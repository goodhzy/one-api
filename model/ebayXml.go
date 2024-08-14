package model

import "encoding/xml"

type EbayResponseXml struct {
	Errors *Errors `xml:"Errors"`
}

// GetMyeBaySellingRequest  请求结构
type GetMyeBaySellingRequest struct {
	XMLName       xml.Name   `xml:"GetMyeBaySellingRequest"`
	Xmlns         string     `xml:"xmlns,attr"`
	ErrorLanguage string     `xml:"ErrorLanguage"`
	WarningLevel  string     `xml:"WarningLevel"`
	ActiveList    ActiveList `xml:"ActiveList"`
}

type Pagination struct {
	EntriesPerPage int `xml:"EntriesPerPage"`
	PageNumber     int `xml:"PageNumber"`
}
type ActiveList struct {
	Sort       string     `xml:"Sort"`
	Pagination Pagination `xml:"Pagination"`
}

type ActiveListResp struct {
	ItemArray        ItemArray        `xml:"ItemArray"`
	PaginationResult PaginationResult `xml:"PaginationResult"`
}

type Errors struct {
	XMLName             xml.Name `xml:"Errors"`
	ShortMessage        string   `xml:"ShortMessage"`
	LongMessage         string   `xml:"LongMessage"`
	ErrorCode           int      `xml:"ErrorCode"`
	SeverityCode        string   `xml:"SeverityCode"`
	ErrorClassification string   `xml:"ErrorClassification"`
}

type GetMyeBaySellingResponse struct {
	XMLName    xml.Name       `xml:"GetMyeBaySellingResponse"`
	Timestamp  string         `xml:"Timestamp"`
	Ack        string         `xml:"Ack"`
	Version    string         `xml:"Version"`
	ActiveList ActiveListResp `xml:"ActiveList"`
	Errors     Errors         `xml:"Errors"`
}

type ItemArray struct {
	Items []Item `xml:"Item"`
}

type Item struct {
	BuyItNowPrice             Price           `xml:"BuyItNowPrice"`
	ItemID                    string          `xml:"ItemID"`
	ListingDetails            ListingDetails  `xml:"ListingDetails"`
	ListingDuration           string          `xml:"ListingDuration"`
	ListingType               string          `xml:"ListingType"`
	Quantity                  int             `xml:"Quantity"`
	SellingStatus             SellingStatus   `xml:"SellingStatus"`
	ShippingDetails           ShippingDetails `xml:"ShippingDetails"`
	TimeLeft                  string          `xml:"TimeLeft"`
	Title                     string          `xml:"Title"`
	WatchCount                int             `xml:"WatchCount,omitempty"`
	QuantityAvailable         int             `xml:"QuantityAvailable"`
	SKU                       string          `xml:"SKU"`
	PictureDetails            PictureDetails  `xml:"PictureDetails"`
	ClassifiedAdPayPerLeadFee Price           `xml:"ClassifiedAdPayPerLeadFee"`
	SellerProfiles            SellerProfiles  `xml:"SellerProfiles"`
}

type Price struct {
	CurrencyID string  `xml:"currencyID,attr"`
	Value      float64 `xml:",chardata"`
}

type ListingDetails struct {
	StartTime                   string `xml:"StartTime"`
	ViewItemURL                 string `xml:"ViewItemURL"`
	ViewItemURLForNaturalSearch string `xml:"ViewItemURLForNaturalSearch"`
}

type SellingStatus struct {
	CurrentPrice Price `xml:"CurrentPrice"`
	QuantitySold int   `xml:"QuantitySold"`
}

type ShippingDetails struct {
	ShippingServiceOptions []ShippingServiceOption `xml:"ShippingServiceOptions"`
	ShippingType           string                  `xml:"ShippingType"`
}

type ShippingServiceOption struct {
	ShippingServiceCost Price `xml:"ShippingServiceCost"`
}

type PictureDetails struct {
	GalleryURL string `xml:"GalleryURL"`
}

type SellerProfiles struct {
	SellerShippingProfile SellerShippingProfile `xml:"SellerShippingProfile"`
	SellerReturnProfile   SellerReturnProfile   `xml:"SellerReturnProfile"`
	SellerPaymentProfile  SellerPaymentProfile  `xml:"SellerPaymentProfile"`
}

type SellerShippingProfile struct {
	ShippingProfileID   string `xml:"ShippingProfileID"`
	ShippingProfileName string `xml:"ShippingProfileName"`
}

type SellerReturnProfile struct {
	ReturnProfileID   string `xml:"ReturnProfileID"`
	ReturnProfileName string `xml:"ReturnProfileName"`
}

type SellerPaymentProfile struct {
	PaymentProfileID   string `xml:"PaymentProfileID"`
	PaymentProfileName string `xml:"PaymentProfileName"`
}

type PaginationResult struct {
	TotalNumberOfPages   int `xml:"TotalNumberOfPages"`
	TotalNumberOfEntries int `xml:"TotalNumberOfEntries"`
}
