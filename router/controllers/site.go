package controllers

import (
	"github.com/gin-gonic/gin"
	model "github.com/songquanpeng/one-api/model"
	"github.com/songquanpeng/one-api/pkg/conf"
	"github.com/songquanpeng/one-api/pkg/serializer"
	"github.com/songquanpeng/one-api/pkg/wopi"
)

// SiteConfig 获取站点全局配置
func SiteConfig(c *gin.Context) {
	siteConfig := model.GetSettingByNames(
		"siteName",
		"login_captcha",
		"reg_captcha",
		"email_active",
		"forget_captcha",
		"email_active",
		"themes",
		"defaultTheme",
		"home_view_method",
		"share_view_method",
		"authn_enabled",
		"captcha_ReCaptchaKey",
		"captcha_type",
		"captcha_TCaptcha_CaptchaAppId",
		"register_enabled",
		"show_app_promotion",
	)

	var wopiExts []string
	if wopi.Default != nil {
		wopiExts = wopi.Default.AvailableExts()
	}

	// 如果已登录，则同时返回用户信息和标签
	user, _ := c.Get("user")
	if user, ok := user.(*model.User); ok {
		c.JSON(200, serializer.BuildSiteConfig(siteConfig, user, wopiExts))
		return
	}

	c.JSON(200, serializer.BuildSiteConfig(siteConfig, nil, wopiExts))
}

// Ping 状态检查页面
func Ping(c *gin.Context) {
	version := conf.BackendVersion
	if conf.IsPro == "true" {
		version += "-pro"
	}

	c.JSON(200, serializer.Response{
		Code: 0,
		Data: version,
	})
}

// Manifest 获取manifest.json
func Manifest(c *gin.Context) {
	options := model.GetSettingByNames(
		"siteName",
		"siteTitle",
		"pwa_small_icon",
		"pwa_medium_icon",
		"pwa_large_icon",
		"pwa_display",
		"pwa_theme_color",
		"pwa_background_color",
	)

	c.JSON(200, map[string]interface{}{
		"short_name": options["siteName"],
		"name":       options["siteTitle"],
		"icons": []map[string]string{
			{
				"src":   options["pwa_small_icon"],
				"sizes": "64x64 32x32 24x24 16x16",
				"type":  "image/x-icon",
			},
			{
				"src":   options["pwa_medium_icon"],
				"type":  "image/png",
				"sizes": "192x192",
			},
			{
				"src":   options["pwa_large_icon"],
				"type":  "image/png",
				"sizes": "512x512",
			},
		},
		"start_url":        ".",
		"display":          options["pwa_display"],
		"theme_color":      options["pwa_theme_color"],
		"background_color": options["pwa_background_color"],
	})
}
