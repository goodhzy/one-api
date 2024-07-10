package helper

import (
	"encoding/base64"
	"os"
)

func GetEncodedAuth() string {
	clientID := os.Getenv("EBAY_APP_ID")
	clientSecret := os.Getenv("EBAY_CERT_ID")

	// 将client_id:client_secret进行Base64编码
	auth := clientID + ":" + clientSecret
	encodedAuth := base64.StdEncoding.EncodeToString([]byte(auth))
	return encodedAuth
}
