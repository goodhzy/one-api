package helper

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"io"
	"net/http"
	"os/exec"
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

func GetVideoCover(videoFile File) (io.Reader, error) {
	var out bytes.Buffer
	cmd := exec.Command("ffmpeg", "-i", "pipe:0", "-vf", "thumbnail,scale=320:240", "-frames:v", "1", "-f", "image2", "pipe:1")
	cmd.Stdin = videoFile
	cmd.Stdout = &out
	cmd.Stderr = &out

	err := cmd.Run()
	if err != nil {
		return nil, err
	}

	frame := out.Bytes()

	// 将第一帧图片数据赋值给一个变量
	firstFrameImage := bytes.NewReader(frame)

	return firstFrameImage, nil
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

// getVideoDimensions 获取视频数据的宽高
func GetVideoDimensions(videoData io.Reader) (int, int, error) {
	// 创建管道读取 ffprobe 输出
	cmd := exec.Command("ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", "-")
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	// 将视频数据传递给 ffprobe
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get stdin pipe: %w", err)
	}

	// 启动 ffprobe 命令
	if err := cmd.Start(); err != nil {
		return 0, 0, fmt.Errorf("failed to start ffprobe: %w", err)
	}

	// 将视频数据写入 ffprobe 的标准输入
	_, err = io.Copy(stdin, videoData)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to copy video data to ffprobe: %w", err)
	}

	// 关闭标准输入以结束数据传递
	if err := stdin.Close(); err != nil {
		return 0, 0, fmt.Errorf("failed to close stdin: %w", err)
	}

	// 等待 ffprobe 完成处理
	if err := cmd.Wait(); err != nil {
		return 0, 0, fmt.Errorf("ffprobe failed: %s", out.String())
	}

	// 解析 ffprobe 输出的 JSON 信息
	var ffprobeOutput FFProbeOutput
	err = json.Unmarshal(out.Bytes(), &ffprobeOutput)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to parse ffprobe output: %w", err)
	}

	// 获取视频流的宽高信息
	if len(ffprobeOutput.Streams) == 0 {
		return 0, 0, fmt.Errorf("no video stream found")
	}
	width := ffprobeOutput.Streams[0].Width
	height := ffprobeOutput.Streams[0].Height

	return width, height, nil
}
