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

type Availability struct {
	PickupAtLocationAvailability []PickupAtLocationAvailability `json:"pickupAtLocationAvailability,omitempty"`
	ShipToLocationAvailability   ShipToLocationAvailability     `json:"shipToLocationAvailability"`
}

// PickupAtLocationAvailability struct to represent pickup availability details
type PickupAtLocationAvailability struct {
	AvailabilityType    string          `json:"availabilityType"`
	FulfillmentTime     FulfillmentTime `json:"fulfillmentTime"`
	MerchantLocationKey string          `json:"merchantLocationKey"`
	Quantity            int             `json:"quantity"`
}

// FulfillmentTime struct to represent fulfillment time details
type FulfillmentTime struct {
	Unit  string `json:"unit"`
	Value int    `json:"value"`
}

// ShipToLocationAvailability struct to represent ship-to-location availability details
type ShipToLocationAvailability struct {
	AvailabilityDistributions []AvailabilityDistribution `json:"availabilityDistributions,omitempty"`
	Quantity                  int                        `json:"quantity"`
}

// AvailabilityDistribution struct to represent availability distribution details
type AvailabilityDistribution struct {
	FulfillmentTime     FulfillmentTime `json:"fulfillmentTime"`
	MerchantLocationKey string          `json:"merchantLocationKey"`
	Quantity            int             `json:"quantity"`
}

// ConditionDescriptor struct to represent condition descriptors
type ConditionDescriptor struct {
	AdditionalInfo string   `json:"additionalInfo,omitempty"`
	Name           string   `json:"name"`
	Values         []string `json:"values"`
}

// Dimensions struct to represent package dimensions
type Dimensions struct {
	Height float64 `json:"height,omitempty"`
	Length float64 `json:"length,omitempty"`
	Unit   string  `json:"unit,omitempty"`
	Width  float64 `json:"width,omitempty"`
}

// PackageWeightAndSize struct to represent package weight and size details
type PackageWeightAndSize struct {
	Dimensions        Dimensions `json:"dimensions"`
	PackageType       string     `json:"packageType"`
	ShippingIrregular bool       `json:"shippingIrregular"`
	Weight            Weight     `json:"weight"`
}

// Weight struct to represent weight details
type Weight struct {
	Unit  string  `json:"unit"`
	Value float64 `json:"value"`
}

// Product struct to represent product details
type Product struct {
	Aspects     string   `json:"aspects,omitempty"`
	Brand       string   `json:"brand,omitempty"`
	Description string   `json:"description,omitempty"`
	EAN         []string `json:"ean,omitempty"`
	EPID        string   `json:"epid,omitempty"`
	ImageUrls   []string `json:"imageUrls,omitempty"`
	ISBN        []string `json:"isbn,omitempty"`
	MPN         string   `json:"mpn,omitempty"`
	Subtitle    string   `json:"subtitle,omitempty"`
	Title       string   `json:"title,omitempty"`
	UPC         []string `json:"upc,omitempty"`
	VideoIds    []string `json:"videoIds,omitempty"`
}

// InventoryItem struct to represent an inventory item
type InventoryItem struct {
	Availability         *Availability         `json:"availability"`
	Condition            string                `json:"condition,omitempty"`
	ConditionDescription string                `json:"conditionDescription,omitempty"`
	ConditionDescriptors []ConditionDescriptor `json:"conditionDescriptors,omitempty"`
	Locale               string                `json:"locale" required:"true"`
	PackageWeightAndSize *PackageWeightAndSize `json:"packageWeightAndSize,omitempty"`
	Product              Product               `json:"product"`
	SKU                  string                `json:"sku" required:"true"`
}

// RequestPayload struct to represent the bulk create or replace inventory item request payload
type RequestPayload struct {
	Requests []InventoryItem `json:"requests"`
}

// ErrorDetail struct to represent error details
type ErrorDetail struct {
	Category     string      `json:"category"`
	Domain       string      `json:"domain"`
	ErrorID      int         `json:"errorId"`
	InputRefIds  []string    `json:"inputRefIds,omitempty"`
	LongMessage  string      `json:"longMessage"`
	Message      string      `json:"message"`
	OutputRefIds []string    `json:"outputRefIds,omitempty"`
	Parameters   []Parameter `json:"parameters,omitempty"`
	Subdomain    string      `json:"subdomain"`
}

