package controller

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/model"
)

func GetAllCountryCodes(c *gin.Context) {
	countryCodes, err := model.GetAllCountryCodes()
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
		"data":    countryCodes,
	})
	return
}


func InsertAllCountryCodes(c *gin.Context) {
	// 读取本地json文件
	exePath, err := filepath.Abs(filepath.Dir("."))
    if err != nil {
        fmt.Println(err)
    }
	// 构建 bin 目录的路径
    binDir := filepath.Join(exePath, "bin")

    // 构建文件路径
    filePath := filepath.Join(binDir, "country-codes.json")
	jsonFile, err := os.Open(filePath)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return	
	}
	defer jsonFile.Close()
	byteValue, _ := ioutil.ReadAll(jsonFile)
	var countryCodes []model.CountryCodes
	json.Unmarshal(byteValue, &countryCodes)

	//  获取数组的前两条数据， 并组成一个数组
	// 插入数据库
	for _, countryCode := range countryCodes {
		err := model.InsertCountryCode(&countryCode)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "插入成功",
	})
}
