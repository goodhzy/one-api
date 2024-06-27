package controller

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/gin-gonic/gin"
)

func generateRandomString(n int) string {
	const letterBytes = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}

func handleError(err error) {
	fmt.Println("Error:", err)
	os.Exit(-1)
}

func Upload(c *gin.Context) {
	// 获取前端上传的文件
	file, _ := c.FormFile("file")
	// 转成reader
	src, _ := file.Open()
	ext := filepath.Ext(file.Filename)
	// 从环境变量中获取访问凭证。运行本代码示例之前，请先配置环境变量。
	provider, err := oss.NewEnvironmentVariableCredentialsProvider()
	if err != nil {
		fmt.Println("Error:", err)
	}
	client, err := oss.New("https://oss-cn-guangzhou.aliyuncs.com", "", "", oss.SetCredentialsProvider(&provider), oss.AuthVersion(oss.AuthV4), oss.Region("cn-guangzhou"))
	if err != nil {
		fmt.Println("Error:", err)
	}

	bucketName := "ball-star-card"
	// 根据文件名生成objectName， 需要有年月日作为目录, 文件名生成随机的16位字符串, 需要加上文件后缀
	objectName := "uploads/" + time.Now().Format("2006/01/02") + "/" + generateRandomString(16) + ext
	fmt.Println(objectName)
	bucket, err := client.Bucket(bucketName)
	if err != nil {
		handleError(err)
	}
	// 上传文件。
	err = bucket.PutObject(objectName, src)
	if err != nil {
		handleError(err)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    gin.H{"url": objectName},
	})

}
