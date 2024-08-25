package model

import (
	"gorm.io/gorm"
)

// Folder 目录
type Folder struct {
	// 表字段
	gorm.Model
	Name     string `gorm:"unique_index:idx_only_one_name"`
	ParentID *uint  `gorm:"index:parent_id;unique_index:idx_only_one_name"`
	OwnerID  uint   `gorm:"index:owner_id"`
	PolicyID uint   // Webdav下挂载的存储策略ID

	// 数据库忽略字段
	Position        string `gorm:"-"`
	InheritPolicyID uint   `gorm:"-"` //  从父目录继承而来的policy id，默认值则使用自身的的PolicyID
	WebdavDstName   string `gorm:"-"`
}

func (Folder) TableName() string {
	return "cd_folders"
}

// Create 创建目录
func (folder *Folder) Create() (uint, error) {
	if err := DB.FirstOrCreate(folder, *folder).Error; err != nil {
		folder.Model = gorm.Model{}
		err2 := DB.First(folder, *folder).Error
		return folder.ID, err2
	}

	return folder.ID, nil
}
