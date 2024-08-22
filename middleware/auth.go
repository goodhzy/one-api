package middleware

import (
	"bytes"
	"context"
	"crypto/md5"
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/qiniu/go-sdk/v7/auth/qbox"
	"github.com/songquanpeng/one-api/common/blacklist"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/network"
	model "github.com/songquanpeng/one-api/model"
	"github.com/songquanpeng/one-api/pkg/auth"
	"github.com/songquanpeng/one-api/pkg/cache"
	"github.com/songquanpeng/one-api/pkg/filesystem"
	"github.com/songquanpeng/one-api/pkg/filesystem/driver/oss"
	"github.com/songquanpeng/one-api/pkg/filesystem/driver/upyun"
	"github.com/songquanpeng/one-api/pkg/mq"
	"github.com/songquanpeng/one-api/pkg/serializer"
	"github.com/songquanpeng/one-api/pkg/util"
	"io/ioutil"
	"net/http"
	"strings"
)

func authHelper(c *gin.Context, minRole int) {
	session := sessions.Default(c)
	username := session.Get("username")
	role := session.Get("role")
	id := session.Get("id")
	status := session.Get("status")
	if username == nil {
		// Check access token
		accessToken := c.Request.Header.Get("Authorization")
		if accessToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "无权进行此操作，未登录且未提供 access token",
			})
			c.Abort()
			return
		}
		user := model.ValidateAccessToken(accessToken)
		if user != nil && user.Username != "" {
			// Token is valid
			username = user.Username
			role = user.Role
			id = user.Id
			status = user.Status
		} else {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无权进行此操作，access token 无效",
			})
			c.Abort()
			return
		}
	}
	if status.(int) == model.UserStatusDisabled || blacklist.IsUserBanned(id.(int)) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "用户已被封禁",
		})
		session := sessions.Default(c)
		session.Clear()
		_ = session.Save()
		c.Abort()
		return
	}
	if role.(int) < minRole {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无权进行此操作，权限不足",
		})
		c.Abort()
		return
	}
	c.Set("username", username)
	c.Set("role", role)
	c.Set("id", id)
	c.Set("user_id", id)
	c.Next()
}

func UserAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		authHelper(c, model.RoleCommonUser)
	}
}

func AdminAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		authHelper(c, model.RoleAdminUser)
	}
}

func RootAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		authHelper(c, model.RoleRootUser)
	}
}

func TokenAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		key := c.Request.Header.Get("Authorization")
		key = strings.TrimPrefix(key, "Bearer ")
		key = strings.TrimPrefix(key, "sk-")
		parts := strings.Split(key, "-")
		key = parts[0]
		token, err := model.ValidateUserToken(key)
		if err != nil {
			abortWithMessage(c, http.StatusUnauthorized, err.Error())
			return
		}
		if token.Subnet != nil && *token.Subnet != "" {
			if !network.IsIpInSubnets(ctx, c.ClientIP(), *token.Subnet) {
				abortWithMessage(c, http.StatusForbidden, fmt.Sprintf("该令牌只能在指定网段使用：%s，当前 ip：%s", *token.Subnet, c.ClientIP()))
				return
			}
		}
		userEnabled, err := model.CacheIsUserEnabled(token.UserId)
		if err != nil {
			abortWithMessage(c, http.StatusInternalServerError, err.Error())
			return
		}
		if !userEnabled || blacklist.IsUserBanned(token.UserId) {
			abortWithMessage(c, http.StatusForbidden, "用户已被封禁")
			return
		}
		requestModel, err := getRequestModel(c)
		if err != nil && shouldCheckModel(c) {
			abortWithMessage(c, http.StatusBadRequest, err.Error())
			return
		}
		c.Set(ctxkey.RequestModel, requestModel)
		if token.Models != nil && *token.Models != "" {
			c.Set(ctxkey.AvailableModels, *token.Models)
			if requestModel != "" && !isModelInList(requestModel, *token.Models) {
				abortWithMessage(c, http.StatusForbidden, fmt.Sprintf("该令牌无权使用模型：%s", requestModel))
				return
			}
		}
		c.Set(ctxkey.Id, token.UserId)
		c.Set(ctxkey.TokenId, token.Id)
		c.Set(ctxkey.TokenName, token.Name)
		if len(parts) > 1 {
			if model.IsAdmin(token.UserId) {
				c.Set(ctxkey.SpecificChannelId, parts[1])
			} else {
				abortWithMessage(c, http.StatusForbidden, "普通用户不支持指定渠道")
				return
			}
		}
		c.Next()
	}
}

