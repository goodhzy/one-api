import Chunk from "./chunk";
import { slaveUploadChunk } from "../api";

export default class Remote extends Chunk {
    async uploadChunk(chunkInfo) {
        return slaveUploadChunk(
          `${this.task.session?.uploadURLs[0]}`,
          this.task.session?.credential,
          chunkInfo,
          (p) => {
              this.updateChunkProgress(p.loaded, chunkInfo.index);
          },
          this.cancelToken.token
        );
    }
}
