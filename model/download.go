package model

import (
	"crypto/md5"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"github.com/pkg/errors"
	"gorm.io/gorm"
	"strings"

	"github.com/songquanpeng/one-api/pkg/aria2/rpc"
	"github.com/songquanpeng/one-api/pkg/util"
)

const (
	// Active 账户正常状态
	Active = iota + 1
	// NotActivicated 未激活
	NotActivicated
	// Baned 被封禁
	Baned
	// OveruseBaned 超额使用被封禁
	OveruseBaned
)

// Download 离线下载队列模型
type Download struct {
	gorm.Model
	Status         int    // 任务状态
	Type           int    // 任务类型
	Source         string `gorm:"type:text"` // 文件下载地址
	TotalSize      uint64 // 文件大小
	DownloadedSize uint64 // 文件大小
	GID            string `gorm:"size:32,index:gid"` // 任务ID
	Speed          int    // 下载速度
	Parent         string `gorm:"type:text"`       // 存储目录
	Attrs          string `gorm:"size:4294967295"` // 任务状态属性
	Error          string `gorm:"type:text"`       // 错误描述
	Dst            string `gorm:"type:text"`       // 用户文件系统存储父目录路径
	UserID         uint   // 发起者UID
	TaskID         uint   // 对应的转存任务ID
	NodeID         uint   // 处理任务的节点ID

	// 关联模型
	User *User `gorm:"PRELOAD:false,association_autoupdate:false"`

	// 数据库忽略字段
	StatusInfo rpc.StatusInfo `gorm:"-"`
	Task       *Task          `gorm:"-"`
	NodeName   string         `gorm:"-"`
}

func (Download) TableName() string {
	return "cd_download" // 添加前缀的表名
}

// AfterFind 找到下载任务后的钩子，处理Status结构
func (task *Download) AfterFind(tx *gorm.DB) (err error) {
	// 解析状态
	if task.Attrs != "" {
		err = json.Unmarshal([]byte(task.Attrs), &task.StatusInfo)
	}

	if task.TaskID != 0 {
		task.Task, _ = GetTasksByID(task.TaskID)
	}

	return err
}

// BeforeSave Save下载任务前的钩子
func (task *Download) BeforeSave(tx *gorm.DB) (err error) {
	// 解析状态
	if task.Attrs != "" {
		err = json.Unmarshal([]byte(task.Attrs), &task.StatusInfo)
	}
	return err
}

// Create 创建离线下载记录
func (task *Download) Create() (uint, error) {
	if err := DB.Create(task).Error; err != nil {
		util.Log().Warning("Failed to insert download record: %s", err)
		return 0, err
	}
	return task.ID, nil
}

// Save 更新
func (task *Download) Save() error {
	if err := DB.Save(task).Error; err != nil {
		util.Log().Warning("Failed to update download record: %s", err)
		return err
	}
	return nil
}

// GetDownloadsByStatus 根据状态检索下载
func GetDownloadsByStatus(status ...int) []Download {
	var tasks []Download
	DB.Where("status in (?)", status).Find(&tasks)
	return tasks
}

// GetDownloadsByStatusAndUser 根据状态检索和用户ID下载
// page 为 0 表示列出所有，非零时分页
func GetDownloadsByStatusAndUser(page, uid uint, status ...int) []Download {
	var tasks []Download
	dbChain := DB
	if page > 0 {
		dbChain = dbChain.Limit(10).Offset(int((page - 1) * 10)).Order("updated_at DESC")
	}
	dbChain.Where("user_id = ? and status in (?)", uid, status).Find(&tasks)
	return tasks
}

// GetDownloadByGid 根据GID和用户ID查找下载
func GetDownloadByGid(gid string, uid uint) (*Download, error) {
	download := &Download{}
	result := DB.Where("user_id = ? and g_id = ?", uid, gid).First(download)
	return download, result.Error
}

// GetOwner 获取下载任务所属用户
func (task *Download) GetOwner() *User {
	if task.User == nil {
		if user, err := GetUserByID(task.UserID); err == nil {
			return &user
		}
	}
	return task.User
}

// Delete 删除离线下载记录
func (download *Download) Delete() error {
	return DB.Model(download).Delete(download).Error
}

// GetNodeID 返回任务所属节点ID
func (task *Download) GetNodeID() uint {
	// 兼容3.4版本之前生成的下载记录
	if task.NodeID == 0 {
		return 1
	}

	return task.NodeID
}

// Root 获取用户的根目录
func (user *User) Root() (*Folder, error) {
	var folder Folder
	err := DB.Where("parent_id is NULL AND owner_id = ?", user.Id).First(&folder).Error
	return &folder, err
}

// DeductionStorage 减少用户已用容量
func (user *User) DeductionStorage(size uint64) bool {
	if size == 0 {
		return true
	}
	if size <= user.Storage {
		user.Storage -= size
		DB.Model(user).Update("storage", gorm.Expr("storage - ?", size))
		return true
	}
	// 如果要减少的容量超出已用容量，则设为零
	user.Storage = 0
	DB.Model(user).Update("storage", 0)

	return false
}

// IncreaseStorage 检查并增加用户已用容量
func (user *User) IncreaseStorage(size uint64) bool {
	if size == 0 {
		return true
	}
	if size <= user.GetRemainingCapacity() {
		user.Storage += size
		DB.Model(user).Update("storage", gorm.Expr("storage + ?", size))
		return true
	}
	return false
}

// ChangeStorage 更新用户容量
func (user *User) ChangeStorage(tx *gorm.DB, operator string, size uint64) error {
	return tx.Model(user).Update("storage", gorm.Expr("storage "+operator+" ?", size)).Error
}

