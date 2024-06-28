package model

import (
	"fmt"
)

type Files struct {
	ID        int64  `gorm:"primary_key;auto_increment;not null;comment:'唯一标识文件'" json:"id"`
	FileName  string `gorm:"type:varchar(255);not null;comment:'文件名'" json:"file_name"`
	FilePath  string `gorm:"type:varchar(255);not null;comment:'OSS中存储的路径'" json:"file_path"`
	MimeType  string `gorm:"type:varchar(50);comment:'文件的MIME类型'" json:"mime_type"`
	Size      int64  `gorm:"type:bigint;comment:'文件大小'" json:"size"`
	Width     int    `gorm:"type:int;comment:'文件宽度，如果是图片或视频'" json:"width"`
	Height    int    `gorm:"type:int;comment:'文件高度，如果是图片或视频'" json:"height"`
	CreatedAt int64  `gorm:"type:bigint;comment:'记录创建时间'" json:"created_at"`
	UpdatedAt int64  `gorm:"type:bigint;comment:'记录更新时间'" json:"updated_at"`
}

func InsertFile(file *Files) (*Files, error) {
	err := DB.Create(&file)
	if err != nil {
		fmt.Println(err)
	}
	return file, err.Error
}
