package common

import "time"

var StartTime = time.Now().Unix() // unit: second
var Version = "v0.0.0"            // this hard coding will be replaced automatically when building, no need to manually change

const (
	EbayProductNotPublish string = "NOT_PUBLISH"
	EbayProductPublish    string = "PUBLISH"
)

const (
	NotListed              = 1
	CreateInventorySuccess = 2
	CreateOfferSuccess     = 3
	PublishOfferSuccess    = 4
)
