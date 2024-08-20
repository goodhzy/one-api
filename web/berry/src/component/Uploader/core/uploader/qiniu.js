import Chunk from "./chunk";
import { qiniuDriveUploadChunk, qiniuFinishUpload } from "../api";
import { Status } from "./base";

export default class Qiniu extends Chunk {
    async uploadChunk(chunkInfo) {
        const chunkRes = await qiniuDriveUploadChunk(
          this.task.session?.uploadURLs[0],
          this.task.session?.credential,
          chunkInfo,
          (p) => {
              this.updateChunkProgress(p.loaded, chunkInfo.index);
          },
          this.cancelToken.token
        );

        this.task.chunkProgress[chunkInfo.index].etag = chunkRes.etag;
    }

    async afterUpload() {
        this.logger.info(`Finishing multipart upload...`);
        this.transit(Status.finishing);
        return qiniuFinishUpload(
          this.task.session?.uploadURLs[0],
          this.task.session?.credential,
          this.task.chunkProgress,
          this.cancelToken.token
        );
    }
}
