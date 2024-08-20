import Chunk from "./chunk";
import { Status } from "./base";
import * as utils from "../utils";

export default class ResumeHint extends Chunk {
    constructor(task, manager) {
        super(task, manager);
        this.status = Status.resumable;
        this.progress = {
            total: this.getProgressInfoItem(
              utils.sumChunk(this.task.chunkProgress),
              this.task.size + 1
            ),
        };
        this.subscriber.onProgress(this.progress);
    }

    async uploadChunk(chunkInfo) {
        return null;
    }
}
