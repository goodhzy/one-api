package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
	"io"
	"net/http"
	"net/url"
	"os"
	"reflect"
)

// status枚举 1未刊登 2:已刊登
const (
	NotListed = 1
	Listed    = 2
)

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
	Height float64 `json:"height"`
	Length float64 `json:"length"`
	Unit   string  `json:"unit"`
	Width  float64 `json:"width"`
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
	EPID        string   `json:"epid"`
	ImageUrls   []string `json:"imageUrls"`
	ISBN        []string `json:"isbn"`
	MPN         string   `json:"mpn"`
	Subtitle    string   `json:"subtitle"`
	Title       string   `json:"title"`
	UPC         []string `json:"upc"`
	VideoIds    []string `json:"videoIds"`
}

// InventoryItem struct to represent an inventory item
type InventoryItem struct {
	Availability         Availability          `json:"availability"`
	Condition            string                `json:"condition"`
	ConditionDescription string                `json:"conditionDescription"`
	ConditionDescriptors []ConditionDescriptor `json:"conditionDescriptors,omitempty"`
	Locale               string                `json:"locale"`
	PackageWeightAndSize PackageWeightAndSize  `json:"packageWeightAndSize"`
	Product              Product               `json:"product,omitempty"`
	SKU                  string                `json:"sku"`
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

// Response struct to represent each response in the responses array
type Response struct {
	Errors     []ErrorDetail   `json:"errors,omitempty"`
	Locale     string          `json:"locale"`
	SKU        string          `json:"sku"`
	StatusCode int             `json:"statusCode"`
	Warnings   []WarningDetail `json:"warnings,omitempty"`
}

// BulkCreateOrReplaceInventoryItemResponse struct to represent the full response
type BulkCreateOrReplaceInventoryItemResponse struct {
	Responses []Response `json:"responses"`
}

// 递归过滤字段
func filterFields(v reflect.Value, user *map[string]interface{}, prefix string) {
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	if v.Kind() != reflect.Struct {
		return
	}

	t := v.Type()

	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		fieldType := t.Field(i)

		// 跳过未导出的字段
		if !field.CanInterface() {
			continue
		}

		// 处理嵌套结构
		if field.Kind() == reflect.Struct {
			newPrefix := prefix
			if prefix != "" {
				newPrefix += "."
			}
			newPrefix += fieldType.Tag.Get("json")
			filterFields(field, user, newPrefix)
			continue
		}

		// 检查字段是否为零值
		if !isZeroValue(field) {
			jsonTag := fieldType.Tag.Get("json")
			if jsonTag == "" {
				jsonTag = fieldType.Name
			}
			if prefix != "" {
				jsonTag = prefix + "." + jsonTag
			}
			(*user)[jsonTag] = field.Interface()
		}
	}
}

// 判断字段是否为零值
func isZeroValue(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.Array, reflect.Chan, reflect.Map, reflect.Slice:
		return v.Len() == 0
	case reflect.Struct:
		return reflect.DeepEqual(v.Interface(), reflect.Zero(v.Type()).Interface())
	case reflect.Func, reflect.Interface, reflect.Ptr:
		return v.IsNil()
	default:
		zero := reflect.Zero(v.Type()).Interface()
		current := v.Interface()
		return reflect.DeepEqual(current, zero)
	}
}

func GetConfig(c *gin.Context) {
	var ebayConfig = model.EbayConsentConfig{}
	//ebayConfig.AuthUrl = "https://auth.ebay.com/oauth2/authorize"
	ebayConfig.AuthUrl = config.EbayOauthUrl + "/oauth2/authorize"
	ebayConfig.ClientId = os.Getenv("EBAY_APP_ID")
	ebayConfig.RedirectUri = config.EbayRedirectUri
	ebayConfig.ResponseType = "code"
	ebayConfig.Scope =
		[]string{
			"https://api.ebay.com/oauth/api_scope",                                   // View public data from eBay
			"https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",           // View your eBay marketing activities, such as ad campaigns and listing promotions
			"https://api.ebay.com/oauth/api_scope/sell.marketing",                    // View and manage your eBay marketing activities, such as ad campaigns and listing promotions
			"https://api.ebay.com/oauth/api_scope/sell.inventory",                    // View and manage your inventory and offers
			"https://api.ebay.com/oauth/api_scope/sell.account",                      // View and manage your eBay seller account
			"https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",         // View your order fulfillments
			"https://api.ebay.com/oauth/api_scope/sell.fulfillment",                  // View and manage your order fulfillments
			"https://api.ebay.com/oauth/api_scope/sell.analytics.readonly",           // View your selling analytics data, such as performance reports
			"https://api.ebay.com/oauth/api_scope/commerce.identity.status.readonly", // View your eBay account status
			"https://api.ebay.com/oauth/api_scope/sell.stores",                       // View and manage eBay stores
		}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    ebayConfig,
	})
	return
}

