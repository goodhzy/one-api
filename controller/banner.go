package controller

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
	"net/http"
	"strconv"
)

func GetAllBanner(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}

	banners, err := model.GetAllBanner(p*config.ItemsPerPage, config.ItemsPerPage)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    banners,
	})
	return
}

func GetBannerList(c *gin.Context) {
	banners, err := model.GetBannerList()

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    banners,
	})
	return
}

func GetBanner(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	banner, err := model.GetBannerById(int64(id))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    banner,
	})
	return
}

func AddBanner(c *gin.Context) {
	banner := model.Banner{}
	err := c.ShouldBindJSON(&banner)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": fmt.Sprintf("参数错误：%s", err.Error()),
		})
		return
	}
	banner.CreatedAt = helper.GetTimestamp()
	banner.CreatedBy = int64(c.GetInt(ctxkey.Id))
	err = banner.Insert()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    banner,
	})
	return
}

func DeleteBanner(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userId := c.GetInt64(ctxkey.Id)
	err := model.DeleteBannerById(int64(id), userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
	return
}

func UpdateBanner(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	banner := model.Banner{}
	err := c.ShouldBindJSON(&banner)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	banner.UpdatedAt = helper.GetTimestamp()
	banner.UpdatedBy = int64(userId)
	err = banner.Update()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    banner,
	})
	return
}
