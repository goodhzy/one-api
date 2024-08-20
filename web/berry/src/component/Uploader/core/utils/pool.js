import Base from "../uploader/base";
import { ProcessingTaskDuplicatedError } from "../errors";

export class Pool {
    constructor(limit) {
        this.queue = [];
        this.processing = [];
        this.limit = limit;
    }

    enqueue(uploader) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                uploader,
                resolve,
                reject,
            });
            this.check();
        });
    }

    release(item) {
        this.processing = this.processing.filter(v => v !== item);
        this.check();
    }

    run(item) {
        this.queue = this.queue.filter(v => v !== item);
        if (
          this.processing.findIndex(
            v =>
              v.uploader.task.dst === item.uploader.task.dst &&
              v.uploader.task.file.name === item.uploader.task.name
          ) > -1
        ) {
            // Found a duplicate task
            item.reject(new ProcessingTaskDuplicatedError());
            this.release(item);
            return;
        }

        this.processing.push(item);
        item.uploader.run().then(
          () => {
              item.resolve();
              this.release(item);
          },
          (err) => {
              item.reject(err);
              this.release(item);
          }
        );
    }

    check() {
        const processingNum = this.processing.length;
        const availableNum = Math.max(0, this.limit - processingNum);
        this.queue.slice(0, availableNum).forEach(item => {
            this.run(item);
        });
    }
}
