package controller

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common"
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
	"reflect"
	"strconv"
	"strings"
	"time"
)

// status枚举 1未刊登 2. 创建库存 3. 创建报价 4. 发布报价

const HeaderEbayId = "Ebay-id"
const defaultMarketplaceId = "EBAY_US"

const isProxy = false

func getEbayId(c *gin.Context) string {
	ebayId := c.GetHeader(HeaderEbayId)
	return ebayId
}

func getGlobalId(c *gin.Context) string {
	globalId := c.GetHeader("X-EBAY-SOA-GLOBAL-ID")
	return globalId
}

func errorResponse(c *gin.Context, msg string) {
	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"message": msg,
	})

}

func redisGet(key string) (map[string]interface{}, error) {
	if common.RedisEnabled {
		cacheStr, err := common.RedisGet(key)
		if err != nil {
			fmt.Printf("Error occurred while getting cache: %s\n", err)
			return nil, err
		}
		if cacheStr != "" {
			var cacheJson map[string]interface{}
			err := json.Unmarshal([]byte(cacheStr), &cacheJson)
			if err != nil {
				fmt.Printf("Error occurred while unmarshaling JSON: %s\n", err)
				return nil, err
			}
			return cacheJson, nil
		}
	}
	return nil, nil
}

func redisSet[T any](key string, value T, expiration time.Duration) error {
	if common.RedisEnabled {
		cacheJson, err := json.Marshal(value)
		if err != nil {
			fmt.Printf("Error occurred while marshaling JSON: %s\n", err)
			return err
		}
		err = common.RedisSet(key, string(cacheJson), expiration)
		if err != nil {
			fmt.Printf("Error occurred while setting cache: %s\n", err)
			return err
		}
	}
	return nil
}

