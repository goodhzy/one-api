package model

import (
	"errors"
)

type Banner struct {
	Id          int64  `json:"id"`
	Type        int    `json:"type" validate:"required"`    // 轮播图类型
	FileID      int64  `json:"file_id" validate:"required"` // 文件 ID
	Title       string `json:"title"`                       // 轮播图标题
	Description string `json:"description"`                 // 轮播图描述
	Link        string `json:"link"`                        // 轮播图链接
	Sort        int    `json:"sort"`                        // 轮播图排序
	IsActive    bool   `json:"is_active"`                   // 是否激活
	CreatedAt   int64  `json:"created_at"`                  // 创建时间
	UpdatedAt   int64  `json:"updated_at"`                  // 更新时间
	CreatedBy   int64  `json:"created_by"`                  // 创建者用户 ID
	UpdatedBy   int64  `json:"updated_by"`                  // 更新者用户 ID
}

func GetAllBanner(startIdx int, num int) ([]*Banner, error) {
	var banner []*Banner
	var err error

	err = DB.Limit(num).Offset(startIdx).Find(&banner).Error
	return banner, err
}

func GetBannerById(id int64) (*Banner, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}
	banner := Banner{Id: id}
	var err error = nil
	err = DB.First(&banner, "id = ?", id).Error
	return &banner, err
}

func (banner *Banner) Insert() error {
	var err error
	err = DB.Create(banner).Error
	return err
}

// Update Make sure your banner's fields is completed, because this will update non-zero values
func (banner *Banner) Update() error {
	var err error
	err = DB.Model(banner).Select("name", "status", "expired_time", "remain_quota", "unlimited_quota", "models", "subnet").Updates(banner).Error
	return err
}

func (banner *Banner) SelectUpdate() error {
	// This can update zero values
	return DB.Model(banner).Select("accessed_time", "status").Updates(banner).Error
}

func (banner *Banner) Delete() error {
	var err error
	err = DB.Delete(banner).Error
	return err
}

func DeleteBannerById(id int64, userId int64) (err error) {
	// Why we need userId here? In case user want to delete other's banner.
	if id == 0 {
		return errors.New("id 为空！")
	}
	banner := Banner{Id: id, UpdatedAt: userId}
	err = DB.Where(banner).First(&banner).Error
	if err != nil {
		return err
	}
	return banner.Delete()
}
