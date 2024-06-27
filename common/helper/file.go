package helper

import (
	"image"
	"net/http"
)

type File interface {
	Read(p []byte) (n int, err error)
	Seek(offset int64, whence int) (int64, error)
}

// GetFileMimeType 获取文件的 MIME 类型
func GetFileMimeType(file File) (string, error) {
	// 读取文件的前 512 个字节
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil {
		return "", err
	}

	// 将读取位置复位到文件开头
	_, err = file.Seek(0, 0)
	if err != nil {
		return "", err
	}

	// 使用 http.DetectContentType 函数检测 MIME 类型
	return http.DetectContentType(buffer), nil
}

// GetImageInfo 获取图片信息
func GetImageInfo(file File) (width, height int, err error) {
	// Decode the image to get its bounds and type
	img, _, err := image.Decode(file)
	if err != nil {
		return 0, 0, err
	}

	bounds := img.Bounds()

	return bounds.Dx(), bounds.Dy(), nil
}

// IsImage 判断文件是否为图片
func IsImage(file File) bool {
	mimeType, err := GetFileMimeType(file)
	if err != nil {
		return false
	}
	imageMimeTypes := map[string]bool{
		"image/jpeg":               true,
		"image/png":                true,
		"image/gif":                true,
		"image/bmp":                true,
		"image/webp":               true,
		"image/tiff":               true,
		"image/x-icon":             true,
		"image/vnd.microsoft.icon": true,
		"image/svg+xml":            true,
	}
	return imageMimeTypes[mimeType]
}

// IsVideo 判断文件是否为视频
func IsVideo(file File) bool {
	mimeType, err := GetFileMimeType(file)
	if err != nil {
		return false
	}
	videoMimeTypes := map[string]bool{
		"video/mp4":        true,
		"video/x-matroska": true,
		"video/webm":       true,
		"video/x-msvideo":  true,
		"video/quicktime":  true,
		"video/mpeg":       true,
		"video/x-ms-wmv":   true,
		"video/3gpp":       true,
		"video/3gpp2":      true,
		"video/ogg":        true,
	}
	return videoMimeTypes[mimeType]
}