func doEbayRequest(c *gin.Context, method string, path string, body []byte, queryParams map[string]string, accessToken string, isXml bool) (*http.Response, error) {
	// 获取ebay_user_id
	ebayId, _ := strconv.Atoi(getEbayId(c))
	// 如果path带有http或者https
	var reqUrl = ""
	if len(path) > 4 && (path[:4] == "http" || path[:5] == "https") {
		reqUrl = path
	} else {
		reqUrl = config.EbayApiUrl + path
	}

	if isXml {
		reqUrl = config.EbayApiUrl + "/ws/api.dll"
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
		req.Header.Set("Content-Type", "application/json")
	case "PUT":
		req, err = http.NewRequest("PUT", reqUrl, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
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
			return nil, fmt.Errorf("ebay账号未绑定")
		}
		cAccessToken = ebay.AccessToken
	}

	req.Header.Set("Content-Language", "en-US")
	req.Header.Set("X-EBAY-SOA-GLOBAL-ID", c.GetHeader("X-EBAY-SOA-GLOBAL-ID"))
	req.Header.Set("X-EBAY-API-SITEID", strconv.Itoa(0))
	if isXml {
		req.Header.Set("X-EBAY-API-CALL-NAME", path)
		req.Header.Set("X-EBAY-API-IAF-TOKEN", fmt.Sprintf(cAccessToken))
		req.Header.Set("X-EBAY-API-COMPATIBILITY-LEVEL", strconv.Itoa(967))
	} else {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", cAccessToken))
	}

	var client *http.Client
	if isProxy {
		uri := url.URL{}
		uriProxy, _ := uri.Parse("http://127.0.0.1:8888")
		client = &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(uriProxy),
			},
		}
	} else {
		client = &http.Client{}
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		if resp.StatusCode == http.StatusUnauthorized {
			accessToken, err := RefreshToken(c)

			if accessToken == "" {
				// TODO 这里应该去重新授权获取token
				var ebay = model.Ebay{
					Status: common.EbayUserExpired,
					Id:     int64(ebayId),
				}
				err = ebay.Update()
				return nil, fmt.Errorf("账号已过期, 请前往ebay账号管理重新授权")
			}
			if err != nil {
				return nil, err
			}
			if isXml {
				req.Header.Set("X-EBAY-API-IAF-TOKEN", fmt.Sprintf(accessToken))
			} else {
				req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

			}
			req.Body = io.NopCloser(bytes.NewBuffer(body))
			resp, err = client.Do(req)
			if err != nil {
				return nil, err
			}
		}
		if resp.StatusCode > http.StatusUnauthorized {
			var respBody = model.EbayResponse{}
			err = handleRespBody(c, resp, &respBody, false)
			if err != nil {
				return nil, err
			}
			if respBody.Errors != nil && len(respBody.Errors) > 0 {
				return nil, fmt.Errorf("ebay request error: message %s; longMessage : %s", respBody.Errors[0].Message, respBody.Errors[0].LongMessage)
			}
			return nil, fmt.Errorf("ebay request error: %s", resp.Status)
		}
	}
	if isXml {
		var respBody model.EbayResponseXml
		cacheBody, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		resp.Body = io.NopCloser(bytes.NewBuffer(cacheBody))
		err = handleRespBody(c, resp, &respBody, true)
		if err != nil {
			return nil, err
		}

		resp.Body = io.NopCloser(bytes.NewBuffer(cacheBody))
		if err != nil {
			return nil, fmt.Errorf("read response body error: %s", err.Error())
		}
		if respBody.Errors != nil {
			// ErrorCode带有931 重新授权
			if respBody.Errors.ErrorCode == 931 || respBody.Errors.ErrorCode == 932 {
				accessToken, err := RefreshToken(c)
				if accessToken == "" {
					return nil, fmt.Errorf("账号已过期, 请前往ebay账号管理重新授权")
				}
				if err != nil {
					return nil, err
				}
				if isXml {
					req.Header.Set("X-EBAY-API-IAF-TOKEN", fmt.Sprintf(accessToken))
				} else {
					req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

				}
				req.Body = io.NopCloser(bytes.NewBuffer(body))
				resp, err = client.Do(req)
				if err != nil {
					return nil, err
				}
			}
		}
	}
	return resp, err
}
func handleRespBody[T any](c *gin.Context, resp *http.Response, respBody *T, isXml bool) error {
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
	if resp.StatusCode == http.StatusNoContent && (body == nil || len(body) == 0) {
		return nil
	}
	if isXml {
		if err := xml.Unmarshal(body, &respBody); err != nil {
			return err
		}
	} else {
		if err := json.Unmarshal(body, &respBody); err != nil {
			return err
		}
	}
	// 使用反射检查 respBody 是否包含 errors 字段
	respBodyValue := reflect.ValueOf(respBody)
	if respBodyValue.Kind() == reflect.Ptr {
		respBodyValue = respBodyValue.Elem()
		if respBodyValue.Kind() == reflect.Struct {
			errorsField := respBodyValue.FieldByName("Errors")
			if errorsField.IsValid() && errorsField.Kind() == reflect.Slice && errorsField.Len() > 0 {
				firstError := errorsField.Index(0).Interface()
				firstErrorValue := reflect.ValueOf(firstError)
				messageField := firstErrorValue.FieldByName("Message")
				longMessageField := firstErrorValue.FieldByName("LongMessage")
				if messageField.IsValid() && messageField.Kind() == reflect.String &&
					longMessageField.IsValid() && longMessageField.Kind() == reflect.String {
					//return fmt.Errorf("ebay request error: message %s; longMessage: %s", messageField.String(), longMessageField.String())
					return fmt.Errorf(string(body))
				}
			}
		}
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
			"https://api.ebay.com/oauth/api_scope",                           // View public data from eBay
			"https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",   // View your eBay marketing activities, such as ad campaigns and listing promotions
			"https://api.ebay.com/oauth/api_scope/sell.marketing",            // View and manage your eBay marketing activities, such as ad campaigns and listing promotions
			"https://api.ebay.com/oauth/api_scope/sell.inventory",            // View and manage your inventory and offers
			"https://api.ebay.com/oauth/api_scope/sell.account",              // View and manage your eBay seller account
			"https://api.ebay.com/oauth/api_scope/sell.account.readonly",     // View and manage your eBay seller account
			"https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly", // View your order fulfillments
			"https://api.ebay.com/oauth/api_scope/sell.fulfillment",          // View and manage your order fulfillments
			"https://api.ebay.com/oauth/api_scope/sell.analytics.readonly",   // View your selling analytics data, such as performance reports
			"https://api.ebay.com/oauth/api_scope/sell.stores",               // View and manage eBay stores
			"https://api.ebay.com/oauth/api_scope/commerce.identity.readonly",
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
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "request error",
		})
		return
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Basic "+helper.GetEncodedAuth())

	var client *http.Client
	if isProxy {
		uri := url.URL{}
		uriProxy, _ := uri.Parse("http://127.0.0.1:8888")
		client = &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(uriProxy),
			},
		}
	} else {
		client = &http.Client{}
	}
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
	err = handleRespBody(c, resp, &bodyData, false)
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
	ebay.Status = common.EbayUserNormal
	ebay.Id = ebayBind.Id
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
	Ids []int64 `json:"ids"`
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
			Status:         common.NotListed,
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
	status := c.Query("status")
	title := c.Query("title")
	if p < 0 {
		p = 0
	}
	ebayProducts, err := model.GetEbayProductList(p*config.ItemsPerPage, config.ItemsPerPage, status, title, int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	// 解析status为status_name
	for i, ebayProduct := range ebayProducts {
		ebayProducts[i].StatusName = common.GetStatusName(ebayProduct.Status)

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

func DeleteEbayGoods(c *gin.Context) {
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

func saveEbayGoods(c *gin.Context) (model.EbayProduct, error) {
	var ebayProduct model.EbayProduct
	if err := c.ShouldBindJSON(&ebayProduct); err != nil {
		return ebayProduct, err
	}
	userId := int64(c.GetInt(ctxkey.Id))
	if ebayProduct.Id > 0 {
		ebayProduct.UpdatedAt = helper.GetTimestamp()
		err := ebayProduct.Update(userId)
		if err != nil {
			return ebayProduct, err
		}
	} else {
		ebayProduct.CreatedAt = helper.GetTimestamp()
		ebayProduct.UserId = userId
		err := ebayProduct.Insert()
		if err != nil {
			return ebayProduct, err
		}
	}
	return ebayProduct, nil

}

func SaveEbayGoods(c *gin.Context) {
	_, err := saveEbayGoods(c)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "save ebay goods success",
	})
	return
}

// CreateOrReplaceInventoryItem 创建库存商品
// https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem
func CreateOrReplaceInventoryItem(c *gin.Context, ebayProduct *model.EbayProduct) error {
	var path = "/sell/inventory/v1/inventory_item/" + ebayProduct.SKU
	var payLoadJson = map[string]interface{}{
		"availability":         ebayProduct.Availability,
		"condition":            ebayProduct.Condition,
		"conditionDescription": ebayProduct.ConditionDescription,
		"conditionDescriptors": ebayProduct.ConditionDescriptors,
		//"packageWeightAndSize": ebayProduct.PackageWeightAndSize,
		"product": ebayProduct.Product,
		"locale":  ebayProduct.Locale,
	}
	payloadBytes, err := json.Marshal(payLoadJson)
	resp, err := doEbayRequest(c, "PUT", path, payloadBytes, nil, "", false)
	if err != nil {
		return err
	}

	var respBody model.EbayResponse
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		ebayProduct.EbayError = err.Error()
		updateErr := ebayProduct.Update(int64(c.GetInt(ctxkey.Id)))
		if updateErr != nil {
			return updateErr
		}
		return err
	}
	// 更改状态
	ebayProduct.Status = common.CreateInventorySuccess
	err = ebayProduct.Update(int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		return err
	}

	return nil
}

