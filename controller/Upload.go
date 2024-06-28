package controller

import (
	"fmt"
	"image"
	"io"
	"math/rand"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
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

func getImageDimensions(file io.Reader) (int, int, error) {
	img, _, err := image.Decode(file)
	if err != nil {
		return 0, 0, err
	}

	return img.Bounds().Dx(), img.Bounds().Dy(), nil
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

	client, err := helper.CreateOssClient()
	if err != nil {
		fmt.Println("Error:", err)
	}

	if helper.IsVideo(src) {
		width, height, err := helper.GetVideoDimensions(src)
		if err != nil {
			handleError(c, err)
		}
		fmt.Printf("Video dimensions: %d x %d\n", width, height)
	}

	// 根据文件名生成objectName， 需要有年月日作为目录, 文件名生成随机的16位字符串, 需要加上文件后缀
	objectName := getObjectName(ext)
	fmt.Println(objectName)
	bucket, err := client.Bucket(config.BucketName)
	if err != nil {
		handleError(c, err)
	}
	// 上传文件。
	err = bucket.PutObject(objectName, src)
	if err != nil {
		handleError(c, err)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    gin.H{"url": objectName, "width": width, "height": height, "size": file.Size},
	})

}
