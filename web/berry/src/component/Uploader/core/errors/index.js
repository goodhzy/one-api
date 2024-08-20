import { sizeToString } from "../utils";
import i18next from "../../../../i18n";
import { AppError } from "../../../../middleware/Api";

export const UploaderErrorName = {
    InvalidFile: "InvalidFile",
    NoPolicySelected: "NoPolicySelected",
    UnknownPolicyType: "UnknownPolicyType",
    FailedCreateUploadSession: "FailedCreateUploadSession",
    FailedDeleteUploadSession: "FailedDeleteUploadSession",
    HTTPRequestFailed: "HTTPRequestFailed",
    LocalChunkUploadFailed: "LocalChunkUploadFailed",
    SlaveChunkUploadFailed: "SlaveChunkUploadFailed",
    WriteCtxFailed: "WriteCtxFailed",
    RemoveCtxFailed: "RemoveCtxFailed",
    ReadCtxFailed: "ReadCtxFailed",
    InvalidCtxData: "InvalidCtxData",
    CtxExpired: "CtxExpired",
    RequestCanceled: "RequestCanceled",
    ProcessingTaskDuplicated: "ProcessingTaskDuplicated",
    OneDriveChunkUploadFailed: "OneDriveChunkUploadFailed",
    OneDriveEmptyFile: "OneDriveEmptyFile",
    FailedFinishOneDriveUpload: "FailedFinishOneDriveUpload",
    S3LikeChunkUploadFailed: "S3LikeChunkUploadFailed",
    S3LikeUploadCallbackFailed: "S3LikeUploadCallbackFailed",
    COSUploadCallbackFailed: "COSUploadCallbackFailed",
    COSPostUploadFailed: "COSPostUploadFailed",
    UpyunPostUploadFailed: "UpyunPostUploadFailed",
    QiniuChunkUploadFailed: "QiniuChunkUploadFailed",
    FailedFinishOSSUpload: "FailedFinishOSSUpload",
    FailedFinishQiniuUpload: "FailedFinishQiniuUpload",
    FailedTransformResponse: "FailedTransformResponse",
};

const RETRY_ERROR_LIST = [
    UploaderErrorName.FailedCreateUploadSession,
    UploaderErrorName.HTTPRequestFailed,
    UploaderErrorName.LocalChunkUploadFailed,
    UploaderErrorName.SlaveChunkUploadFailed,
    UploaderErrorName.RequestCanceled,
    UploaderErrorName.ProcessingTaskDuplicated,
    UploaderErrorName.FailedTransformResponse,
];

const RETRY_CODE_LIST = [-1];

export class UploaderError {
    constructor(name, message) {
        this.name = name;
        this.message = message;
        this.stack = new Error().stack;
    }

    Message() {
        return this.message;
    }

    Retryable() {
        return RETRY_ERROR_LIST.includes(this.name);
    }
}

// File not validated by storage policy
export class FileValidateError extends UploaderError {
    constructor(message, field, policy) {
        super(UploaderErrorName.InvalidFile, message);
        this.field = field;
        this.policy = policy;
    }

    Message() {
        if (this.field === "size") {
            return i18next.t(`uploader.sizeExceedLimitError`, {
                max: sizeToString(this.policy.maxSize),
            });
        }

        return i18next.t(`uploader.suffixNotAllowedError`, {
            supported: this.policy.allowedSuffix
              ? this.policy.allowedSuffix.join(",")
              : "*",
        });
    }
}

// Unknown storage policy
export class UnknownPolicyError extends UploaderError {
    constructor(message, policy) {
        super(UploaderErrorName.UnknownPolicyType, message);
        this.policy = policy;
    }
}

// Backend API error
export class APIError extends UploaderError {
    constructor(name, message, response) {
        super(name, message);
        this.response = response;
        this.appError = new AppError(response.msg, response.code, response.msg);
    }

    Message() {
        return `${this.message}: ${this.appError.message}`;
    }

    Retryable() {
        return (
          super.Retryable() && RETRY_CODE_LIST.includes(this.response.code)
        );
    }
}

// Failed to create upload session
export class CreateUploadSessionError extends APIError {
    constructor(response) {
        super(UploaderErrorName.FailedCreateUploadSession, "", response);
    }

    Message() {
        this.message = i18next.t(`uploader.createUploadSessionError`);
        return super.Message();
    }
}

// Failed to delete upload session
export class DeleteUploadSessionError extends APIError {
    constructor(response) {
        super(UploaderErrorName.FailedDeleteUploadSession, "", response);
    }

    Message() {
        this.message = i18next.t(`uploader.deleteUploadSessionError`);
        return super.Message();
    }
}

// HTTP request error
export class HTTPError extends UploaderError {
    constructor(axiosErr, url) {
        super(UploaderErrorName.HTTPRequestFailed, axiosErr.message);
        this.response = axiosErr.response;
        this.url = url;
    }

    Message() {
        return i18next.t(`uploader.requestError`, {
            msg: this.axiosErr,
            url: this.url,
        });
    }
}

// Local chunk upload failed
export class LocalChunkUploadError extends APIError {
    constructor(response, chunkIndex) {
        super(UploaderErrorName.LocalChunkUploadFailed, "", response);
        this.chunkIndex = chunkIndex;
    }

    Message() {
        this.message = i18next.t(`uploader.chunkUploadError`, {
            index: this.chunkIndex,
        });
        return super.Message();
    }
}

