import Base from "./base";
import * as utils from "../utils";

export default class Chunk extends Base {
    constructor(task, manager) {
        super(task, manager);
        this.chunks = [];
    }

    async upload() {
        this.logger.info("Preparing uploading file chunks.");
        this.initBeforeUploadChunks();

        this.logger.info("Starting uploading file chunks:", this.chunks);
        this.updateLocalCache();
        for (let i = 0; i < this.chunks.length; i++) {
            if (
              this.task.chunkProgress[i].loaded < this.chunks[i].size ||
              this.chunks[i].size == 0
            ) {
                await this.uploadChunk({ chunk: this.chunks[i], index: i });
                this.logger.info(`Chunk [${i}] uploaded.`);
                this.updateLocalCache();
            }
        }
    }

    initBeforeUploadChunks() {
        this.chunks = utils.getChunks(
          this.task.file,
          this.task.session?.chunkSize
        );
        const cachedInfo = utils.getResumeCtx(this.task, this.logger);
        if (cachedInfo == null) {
            this.task.chunkProgress = this.chunks.map((value, index) => ({
                loaded: 0,
                index,
            }));
        }

        this.notifyResumeProgress();
    }

    async uploadChunk(chunkInfo) {
        throw new Error("Method 'uploadChunk' must be implemented.");
    }

    updateChunkProgress(loaded, index) {
        this.task.chunkProgress[index].loaded = loaded;
        this.notifyResumeProgress();
    }

    notifyResumeProgress() {
        this.progress = {
            total: this.getProgressInfoItem(
              utils.sumChunk(this.task.chunkProgress),
              this.task.file.size + 1
            ),
            chunks: this.chunks.map((chunk, index) => {
                return this.getProgressInfoItem(
                  this.task.chunkProgress[index].loaded,
                  chunk.size,
                  false
                );
            }),
        };
        this.subscriber.onProgress(this.progress);
    }

    updateLocalCache() {
        utils.setResumeCtx(this.task, this.logger);
    }
}
