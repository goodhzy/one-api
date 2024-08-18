module github.com/songquanpeng/one-api

// +heroku goVersion go1.18
go 1.22

toolchain go1.22.2

require (
	github.com/DATA-DOG/go-sqlmock v1.3.3
	github.com/HFO4/aliyun-oss-go-sdk v2.2.3+incompatible
	github.com/aliyun/aliyun-oss-go-sdk v3.0.2+incompatible
	github.com/aws/aws-sdk-go v1.31.5
	github.com/aws/aws-sdk-go-v2 v1.27.0
	github.com/aws/aws-sdk-go-v2/credentials v1.17.15
	github.com/aws/aws-sdk-go-v2/service/bedrockruntime v1.8.3
	github.com/duo-labs/webauthn v0.0.0-20221205164246-ebaf9b74c6ec
	github.com/fatih/color v1.9.0
	github.com/gin-contrib/cors v1.7.2
	github.com/gin-contrib/gzip v1.0.1
	github.com/gin-contrib/sessions v1.0.1
	github.com/gin-contrib/static v1.1.2
	github.com/gin-gonic/gin v1.10.0
	github.com/go-ini/ini v1.50.0
	github.com/go-mail/mail v2.3.1+incompatible
	github.com/go-playground/validator/v10 v10.20.0
	github.com/go-redis/redis/v8 v8.11.5
	github.com/gofrs/uuid v4.0.0+incompatible
	github.com/golang-jwt/jwt v3.2.2+incompatible
	github.com/gomodule/redigo v2.0.0+incompatible
	github.com/google/go-querystring v1.0.0
	github.com/google/uuid v1.6.0
	github.com/gorilla/securecookie v1.1.2
	github.com/gorilla/sessions v1.2.2
	github.com/gorilla/websocket v1.5.1
	github.com/h2non/filetype v1.1.3
	github.com/jinzhu/copier v0.4.0
	github.com/jinzhu/gorm v1.9.11
	github.com/juju/ratelimit v1.0.1
	github.com/mholt/archiver/v4 v4.0.0-alpha.6
	github.com/pkg/errors v0.9.1
	github.com/pkoukk/tiktoken-go v0.1.7
	github.com/pquerna/otp v1.2.0
	github.com/qiniu/go-sdk/v7 v7.11.1
	github.com/rafaeljusto/redigomock v0.0.0-20191117212112-00b2509252a1
	github.com/robfig/cron/v3 v3.0.1
	github.com/samber/lo v1.38.1
	github.com/smartystreets/goconvey v1.8.1
	github.com/speps/go-hashids v2.0.0+incompatible
	github.com/stretchr/testify v1.9.0
	github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common v1.0.393
	github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/scf v1.0.393
	github.com/tencentyun/cos-go-sdk-v5 v0.0.0-20200120023323-87ff3bc489ac
	github.com/upyun/go-sdk v2.1.0+incompatible
	golang.org/x/crypto v0.23.0
	golang.org/x/image v0.16.0
	golang.org/x/time v0.5.0
	google.golang.org/api v0.45.0
	gorm.io/driver/mysql v1.5.6
	gorm.io/driver/postgres v1.5.7
	gorm.io/driver/sqlite v1.5.5
	gorm.io/gorm v1.25.10
)

