package controller

import (
	"fmt"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/model"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/helper"
)

func generateRandomString(n int) string {
	const letterBytes = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}

func handleError(c *gin.Context, err error) {
	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"message": err.Error(),
	})
}

func getObjectName(ext string) string {
	return "uploads/" + time.Now().Format("2006/01/02") + "/" + generateRandomString(16) + ext
}

func Upload(c *gin.Context) {
	// 获取前端上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		handleError(c, err)
		return
	}

	// 转成reader
	src, err := file.Open()
	if err != nil {
		handleError(c, err)
		return
	}
	mimeType, err := helper.GetFileMimeType(src)
	if err != nil {
		handleError(c, err)
		return
	}
	fmt.Printf("MIME type: %s\n", mimeType)

	ext := filepath.Ext(file.Filename)

	var width, height int
	// 获取图片的宽高
	if helper.IsImage(src) {
		width, height, err = helper.GetImageInfo(src)
		if err != nil {
			handleError(c, err)
			return
		}
		fmt.Printf("Image dimensions: %d x %d\n", width, height)
	}
	if helper.IsVideo(src) {
		filePath := "./tmp/" + file.Filename
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		defer func(name string) {
			err := os.Remove(name)
			if err != nil {
				handleError(c, err)
			}
		}(filePath) // 确保在函数结束后删除文件

		// 获取视频的宽高
		width, height, err = helper.GetVideoDimensions(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get video dimensions"})
			return
		}
		fmt.Printf("video dimensions: %d x %d\n", width, height)
	}
	client, err := helper.CreateOssClient()
	if err != nil {
		handleError(c, err)
	}

	// 根据文件名生成objectName， 需要有年月日作为目录, 文件名生成随机的16位字符串, 需要加上文件后缀
	objectName := getObjectName(ext)
	bucket, err := client.Bucket(config.BucketName)
	if err != nil {
		handleError(c, err)
	}

	err = bucket.PutObject(objectName, src)
	if err != nil {
		handleError(c, err)
	}
	insertFile, err := model.InsertFile(&model.Files{
		FileName:  file.Filename,
		FilePath:  objectName,
		MimeType:  mimeType,
		Size:      file.Size,
		Width:     width,
		Height:    height,
		CreatedAt: helper.GetTimestamp(),
	})
	if err != nil {
		handleError(c, err)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "上传成功",
		"data":    insertFile,
	})

}