// CreateOffer 创建报价
// https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/createOffer
func CreateOffer(c *gin.Context, ebayProduct *model.EbayProduct) error {
	var createOfferPath = ""
	var createOfferMethod = ""
	if ebayProduct.OfferId == "" {
		createOfferPath = "/sell/inventory/v1/offer"
		createOfferMethod = "POST"
	} else {
		createOfferPath = "/sell/inventory/v1/offer/" + ebayProduct.OfferId
		createOfferMethod = "PUT"
	}
	var createOfferPayload []byte

	var createOfferPayloadJson = map[string]interface{}{
		"sku": ebayProduct.SKU,
		//"availableQuantity":   ebayProduct.AvailableQuantity,
		"format":              ebayProduct.Format,
		"categoryId":          ebayProduct.CategoryId,
		"secondaryCategoryId": ebayProduct.SecondaryCategoryId,
		"listingPolicies":     ebayProduct.ListingPolicies,
		"pricingSummary":      ebayProduct.PricingSummary,
		"storeCategoryNames":  ebayProduct.StoreCategoryNames,
		"marketplaceId":       ebayProduct.MarketplaceId,
		"merchantLocationKey": ebayProduct.MerchantLocationKey,
	}
	if ebayProduct.ListingDuration != "" {
		createOfferPayloadJson["listingDuration"] = ebayProduct.ListingDuration
	}

	createOfferPayload, err := json.Marshal(createOfferPayloadJson)

	if err != nil {
		return err
	}

	resp, err := doEbayRequest(c, createOfferMethod, createOfferPath, createOfferPayload, nil, "", false)
	if err != nil {
		return err
	}
	var createOfferRespBody model.EbayCreateOfferResponse
	err = handleRespBody(c, resp, &createOfferRespBody, false)
	if err != nil {
		ebayProduct.EbayError = err.Error()
		updateErr := ebayProduct.Update(int64(c.GetInt(ctxkey.Id)))
		if updateErr != nil {
			return updateErr
		}
		return err
	}
	if createOfferRespBody.OfferId != "" {
		ebayProduct.OfferId = createOfferRespBody.OfferId
	}
	// 更改状态
	ebayProduct.Status = common.CreateOfferSuccess
	err = ebayProduct.Update(int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		return err
	}
	return nil
}