require (
	cloud.google.com/go v0.81.0 // indirect
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/andybalholm/brotli v1.0.4 // indirect
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.6.2 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.3.7 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.6.7 // indirect
	github.com/aws/smithy-go v1.20.2 // indirect
	github.com/baiyubin/aliyun-sts-go-sdk v0.0.0-20180326062324-cfa1a18b161f // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/bgentry/speakeasy v0.1.0 // indirect
	github.com/boombuler/barcode v1.0.1-0.20190219062509-6c824513bacc // indirect
	github.com/bytedance/sonic v1.11.6 // indirect
	github.com/bytedance/sonic/loader v0.1.1 // indirect
	github.com/census-instrumentation/opencensus-proto v0.3.0 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/cloudflare/cfssl v1.6.1 // indirect
	github.com/cloudwego/base64x v0.1.4 // indirect
	github.com/cloudwego/iasm v0.2.0 // indirect
	github.com/cncf/udpa/go v0.0.0-20210322005330-6414d713912e // indirect
	github.com/coreos/go-semver v0.3.0 // indirect
	github.com/coreos/go-systemd/v22 v22.3.2 // indirect
	github.com/cpuguy83/go-md2man/v2 v2.0.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dlclark/regexp2 v1.11.0 // indirect
	github.com/dsnet/compress v0.0.1 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/envoyproxy/go-control-plane v0.9.9-0.20210217033140-668b12f5399d // indirect
	github.com/envoyproxy/protoc-gen-validate v0.6.1 // indirect
	github.com/form3tech-oss/jwt-go v3.2.3+incompatible // indirect
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/fullstorydev/grpcurl v1.8.1 // indirect
	github.com/fxamacker/cbor/v2 v2.4.0 // indirect
	github.com/gabriel-vasile/mimetype v1.4.3 // indirect
	github.com/gin-contrib/sse v0.1.0 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-sql-driver/mysql v1.8.1 // indirect
	github.com/goccy/go-json v0.10.3 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang-jwt/jwt/v4 v4.1.0 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/mock v1.5.0 // indirect
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/golang/snappy v0.0.4 // indirect
	github.com/google/btree v1.0.1 // indirect
	github.com/google/certificate-transparency-go v1.1.2-0.20210511102531-373a877eec92 // indirect
	github.com/google/go-cmp v0.5.9 // indirect
	github.com/googleapis/gax-go/v2 v2.0.5 // indirect
	github.com/gopherjs/gopherjs v1.17.2 // indirect
	github.com/gorilla/context v1.1.2 // indirect
	github.com/grpc-ecosystem/go-grpc-middleware v1.3.0 // indirect
	github.com/grpc-ecosystem/go-grpc-prometheus v1.2.0 // indirect
	github.com/grpc-ecosystem/grpc-gateway v1.16.0 // indirect
	github.com/inconshreveable/mousetrap v1.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20231201235250-de7065d80cb9 // indirect
	github.com/jackc/pgx/v5 v5.5.5 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	github.com/jhump/protoreflect v1.8.2 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/jonboulle/clockwork v0.2.2 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/jtolds/gls v4.20.0+incompatible // indirect
	github.com/klauspost/compress v1.17.7 // indirect
	github.com/klauspost/cpuid/v2 v2.2.7 // indirect
	github.com/klauspost/pgzip v1.2.5 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/leodido/go-urn v1.4.0 // indirect
	github.com/mattn/go-colorable v0.1.4 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.12 // indirect
	github.com/mattn/go-sqlite3 v2.0.3+incompatible // indirect
	github.com/matttproud/golang_protobuf_extensions v1.0.1 // indirect
	github.com/mitchellh/mapstructure v1.4.1 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/mozillazg/go-httpheader v0.2.1 // indirect
	github.com/nwaples/rardecode/v2 v2.0.0-beta.2 // indirect
	github.com/olekukonko/tablewriter v0.0.5 // indirect
	github.com/pelletier/go-toml/v2 v2.2.2 // indirect
	github.com/pierrec/lz4/v4 v4.1.14 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/prometheus/client_golang v1.10.0 // indirect
	github.com/prometheus/client_model v0.2.0 // indirect
	github.com/prometheus/common v0.24.0 // indirect
	github.com/prometheus/procfs v0.6.0 // indirect
	github.com/rivo/uniseg v0.2.0 // indirect
	github.com/rogpeppe/go-internal v1.12.0 // indirect
	github.com/russross/blackfriday/v2 v2.1.0 // indirect
	github.com/satori/go.uuid v1.2.0 // indirect
	github.com/sirupsen/logrus v1.8.1 // indirect
	github.com/smarty/assertions v1.15.0 // indirect
	github.com/soheilhy/cmux v0.1.5 // indirect
	github.com/spf13/cobra v1.2.1 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/stretchr/objx v0.5.2 // indirect
	github.com/therootcompany/xz v1.0.1 // indirect
	github.com/tmc/grpc-websocket-proxy v0.0.0-20201229170055-e5319fda7802 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/ugorji/go/codec v1.2.12 // indirect
	github.com/ulikunitz/xz v0.5.10 // indirect
	github.com/urfave/cli v1.22.5 // indirect
	github.com/x448/float16 v0.8.4 // indirect
	github.com/xiang90/probing v0.0.0-20190116061207-43a291ad63a2 // indirect
	go.etcd.io/bbolt v1.3.5 // indirect
	go.etcd.io/etcd/api/v3 v3.5.0 // indirect
	go.etcd.io/etcd/client/pkg/v3 v3.5.0 // indirect
	go.etcd.io/etcd/client/v2 v2.305.0 // indirect
	go.etcd.io/etcd/client/v3 v3.5.0-alpha.0 // indirect
	go.etcd.io/etcd/etcdctl/v3 v3.5.0-alpha.0 // indirect
	go.etcd.io/etcd/pkg/v3 v3.5.0-alpha.0 // indirect
	go.etcd.io/etcd/raft/v3 v3.5.0-alpha.0 // indirect
	go.etcd.io/etcd/server/v3 v3.5.0-alpha.0 // indirect
	go.etcd.io/etcd/tests/v3 v3.5.0-alpha.0 // indirect
	go.etcd.io/etcd/v3 v3.5.0-alpha.0 // indirect
	go.opencensus.io v0.23.0 // indirect
	go.uber.org/atomic v1.7.0 // indirect
	go.uber.org/multierr v1.7.0 // indirect
	go.uber.org/zap v1.17.0 // indirect
	golang.org/x/arch v0.8.0 // indirect
	golang.org/x/exp v0.0.0-20220303212507-bbda1eaf7a17 // indirect
	golang.org/x/mod v0.9.0 // indirect
	golang.org/x/net v0.25.0 // indirect
	golang.org/x/oauth2 v0.0.0-20210427180440-81ed05c6b58c // indirect
	golang.org/x/sync v0.7.0 // indirect
	golang.org/x/sys v0.20.0 // indirect
	golang.org/x/text v0.15.0 // indirect
	golang.org/x/tools v0.7.0 // indirect
	google.golang.org/appengine v1.6.7 // indirect
	google.golang.org/genproto v0.0.0-20210602131652-f16073e35f0c // indirect
	google.golang.org/grpc v1.38.0 // indirect
	google.golang.org/protobuf v1.34.1 // indirect
	gopkg.in/alexcesaro/quotedprintable.v3 v3.0.0-20150716171945-2caba252f4dc // indirect
	gopkg.in/cheggaaa/pb.v1 v1.0.28 // indirect
	gopkg.in/mail.v2 v2.3.1 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	sigs.k8s.io/yaml v1.2.0 // indirect
)

replace github.com/gomodule/redigo v2.0.0+incompatible => github.com/gomodule/redigo v1.8.9
