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

func GetAllFeedback(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}

	feedbacks, err := model.GetAllFeedback(p*config.ItemsPerPage, config.ItemsPerPage)

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
		"data":    feedbacks,
	})
	return
}

func GetFeedbackList(c *gin.Context) {
	feedbacks, err := model.GetFeedbackList()

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
		"data":    feedbacks,
	})
	return
}

func GetFeedback(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	feedback, err := model.GetFeedbackById(int64(id))
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
		"data":    feedback,
	})
	return
}

func AddFeedback(c *gin.Context) {
	feedback := model.Feedback{}
	err := c.ShouldBindJSON(&feedback)
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
	feedback.CreatedAt = helper.GetTimestamp()
	feedback.CreatedBy = int64(c.GetInt(ctxkey.Id))
	err = feedback.Insert()
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
		"data":    feedback,
	})
	return
}