// PublishOffer 刊登报价
// https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/publishOffer
func PublishOffer(c *gin.Context, ebayProduct *model.EbayProduct) error {
	var publishOfferPath = "/sell/inventory/v1/offer/" + ebayProduct.OfferId + "/publish"
	resp, err := doEbayRequest(c, "POST", publishOfferPath, nil, nil, "", false)
	if err != nil {
		return err
	}
	var publishOfferRespBody model.EbayPublishOfferResponse
	err = handleRespBody(c, resp, &publishOfferRespBody, false)
	if err != nil {
		ebayProduct.EbayError = err.Error()
		updateErr := ebayProduct.Update(int64(c.GetInt(ctxkey.Id)))
		if updateErr != nil {
			return updateErr
		}
		return err
	}
	// 更改状态
	ebayProduct.Status = common.PublishOfferSuccess
	err = ebayProduct.Update(int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		return err
	}
	return nil
}

// PublishEbayGoods 刊登商品
// https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/publishOffer

func PublishEbayGoods(c *gin.Context) {
	ebayProduct, err := saveEbayGoods(c)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	err = CreateOrReplaceInventoryItem(c, &ebayProduct)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	err = CreateOffer(c, &ebayProduct)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	err = PublishOffer(c, &ebayProduct)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "publish ebay goods success",
	})
	return
}