func shouldCheckModel(c *gin.Context) bool {
	if strings.HasPrefix(c.Request.URL.Path, "/v1/completions") {
		return true
	}
	if strings.HasPrefix(c.Request.URL.Path, "/v1/chat/completions") {
		return true
	}
	if strings.HasPrefix(c.Request.URL.Path, "/v1/images") {
		return true
	}
	if strings.HasPrefix(c.Request.URL.Path, "/v1/audio") {
		return true
	}
	return false
}

const (
	CallbackFailedStatusCode = http.StatusUnauthorized
)

// SignRequired 验证请求签名
func SignRequired(authInstance auth.Auth) gin.HandlerFunc {
	return func(c *gin.Context) {
		var err error
		switch c.Request.Method {
		case "PUT", "POST", "PATCH":
			err = auth.CheckRequest(authInstance, c.Request)
		default:
			err = auth.CheckURI(authInstance, c.Request.URL)
		}

		if err != nil {
			c.JSON(200, serializer.Err(serializer.CodeCredentialInvalid, err.Error(), err))
			c.Abort()
			return
		}

		c.Next()
	}
}

// CurrentUser 获取登录用户
func CurrentUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		uid := session.Get("id")
		if uid != nil {
			user, err := model.GetActiveUserByID(uid)
			if err == nil {
				c.Set("user", &user)
			}
		}
		c.Next()
	}
}

// AuthRequired 需要登录
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		if user, _ := c.Get("user"); user != nil {
			if _, ok := user.(*model.User); ok {
				c.Next()
				return
			}
		}

		c.JSON(200, serializer.CheckLogin())
		c.Abort()
	}
}

// WebDAVAuth 验证WebDAV登录及权限
func WebDAVAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// OPTIONS 请求不需要鉴权，否则Windows10下无法保存文档
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		username, password, ok := c.Request.BasicAuth()
		if !ok {
			c.Writer.Header()["WWW-Authenticate"] = []string{`Basic realm="cloudreve"`}
			c.Status(http.StatusUnauthorized)
			c.Abort()
			return
		}

		expectedUser, err := model.GetActiveUserByEmail(username)
		if err != nil {
			c.Status(http.StatusUnauthorized)
			c.Abort()
			return
		}

		// 密码正确？
		webdav, err := model.GetWebdavByPassword(password, uint(expectedUser.Id))
		if err != nil {
			c.Status(http.StatusUnauthorized)
			c.Abort()
			return
		}

		// 用户组已启用WebDAV？
		if !expectedUser.Group.WebDAVEnabled {
			c.Status(http.StatusForbidden)
			c.Abort()
			return
		}

		// 用户组已启用WebDAV代理？
		if !expectedUser.Group.OptionsSerialized.WebDAVProxy {
			webdav.UseProxy = false
		}

		c.Set("user", &expectedUser)
		c.Set("webdav", webdav)
		c.Next()
	}
}

// 对上传会话进行验证
func UseUploadSession(policyType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 验证key并查找用户
		resp := uploadCallbackCheck(c, policyType)
		if resp.Code != 0 {
			c.JSON(CallbackFailedStatusCode, resp)
			c.Abort()
			return
		}

		c.Next()
	}
}

// uploadCallbackCheck 对上传回调请求的 callback key 进行验证，如果成功则返回上传用户
func uploadCallbackCheck(c *gin.Context, policyType string) serializer.Response {
	// 验证 Callback Key
	sessionID := c.Param("sessionID")
	if sessionID == "" {
		return serializer.ParamErr("Session ID cannot be empty", nil)
	}

	callbackSessionRaw, exist := cache.Get(filesystem.UploadSessionCachePrefix + sessionID)
	if !exist {
		return serializer.Err(serializer.CodeUploadSessionExpired, "上传会话不存在或已过期", nil)
	}

	callbackSession := callbackSessionRaw.(serializer.UploadSession)
	c.Set(filesystem.UploadSessionCtx, &callbackSession)
	if callbackSession.Policy.Type != policyType {
		return serializer.Err(serializer.CodePolicyNotAllowed, "", nil)
	}

	// 清理回调会话
	_ = cache.Deletes([]string{sessionID}, filesystem.UploadSessionCachePrefix)

	// 查找用户
	user, err := model.GetActiveUserByID(callbackSession.UID)
	if err != nil {
		return serializer.Err(serializer.CodeUserNotFound, "", err)
	}
	c.Set(filesystem.UserCtx, &user)
	return serializer.Response{}
}

