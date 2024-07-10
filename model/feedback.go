package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"gorm.io/gorm"
)

type StringArray []string

// Value 实现 driver.Valuer 接口
func (a StringArray) Value() (driver.Value, error) {
	return json.Marshal(a)
}

// Scan 实现 sql.Scanner 接口
func (a *StringArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, &a)
}

type Feedback struct {
	Id        int64          `json:"id"`
	Images    StringArray    `json:"images"`                      // 文件 ID
	Title     string         `json:"title" validate:"required"`   // 标题
	Content   string         `json:"content" validate:"required"` // 内容
	CreatedAt int64          `json:"created_at"`                  // 创建时间
	DeletedAt gorm.DeletedAt `json:"deleted_at"`                  // 删除时间
	CreatedBy int64          `json:"created_by"`                  // 创建者用户 ID
}

func GetAllFeedback(startIdx int, num int) ([]*Feedback, error) {
	var feedback []*Feedback
	var err error

	err = DB.Limit(num).Offset(startIdx).Find(&feedback).Error
	fmt.Println(DB.Explain("all"))
	return feedback, err
}

func GetFeedbackById(id int64) (*Feedback, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}
	feedback := Feedback{Id: id}
	var err error = nil
	err = DB.Preload("Files").First(&feedback, "id = ?", id).Error
	return &feedback, err
}

func (feedback *Feedback) Insert() error {
	var err error
	fmt.Printf("feedback: %v\n", feedback)
	err = DB.Create(feedback).Error
	return err
}

func GetFeedbackList() ([]*Feedback, error) {
	var feedback []*Feedback
	var err error

	err = DB.Preload("Files").Limit(99).Where("is_active = ?", 1).Order("sort asc").Find(&feedback).Error
	fmt.Println(DB.Explain("all"))
	return feedback, err
}