// PublishEbayGoodsBatch 批量刊登商品
func PublishEbayGoodsBatch(c *gin.Context) {
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
	// 根据ids获取ebay_goods
	ebayProducts, err := model.GetEbayProductsByIds(ids, int64(c.GetInt(ctxkey.Id)))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var successEbayProducts []model.EbayProduct
	var failedEbayProducts []model.EbayProduct
	for _, ebayProduct := range ebayProducts {
		if ebayProduct.EbayId == 0 {
			errorResponse(c, "请先绑定或者选择ebay账号")
			return
		}
		if ebayProduct.Product == nil {
			errorResponse(c, "Product is required")
			return

		}

		if ebayProduct.CategoryId == "" {
			errorResponse(c, "CategoryId is required")
			return

		}
		if ebayProduct.ListingPolicies == nil {
			errorResponse(c, "ListingPolicies is required")
			return
		}
		err = CreateOrReplaceInventoryItem(c, &ebayProduct)
		if err != nil {
			failedEbayProducts = append(failedEbayProducts, ebayProduct)
			continue
		}
		err = CreateOffer(c, &ebayProduct)
		if err != nil {
			failedEbayProducts = append(failedEbayProducts, ebayProduct)
			continue
		}
		err = PublishOffer(c, &ebayProduct)
		if err != nil {
			failedEbayProducts = append(failedEbayProducts, ebayProduct)
			continue
		}
		successEbayProducts = append(successEbayProducts, ebayProduct)
	}
	var successIds = make([]int64, 0)
	var failedIds = make([]int64, 0)
	for _, successEbayProduct := range successEbayProducts {
		successIds = append(successIds, successEbayProduct.Id)
	}
	for _, failedEbayProduct := range failedEbayProducts {
		failedIds = append(failedIds, failedEbayProduct.Id)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "publish ebay goods batch success",
		"data": gin.H{
			"successIds": successIds,
			"failedIds":  failedIds,
		},
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
	resp, err := doEbayRequest(c, "POST", path, payloadBytes, nil, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var respBody model.BulkCreateOrReplaceInventoryItemResponse
	err = handleRespBody(c, resp, &respBody, false)
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

	redisKey := fmt.Sprintf("ebayId=%s_marketPlaceId=%s_globalId=%s_name=fulfillmentPolicies", getEbayId(c), marketPlaceId, getGlobalId(c))

	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get fulfillment policies success",
			"data":    cacheJson,
		})
		return
	}

	queryParams["marketplace_id"] = marketPlaceId
	var path = "/sell/account/v1/fulfillment_policy"
	resp, err := doEbayRequest(c, "GET", path, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*5)*time.Second)
	if common.RedisEnabled {
		// 缓存数据
		cacheJson, err := json.Marshal(respBody)
		if err != nil {
			fmt.Printf("Error occurred while marshaling JSON: %s", err)
		}
		err = common.RedisSet(redisKey, string(cacheJson), time.Duration(60*5)*time.Second)
		if err != nil {
			fmt.Printf("Error occurred while setting cache: %s", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get fulfillment policies success",
		"data":    respBody,
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
	err = handleRespBody(c, resp, &bodyData, false)

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
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
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

	redisKey := fmt.Sprintf("ebayId=%s_globalId=%s_name=storeCategories", getEbayId(c), getGlobalId(c))

	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get store categories success",
			"data":    cacheJson,
		})
		return
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*5)*time.Second)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get store categories success",
		"data":    respBody,
	})
	return
}

func GetEbayUser(c *gin.Context, accessToken string, identity *model.EbayIdentity) error {
	urlStr := config.GetEbayUserUri + "/commerce/identity/v1/user/"
	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, accessToken, false)
	if err != nil {
		return err
	}
	err = handleRespBody(c, resp, identity, false)
	if err != nil {
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
		marketplaceId = defaultMarketplaceId
	}
	redisKey := fmt.Sprintf("ebayId=%s_marketplaceId=%s_globalId=%s_name=defaultCategoryTreeId", getEbayId(c), marketplaceId, getGlobalId(c))

	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get default category tree id success",
			"data":    cacheJson,
		})
		return
	}

	queryParams["marketplace_id"] = marketplaceId
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*60*24)*time.Second)
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

	cacheKey := fmt.Sprintf("ebayId=%s_categoryTreeId=%s_globalId=%s_name=categoryTree", getEbayId(c), categoryTreeId, getGlobalId(c))
	cacheJson, _ := redisGet(cacheKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get category tree success",
			"data":    cacheJson,
		})
		return
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, nil, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(cacheKey, respBody, time.Duration(60*60*24*7)*time.Second)
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
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
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
	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
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

	redisKey := fmt.Sprintf("ebayId=%s_categoryTreeId=%s_categoryId=%s_globalId=%s_name=itemAspectsForCategory", getEbayId(c), categoryTreeId, c.Query("category_id"), getGlobalId(c))
	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get item aspects for category success",
			"data":    cacheJson,
		})
		return
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*60*24*7)*time.Second)
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
	categoryIds := c.QueryArray("category_ids[]")
	if len(categoryIds) > 0 {
		queryParams["filter"] = generateFilter(categoryIds)
	} else {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "category_ids is required",
		})
		return
	}

	redisKey := fmt.Sprintf("ebayId=%s_marketplaceId=%s_categoryIds=%s_globalId=%s_name=itemConditionPolicies", getEbayId(c), marketplaceId, strings.Join(categoryIds, ","), getGlobalId(c))
	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get item condition policies success",
			"data":    cacheJson,
		})
		return
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*5)*time.Second)
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
	queryParams["marketplace_id"] = marketPlaceId

	redisKey := fmt.Sprintf("ebayId=%s_marketPlaceId=%s_globalId=%s_name=returnPolicies", getEbayId(c), marketPlaceId, getGlobalId(c))
	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get return policies success",
			"data":    cacheJson,
		})
		return
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*5)*time.Second)
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

	redisKey := fmt.Sprintf("ebayId=%s_marketPlaceId=%s_globalId=%s_name=paymentPolicies", getEbayId(c), marketPlaceId, getGlobalId(c))
	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get payment policies success",
			"data":    cacheJson,
		})
		return
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*5)*time.Second)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get payment policies success",
		"data":    respBody,
	})
	return
}