// IncreaseStorageWithoutCheck 忽略可用容量，增加用户已用容量
func (user *User) IncreaseStorageWithoutCheck(size uint64) {
	if size == 0 {
		return
	}
	user.Storage += size
	DB.Model(user).Update("storage", gorm.Expr("storage + ?", size))

}

// GetRemainingCapacity 获取剩余配额
func (user *User) GetRemainingCapacity() uint64 {
	total := user.Group.MaxStorage
	if total <= user.Storage {
		return 0
	}
	return total - user.Storage
}

// GetPolicyID 获取用户当前的存储策略ID
func (user *User) GetPolicyID(prefer uint) uint {
	if len(user.Group.PolicyList) > 0 {
		return user.Group.PolicyList[0]
	}
	return 0
}

// GetUserByID 用ID获取用户
func GetUserByID(ID interface{}) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).First(&user, ID)
	return user, result.Error
}

// GetActiveUserByID 用ID获取可登录用户
func GetActiveUserByID(ID interface{}) (User, error) {
	var user User
	result := DB.Preload("Group").Where("status = ?", Active).First(&user, ID)
	err := user.Group.AfterFind(&gorm.DB{})
	if err != nil {
		return User{}, err
	}
	return user, result.Error
}

// GetActiveUserByOpenID 用OpenID获取可登录用户
func GetActiveUserByOpenID(openid string) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).Where("status = ? and open_id = ?", Active, openid).Find(&user)
	return user, result.Error
}

// GetUserByEmail 用Email获取用户
func GetUserByEmail(email string) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).Where("email = ?", email).First(&user)
	return user, result.Error
}

// GetActiveUserByEmail 用Email获取可登录用户
func GetActiveUserByEmail(email string) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).Where("status = ? and email = ?", Active, email).First(&user)
	return user, result.Error
}

// NewUser 返回一个新的空 User
func NewUser() User {
	options := UserOption{}
	return User{
		OptionsSerialized: options,
	}
}

// BeforeSave Save用户前的钩子
func (user *User) BeforeSave(tx *gorm.DB) (err error) {
	err = user.SerializeOptions()
	return err
}

// AfterCreate 创建用户后的钩子
func (user *User) AfterCreate(tx *gorm.DB) (err error) {
	// 创建用户的默认根目录
	defaultFolder := &Folder{
		Name:    "/",
		OwnerID: uint(int64(user.Id)),
	}
	tx.Create(defaultFolder)
	return err
}

// AfterFind 找到用户后的钩子
func (user *User) AfterFind(tx *gorm.DB) (err error) {
	// 解析用户设置到OptionsSerialized
	if user.Options != "" {
		err = json.Unmarshal([]byte(user.Options), &user.OptionsSerialized)
	}

	// 预加载存储策略
	user.Policy, _ = GetPolicyByID(user.GetPolicyID(0))
	return err
}

// SerializeOptions 将序列后的Option写入到数据库字段
func (user *User) SerializeOptions() (err error) {
	optionsValue, err := json.Marshal(&user.OptionsSerialized)
	user.Options = string(optionsValue)
	return err
}

// CheckPassword 根据明文校验密码
func (user *User) CheckPassword(password string) (bool, error) {

	// 根据存储密码拆分为 Salt 和 Digest
	passwordStore := strings.Split(user.Password, ":")
	if len(passwordStore) != 2 && len(passwordStore) != 3 {
		return false, errors.New("Unknown password type")
	}

	// 兼容V2密码，升级后存储格式为: md5:$HASH:$SALT
	if len(passwordStore) == 3 {
		if passwordStore[0] != "md5" {
			return false, errors.New("Unknown password type")
		}
		hash := md5.New()
		_, err := hash.Write([]byte(passwordStore[2] + password))
		bs := hex.EncodeToString(hash.Sum(nil))
		if err != nil {
			return false, err
		}
		return bs == passwordStore[1], nil
	}

	//计算 Salt 和密码组合的SHA1摘要
	hash := sha1.New()
	_, err := hash.Write([]byte(password + passwordStore[0]))
	bs := hex.EncodeToString(hash.Sum(nil))
	if err != nil {
		return false, err
	}

	return bs == passwordStore[1], nil
}

// SetPassword 根据给定明文设定 User 的 Password 字段
func (user *User) SetPassword(password string) error {
	//生成16位 Salt
	salt := util.RandStringRunes(16)

	//计算 Salt 和密码组合的SHA1摘要
	hash := sha1.New()
	_, err := hash.Write([]byte(password + salt))
	bs := hex.EncodeToString(hash.Sum(nil))

	if err != nil {
		return err
	}

	//存储 Salt 值和摘要， ":"分割
	user.Password = salt + ":" + string(bs)
	return nil
}

// NewAnonymousUser 返回一个匿名用户
func NewAnonymousUser() *User {
	user := User{}
	user.Policy.Type = "anonymous"
	user.Group, _ = GetGroupByID(3)
	return &user
}

// IsAnonymous 返回是否为未登录用户
func (user *User) IsAnonymous() bool {
	return user.Id == 0
}

// SetStatus 设定用户状态
func (user *User) SetStatus(status int) {
	DB.Model(&user).Update("status", status)
}

// UpdateOptions 更新用户偏好设定
//func (user *User) UpdateOptions() error {
//	if err := user.SerializeOptions(); err != nil {
//		return err
//	}
//	return user.Update(map[string]interface{}{"options": user.Options})
//}