// Request canceled
export class RequestCanceledError extends UploaderError {
    constructor() {
        super(UploaderErrorName.RequestCanceled, "Request canceled");
    }
}

// Slave chunk upload failed
export class SlaveChunkUploadError extends APIError {
    constructor(response, chunkIndex) {
        super(UploaderErrorName.SlaveChunkUploadFailed, "", response);
        this.chunkIndex = chunkIndex;
    }

    Message() {
        this.message = i18next.t(`uploader.chunkUploadError`, {
            index: this.chunkIndex,
        });
        return super.Message();
    }
}

// Processing task duplicated
export class ProcessingTaskDuplicatedError extends UploaderError {
    constructor() {
        super(
          UploaderErrorName.ProcessingTaskDuplicated,
          "Processing task duplicated"
        );
    }

    Message() {
        return i18next.t(`uploader.conflictError`);
    }
}

// OneDrive chunk upload failed
export class OneDriveChunkError extends UploaderError {
    constructor(response) {
        super(
          UploaderErrorName.OneDriveChunkUploadFailed,
          response.error.message
        );
        this.response = response;
    }

    Message() {
        let msg = i18next.t(`uploader.chunkUploadErrorWithMsg`, {
            msg: this.message,
        });

        if (this.response.error.retryAfterSeconds !== undefined) {
            msg += " " + i18next.t(`uploader.chunkUploadErrorWithRetryAfter`, {
                retryAfter: this.response.error.retryAfterSeconds,
            });
        }

        return msg;
    }

    Retryable() {
        return (
          super.Retryable() || this.response.error.retryAfterSeconds !== undefined
        );
    }
}

// OneDrive empty file selected
export class OneDriveEmptyFileSelected extends UploaderError {
    constructor() {
        super(UploaderErrorName.OneDriveEmptyFile, "empty file not supported");
    }

    Message() {
        return i18next.t("uploader.emptyFileError");
    }
}

// OneDrive failed to finish upload
export class OneDriveFinishUploadError extends APIError {
    constructor(response) {
        super(UploaderErrorName.FailedFinishOneDriveUpload, "", response);
    }

    Message() {
        this.message = i18next.t("uploader.finishUploadError");
        return super.Message();
    }
}

// S3-like chunk upload failed
export class S3LikeChunkError extends UploaderError {
    constructor(response) {
        super(
          UploaderErrorName.S3LikeChunkUploadFailed,
          response.getElementsByTagName("Message")[0].innerHTML
        );
    }

    Message() {
        return i18next.t(`uploader.chunkUploadErrorWithMsg`, {
            msg: this.message,
        });
    }
}

// OSS finish upload failed
export class S3LikeFinishUploadError extends UploaderError {
    constructor(response) {
        super(
          UploaderErrorName.S3LikeChunkUploadFailed,
          response.getElementsByTagName("Message")[0].innerHTML
        );
        this.response = response;
    }

    Message() {
        return i18next.t(`uploader.ossFinishUploadError`, {
            msg: this.message,
            code: this.response.getElementsByTagName("Code")[0].innerHTML,
        });
    }
}

// Qiniu chunk upload failed
export class QiniuChunkError extends UploaderError {
    constructor(response) {
        super(UploaderErrorName.QiniuChunkUploadFailed, response.error);
        this.response = response;
    }

    Message() {
        return i18next.t(`uploader.chunkUploadErrorWithMsg`, {
            msg: this.message,
        });
    }
}

// Qiniu finish upload failed
export class QiniuFinishUploadError extends UploaderError {
    constructor(response) {
        super(UploaderErrorName.FailedFinishQiniuUpload, response.error);
        this.response = response;
    }

    Message() {
        return i18next.t(`uploader.finishUploadErrorWithMsg`, {
            msg: this.message,
        });
    }
}

// COS upload failed
export class COSUploadError extends UploaderError {
    constructor(response) {
        super(
          UploaderErrorName.COSPostUploadFailed,
          response.getElementsByTagName("Message")[0].innerHTML
        );
        this.response = response;
    }

    Message() {
        return i18next.t(`uploader.cosUploadFailed`, {
            msg: this.message,
            code: this.response.getElementsByTagName("Code")[0].innerHTML,
        });
    }
}

// COS upload callback failed
export class COSUploadCallbackError extends APIError {
    constructor(response) {
        super(UploaderErrorName.COSUploadCallbackFailed, "", response);
    }

    Message() {
        this.message = i18next.t("uploader.finishUploadError");
        return super.Message();
    }
}

// Upyun upload failed
export class UpyunUploadError extends UploaderError {
    constructor(response) {
        super(UploaderErrorName.UpyunPostUploadFailed, response.message);
        this.response = response;
    }

    Message() {
        return i18next.t("uploader.upyunUploadFailed", {
            msg: this.message,
        });
    }
}

// S3-like upload callback failed
export class S3LikeUploadCallbackError extends APIError {
    constructor(response) {
        super(UploaderErrorName.S3LikeUploadCallbackFailed, "", response);
    }

    Message() {
        this.message = i18next.t("uploader.finishUploadError");
        return super.Message();
    }
}

// Failed to transform response
export class TransformResponseError extends UploaderError {
    constructor(response, parseError) {
        super(UploaderErrorName.FailedTransformResponse, parseError.message);
        this.response = response;
    }

    Message() {
        return i18next.t("uploader.parseResponseError", {
            msg: this.message,
            content: this.response,
        });
    }
}
