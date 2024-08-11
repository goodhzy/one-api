package common

import "time"

var StartTime = time.Now().Unix() // unit: second
var Version = "v0.0.0"            // this hard coding will be replaced automatically when building, no need to manually change

const (
	EbayProductNotPublish string = "NOT_PUBLISH"
	EbayProductPublish    string = "PUBLISH"
)

const (
	NotListed              = 1 // 未刊登
	CreateInventorySuccess = 2 // 创建库存成功, 部分刊登
	CreateOfferSuccess     = 3 // 创建报价成功, 部分刊登
	PublishOfferSuccess    = 4 // 发布报价成功
)

const (
	EbayUserNormal  = 1
	EbayUserExpired = 2
)