// Parameter struct to represent parameter details
type Parameter struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// WarningDetail struct to represent warning details
type WarningDetail struct {
	Category     string      `json:"category"`
	Domain       string      `json:"domain"`
	ErrorID      int         `json:"errorId"`
	InputRefIds  []string    `json:"inputRefIds,omitempty"`
	LongMessage  string      `json:"longMessage"`
	Message      string      `json:"message"`
	OutputRefIds []string    `json:"outputRefIds,omitempty"`
	Parameters   []Parameter `json:"parameters,omitempty"`
	Subdomain    string      `json:"subdomain"`
}

// EbayResponse Response struct to represent each response in the responses array
type EbayResponse struct {
	Errors []ErrorDetail `json:"errors,omitempty"`
}

// BulkCreateOrReplaceInventoryItemResponse struct to represent the full response
type BulkCreateOrReplaceInventoryItemResponse struct {
	Responses []EbayResponse `json:"responses"`
}

// offer model start
type CurrencyValue struct {
	Currency string `json:"currency,omitempty"`
	Value    string `json:"value,omitempty"`
}

type Charity struct {
	CharityId          string `json:"charityId,omitempty"`
	DonationPercentage string `json:"donationPercentage,omitempty"`
}

type EcoParticipationFee struct {
	Currency string `json:"currency,omitempty"`
	Value    string `json:"value,omitempty"`
}

type ExtendedProducerResponsibility struct {
	EcoParticipationFee    *EcoParticipationFee `json:"ecoParticipationFee,omitempty"`
	ProducerProductId      string               `json:"producerProductId,omitempty"`
	ProductDocumentationId string               `json:"productDocumentationId,omitempty"`
	ProductPackageId       string               `json:"productPackageId,omitempty"`
	ShipmentPackageId      string               `json:"shipmentPackageId,omitempty"`
}

type BestOfferTerms struct {
	AutoAcceptPrice  *CurrencyValue `json:"autoAcceptPrice,omitempty"`
	AutoDeclinePrice *CurrencyValue `json:"autoDeclinePrice,omitempty"`
	BestOfferEnabled string         `json:"bestOfferEnabled,omitempty"`
}

type RegionalPolicy struct {
	Country   string   `json:"country,omitempty"`
	PolicyIds []string `json:"policyIds,omitempty"`
}

type ListingPolicies struct {
	BestOfferTerms                    *BestOfferTerms        `json:"bestOfferTerms,omitempty"`
	EBayPlusIfEligible                string                 `json:"eBayPlusIfEligible,omitempty"`
	FulfillmentPolicyId               string                 `json:"fulfillmentPolicyId,omitempty"`
	PaymentPolicyId                   string                 `json:"paymentPolicyId,omitempty"`
	ProductCompliancePolicyIds        []string               `json:"productCompliancePolicyIds,omitempty"`
	RegionalProductCompliancePolicies []RegionalPolicy       `json:"regionalProductCompliancePolicies,omitempty"`
	RegionalTakeBackPolicies          []RegionalPolicy       `json:"regionalTakeBackPolicies,omitempty"`
	ReturnPolicyId                    string                 `json:"returnPolicyId,omitempty"`
	ShippingCostOverrides             []ShippingCostOverride `json:"shippingCostOverrides,omitempty"`
	TakeBackPolicyId                  string                 `json:"takeBackPolicyId,omitempty"`
}

type ShippingCostOverride struct {
	AdditionalShippingCost *CurrencyValue `json:"additionalShippingCost,omitempty"`
	Priority               string         `json:"priority,omitempty"`
	ShippingCost           *CurrencyValue `json:"shippingCost,omitempty"`
	ShippingServiceType    string         `json:"shippingServiceType,omitempty"`
	Surcharge              *CurrencyValue `json:"surcharge,omitempty"`
}

type PricingSummary struct {
	AuctionReservePrice            *CurrencyValue `json:"auctionReservePrice,omitempty"`
	AuctionStartPrice              *CurrencyValue `json:"auctionStartPrice,omitempty"`
	MinimumAdvertisedPrice         *CurrencyValue `json:"minimumAdvertisedPrice,omitempty"`
	OriginallySoldForRetailPriceOn string         `json:"originallySoldForRetailPriceOn,omitempty"`
	OriginalRetailPrice            *CurrencyValue `json:"originalRetailPrice,omitempty"`
	Price                          *CurrencyValue `json:"price,omitempty"`
	PricingVisibility              string         `json:"pricingVisibility,omitempty"`
}

