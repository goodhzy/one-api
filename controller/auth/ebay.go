package auth

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func EbayOAuth(c *gin.Context) {
	session := sessions.Default(c)
	state := c.Query("state")
}
