package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/random"
	"github.com/songquanpeng/one-api/model"
	"gorm.io/gorm"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
)

// status枚举 1未刊登 2:已刊登
const (
	NotListed = 1
	Listed    = 2
)

const HeaderEbayId = "ebay_id"
const defaultMarketplaceId = "EBAY_US"

func doEbayRequest(c *gin.Context, method string, path string, body []byte, queryParams map[string]string, accessToken string) (*http.Response, error) {
	// 获取ebay_user_id
	ebayId, _ := strconv.Atoi(c.GetHeader(HeaderEbayId))
	// 如果path带有http或者https
	var reqUrl = ""
	if len(path) > 4 && (path[:4] == "http" || path[:5] == "https") {
		reqUrl = path
	} else {
		reqUrl = config.EbayApiUrl + path
	}

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
	cAccessToken := accessToken
	if accessToken == "" {
		ebay, err := model.GetEbayBindInfoByUserIdAndEbayUserId(int64(c.GetInt(ctxkey.Id)), int64(ebayId))
		if err != nil {
			return nil, err
		}
		cAccessToken = ebay.AccessToken
	}
	req.Header.Set("Content-Language", "en-US")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", cAccessToken))
	var client *http.Client
	//
	//uri := url.URL{}
	//uriProxy, _ := uri.Parse("http://127.0.0.1:8888")
	//client = &http.Client{
	//	Transport: &http.Transport{
	//		Proxy: http.ProxyURL(uriProxy),
	//	},
	//}
	client = &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		if resp.StatusCode == http.StatusUnauthorized {
			accessToken, err := RefreshToken(c)
			if accessToken == "" {
				// TODO 这里应该去重新授权获取token
				return nil, fmt.Errorf("ebay request error: %s", "refresh token error")
			}
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
	// https://developer.ebay.com/my/keys
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
			"https://api.ebay.com/oauth/api_scope/commerce.identity.readonly",
			"https://api.ebay.com/oauth/api_scope/commerce.identity.name.readonly",
			"https://api.ebay.com/oauth/api_scope/commerce.identity.address.readonly",
			"https://api.ebay.com/oauth/api_scope/commerce.identity.email.readonly",
			"https://api.ebay.com/oauth/api_scope/commerce.identity.phone.readonly",
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
			"message": err.Error(),
		})
		return
	}
	// 获取body内容
	var bodyData model.EbayOauthRes
	err = handleRespBody(c, resp, &bodyData)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err,
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
	// 获取ebay用户信息
	var identity model.EbayIdentity
	err = GetEbayUser(c, bodyData.AccessToken, &identity)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	// 查询是否有绑定信息
	ebayBind, err := model.GetEbayBindInfoByEbayUserId(identity.UserId)
	fmt.Printf("ebayBind: %+v\n", ebayBind)
	fmt.Printf("err: %+v\n", err)
	fmt.Printf(gorm.ErrRecordNotFound.Error())
	if err != nil {
		if err.Error() != gorm.ErrRecordNotFound.Error() {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}
	ebay.Username = identity.Username
	ebay.RegistrationMarketplaceId = identity.RegistrationMarketplaceId
	ebay.AccountType = identity.AccountType
	ebay.EbayUserId = identity.UserId
	if ebayBind.Id > 0 {
		err = ebay.Update()
	} else {
		err = ebay.Insert()

	}
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
			BackOssImage:   log.BackOssImage,
			FrontOssImage:  log.FrontOssImage,
			CompositeImage: log.OssImage,
			SelfSku:        random.GetUUID(),
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

func GetEbayGoodsList(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	ebayProducts, err := model.GetEbayProductList(p*config.ItemsPerPage, config.ItemsPerPage, int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get ebay goods list success",
		"data":    ebayProducts,
	})
}

func GetEbayGoodsDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Query("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	ebayProduct, err := model.GetEbayProductById(int64(id), int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get ebay goods detail success",
		"data":    ebayProduct,
	})

}

func GetEbayDeleteGoods(c *gin.Context) {
	id, err := strconv.Atoi(c.Query("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	err = model.DeleteEbayProductById(int64(id), int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "delete ebay goods success",
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
	resp, err := doEbayRequest(c, "POST", path, payloadBytes, nil, "")
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
	marketPlaceId := c.Query("marketplace_id")
	if strings.TrimSpace(marketPlaceId) == "" {
		marketPlaceId = defaultMarketplaceId
	}
	queryParams["marketplace_id"] = marketPlaceId
	var path = "/sell/account/v1/fulfillment_policy"
	resp, err := doEbayRequest(c, "GET", path, nil, queryParams, "")
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
	resp, err := doEbayRequest(c, "POST", path, payloadBytes, nil, "")
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
	ebayId, _ := strconv.Atoi(c.GetHeader(HeaderEbayId))
	ebay, err := model.GetEbayBindInfoByUserIdAndEbayUserId(int64(c.GetInt(ctxkey.Id)), int64(ebayId))
	if err != nil {
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
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, "")
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
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, "")
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
		"message": "get store categories success",
		"data":    respBody,
	})
	return
}

func GetEbayUser(c *gin.Context, accessToken string, identity *model.EbayIdentity) error {
	urlStr := "https://apiz.sandbox.ebay.com/commerce/identity/v1/user/"
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, accessToken)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return err
	}
	err = handleRespBody(c, resp, &identity)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return err
	}
	return nil
}