func GetListingDuration(c *gin.Context) {
	// 创建带label, value的数组
	durations := []map[string]string{
		{"label": "1天", "value": "DAYS_1"},
		{"label": "3天", "value": "DAYS_3"},
		{"label": "5天", "value": "DAYS_5"},
		{"label": "7天", "value": "DAYS_7"},
		{"label": "10天", "value": "DAYS_10"},
		//{"label": "21天", "value": "DAYS_21"},
		//{"label": "30天", "value": "DAYS_30"},
		//{"label": "GTC", "value": "GTC"},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get listing duration success",
		"data":    durations,
	})
}

// GetInventoryLocations 获取库存位置
// https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/getInventoryLocations
func GetInventoryLocations(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	queryParams := map[string]string{}
	queryParams["limit"] = strconv.Itoa(config.ItemsPerPage)
	queryParams["offset"] = strconv.Itoa(p * config.ItemsPerPage)
	urlStr := "/sell/inventory/v1/location"

	// TODO 这里没有针对分页做缓存, 因为暂时没有分页需求
	redisKey := fmt.Sprintf("ebayId=%s_globalId=%s_name=inventoryLocations", getEbayId(c), getGlobalId(c))
	cacheJson, _ := redisGet(redisKey)
	if cacheJson != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "get inventory locations success",
			"data":    cacheJson,
		})
		return
	}

	resp, err := doEbayRequest(c, "GET", urlStr, nil, queryParams, "", false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	var respBody any
	err = handleRespBody(c, resp, &respBody, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	_ = redisSet(redisKey, respBody, time.Duration(60*5)*time.Second)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get inventory locations success",
		"data":    respBody,
	})
	return
}

// 定义XML结构体

// GetMyeBaySelling 获取我的eBay销售
// https://developer.ebay.com/devzone/xml/docs/reference/ebay/GetMyeBaySelling.html
func GetMyeBaySelling(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	p = p + 1
	var status = c.Query("status")

	request := model.GetMyeBaySellingRequest{
		Xmlns:         "urn:ebay:apis:eBLBaseComponents",
		ErrorLanguage: "en_US",
		WarningLevel:  "High",
	}
	if status == "ActiveList" {
		request.ActiveList = &model.ActiveList{
			Sort: "TimeLeft",
			Pagination: model.Pagination{
				EntriesPerPage: 10,
				PageNumber:     p,
			},
		}
		request.UnsoldList = nil
	} else {
		request.UnsoldList = &model.UnsoldList{
			DurationInDays: 60,
			Pagination: model.Pagination{
				EntriesPerPage: 10,
				PageNumber:     p,
			},
		}
		request.ActiveList = nil
	}

	// 将结构体转为XML
	output, err := xml.MarshalIndent(request, "", "    ")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 添加XML头
	xmlHeader := []byte(xml.Header)
	fullXML := append(xmlHeader, output...)

	resp, err := doEbayRequest(c, "POST", "GetMyeBaySelling", fullXML, nil, "", true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var response model.GetMyeBaySellingResponse
	err = handleRespBody(c, resp, &response, true)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get my eBay selling success",
		"data":    response,
	})
}