func EbayAuth(c *gin.Context) {
	// 获取code
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "code is required",
		})
		return
	}

	// 设置请求的目标URL
	urlStr := config.EbayApiUrl + "/identity/v1/oauth2/token"

	// 创建一个表单数据
	// 假设我们要发送的表单字段是"key1=value1&key2=value2"
	formData := url.Values{}
	formData.Set("grant_type", "authorization_code")
	formData.Set("code", code)
	formData.Set("redirect_uri", config.EbayRedirectUri)

	// 编码表单数据
	encodedFormData := formData.Encode()

	// 创建HTTP请求
	req, err := http.NewRequest("POST", urlStr, bytes.NewBuffer([]byte(encodedFormData)))
	if err != nil {
		fmt.Println("Error creating request:", err)
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "request error",
		})
		return
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Basic "+helper.GetEncodedAuth())

	// 发起请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "request error",
		})
		return
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {

		}
	}(resp.Body)

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
		return
	}
	// 获取body内容
	var bodyData model.EbayOauthRes
	err = json.Unmarshal(body, &bodyData)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "json unmarshal error",
		})
		return
	}
	if bodyData.Error != "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": bodyData.ErrorDescription,
		})
		return
	}
	var ebay = model.Ebay{
		AccessToken:           bodyData.AccessToken,
		ExpiresIn:             bodyData.ExpiresIn,
		RefreshToken:          bodyData.RefreshToken,
		RefreshTokenExpiresIn: bodyData.RefreshTokenExpiresIn,
		TokenType:             bodyData.TokenType,
		CreatedAt:             helper.GetTimestamp(),
		UserId:                int64(c.GetInt(ctxkey.Id)),
	}
	err = ebay.Insert()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "bind success",
	})
	return
}

type LogRequest struct {
	Ids []int `json:"ids"`
}

func LogToEbayGoods(c *gin.Context) {
	var logJson LogRequest
	err := c.BindJSON(&logJson)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var ids = logJson.Ids
	// 根据ids获取log
	logs, err := model.GetLogsByIds(ids)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
	}
	// 将logs转成ebay_goods
	var ebayProduct model.EbayProduct
	var ebayProducts []model.EbayProduct
	for _, log := range logs {
		ebayProducts = append(ebayProducts, model.EbayProduct{
			UserId:         int64(c.GetInt(ctxkey.Id)),
			Title:          log.Result,
			CompositeImage: log.OssImage,
			Status:         NotListed,
			Sort:           1,
			CreatedAt:      helper.GetTimestamp(),
		})
	}
	// 批量插入
	err = ebayProduct.InsertBatch(ebayProducts)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "log to ebay goods success",
	})
	return
}

func BulkCreateOrReplaceInventoryItem(c *gin.Context) {
	var rawData map[string]json.RawMessage
	if err := c.ShouldBindJSON(&rawData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := make(map[string]interface{})
	for key, value := range rawData {
		var v interface{}
		if err := json.Unmarshal(value, &v); err == nil {
			user[key] = v
		}
	}
	payloadBytes, err := json.Marshal(user)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var reqUrl = config.EbayApiUrl + "/sell/inventory/v1/bulk_create_or_replace_inventory_item"
	req, err := http.NewRequest("POST", reqUrl, bytes.NewBuffer(payloadBytes))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	ebay, err := model.GetEbayBindInfoByUserId(int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	req.Header.Set("Content-Language", "en-US")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ebay.AccessToken))

	// Perform the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if resp.StatusCode >= 400 {
		if resp.StatusCode == http.StatusUnauthorized {
			_, err := RefreshToken(c)
			if err != nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "refresh token",
				})
			}
			// 重新请求
			resp, err = client.Do(req)
			if err != nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
		}
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}(resp.Body)

	// Read and parse the response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var response BulkCreateOrReplaceInventoryItemResponse
	if err := json.Unmarshal(body, &response); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "bulk create or replace inventory item success",
	})
	return
}

func RefreshToken(c *gin.Context) (string, error) {
	// 设置请求的目标URL
	urlStr := config.EbayApiUrl + "/identity/v1/oauth2/token"
	ebay, err := model.GetEbayBindInfoByUserId(int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return "", err
	}
	formData := url.Values{}
	formData.Set("grant_type", "refresh_token")
	formData.Set("refresh_token", ebay.RefreshToken)
	encodedFormData := formData.Encode()

	// 创建HTTP请求
	req, err := http.NewRequest("POST", urlStr, bytes.NewBuffer([]byte(encodedFormData)))
	if err != nil {
		fmt.Println("Error creating request:", err)
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "request error",
		})
		return "", err
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Basic "+helper.GetEncodedAuth())

	// 发起请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "request error",
		})
		return "", err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
		}
	}(resp.Body)

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
		return "", err
	}
	// 获取body内容
	var bodyData model.EbayOauthRes
	err = json.Unmarshal(body, &bodyData)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "json unmarshal error",
		})
		return "", err
	}
	if bodyData.Error != "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": bodyData.ErrorDescription,
		})
		return "", err
	}
	err = model.UpdateAccessToken(int64(c.GetInt(ctxkey.Id)), bodyData.AccessToken)
	if err != nil {
		return "", err
	}
	return bodyData.AccessToken, nil
}
