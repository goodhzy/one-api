package router

import (
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/controller"
	auth2 "github.com/songquanpeng/one-api/controller/auth"
	"github.com/songquanpeng/one-api/middleware"
	pkgAuth "github.com/songquanpeng/one-api/pkg/auth"
	"github.com/songquanpeng/one-api/pkg/cache"
	"github.com/songquanpeng/one-api/pkg/hashid"
	wopi2 "github.com/songquanpeng/one-api/pkg/wopi"
	"github.com/songquanpeng/one-api/router/controllers"
)

func SetApiRouter(router *gin.Engine) {
	apiRouter := router.Group("/api")
	apiRouter.Use(gzip.Gzip(gzip.DefaultCompression))
	apiRouter.Use(middleware.GlobalAPIRateLimit())
	{
		apiRouter.GET("/status", controller.GetStatus)
		apiRouter.GET("/models", middleware.UserAuth(), controller.DashboardListModels)
		apiRouter.GET("/notice", controller.GetNotice)
		apiRouter.GET("/about", controller.GetAbout)
		apiRouter.GET("/home_page_content", controller.GetHomePageContent)
		apiRouter.GET("/verification", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.SendEmailVerification)
		apiRouter.GET("/reset_password", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.SendPasswordResetEmail)
		apiRouter.POST("/user/reset", middleware.CriticalRateLimit(), controller.ResetPassword)
		apiRouter.GET("/oauth/lark", middleware.CriticalRateLimit(), auth2.LarkOAuth)
		apiRouter.GET("/oauth/state", middleware.CriticalRateLimit(), auth2.GenerateOAuthCode)
		apiRouter.GET("/oauth/wechat", middleware.CriticalRateLimit(), auth2.WeChatAuth)
		apiRouter.GET("/oauth/ebay", middleware.CriticalRateLimit(), auth2.EbayOAuth)
		apiRouter.GET("/oauth/wechat/bind", middleware.CriticalRateLimit(), middleware.UserAuth(), auth2.WeChatBind)
		apiRouter.GET("/oauth/email/bind", middleware.CriticalRateLimit(), middleware.UserAuth(), controller.EmailBind)
		apiRouter.POST("/topup", middleware.AdminAuth(), controller.AdminTopUp)
		apiRouter.GET("/prompt", controller.GetPrompt)
		apiRouter.GET("/all_country_codes", controller.GetAllCountryCodes)
		apiRouter.GET("/insert-all-countryCodes", controller.InsertAllCountryCodes)
		apiRouter.POST("/upload", controller.Upload)
		apiRouter.GET("/banner/list", controller.GetBannerList)
		apiRouter.POST("test_base64", controller.TestUpload)

		apiRouter.GET("/ebay_config", middleware.UserAuth(), controller.GetConfig)
		apiRouter.GET("/ebay_oauth", middleware.UserAuth(), controller.EbayAuth)
		apiRouter.POST("/ebay_bulk_create_or_replace_inventory_item", middleware.UserAuth(), controller.BulkCreateOrReplaceInventoryItem)
		apiRouter.GET("/ebay_get_fulfillment_policies", middleware.UserAuth(), controller.GetFulfillmentPolicies)
		apiRouter.GET("/ebay_sites", middleware.UserAuth(), controller.GetSites)
		apiRouter.GET("/ebay_format_type", middleware.UserAuth(), controller.GetFormatTypes)
		apiRouter.GET("/ebay_stores", middleware.UserAuth(), controller.GetStores)
		apiRouter.GET("/ebay_get_store_categories", middleware.UserAuth(), controller.GetStoreCategories)
		apiRouter.GET("/ebay_account_list", middleware.UserAuth(), controller.GetMyEbayAccountList)
		apiRouter.GET("/ebay_account_delete", middleware.UserAuth(), controller.DelMyEbayAccount)
		apiRouter.GET("/ebay_get_default_category_tree_id", middleware.UserAuth(), controller.GetDefaultCategoryTreeId)
		apiRouter.GET("/ebay_category_tree", middleware.UserAuth(), controller.GetCategoryTree)
		apiRouter.GET("/ebay_category_subtree", middleware.UserAuth(), controller.GetCategorySubtree)
		apiRouter.GET("/ebay_get_category_suggestions", middleware.UserAuth(), controller.GetCategorySuggestions)
		apiRouter.GET("/ebay_get_item_aspects_for_category", middleware.UserAuth(), controller.GetItemAspectsForCategory)
		apiRouter.GET("/ebay_get_item_condition_policies", middleware.UserAuth(), controller.GetItemConditionPolicies)
		apiRouter.GET("/ebay_get_goods_list", middleware.UserAuth(), controller.GetEbayGoodsList)
		apiRouter.GET("/ebay_get_goods_detail", middleware.UserAuth(), controller.GetEbayGoodsDetail)
		apiRouter.POST("/ebay_save_goods", middleware.UserAuth(), controller.SaveEbayGoods)
		apiRouter.POST("/ebay_publish_goods", middleware.UserAuth(), controller.PublishEbayGoods)
		apiRouter.POST("/ebay_publish_goods_batch", middleware.UserAuth(), controller.PublishEbayGoodsBatch)
		apiRouter.GET("/ebay_delete_goods", middleware.UserAuth(), controller.DeleteEbayGoods)
		apiRouter.GET("/ebay_get_return_policy", middleware.UserAuth(), controller.GetEbayReturnPolicies)
		apiRouter.GET("/ebay_get_payment_policy", middleware.UserAuth(), controller.GetPaymentPolicies)
		apiRouter.GET("/ebay_get_listing_duration", middleware.UserAuth(), controller.GetListingDuration)
		apiRouter.GET("/ebay_get_inventory_location", middleware.UserAuth(), controller.GetInventoryLocations)
		apiRouter.GET("/ebay_get_my_selling", middleware.UserAuth(), controller.GetMyeBaySelling)
		apiRouter.GET("/ebay_get_item", middleware.UserAuth(), controller.GetItem)
		apiRouter.POST("/ebay_end_items", middleware.UserAuth(), controller.EndItems)
		apiRouter.POST("/ebay_re_items", middleware.UserAuth(), controller.RelistItems)

		userRoute := apiRouter.Group("/user")
		{
			userRoute.POST("/register", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.Register)
			userRoute.POST("/login", middleware.CriticalRateLimit(), controller.Login)
			userRoute.GET("/logout", controller.Logout)
			userRoute.GET("/storage", middleware.UserAuth(), middleware.CurrentUser(), controllers.UserStorage)

			selfRoute := userRoute.Group("/")
			selfRoute.Use(middleware.UserAuth())
			{
				selfRoute.GET("/dashboard", controller.GetUserDashboard)
				selfRoute.GET("/self", controller.GetSelf)
				selfRoute.PUT("/self", controller.UpdateSelf)
				selfRoute.DELETE("/self", controller.DeleteSelf)
				selfRoute.GET("/token", controller.GenerateAccessToken)
				selfRoute.GET("/aff", controller.GetAffCode)
				selfRoute.POST("/topup", controller.TopUp)
				selfRoute.GET("/available_models", controller.GetUserAvailableModels)
			}

			adminRoute := userRoute.Group("/")
			adminRoute.Use(middleware.AdminAuth())
			{
				adminRoute.GET("/", controller.GetAllUsers)
				adminRoute.GET("/search", controller.SearchUsers)
				adminRoute.GET("/:id", controller.GetUser)
				adminRoute.POST("/", controller.CreateUser)
				adminRoute.POST("/manage", controller.ManageUser)
				adminRoute.PUT("/", controller.UpdateUser)
				adminRoute.DELETE("/:id", controller.DeleteUser)
			}
		}
		optionRoute := apiRouter.Group("/option")
		optionRoute.Use(middleware.AdminAuth())
		{
			optionRoute.GET("/", controller.GetOptions)
			optionRoute.PUT("/", controller.UpdateOption)
		}
		channelRoute := apiRouter.Group("/channel")
		channelRoute.Use(middleware.AdminAuth())
		{
			channelRoute.GET("/", controller.GetAllChannels)
			channelRoute.GET("/search", controller.SearchChannels)
			channelRoute.GET("/models", controller.ListAllModels)
			channelRoute.GET("/:id", controller.GetChannel)
			channelRoute.GET("/test", controller.TestChannels)
			channelRoute.GET("/test/:id", controller.TestChannel)
			channelRoute.GET("/update_balance", controller.UpdateAllChannelsBalance)
			channelRoute.GET("/update_balance/:id", controller.UpdateChannelBalance)
			channelRoute.POST("/", controller.AddChannel)
			channelRoute.PUT("/", controller.UpdateChannel)
			channelRoute.DELETE("/disabled", controller.DeleteDisabledChannel)
			channelRoute.DELETE("/:id", controller.DeleteChannel)
		}

		tokenRoute := apiRouter.Group("/token")
		tokenRoute.Use(middleware.UserAuth())
		{
			tokenRoute.GET("/", controller.GetAllTokens)
			tokenRoute.GET("/search", controller.SearchTokens)
			tokenRoute.GET("/:id", controller.GetToken)
			tokenRoute.POST("/", controller.AddToken)
			tokenRoute.PUT("/", controller.UpdateToken)
			tokenRoute.DELETE("/:id", controller.DeleteToken)
			tokenRoute.GET("/default", controller.GetDefaultToken)
		}

		bannerRoute := apiRouter.Group("/banner")
		bannerRoute.Use(middleware.AdminAuth())
		{
			bannerRoute.GET("/", controller.GetAllBanner)
			bannerRoute.GET("/:id", controller.GetBanner)
			bannerRoute.POST("/", controller.AddBanner)
			bannerRoute.PUT("/", controller.UpdateBanner)
			bannerRoute.PUT("/disabled", controller.DeleteDisabledChannel)
			bannerRoute.DELETE("/:id", controller.DeleteBanner)
		}

		redemptionRoute := apiRouter.Group("/redemption")
		redemptionRoute.Use(middleware.AdminAuth())
		{
			redemptionRoute.GET("/", controller.GetAllRedemptions)
			redemptionRoute.GET("/search", controller.SearchRedemptions)
			redemptionRoute.GET("/:id", controller.GetRedemption)
			redemptionRoute.POST("/", controller.AddRedemption)
			redemptionRoute.PUT("/", controller.UpdateRedemption)
			redemptionRoute.DELETE("/:id", controller.DeleteRedemption)
		}
		logRoute := apiRouter.Group("/log")
		logRoute.GET("/", middleware.AdminAuth(), controller.GetAllLogs)
		logRoute.DELETE("/", middleware.AdminAuth(), controller.DeleteHistoryLogs)
		logRoute.GET("/stat", middleware.AdminAuth(), controller.GetLogsStat)
		logRoute.GET("/self/stat", middleware.UserAuth(), controller.GetLogsSelfStat)
		logRoute.GET("/search", middleware.AdminAuth(), controller.SearchAllLogs)
		logRoute.GET("/self", middleware.UserAuth(), controller.GetUserLogs)
		logRoute.GET("/self/search", middleware.UserAuth(), controller.SearchUserLogs)
		logRoute.POST("/to_ebay", middleware.UserAuth(), controller.LogToEbayGoods)
		groupRoute := apiRouter.Group("/group")
		groupRoute.Use(middleware.AdminAuth())
		{
			groupRoute.GET("/", controller.GetGroups)
		}

		feedbackRoute := apiRouter.Group("/feedback")
		feedbackRoute.POST("/", middleware.UserAuth(), controller.AddFeedback)
		feedbackRoute.GET("/", middleware.UserAuth(), controller.GetAllFeedback)

	}
}