func GetMyEbayAccountList(c *gin.Context) {
	ebays, err := model.GetAllEbayAccountByUserId(int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get my ebay account list success",
		"data":    ebays,
	})
	return
}

func DelMyEbayAccount(c *gin.Context) {
	if c.Query("id") == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "id is required",
		})
		return
	}
	id, _ := strconv.Atoi(c.Query("id"))
	err := model.DeleteEbayAccountById(int64(id), c.GetInt64(ctxkey.Id))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "delete my ebay account success",
	})
	return
}

// GetDefaultCategoryTreeId get_default_category_tree_id
// https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId
func GetDefaultCategoryTreeId(c *gin.Context) {
	urlStr := "/commerce/taxonomy/v1/get_default_category_tree_id"
	queryParams := map[string]string{}
	var marketplaceId = ""
	if c.Query("marketplace_id") != "" {
		marketplaceId = c.Query("marketplace_id")
	} else {
		marketplaceId = "EBAY_US"
	}
	queryParams["marketplace_id"] = marketplaceId
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "")
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
		"message": "get default category tree id success",
		"data":    respBody,
	})
	return
}

// GetCategoryTree get_category_tree
// https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategoryTree
func GetCategoryTree(c *gin.Context) {
	urlStr := "/commerce/taxonomy/v1/category_tree/"
	categoryTreeId := c.Query("category_tree_id")
	urlStr += categoryTreeId
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, "")
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
		"message": "get category tree success",
		"data":    respBody,
	})
	return
}

// GetCategorySubtree get_category_subtree
// https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategorySubtree
func GetCategorySubtree(c *gin.Context) {
	///category_tree/{category_tree_id}/get_category_subtree
	urlStr := "/commerce/taxonomy/v1/category_tree/"
	categoryTreeId := c.Query("category_tree_id")
	urlStr += categoryTreeId + "/get_category_subtree"
	queryParams := map[string]string{}
	queryParams["category_id"] = c.Query("category_id")
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "")
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
		"message": "get category subtree success",
		"data":    respBody,
	})
	return
}

// GetCategorySuggestions get_category_suggestions
// https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategorySuggestions
func GetCategorySuggestions(c *gin.Context) {
	urlStr := "/commerce/taxonomy/v1/category_tree/"
	categoryTreeId := c.Query("category_tree_id")
	urlStr += categoryTreeId + "/get_category_suggestions"
	queryParams := map[string]string{}
	queryParams["q"] = c.Query("q")
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "")
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
		"message": "get category suggestions success",
		"data":    respBody,
	})
	return
}

// GetItemAspectsForCategory 获取类目属性
// https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getItemAspectsForCategory
func GetItemAspectsForCategory(c *gin.Context) {
	urlStr := "/commerce/taxonomy/v1/category_tree/"
	categoryTreeId := c.Query("category_tree_id")
	urlStr += categoryTreeId + "/get_item_aspects_for_category"
	queryParams := map[string]string{}
	queryParams["category_id"] = c.Query("category_id")
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "")
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
		"message": "get item aspects for category success",
		"data":    respBody,
	})
	return
}

// Function to generate the filter parameter
func generateFilter(categoryIds []string) string {
	// Join the category IDs with '|'
	categoryIdsStr := strings.Join(categoryIds, "|")

	// Format the string to the required filter format
	filterStr := fmt.Sprintf("categoryIds:{%s}", categoryIdsStr)

	// URL encode the filter string

	return filterStr
}

// GetItemConditionPolicies 获取物品状况
// https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getItemConditionPolicies
func GetItemConditionPolicies(c *gin.Context) {

	urlStr := "/sell/metadata/v1/marketplace/"
	marketplaceId := c.Query("marketplace_id")
	urlStr += marketplaceId + "/get_item_condition_policies"
	queryParams := map[string]string{}
	categoryIds := c.QueryArray("category_ids")
	if len(categoryIds) > 0 {
		queryParams["filter"] = generateFilter(categoryIds)
	} else {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "category_ids is required",
		})
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "")
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
		"message": "get item condition policies success",
		"data":    respBody,
	})
	return
}

// GetEbayReturnPolicies 获取退货政策
// https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/getReturnPolicies
func GetEbayReturnPolicies(c *gin.Context) {
	urlStr := "/sell/account/v1/return_policy"
	queryParams := map[string]string{}
	marketPlaceId := c.Query("marketplace_id")
	if strings.TrimSpace(marketPlaceId) == "" {
		marketPlaceId = defaultMarketplaceId
	}
	fmt.Printf("marketPlaceId: %s\n", marketPlaceId)
	queryParams["marketplace_id"] = marketPlaceId
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "")
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
		"message": "get return policies success",
		"data":    respBody,
	})
	return
}

// GetPaymentPolicies 获取支付政策
// https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicies
func GetPaymentPolicies(c *gin.Context) {
	urlStr := "/sell/account/v1/payment_policy"
	queryParams := map[string]string{}
	marketPlaceId := c.Query("marketplace_id")
	if strings.TrimSpace(marketPlaceId) == "" {
		marketPlaceId = defaultMarketplaceId
	}
	queryParams["marketplace_id"] = marketPlaceId
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "")
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
		"message": "get payment policies success",
		"data":    respBody,
	})
	return
}