// GetItem 获取商品
// https://developer.ebay.com/devzone/xml/docs/reference/ebay/GetItem.html
func GetItem(c *gin.Context) {
	itemId := c.Query("item_id")
	request := model.GetItemRequest{
		Xmlns:         "urn:ebay:apis:eBLBaseComponents",
		ErrorLanguage: "en_US",
		WarningLevel:  "High",
		ItemID:        itemId,
	}

	output, err := xml.MarshalIndent(request, "", "    ")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	xmlHeader := []byte(xml.Header)
	fullXML := append(xmlHeader, output...)

	resp, err := doEbayRequest(c, "POST", "GetItem", fullXML, nil, "", true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var response model.GetItemResponse
	err = handleRespBody(c, resp, &response, true)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "get item success",
		"data":    response,
	})

}

type EndItemsJson struct {
	ItemIds []string `json:"item_ids"`
}

// EndItems 下架商品
// https://developer.ebay.com/devzone/xml/docs/reference/ebay/EndItems.html
func EndItems(c *gin.Context) {
	// 从post获取请求参数
	var endItemsJson EndItemsJson
	err := c.ShouldBindJSON(&endItemsJson)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	request := model.EndItemsRequest{
		XMLNs:         "urn:ebay:apis:eBLBaseComponents",
		ErrorLanguage: "en_US",
		WarningLevel:  "High",
	}
	itemIds := endItemsJson.ItemIds
	if len(itemIds) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "itemIds is required",
		})
		return
	}
	for i, itemId := range itemIds {
		container := model.EndItemRequestContainer{
			MessageID:    fmt.Sprintf("Listing%d", i+1),
			EndingReason: "NotAvailable", // or another reason based on your logic
			ItemID:       itemId,
		}
		request.EndItemRequestContainer = append(request.EndItemRequestContainer, container)
	}

	output, err := xml.MarshalIndent(request, "", "  ")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Adding the XML declaration manually
	xmlDeclaration := `<?xml version="1.0" encoding="utf-8" ?>`
	fullXML := xmlDeclaration + "\n" + string(output)

	resp, err := doEbayRequest(c, "POST", "EndItems", []byte(fullXML), nil, "", true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var response model.EndItemsResponse
	err = handleRespBody(c, resp, &response, true)
	if response.Errors != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": response.Errors,
		})
		return
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
		"message": "end items success",
		"data":    response,
	})
	return
}

// RelistItems 重新上架商品
// https://developer.ebay.com/devzone/xml/docs/reference/ebay/RelistItem.html
func RelistItems(c *gin.Context) {
	var endItemsJson EndItemsJson
	err := c.ShouldBindJSON(&endItemsJson)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	itemIds := endItemsJson.ItemIds

	for _, itemId := range itemIds {
		request := model.RelistItemRequest{
			Xmlns:         "urn:ebay:apis:eBLBaseComponents",
			ErrorLanguage: "en_US",
			WarningLevel:  "High",
			Item: model.RelistItem{
				ItemID: itemId,
			},
		}
		output, err := xml.MarshalIndent(request, "", "    ")
		if err != nil {
			//c.JSON(http.StatusOK, gin.H{
			//	"success": false,
			//	"message": err.Error(),
			//})
			//return
		}

		xmlHeader := []byte(xml.Header)
		fullXML := append(xmlHeader, output...)

		resp, err := doEbayRequest(c, "POST", "RelistItem", fullXML, nil, "", true)
		if err != nil {
			//c.JSON(http.StatusOK, gin.H{
			//	"success": false,
			//	"message": err.Error(),
			//})
			//return
		}

		var response model.RelistItemResponse
		err = handleRespBody(c, resp, &response, true)

		if err != nil {
			//c.JSON(http.StatusOK, gin.H{
			//	"success": false,
			//	"message": err.Error(),
			//})
			//return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "relist item success",
	})
}
