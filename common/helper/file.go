package helper

import (
	"fmt"
	"github.com/h2non/filetype"
	"image"
	"io"
	"os/exec"
)

type File interface {
	Read(p []byte) (n int, err error)
	Seek(offset int64, whence int) (int64, error)
}

// GetFileMimeType 获取文件的 MIME 类型
func GetFileMimeType(file File) (string, error) {
	// 检查 file 是否实现了 io.Seeker 接口
	seeker, ok := file.(io.Seeker)
	if !ok {
		return "", fmt.Errorf("file does not implement io.Seeker")
	}

	// 保存当前文件指针位置
	currentPos, err := seeker.Seek(0, io.SeekCurrent)
	if err != nil {
		return "", err
	}

	// 读取文件的前 512 个字节
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil && err != io.EOF {
		return "", err
	}

	// 将文件指针复位到原来的位置
	_, err = seeker.Seek(currentPos, io.SeekStart)
	if err != nil {
		return "", err
	}

	// 使用 filetype 库检测 MIME 类型
	kind, err := filetype.Match(buffer)
	if err != nil {
		return "", err
	}

	if kind == filetype.Unknown {
		return "unknown", nil
	}

	return kind.MIME.Value, nil
}

// GetImageInfo 获取图片信息
func GetImageInfo(file File) (width, height int, err error) {
	seeker, ok := file.(io.Seeker)
	if !ok {
		return 0, 0, fmt.Errorf("file does not implement io.Seeker")
	}

	// 保存当前文件指针位置
	currentPos, err := seeker.Seek(0, io.SeekCurrent)
	if err != nil {
		return 0, 0, err
	}

	img, _, err := image.Decode(file)

	if err != nil {
		return 0, 0, err
	}
	_, err = seeker.Seek(currentPos, io.SeekStart)
	if err != nil {
		return 0, 0, err
	}
	bounds := img.Bounds()
	return bounds.Dx(), bounds.Dy(), nil
}

// IsImage 判断文件是否为图片
func IsImage(file File) bool {
	seeker, ok := file.(io.Seeker)
	if !ok {
		return false
	}

	// 保存当前文件指针位置
	currentPos, err := seeker.Seek(0, io.SeekCurrent)
	if err != nil {
		return false
	}
	head := make([]byte, 261)
	_, err = file.Read(head)
	if err != nil {
		return false
	}
	_, err = seeker.Seek(currentPos, io.SeekStart)
	if err != nil {
		return false
	}
	return filetype.IsImage(head)
}

// IsVideo 判断文件是否为视频
func IsVideo(file File) bool {
	seeker, ok := file.(io.Seeker)
	if !ok {
		return false
	}

	// 保存当前文件指针位置
	currentPos, err := seeker.Seek(0, io.SeekCurrent)
	if err != nil {
		return false
	}
	head := make([]byte, 261)
	_, err = file.Read(head)
	if err != nil {
		return false
	}
	_, err = seeker.Seek(currentPos, io.SeekStart)
	if err != nil {
		return false
	}
	return filetype.IsVideo(head)
}

// VideoStream 用于表示视频流信息的结构体
type VideoStream struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// FFProbeOutput 用于表示 ffprobe 输出的结构体
type FFProbeOutput struct {
	Streams []VideoStream `json:"streams"`
}

// GetVideoDimensions 获取视频数据的宽高
func GetVideoDimensions(filePath string) (int, int, error) {

	cmd := exec.Command("ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0", filePath)
	output, err := cmd.Output()
	if err != nil {
		return 0, 0, err
	}

	var width, height int
	_, err = fmt.Sscanf(string(output), "%dx%d", &width, &height)
	if err != nil {
		return 0, 0, err
	}

	return width, height, nil
}
