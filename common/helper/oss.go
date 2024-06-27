package helper

import (
	"github.com/aliyun/aliyun-oss-go-sdk/oss"
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