// RemoteCallbackAuth 远程回调签名验证
func RemoteCallbackAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 验证签名
		session := c.MustGet(filesystem.UploadSessionCtx).(*serializer.UploadSession)
		authInstance := auth.HMACAuth{SecretKey: []byte(session.Policy.SecretKey)}
		if err := auth.CheckRequest(authInstance, c.Request); err != nil {
			c.JSON(CallbackFailedStatusCode, serializer.Err(serializer.CodeCredentialInvalid, err.Error(), err))
			c.Abort()
			return
		}

		c.Next()

	}
}

// QiniuCallbackAuth 七牛回调签名验证
func QiniuCallbackAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := c.MustGet(filesystem.UploadSessionCtx).(*serializer.UploadSession)

		// 验证回调是否来自qiniu
		mac := qbox.NewMac(session.Policy.AccessKey, session.Policy.SecretKey)
		ok, err := mac.VerifyCallback(c.Request)
		if err != nil {
			util.Log().Debug("Failed to verify callback request: %s", err)
			c.JSON(401, serializer.GeneralUploadCallbackFailed{Error: "Failed to verify callback request."})
			c.Abort()
			return
		}

		if !ok {
			c.JSON(401, serializer.GeneralUploadCallbackFailed{Error: "Invalid signature."})
			c.Abort()
			return
		}

		c.Next()
	}
}

// OSSCallbackAuth 阿里云OSS回调签名验证
func OSSCallbackAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		err := oss.VerifyCallbackSignature(c.Request)
		if err != nil {
			util.Log().Debug("Failed to verify callback request: %s", err)
			c.JSON(401, serializer.GeneralUploadCallbackFailed{Error: "Failed to verify callback request."})
			c.Abort()
			return
		}

		c.Next()
	}
}

// UpyunCallbackAuth 又拍云回调签名验证
func UpyunCallbackAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := c.MustGet(filesystem.UploadSessionCtx).(*serializer.UploadSession)

		// 获取请求正文
		body, err := ioutil.ReadAll(c.Request.Body)
		c.Request.Body.Close()
		if err != nil {
			c.JSON(401, serializer.GeneralUploadCallbackFailed{Error: err.Error()})
			c.Abort()
			return
		}

		c.Request.Body = ioutil.NopCloser(bytes.NewReader(body))

		// 准备验证Upyun回调签名
		handler := upyun.Driver{Policy: &session.Policy}
		contentMD5 := c.Request.Header.Get("Content-Md5")
		date := c.Request.Header.Get("Date")
		actualSignature := c.Request.Header.Get("Authorization")

		// 计算正文MD5
		actualContentMD5 := fmt.Sprintf("%x", md5.Sum(body))
		if actualContentMD5 != contentMD5 {
			c.JSON(401, serializer.GeneralUploadCallbackFailed{Error: "MD5 mismatch."})
			c.Abort()
			return
		}

		// 计算理论签名
		signature := handler.Sign(context.Background(), []string{
			"POST",
			c.Request.URL.Path,
			date,
			contentMD5,
		})

		// 对比签名
		if signature != actualSignature {
			c.JSON(401, serializer.GeneralUploadCallbackFailed{Error: "Signature not match"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// OneDriveCallbackAuth OneDrive回调签名验证
func OneDriveCallbackAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 发送回调结束信号
		mq.GlobalMQ.Publish(c.Param("sessionID"), mq.Message{})

		c.Next()
	}
}

// IsAdmin 必须为管理员用户组
func IsAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := c.Get("user")
		if user.(*model.User).Group.ID != 1 && user.(*model.User).Id != 1 {
			c.JSON(200, serializer.Err(serializer.CodeNoPermissionErr, "", nil))
			c.Abort()
			return
		}

		c.Next()
	}
}
