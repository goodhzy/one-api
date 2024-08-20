import { PolicyType } from "../types";
import Logger from "../logger";
import { validate } from '../utils';
import { CancelToken } from '../utils';
import axios from "axios";
import { createUploadSession, deleteUploadSession } from "../api";
import * as utils from "../utils";
import { RequestCanceledError, UploaderError } from "../errors";

export const Status = {
    added: 0,
    resumable: 1,
    initialized: 2,
    queued: 3,
    preparing: 4,
    processing: 5,
    finishing: 6,
    finished: 7,
    error: 8,
    canceled: 9,
};

const resumePolicy = [
    PolicyType.local,
    PolicyType.remote,
    PolicyType.qiniu,
    PolicyType.oss,
    PolicyType.onedrive,
    PolicyType.s3,
];
const deleteUploadSessionDelay = 500;

export default class Base {
    constructor(task, manager) {
        this.child = [];
        this.status = Status.added;
        this.error = undefined;

        this.id = ++Base.id;
        Base.id = Base.id || 0;

        this.logger = new Logger(manager.logger.level, "UPLOADER", this.id);
        this.logger.info("Initialize new uploader for task: ", task);
        this.subscriber = {
            onTransition: () => {},
            onError: () => {},
            onProgress: () => {},
            onMsg: () => {},
        };

        this.task = task;
        this.manager = manager;
        this.cancelToken = CancelToken.source();
        this.progress = {
            total: {
                size: 0,
                loaded: 0,
                percent: 0,
            },
        };

        this.lastTime = Date.now();
        this.startTime = Date.now();
    }

    static id = 0;

    subscribe(handlers) {
        this.subscriber = handlers;
    }

    async start() {
        this.logger.info("Activate uploading task");
        this.transit(Status.initialized);
        this.lastTime = this.startTime = Date.now();

        try {
            validate(this.task.file, this.task.policy);
        } catch (e) {
            this.logger.error("File validate failed with error:", e);
            this.setError(e);
            return;
        }

        this.logger.info("Enqueued in manager pool");
        this.transit(Status.queued);
        try {
            await this.manager.pool.enqueue(this);
        } catch (e) {
            this.logger.info("Upload task failed with error:", e);
            this.setError(e);
        }
    }

    async run() {
        this.logger.info("Start upload task, create upload session...");
        this.transit(Status.preparing);
        const cachedInfo = utils.getResumeCtx(this.task, this.logger);
        if (cachedInfo == null) {
            this.task.session = await createUploadSession(
              {
                  path: this.task.dst,
                  size: this.task.file.size,
                  name: this.task.file.name,
                  policy_id: this.task.policy.id,
                  last_modified: this.task.file.lastModified,
                  mime_type: this.task.file.type,
              },
              this.cancelToken.token
            );
            this.logger.info("Upload session created:", this.task.session);
        } else {
            this.task.session = cachedInfo.session;
            this.task.resumed = true;
            this.task.chunkProgress = cachedInfo.chunkProgress;
            this.logger.info("Resume upload from cached ctx:", cachedInfo);
        }

        this.transit(Status.processing);
        await this.upload();
        await this.afterUpload();
        utils.removeResumeCtx(this.task, this.logger);
        this.transit(Status.finished);
        this.logger.info("Upload task completed");
    }

    async upload() {
        throw new Error("Method 'upload()' must be implemented.");
    }

    async afterUpload() {

    }

    async cancel() {
        if (this.status === Status.finished) {
            return;
        }

        this.cancelToken.cancel();
        await this.cancelUploadSession();
        this.transit(Status.canceled);
    }

    reset() {
        this.cancelToken = axios.CancelToken.source();
        this.progress = {
            total: {
                size: 0,
                loaded: 0,
                percent: 0,
            },
        };
    }

    setError(e) {
        if (
          !(e instanceof UploaderError && e.Retryable()) ||
          !resumePolicy.includes(this.task.policy.type)
        ) {
            this.logger.warn("Non-resume error occurs, clean resume ctx cache");
            this.cancelUploadSession().then();
        }

        if (!(e instanceof RequestCanceledError)) {
            this.status = Status.error;
            this.error = e;
            this.subscriber.onError(e);
        }
    }

    cancelUploadSession() {
        return new Promise((resolve) => {
            utils.removeResumeCtx(this.task, this.logger);
            if (this.task.session) {
                setTimeout(() => {
                    deleteUploadSession(this.task.session.sessionID)
                      .catch((e) => {
                          this.logger.warn("Failed to cancel upload session: ", e);
                      })
                      .finally(() => {
                          resolve();
                      });
                }, deleteUploadSessionDelay);
            } else {
                resolve();
            }
        });
    }

    transit(status) {
        this.status = status;
        this.subscriber.onTransition(status);
    }

    getProgressInfoItem(loaded, size, fromCache) {
        return {
            size,
            loaded,
            percent: (loaded / size) * 100,
            ...(fromCache == null ? {} : { fromCache }),
        };
    }

    key() {
        return utils.getResumeCtxKey(this.task);
    }
}
