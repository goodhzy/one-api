package helper

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/songquanpeng/one-api/common/config"
	"math/rand"
	"strings"
	"time"
)

func CreateOssClient() (*oss.Client, error) {
	provider, err := oss.NewEnvironmentVariableCredentialsProvider()
	if err != nil {
		return nil, err
	}
	client, err := oss.New("https://oss-cn-guangzhou.aliyuncs.com", "", "", oss.SetCredentialsProvider(&provider), oss.AuthVersion(oss.AuthV4), oss.Region("cn-guangzhou"))
	if err != nil {
		return nil, err
	}
	return client, nil
}
func generateRandomString(n int) string {
	const letterBytes = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}

func GetObjectName(ext string) string {
	return "uploads/" + time.Now().Format("2006/01/02") + "/" + generateRandomString(16) + ext
}
func mimeToExtension(mimeType string) string {
	mimeExtensions := map[string]string{
		"image/jpeg": "jpg",
		"image/png":  "png",
		"image/gif":  "gif",
		"image/bmp":  "bmp",
		"image/webp": "webp",
		"image/tiff": "tiff",
		// 其他MIME类型和扩展名的映射
	}
	return mimeExtensions[mimeType]
}

func GetBase64ImageExt(base64Image string) (ext string, err error) {
	fmt.Println(base64Image)
	fmt.Println("------------------------")
	fmt.Println("------------------------")
	// 分离MIME类型信息和实际的Base64数据
	parts := strings.Split(base64Image, ",")
	if len(parts) != 2 {
		fmt.Println("Invalid Base64 string format")
		return "", fmt.Errorf("invalid Base64 string format")
	}

	// 提取MIME类型信息
	mimeInfo := parts[0]
	mimeType := strings.TrimPrefix(mimeInfo, "data:")
	mimeType = strings.Split(mimeType, ";")[0]

	// 获取文件扩展名
	extension := mimeToExtension(mimeType)
	fmt.Println("File extension:", extension)
	return extension, nil
}

func UploadFromBase64(base64Str string) (string, error) {
	if base64Str == "" {
		fmt.Println("base64Str is empty")
		return "", fmt.Errorf("base64Str is empty")
	}
	println(base64Str)
	// base64带有前缀，需要去掉， 前缀格式不确定
	afterBase64Str := strings.Split(base64Str, ",")[1]
	byteArray, err := base64.StdEncoding.DecodeString(afterBase64Str)
	if err != nil {
		fmt.Println("Error decoding Base64 string:", err)
		return "", err
	}
	client, err := CreateOssClient()
	if err != nil {
		fmt.Println("fail to create client", err)

	}
	bucket, err := client.Bucket(config.BucketName)
	if err != nil {
		fmt.Println("fail to get bucket", err)
	}
	ext, err := GetBase64ImageExt(base64Str)
	if err != nil {
		fmt.Println("fail to get base64 image ext", err)
		return "", err
	}
	objectName := GetObjectName("." + ext)
	fmt.Println("objectName", objectName)
	err = bucket.PutObject(objectName, bytes.NewReader(byteArray))
	if err != nil {
		fmt.Println("fail to put object", err)
		return "", err
	}
	return objectName, nil
}
