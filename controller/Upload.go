package controller

import (
	"fmt"
	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/gin-gonic/gin"
	"os"
)

func handleError(err error) {
	fmt.Println("Error:", err)
	os.Exit(-1)
}

func Upload(c *gin.Context) {
	// 获取前端上传的文件
	file, _ := c.FormFile("file")
	// 转成reader
	src, _ := file.Open()
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
	objectName := "country-codes.json"
	bucket, err := client.Bucket(bucketName)
	if err != nil {
		handleError(err)
	}
	// 上传文件。
	err = bucket.PutObject(objectName, src)
	if err != nil {
		handleError(err)
	}

	fmt.Printf("client:%#v\n", client)
}
