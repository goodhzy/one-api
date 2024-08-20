import Base from "./base";
import { upyunFormUploadChunk } from "../api";

export default class Upyun extends Base {
  async upload() {
    this.logger.info("Starting uploading file stream:", this.task.file);
    await upyunFormUploadChunk(
      this.task.session?.uploadURLs[0],
      this.task.file,
      this.task.session?.policy,
      this.task.session?.credential,
      (p) => {
        this.subscriber.onProgress({
          total: this.getProgressInfoItem(p.loaded, p.total),
        });
      },
      this.cancelToken.token
    );
  }
}