func InitMasterRouter(r *gin.Engine) {
	/*
		静态资源
	*/
	r.Use(gzip.Gzip(gzip.DefaultCompression, gzip.WithExcludedPaths([]string{"/api/"})))
	r.GET("manifest.json", controllers.Manifest)

	v3 := r.Group("/api/v3")

	/*
		中间件
	*/
	//v3.Use(middleware.Session(conf.SystemConfig.SessionSecret))
	// 测试模式加入Mock助手中间件
	if gin.Mode() == gin.TestMode {
		v3.Use(middleware.MockHelper())
	}
	// 用户会话
	v3.Use(middleware.CurrentUser())

	// 禁止缓存
	v3.Use(middleware.CacheControl())

	/*
		路由
	*/
	{
		// Redirect file source link
		source := r.Group("f")
		{
			source.GET(":id/:name",
				middleware.HashID(hashid.SourceLinkID),
				middleware.ValidateSourceLink(),
				controllers.AnonymousPermLink)
		}

		// 全局设置相关
		site := v3.Group("site")
		{
			// 测试用路由
			site.GET("ping", controllers.Ping)
			// 站点全局配置
			site.GET("config", middleware.CSRFInit(), controllers.SiteConfig)
		}

		// 用户相关路由
		user := v3.Group("user")
		{
			user.GET("authn/:username",
				middleware.IsFunctionEnabled("authn_enabled"),
				controllers.StartLoginAuthn,
			)
			// WebAuthn登陆
			user.POST("authn/finish/:username",
				middleware.IsFunctionEnabled("authn_enabled"),
				controllers.FinishLoginAuthn,
			)
			// 获取用户主页展示用分享
			user.GET("profile/:id",
				middleware.HashID(hashid.UserID),
				controllers.GetUserShare,
			)
			// 获取用户头像
			user.GET("avatar/:id/:size",
				middleware.HashID(hashid.UserID),
				middleware.StaticResourceCache(),
				controllers.GetUserAvatar,
			)
		}

		// 需要携带签名验证的
		sign := v3.Group("")
		sign.Use(middleware.SignRequired(pkgAuth.General))
		{
			file := sign.Group("file")
			{
				// 文件外链（直接输出文件数据）
				file.GET("get/:id/:name",
					middleware.Sandbox(),
					middleware.StaticResourceCache(),
					controllers.AnonymousGetContent,
				)
				// 文件外链(301跳转)
				file.GET("source/:id/:name", controllers.AnonymousPermLinkDeprecated)
				// 下载文件
				file.GET("download/:id",
					middleware.StaticResourceCache(),
					controllers.Download,
				)
				// 打包并下载文件
				file.GET("archive/:sessionID/archive.zip", controllers.DownloadArchive)
			}

			// Copy user session
			sign.GET(
				"user/session/copy/:id",
				middleware.MobileRequestOnly(),
				controllers.UserPerformCopySession,
			)
		}

		// 回调接口
		callback := v3.Group("callback")
		{
			// 远程策略上传回调
			callback.POST(
				"remote/:sessionID/:key",
				middleware.UseUploadSession("remote"),
				middleware.RemoteCallbackAuth(),
				controllers.RemoteCallback,
			)
			// 七牛策略上传回调
			callback.POST(
				"qiniu/:sessionID",
				middleware.UseUploadSession("qiniu"),
				middleware.QiniuCallbackAuth(),
				controllers.QiniuCallback,
			)
			// 阿里云OSS策略上传回调
			callback.POST(
				"oss/:sessionID",
				middleware.UseUploadSession("oss"),
				middleware.OSSCallbackAuth(),
				controllers.OSSCallback,
			)
			// 又拍云策略上传回调
			callback.POST(
				"upyun/:sessionID",
				middleware.UseUploadSession("upyun"),
				middleware.UpyunCallbackAuth(),
				controllers.UpyunCallback,
			)
			onedrive := callback.Group("onedrive")
			{
				// 文件上传完成
				onedrive.POST(
					"finish/:sessionID",
					middleware.UseUploadSession("onedrive"),
					middleware.OneDriveCallbackAuth(),
					controllers.OneDriveCallback,
				)
				// OAuth 完成
				onedrive.GET(
					"auth",
					controllers.OneDriveOAuth,
				)
			}
			// Google Drive related
			gdrive := callback.Group("googledrive")
			{
				// OAuth 完成
				gdrive.GET(
					"auth",
					controllers.GoogleDriveOAuth,
				)
			}
			// 腾讯云COS策略上传回调
			callback.GET(
				"cos/:sessionID",
				middleware.UseUploadSession("cos"),
				controllers.COSCallback,
			)
			// AWS S3策略上传回调
			callback.GET(
				"s3/:sessionID",
				middleware.UseUploadSession("s3"),
				controllers.S3Callback,
			)
		}

		// 分享相关
		share := v3.Group("share", middleware.ShareAvailable())
		{
			// 获取分享
			share.GET("info/:id", controllers.GetShare)
			// 创建文件下载会话
			share.PUT("download/:id",
				middleware.CheckShareUnlocked(),
				middleware.BeforeShareDownload(),
				controllers.GetShareDownload,
			)
			// 预览分享文件
			share.GET("preview/:id",
				middleware.CSRFCheck(),
				middleware.CheckShareUnlocked(),
				middleware.ShareCanPreview(),
				middleware.BeforeShareDownload(),
				controllers.PreviewShare,
			)
			// 取得Office文档预览地址
			share.GET("doc/:id",
				middleware.CheckShareUnlocked(),
				middleware.ShareCanPreview(),
				middleware.BeforeShareDownload(),
				controllers.GetShareDocPreview,
			)
			// 获取文本文件内容
			share.GET("content/:id",
				middleware.CheckShareUnlocked(),
				middleware.BeforeShareDownload(),
				controllers.PreviewShareText,
			)
			// 分享目录列文件
			share.GET("list/:id/*path",
				middleware.CheckShareUnlocked(),
				controllers.ListSharedFolder,
			)
			// 分享目录搜索
			share.GET("search/:id/:type/:keywords",
				middleware.CheckShareUnlocked(),
				controllers.SearchSharedFolder,
			)
			// 归档打包下载
			share.POST("archive/:id",
				middleware.CheckShareUnlocked(),
				middleware.BeforeShareDownload(),
				controllers.ArchiveShare,
			)
			// 获取README文本文件内容
			share.GET("readme/:id",
				middleware.CheckShareUnlocked(),
				controllers.PreviewShareReadme,
			)
			// 获取缩略图
			share.GET("thumb/:id/:file",
				middleware.CheckShareUnlocked(),
				middleware.ShareCanPreview(),
				controllers.ShareThumb,
			)
			// 搜索公共分享
			v3.Group("share").GET("search", controllers.SearchShare)
		}

		wopi := v3.Group(
			"wopi",
			middleware.HashID(hashid.FileID),
			middleware.WopiAccessValidation(wopi2.Default, cache.Store),
		)
		{
			// 获取文件信息
			wopi.GET("files/:id", controllers.CheckFileInfo)
			// 获取文件内容
			wopi.GET("files/:id/contents", controllers.GetFile)
			// 更新文件内容
			wopi.POST("files/:id/contents", middleware.WopiWriteAccess(), controllers.PutFile)
			// 通用文件操作
			wopi.POST("files/:id", middleware.WopiWriteAccess(), controllers.ModifyFile)
		}

		// 需要登录保护的
		auth := v3.Group("")
		auth.Use(middleware.AuthRequired())
		{
			// 管理
			admin := auth.Group("admin", middleware.IsAdmin())
			{
				// 获取站点概况
				admin.GET("summary", controllers.AdminSummary)
				// 获取社区新闻
				admin.GET("news", controllers.AdminNews)
				// 更改设置
				admin.PATCH("setting", controllers.AdminChangeSetting)
				// 获取设置
				admin.POST("setting", controllers.AdminGetSetting)
				// 获取用户组列表
				admin.GET("groups", controllers.AdminGetGroups)
				// 重新加载子服务
				admin.GET("reload/:service", controllers.AdminReloadService)
				// 测试设置
				test := admin.Group("test")
				{
					// 测试邮件设置
					test.POST("mail", controllers.AdminSendTestMail)
					// 测试缩略图生成器调用
					test.POST("thumb", controllers.AdminTestThumbGenerator)
				}

				// 离线下载相关
				aria2 := admin.Group("aria2")
				{
					// 测试连接配置
					aria2.POST("test", controllers.AdminTestAria2)
				}

				// 存储策略管理
				policy := admin.Group("policy")
				{
					// 列出存储策略
					policy.POST("list", controllers.AdminListPolicy)
					// 测试本地路径可用性
					policy.POST("test/path", controllers.AdminTestPath)
					// 测试从机通信
					policy.POST("test/slave", controllers.AdminTestSlave)
					// 创建存储策略
					policy.POST("", controllers.AdminAddPolicy)
					// 创建跨域策略
					policy.POST("cors", controllers.AdminAddCORS)
					// 创建COS回调函数
					policy.POST("scf", controllers.AdminAddSCF)
					// 获取 OneDrive OAuth URL
					oauth := policy.Group(":id/oauth")
					{
						// 获取 OneDrive OAuth URL
						oauth.GET("onedrive", controllers.AdminOAuthURL("onedrive"))
						// 获取 Google Drive OAuth URL
						oauth.GET("googledrive", controllers.AdminOAuthURL("googledrive"))
					}

					// 获取 存储策略
					policy.GET(":id", controllers.AdminGetPolicy)
					// 删除 存储策略
					policy.DELETE(":id", controllers.AdminDeletePolicy)
				}

				// 用户组管理
				group := admin.Group("group")
				{
					// 列出用户组
					group.POST("list", controllers.AdminListGroup)
					// 获取用户组
					group.GET(":id", controllers.AdminGetGroup)
					// 创建/保存用户组
					group.POST("", controllers.AdminAddGroup)
					// 删除
					group.DELETE(":id", controllers.AdminDeleteGroup)
				}

				user := admin.Group("user")
				{
					// 列出用户
					user.POST("list", controllers.AdminListUser)
					// 获取用户
					user.GET(":id", controllers.AdminGetUser)
					// 创建/保存用户
					user.POST("", controllers.AdminAddUser)
					// 删除
					user.POST("delete", controllers.AdminDeleteUser)
					// 封禁/解封用户
					user.PATCH("ban/:id", controllers.AdminBanUser)
				}

				file := admin.Group("file")
				{
					// 列出文件
					file.POST("list", controllers.AdminListFile)
					// 预览文件
					file.GET("preview/:id", middleware.Sandbox(), controllers.AdminGetFile)
					// 删除
					file.POST("delete", controllers.AdminDeleteFile)
					// 列出用户或外部文件系统目录
					file.GET("folders/:type/:id/*path",
						controllers.AdminListFolders)
				}

				share := admin.Group("share")
				{
					// 列出分享
					share.POST("list", controllers.AdminListShare)
					// 删除
					share.POST("delete", controllers.AdminDeleteShare)
				}

				download := admin.Group("download")
				{
					// 列出任务
					download.POST("list", controllers.AdminListDownload)
					// 删除
					download.POST("delete", controllers.AdminDeleteDownload)
				}

				task := admin.Group("task")
				{
					// 列出任务
					task.POST("list", controllers.AdminListTask)
					// 删除
					task.POST("delete", controllers.AdminDeleteTask)
					// 新建文件导入任务
					task.POST("import", controllers.AdminCreateImportTask)
				}

				node := admin.Group("node")
				{
					// 列出从机节点
					node.POST("list", controllers.AdminListNodes)
					// 列出从机节点
					node.POST("aria2/test", controllers.AdminTestAria2)
					// 创建/保存节点
					node.POST("", controllers.AdminAddNode)
					// 启用/暂停节点
					node.PATCH("enable/:id/:desired", controllers.AdminToggleNode)
					// 删除节点
					node.DELETE(":id", controllers.AdminDeleteNode)
					// 获取节点
					node.GET(":id", controllers.AdminGetNode)
				}

			}

			// 用户
			user := auth.Group("user")
			{
				// 当前登录用户信息
				user.GET("me", controllers.UserMe)
				// 存储信息
				user.GET("storage", controllers.UserStorage)
				// 退出登录
				user.DELETE("session", controllers.UserSignOut)
				// Generate temp URL for copying client-side session, used in adding accounts
				// for mobile App.
				user.GET("session", controllers.UserPrepareCopySession)

				// WebAuthn 注册相关
				authn := user.Group("authn",
					middleware.IsFunctionEnabled("authn_enabled"))
				{
					authn.PUT("", controllers.StartRegAuthn)
					authn.PUT("finish", controllers.FinishRegAuthn)
				}

				// 用户设置
				setting := user.Group("setting")
				{
					// 任务队列
					setting.GET("tasks", controllers.UserTasks)
					// 获取当前用户设定
					setting.GET("", controllers.UserSetting)
					// 从文件上传头像
					setting.POST("avatar", controllers.UploadAvatar)
					// 设定为Gravatar头像
					setting.PUT("avatar", controllers.UseGravatar)
					// 更改用户设定
					setting.PATCH(":option", controllers.UpdateOption)
					// 获得二步验证初始化信息
					setting.GET("2fa", controllers.UserInit2FA)
				}
			}

			// 文件
			file := auth.Group("file", middleware.HashID(hashid.FileID))
			{
				// 上传
				upload := file.Group("upload")
				{
					// 文件上传
					upload.POST(":sessionId/:index", controllers.FileUpload)
					// 创建上传会话
					upload.PUT("", controllers.GetUploadSession)
					// 删除给定上传会话
					upload.DELETE(":sessionId", controllers.DeleteUploadSession)
					// 删除全部上传会话
					upload.DELETE("", controllers.DeleteAllUploadSession)
				}
				// 更新文件
				file.PUT("update/:id", controllers.PutContent)
				// 创建空白文件
				file.POST("create", controllers.CreateFile)
				// 创建文件下载会话
				file.PUT("download/:id", controllers.CreateDownloadSession)
				// 预览文件
				file.GET("preview/:id", middleware.Sandbox(), controllers.Preview)
				// 获取文本文件内容
				file.GET("content/:id", middleware.Sandbox(), controllers.PreviewText)
				// 取得Office文档预览地址
				file.GET("doc/:id", controllers.GetDocPreview)
				// 获取缩略图
				file.GET("thumb/:id", controllers.Thumb)
				// 取得文件外链
				file.POST("source", controllers.GetSource)
				// 打包要下载的文件
				file.POST("archive", controllers.Archive)
				// 创建文件压缩任务
				file.POST("compress", controllers.Compress)
				// 创建文件解压缩任务
				file.POST("decompress", controllers.Decompress)
				// 创建文件解压缩任务
				file.GET("search/:type/:keywords", controllers.SearchFile)
			}

			// 离线下载任务
			aria2 := auth.Group("aria2")
			{
				// 创建URL下载任务
				aria2.POST("url", controllers.AddAria2URL)
				// 创建种子下载任务
				aria2.POST("torrent/:id", middleware.HashID(hashid.FileID), controllers.AddAria2Torrent)
				// 重新选择要下载的文件
				aria2.PUT("select/:gid", controllers.SelectAria2File)
				// 取消或删除下载任务
				aria2.DELETE("task/:gid", controllers.CancelAria2Download)
				// 获取正在下载中的任务
				aria2.GET("downloading", controllers.ListDownloading)
				// 获取已完成的任务
				aria2.GET("finished", controllers.ListFinished)
			}

			// 目录
			directory := auth.Group("directory")
			{
				// 创建目录
				directory.PUT("", controllers.CreateDirectory)
				// 列出目录下内容
				directory.GET("*path", controllers.ListDirectory)
			}

			// 对象，文件和目录的抽象
			object := auth.Group("object")
			{
				// 删除对象
				object.DELETE("", controllers.Delete)
				// 移动对象
				object.PATCH("", controllers.Move)
				// 复制对象
				object.POST("copy", controllers.Copy)
				// 重命名对象
				object.POST("rename", controllers.Rename)
				// 获取对象属性
				object.GET("property/:id", controllers.GetProperty)
			}

			// 分享
			share := auth.Group("share")
			{
				// 创建新分享
				share.POST("", controllers.CreateShare)
				// 列出我的分享
				share.GET("", controllers.ListShare)
				// 更新分享属性
				share.PATCH(":id",
					middleware.ShareAvailable(),
					middleware.ShareOwner(),
					controllers.UpdateShare,
				)
				// 删除分享
				share.DELETE(":id",
					controllers.DeleteShare,
				)
			}

			// 用户标签
			tag := auth.Group("tag")
			{
				// 创建文件分类标签
				tag.POST("filter", controllers.CreateFilterTag)
				// 创建目录快捷方式标签
				tag.POST("link", controllers.CreateLinkTag)
				// 删除标签
				tag.DELETE(":id", middleware.HashID(hashid.TagID), controllers.DeleteTag)
			}

			// WebDAV管理相关
			webdav := auth.Group("webdav")
			{
				// 获取账号信息
				webdav.GET("accounts", controllers.GetWebDAVAccounts)
				// 新建账号
				webdav.POST("accounts", controllers.CreateWebDAVAccounts)
				// 删除账号
				webdav.DELETE("accounts/:id", controllers.DeleteWebDAVAccounts)
				// 更新账号可读性和是否使用代理服务
				webdav.PATCH("accounts", controllers.UpdateWebDAVAccounts)
			}

		}

	}
}
