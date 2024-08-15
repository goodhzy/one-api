package model

import "encoding/xml"

type EbayResponseXml struct {
	Errors *Errors `xml:"Errors"`
}

// GetMyeBaySellingRequest  请求结构
type GetMyeBaySellingRequest struct {
	XMLName       xml.Name    `xml:"GetMyeBaySellingRequest"`
	Xmlns         string      `xml:"xmlns,attr"`
	ErrorLanguage string      `xml:"ErrorLanguage"`
	WarningLevel  string      `xml:"WarningLevel"`
	ActiveList    *ActiveList `xml:"ActiveList"`
	UnsoldList    *UnsoldList `xml:"UnsoldList"`
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

type UnsoldList struct {
	DurationInDays int        `xml:"DurationInDays"`
	Pagination     Pagination `xml:"Pagination"`
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
	UnsoldList ActiveListResp `xml:"UnsoldList"`
	Errors     Errors         `xml:"Errors"`
}

type ItemArray struct {
	Items []Item `xml:"Item"`
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

type EndItemsRequest struct {
	XMLName                 xml.Name                  `xml:"EndItemsRequest"`
	XMLNs                   string                    `xml:"xmlns,attr"`
	ErrorLanguage           string                    `xml:"ErrorLanguage"`
	WarningLevel            string                    `xml:"WarningLevel"`
	EndItemRequestContainer []EndItemRequestContainer `xml:"EndItemRequestContainer"`
}

type EndItemRequestContainer struct {
	MessageID    string `xml:"MessageID"`
	EndingReason string `xml:"EndingReason"`
	ItemID       string `xml:"ItemID"`
}

type EndItemsResponse struct {
	XMLName                   xml.Name                   `xml:"EndItemsResponse"`
	XMLNs                     string                     `xml:"xmlns,attr"`
	EndItemResponseContainers []EndItemResponseContainer `xml:"EndItemResponseContainer"`
	Ack                       string                     `xml:"Ack"`
	Build                     string                     `xml:"Build"`
	CorrelationID             string                     `xml:"CorrelationID"`
	Errors                    []ErrorType                `xml:"Errors"`
	HardExpirationWarning     string                     `xml:"HardExpirationWarning"`
	Timestamp                 string                     `xml:"Timestamp"`
	Version                   string                     `xml:"Version"`
}

type EndItemResponseContainer struct {
	CorrelationID string      `xml:"CorrelationID"`
	EndTime       string      `xml:"EndTime"`
	Errors        []ErrorType `xml:"Errors"`
}

type ErrorType struct {
	ErrorClassification string               `xml:"ErrorClassification"`
	ErrorCode           string               `xml:"ErrorCode"`
	ErrorParameters     []ErrorParameterType `xml:"ErrorParameters"`
	LongMessage         string               `xml:"LongMessage"`
	SeverityCode        string               `xml:"SeverityCode"`
	ShortMessage        string               `xml:"ShortMessage"`
}

type ErrorParameterType struct {
	ParamID string `xml:"ParamID,attr"`
	Value   string `xml:"Value"`
}

type GetItemRequest struct {
	Xmlns         string `xml:"xmlns,attr"`
	ErrorLanguage string `xml:"ErrorLanguage"`
	WarningLevel  string `xml:"WarningLevel"`
	ItemID        string `xml:"ItemID"`
}

type GetItemResponse struct {
	XMLName xml.Name `xml:"GetItemResponse"`
	Xmlns   string   `xml:"xmlns,attr"`

	Timestamp string `xml:"Timestamp"`
	Ack       string `xml:"Ack"`
	Version   string `xml:"Version"`
	Build     string `xml:"Build"`

	Item Item `xml:"Item"`
}

type Item struct {
	AutoPay                       bool                    `xml:"AutoPay"`
	BuyerProtection               string                  `xml:"BuyerProtection"`
	BuyItNowPrice                 Price                   `xml:"BuyItNowPrice"`
	Country                       string                  `xml:"Country"`
	Currency                      string                  `xml:"Currency"`
	ItemID                        string                  `xml:"ItemID"`
	ListingDetails                ListingDetails          `xml:"ListingDetails"`
	ListingDuration               string                  `xml:"ListingDuration"`
	ListingType                   string                  `xml:"ListingType"`
	Location                      string                  `xml:"Location"`
	PrimaryCategory               Category                `xml:"PrimaryCategory"`
	PrivateListing                bool                    `xml:"PrivateListing"`
	Quantity                      int                     `xml:"Quantity"`
	IsItemEMSEligible             bool                    `xml:"IsItemEMSEligible"`
	ReservePrice                  Price                   `xml:"ReservePrice"`
	ReviseStatus                  ReviseStatus            `xml:"ReviseStatus"`
	Seller                        Seller                  `xml:"Seller"`
	SellingStatus                 SellingStatus           `xml:"SellingStatus"`
	ShippingDetails               ShippingDetails         `xml:"ShippingDetails"`
	ShipToLocations               string                  `xml:"ShipToLocations"`
	Site                          string                  `xml:"Site"`
	StartPrice                    Price                   `xml:"StartPrice"`
	Storefront                    Storefront              `xml:"Storefront"`
	TimeLeft                      string                  `xml:"TimeLeft"`
	Title                         string                  `xml:"Title"`
	GetItFast                     bool                    `xml:"GetItFast"`
	BuyerResponsibleForShipping   bool                    `xml:"BuyerResponsibleForShipping"`
	SKU                           string                  `xml:"SKU"`
	PictureDetails                PictureDetails          `xml:"PictureDetails"`
	DispatchTimeMax               int                     `xml:"DispatchTimeMax"`
	ProxyItem                     bool                    `xml:"ProxyItem"`
	BuyerGuaranteePrice           Price                   `xml:"BuyerGuaranteePrice"`
	BuyerRequirementDetails       BuyerRequirementDetails `xml:"BuyerRequirementDetails"`
	IntangibleItem                bool                    `xml:"IntangibleItem"`
	ReturnPolicy                  ReturnPolicy            `xml:"ReturnPolicy"`
	ConditionID                   int                     `xml:"ConditionID"`
	ConditionDescriptors          []ConditionDescriptor   `xml:"ConditionDescriptors>ConditionDescriptor"`
	ConditionDisplayName          string                  `xml:"ConditionDisplayName"`
	PostCheckoutExperienceEnabled bool                    `xml:"PostCheckoutExperienceEnabled"`
	SellerProfiles                SellerProfiles          `xml:"SellerProfiles"`
	ShippingPackageDetails        ShippingPackageDetails  `xml:"ShippingPackageDetails"`
	RelistParentID                string                  `xml:"RelistParentID"`
	HideFromSearch                bool                    `xml:"HideFromSearch"`
	ReasonHideFromSearch          string                  `xml:"ReasonHideFromSearch"`
	OutOfStockControl             bool                    `xml:"OutOfStockControl"`
	EBayPlus                      bool                    `xml:"eBayPlus"`
	EBayPlusEligible              bool                    `xml:"eBayPlusEligible"`
	IsSecureDescription           bool                    `xml:"IsSecureDescription"`
}

type Category struct {
	CategoryID   string `xml:"CategoryID"`
	CategoryName string `xml:"CategoryName"`
}

type ReviseStatus struct {
	ItemRevised bool `xml:"ItemRevised"`
}

type Seller struct {
	AboutMePage             bool       `xml:"AboutMePage"`
	Email                   string     `xml:"Email"`
	FeedbackScore           int        `xml:"FeedbackScore"`
	PositiveFeedbackPercent float64    `xml:"PositiveFeedbackPercent"`
	FeedbackPrivate         bool       `xml:"FeedbackPrivate"`
	IDVerified              bool       `xml:"IDVerified"`
	EBayGoodStanding        bool       `xml:"eBayGoodStanding"`
	NewUser                 bool       `xml:"NewUser"`
	RegistrationDate        string     `xml:"RegistrationDate"`
	Site                    string     `xml:"Site"`
	Status                  string     `xml:"Status"`
	UserID                  string     `xml:"UserID"`
	UserIDChanged           bool       `xml:"UserIDChanged"`
	UserIDLastChanged       string     `xml:"UserIDLastChanged"`
	VATStatus               string     `xml:"VATStatus"`
	SellerInfo              SellerInfo `xml:"SellerInfo"`
	MotorsDealer            bool       `xml:"MotorsDealer"`
}

type SellerInfo struct {
	AllowPaymentEdit      bool   `xml:"AllowPaymentEdit"`
	CheckoutEnabled       bool   `xml:"CheckoutEnabled"`
	CIPBankAccountStored  bool   `xml:"CIPBankAccountStored"`
	GoodStanding          bool   `xml:"GoodStanding"`
	LiveAuctionAuthorized bool   `xml:"LiveAuctionAuthorized"`
	MerchandizingPref     string `xml:"MerchandizingPref"`
	QualifiesForB2BVAT    bool   `xml:"QualifiesForB2BVAT"`
	StoreOwner            bool   `xml:"StoreOwner"`
	StoreURL              string `xml:"StoreURL"`
	SafePaymentExempt     bool   `xml:"SafePaymentExempt"`
	TopRatedSeller        bool   `xml:"TopRatedSeller"`
}

type SellingStatus struct {
	BidCount                    int        `xml:"BidCount"`
	BidIncrement                Price      `xml:"BidIncrement"`
	ConvertedCurrentPrice       Price      `xml:"ConvertedCurrentPrice"`
	CurrentPrice                Price      `xml:"CurrentPrice"`
	HighBidder                  HighBidder `xml:"HighBidder"`
	LeadCount                   int        `xml:"LeadCount"`
	MinimumToBid                Price      `xml:"MinimumToBid"`
	QuantitySold                int        `xml:"QuantitySold"`
	ReserveMet                  bool       `xml:"ReserveMet"`
	SecondChanceEligible        bool       `xml:"SecondChanceEligible"`
	ListingStatus               string     `xml:"ListingStatus"`
	QuantitySoldByPickupInStore int        `xml:"QuantitySoldByPickupInStore"`
}

type HighBidder struct {
	AboutMePage             bool      `xml:"AboutMePage"`
	EIASToken               string    `xml:"EIASToken"`
	Email                   string    `xml:"Email"`
	FeedbackScore           int       `xml:"FeedbackScore"`
	PositiveFeedbackPercent float64   `xml:"PositiveFeedbackPercent"`
	EBayGoodStanding        bool      `xml:"eBayGoodStanding"`
	NewUser                 bool      `xml:"NewUser"`
	RegistrationDate        string    `xml:"RegistrationDate"`
	Site                    string    `xml:"Site"`
	UserID                  string    `xml:"UserID"`
	VATStatus               string    `xml:"VATStatus"`
	BuyerInfo               BuyerInfo `xml:"BuyerInfo"`
	UserAnonymized          bool      `xml:"UserAnonymized"`
}

type BuyerInfo struct {
	ShippingAddress ShippingAddress `xml:"ShippingAddress"`
}

type ShippingAddress struct {
	Country    string `xml:"Country"`
	PostalCode string `xml:"PostalCode"`
}

type CalculatedShippingRate struct {
	WeightMajor Measurement `xml:"WeightMajor"`
	WeightMinor Measurement `xml:"WeightMinor"`
}

type Measurement struct {
	MeasurementSystem string  `xml:"measurementSystem,attr"`
	Unit              string  `xml:"unit,attr"`
	Value             float64 `xml:",chardata"`
}

type SalesTax struct {
	SalesTaxPercent       float64 `xml:"SalesTaxPercent"`
	ShippingIncludedInTax bool    `xml:"ShippingIncludedInTax"`
}

type InternationalShippingServiceOption struct {
	ShippingService         string `xml:"ShippingService"`
	ShippingServiceCost     Price  `xml:"ShippingServiceCost"`
	ShippingServicePriority int    `xml:"ShippingServicePriority"`
	ShipToLocation          string `xml:"ShipToLocation"`
	ShippingInsuranceCost   Price  `xml:"ShippingInsuranceCost"`
}

type Storefront struct {
	StoreName string `xml:"StoreName"`
	StoreURL  string `xml:"StoreURL"`
}

type BuyerRequirementDetails struct {
	ShipToRegistrationCountry            bool   `xml:"ShipToRegistrationCountry"`
	ZeroFeedbackScore                    bool   `xml:"ZeroFeedbackScore"`
	MinimumFeedbackScore                 int    `xml:"MinimumFeedbackScore"`
	MinimumFeedbackScoreThreshold        int    `xml:"MinimumFeedbackScoreThreshold"`
	MaximumUnpaidItemStrikesCount        int    `xml:"MaximumUnpaidItemStrikesCount"`
	MaximumUnpaidItemStrikesDuration     string `xml:"MaximumUnpaidItemStrikesDuration"`
	MaximumBuyerPolicyViolationsCount    int    `xml:"MaximumBuyerPolicyViolationsCount"`
	MaximumBuyerPolicyViolationsDuration string `xml:"MaximumBuyerPolicyViolationsDuration"`
	LinkedPayPalAccount                  bool   `xml:"LinkedPayPalAccount"`
	VerifiedUser                         bool   `xml:"VerifiedUser"`
	MinimumFeedbackScoreAtTimeOfFeedback int    `xml:"MinimumFeedbackScoreAtTimeOfFeedback"`
	AllowedPaymentMethods                string `xml:"AllowedPaymentMethods"`
}

type ReturnPolicy struct {
	ReturnsAccepted          string `xml:"ReturnsAccepted"`
	ReturnsWithin            string `xml:"ReturnsWithin"`
	Refund                   string `xml:"Refund"`
	ShippingCostPaidBy       string `xml:"ShippingCostPaidBy"`
	RestockingFeeValue       string `xml:"RestockingFeeValue"`
	RestockingFeeValueOption string `xml:"RestockingFeeValueOption"`
	ExtendedHolidayReturns   bool   `xml:"ExtendedHolidayReturns"`
	Description              string `xml:"Description"`
	EAN                      string `xml:"EAN"`
	Barcode                  string `xml:"Barcode"`
	ReturnMethod             string `xml:"ReturnMethod"`
}

type ShippingPackageDetails struct {
	ShippingIrregular bool        `xml:"ShippingIrregular"`
	ShippingPackage   string      `xml:"ShippingPackage"`
	WeightMajor       Measurement `xml:"WeightMajor"`
	WeightMinor       Measurement `xml:"WeightMinor"`
}

type RelistItem struct {
	ItemID string `xml:"ItemID"`
}

type RelistItemRequest struct {
	Xmlns         string     `xml:"xmlns,attr"`
	ErrorLanguage string     `xml:"ErrorLanguage"`
	WarningLevel  string     `xml:"WarningLevel"`
	Item          RelistItem `xml:"Item"`
}

type RelistItemResponse struct {
	XMLName        xml.Name `xml:"RelistItemResponse"`
	Xmlns          string   `xml:"xmlns,attr"`
	Timestamp      string   `xml:"Timestamp"`
	Ack            string   `xml:"Ack"`
	Version        string   `xml:"Version"`
	Build          string   `xml:"Build"`
	ItemID         string   `xml:"ItemID"`
	Fees           Fees     `xml:"Fees"`
	StartTime      string   `xml:"StartTime"`
	EndTime        string   `xml:"EndTime"`
	DiscountReason string   `xml:"DiscountReason"`
}

type Fees struct {
	FeeList []Fee `xml:"Fee"`
}

type Fee struct {
	Name                string `xml:"Name"`
	Fee                 Price  `xml:"Fee"`
	PromotionalDiscount *Price `xml:"PromotionalDiscount,omitempty"`
}
