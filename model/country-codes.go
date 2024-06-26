package model

type CountryCodes struct {
	Id          int    `json:"id"`
	ChineseName string `json:"chinese_name" gorm:"default:''"`
	EnglishName string `json:"english_name" gorm:"default:''"`
	CountryCode int    `json:"country_code" gorm:"default:''"`
	PhoneCode   string `json:"phone_code" gorm:"default:''"`
	CreatedAt   int    `json:"created_at" gorm:"bigint"`
}

func GetAllCountryCodes(startIdx int, num int, scope string) ([]*CountryCodes, error) {
	var countryCodes []*CountryCodes
	var err error
	switch scope {
	case "all":
		err = DB.Order("id desc").Find(&countryCodes).Error
	case "disabled":
		err = DB.Order("id desc").Where("status = ? or status = ?", ChannelStatusAutoDisabled, ChannelStatusManuallyDisabled).Find(&countryCodes).Error
	default:
		err = DB.Order("id desc").Limit(num).Offset(startIdx).Omit("key").Find(&countryCodes).Error
	}
	return countryCodes, err
}
