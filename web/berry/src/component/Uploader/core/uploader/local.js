import Chunk from "./chunk";
import { localUploadChunk } from "../api";

export default class Local extends Chunk {
    async uploadChunk(chunkInfo) {
        return localUploadChunk(
          this.task.session?.sessionID,
          chunkInfo,
          (p) => {
              this.updateChunkProgress(p.loaded, chunkInfo.index);
          },
          this.cancelToken.token
        );
    }
}
