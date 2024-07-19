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
)

// status枚举 1未刊登 2:已刊登
const (
	NotListed = 1
	Listed    = 2
)

func doEbayRequest(c *gin.Context, method string, path string, body []byte, queryParams map[string]string) (*http.Response, error) {

	var reqUrl = config.EbayApiUrl + path

	var req *http.Request
	var err error

	// 如果有查询参数，构建带查询参数的URL
	if len(queryParams) > 0 {
		u, err := url.Parse(reqUrl)
		if err != nil {
			return nil, err
		}
		q := u.Query()
		for key, value := range queryParams {
			q.Set(key, value)
		}
		u.RawQuery = q.Encode()
		reqUrl = u.String()
	}

	// 根据方法创建请求
	switch method {
	case "GET":
		req, err = http.NewRequest("GET", reqUrl, nil)
	case "POST":
		req, err = http.NewRequest("POST", reqUrl, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json") // 设置请求体的Content-Type，可以根据需要调整
	default:
		return nil, fmt.Errorf("unsupported method: %s", method)
	}

	if err != nil {
		return nil, err
	}
	ebay, err := model.GetEbayBindInfoByUserId(int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Language", "en-US")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ebay.AccessToken))
	var client *http.Client

	uri := url.URL{}
	uriProxy, _ := uri.Parse("http://127.0.0.1:8888")
	client = &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyURL(uriProxy),
		},
	}
	//client = &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		if resp.StatusCode == http.StatusUnauthorized {
			accessToken, err := RefreshToken(c)
			if err != nil {
				return nil, err
			}
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
			req.Body = io.NopCloser(bytes.NewBuffer(body))
			resp, err = client.Do(req)
			if err != nil {
				return nil, err
			}
		}
		if resp.StatusCode > http.StatusUnauthorized {
			var respBody = model.EbayResponse{}
			err = handleRespBody(c, resp, &respBody)
			if err != nil {
				return nil, err
			}
			if respBody.Errors != nil && len(respBody.Errors) > 0 {
				return nil, fmt.Errorf("ebay request error: %s", respBody.Errors[0].Message)
			}
			return nil, fmt.Errorf("ebay request error: %s", resp.Status)
		}
	}
	return resp, err
}
func handleRespBody[T any](c *gin.Context, resp *http.Response, respBody *T) error {
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(body, &respBody); err != nil {
		return err
	}
	return nil
}

func GetConfig(c *gin.Context) {
	var ebayConfig = model.EbayConsentConfig{}
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
			"https://api.ebay.com/oauth/api_scope/sell.account.readonly",             // View and manage your eBay seller account
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
			return
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
	err := c.ShouldBind(&logJson)
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
		return
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

// BulkCreateOrReplaceInventoryItem 批量创建或替换库存商品
// https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem
func BulkCreateOrReplaceInventoryItem(c *gin.Context) {
	var rawData model.RequestPayload
	if err := c.ShouldBindJSON(&rawData); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	payloadBytes, err := json.Marshal(rawData)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var path = "/sell/inventory/v1/bulk_create_or_replace_inventory_item"
	resp, err := doEbayRequest(c, "POST", path, payloadBytes, nil)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var respBody model.BulkCreateOrReplaceInventoryItemResponse
	err = handleRespBody(c, resp, &respBody)
	if err != nil {
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

// GetFulfillmentPolicies 获取发货政策
// https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicies
func GetFulfillmentPolicies(c *gin.Context) {
	queryParams := map[string]string{}
	queryParams["marketplace_id"] = c.Query("marketplace_id")
	var path = "/sell/account/v1/fulfillment_policy"
	resp, err := doEbayRequest(c, "GET", path, nil, queryParams)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get fulfillment policies success",
		"data":    respBody,
	})
	return
}

// CreateOffer 创建报价
// https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/createOffer
func CreateOffer(c *gin.Context) {
	var offer model.Offer
	if err := c.ShouldBindJSON(&offer); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	payloadBytes, err := json.Marshal(offer)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var path = "/sell/inventory/v1/offer"
	resp, err := doEbayRequest(c, "POST", path, payloadBytes, nil)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var respBody model.OfferResponse
	err = handleRespBody(c, resp, &respBody)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "create offer success",
	})
	return
}

// RefreshToken 刷新token
// https://developer.ebay.com/api-docs/static/oauth-refresh-token.html
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
		return "", err
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Basic "+helper.GetEncodedAuth())

	// 发起请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	var bodyData model.EbayOauthRes
	err = handleRespBody(c, resp, &bodyData)

	if err != nil {
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

func GetSites(c *gin.Context) {
	sites, err := model.GetSites()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get sites success",
		"data":    sites,
	})
}

func GetFormatTypes(c *gin.Context) {
	// 创建带label, value的数组
	formats := []map[string]string{
		{"label": "拍卖", "value": "AUCTION"},
		{"label": "固价", "value": "FIXED_PRICE"},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get format types success",
		"data":    formats,
	})
}

func GetStores(c *gin.Context) {
	urlStr := "/sell/stores/v1/store"
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get stores success",
		"data":    respBody,
	})
	return
}

func GetStoreCategories(c *gin.Context) {
	urlStr := "/sell/stores/v1/store/categories"
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get stores success",
		"data":    respBody,
	})
	return
}
