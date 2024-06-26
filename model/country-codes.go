package model

import (
	"fmt"
	"time"
)

type CountryCodes struct {
	Id          int    `json:"id"`
	ChineseName string `json:"chinese_name" gorm:"default:''"`
	EnglishName string `json:"english_name" gorm:"default:''"`
	CountryCode string `json:"country_code" gorm:"default:''"`
	PhoneCode   string `json:"phone_code" gorm:"default:''"`
	CreatedAt   int    `json:"created_at" gorm:"bigint"`
}

func GetAllCountryCodes() ([]*CountryCodes, error) {
	var countryCodes []*CountryCodes
	var err error
	err = DB.Find(&countryCodes).Error
	return countryCodes, err
}

func InsertCountryCode(countryCode *CountryCodes) error{
	// countryCode 增加created_at字段
	countryCode.CreatedAt = int(time.Now().Unix())
	err := DB.Create(&countryCode).Error
	if err != nil {
		fmt.Println(err)
	}
	return err
}
