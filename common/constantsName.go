package common

func GetStatusName(status int) string {
	switch status {
	case NotListed:
		return "未刊登"
	case CreateInventorySuccess:
		return "未刊登"
	case CreateOfferSuccess:
		return "未刊登"
	case PublishOfferSuccess:
		return "已刊登"
	default:
		return "Unknown"
	}
}