type EconomicOperator struct {
	AddressLine1    string `json:"addressLine1,omitempty"`
	AddressLine2    string `json:"addressLine2,omitempty"`
	City            string `json:"city,omitempty"`
	CompanyName     string `json:"companyName,omitempty"`
	Country         string `json:"country,omitempty"`
	Email           string `json:"email,omitempty"`
	Phone           string `json:"phone,omitempty"`
	PostalCode      string `json:"postalCode,omitempty"`
	StateOrProvince string `json:"stateOrProvince,omitempty"`
}

type EnergyEfficiencyLabel struct {
	ImageDescription        string `json:"imageDescription,omitempty"`
	ImageURL                string `json:"imageURL,omitempty"`
	ProductInformationSheet string `json:"productInformationSheet,omitempty"`
}

type Hazmat struct {
	Component  string   `json:"component,omitempty"`
	Pictograms []string `json:"pictograms,omitempty"`
	SignalWord string   `json:"signalWord,omitempty"`
	Statements []string `json:"statements,omitempty"`
}

type Regulatory struct {
	EconomicOperator      *EconomicOperator      `json:"economicOperator,omitempty"`
	EnergyEfficiencyLabel *EnergyEfficiencyLabel `json:"energyEfficiencyLabel,omitempty"`
	Hazmat                *Hazmat                `json:"hazmat,omitempty"`
	RepairScore           string                 `json:"repairScore,omitempty"`
}

type Tax struct {
	ApplyTax              string `json:"applyTax,omitempty"`
	ThirdPartyTaxCategory string `json:"thirdPartyTaxCategory,omitempty"`
	VatPercentage         string `json:"vatPercentage,omitempty"`
}

type Offer struct {
	AvailableQuantity              int                             `json:"availableQuantity,omitempty"`
	CategoryId                     string                          `json:"categoryId,omitempty"`
	Charity                        *Charity                        `json:"charity,omitempty"`
	ExtendedProducerResponsibility *ExtendedProducerResponsibility `json:"extendedProducerResponsibility,omitempty"`
	Format                         string                          `json:"format" validate:"required" `
	HideBuyerDetails               string                          `json:"hideBuyerDetails,omitempty"`
	IncludeCatalogProductDetails   bool                            `json:"includeCatalogProductDetails,omitempty"`
	ListingDescription             string                          `json:"listingDescription,omitempty"`
	ListingDuration                string                          `json:"listingDuration,omitempty"`
	ListingPolicies                *ListingPolicies                `json:"listingPolicies,omitempty"`
	ListingStartDate               string                          `json:"listingStartDate,omitempty"`
	LotSize                        string                          `json:"lotSize,omitempty"`
	MarketplaceId                  string                          `json:"marketplaceId" validate:"required"`
	MerchantLocationKey            string                          `json:"merchantLocationKey,omitempty"`
	PricingSummary                 *PricingSummary                 `json:"pricingSummary,omitempty"`
	QuantityLimitPerBuyer          int                             `json:"quantityLimitPerBuyer,omitempty"`
	Regulatory                     *Regulatory                     `json:"regulatory,omitempty"`
	SecondaryCategoryId            string                          `json:"secondaryCategoryId,omitempty"`
	Sku                            string                          `json:"sku" validate:"required"`
	StoreCategoryNames             []string                        `json:"storeCategoryNames,omitempty"`
	Tax                            *Tax                            `json:"tax,omitempty"`
}

type Warning struct {
	Category     string      `json:"category,omitempty"`
	Domain       string      `json:"domain,omitempty"`
	ErrorId      string      `json:"errorId,omitempty"`
	InputRefIds  []string    `json:"inputRefIds,omitempty"`
	LongMessage  string      `json:"longMessage,omitempty"`
	Message      string      `json:"message,omitempty"`
	OutputRefIds []string    `json:"outputRefIds,omitempty"`
	Parameters   []Parameter `json:"parameters,omitempty"`
	Subdomain    string      `json:"subdomain,omitempty"`
}

type OfferResponse struct {
	OfferId  string    `json:"offerId,omitempty"`
	Warnings []Warning `json:"warnings,omitempty"`
}

// offer model end

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
