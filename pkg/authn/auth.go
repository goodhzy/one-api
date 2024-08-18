package authn

import (
	"github.com/duo-labs/webauthn/webauthn"
	model "github.com/songquanpeng/one-api/model"
)

// NewAuthnInstance 新建Authn实例
func NewAuthnInstance() (*webauthn.WebAuthn, error) {
	base := model.GetSiteURL()
	return webauthn.New(&webauthn.Config{
		RPDisplayName: model.GetSettingByName("siteName"), // Display Name for your site
		RPID:          base.Hostname(),                    // Generally the FQDN for your site
		RPOrigin:      base.String(),                      // The origin URL for WebAuthn requests
	})
}
