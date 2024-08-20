import Chunk from "./chunk";
import { s3LikeFinishUpload, s3LikeUploadChunk } from "../api";
import { Status } from "./base";

export default class OSS extends Chunk {
    async uploadChunk(chunkInfo) {
        return s3LikeUploadChunk(
          this.task.session?.uploadURLs[chunkInfo.index],
          chunkInfo,
          (p) => {
              this.updateChunkProgress(p.loaded, chunkInfo.index);
          },
          this.cancelToken.token
        );
    }

    async afterUpload() {
        this.logger.info(`Finishing multipart upload...`);
        this.transit(Status.finishing);
        return s3LikeFinishUpload(
          this.task.session?.completeURL,
          true,
          this.task.chunkProgress,
          this.cancelToken.token
        );
    }
}
