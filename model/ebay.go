package model

import (
	"gorm.io/gorm"
)

type EbayConsentConfig struct {
	AuthUrl      string   `json:"auth_url"`
	ClientId     string   `json:"client_id"`
	Locale       string   `json:"locale,omitempty"`
	Prompt       string   `json:"prompt,omitempty"`
	RedirectUri  string   `json:"redirect_uri"`
	ResponseType string   `json:"response_type"`
	Scope        []string `json:"scope"`
	State        string   `json:"state,omitempty"`
}
type EbayOauthRes struct {
	AccessToken           string `json:"access_token"`
	ExpiresIn             int    `json:"expires_in"`
	RefreshToken          string `json:"refresh_token"`
	RefreshTokenExpiresIn int    `json:"refresh_token_expires_in"`
	TokenType             string `json:"token_type"`
	Error                 string `json:"error"`
	ErrorDescription      string `json:"error_description"`
}

type Ebay struct {
	Id                    int64  `json:"id"`
	UserId                int64  `json:"user_id"`
	AccessToken           string `json:"access_token"`
	ExpiresIn             int    `json:"expires_in"`
	RefreshToken          string `json:"refresh_token"`
	RefreshTokenExpiresIn int    `json:"refresh_token_expires_in"`
	TokenType             string `json:"token_type"`
	CreatedAt             int64  `json:"created_at"`
	UpdatedAt             int64  `json:"updated_at"`
}

type EbayProduct struct {
	Id             int64  `json:"id"`
	UserId         int64  `json:"user_id"`
	Title          string `json:"title"`
	CompositeImage string `json:"composite_image"`
	Status         int    `json:"status"`
	Sort           int    `json:"sort"`
	CreatedAt      int64  `json:"created_at"`
	UpdatedAt      int64  `json:"updated_at"`
}

func (ebay *Ebay) Insert() error {
	var err error
	err = DB.First(&ebay, "user_id = ?", ebay.UserId).Error
	if err != nil && err.Error() == gorm.ErrRecordNotFound.Error() {
		err = DB.Create(ebay).Error
	} else {
		err = DB.Model(&ebay).Where("user_id = ?", ebay.UserId).Updates(ebay).Error
	}
	return err
}

func (ebayProduct *EbayProduct) InsertBatch(items []EbayProduct) error {
	var err error
	err = DB.Create(&items).Error
	return err
}

func GetEbayBindInfoByUserId(userId int64) (*Ebay, error) {
	ebay := Ebay{UserId: userId}
	var err error = nil
	err = DB.First(&ebay, "user_id = ?", userId).Error
	return &ebay, err
}

func UpdateAccessToken(userId int64, accessToken string) error {
	ebay := Ebay{}
	err := DB.Model(&ebay).Where("user_id = ?", userId).Update("AccessToken", accessToken).Error
	return err
}
