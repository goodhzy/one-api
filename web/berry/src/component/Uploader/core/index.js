import Logger from './logger';
import { UnknownPolicyError, UploaderError, UploaderErrorName } from './errors';
import Local from './uploader/local';
import Remote from './uploader/remote';
import OneDrive from './uploader/onedrive';
import OSS from './uploader/oss';
import Qiniu from './uploader/qiniu';
import COS from './uploader/cos';
import Upyun from './uploader/upyun';
import S3 from './uploader/s3';
import ResumeHint from './uploader/placeholder';
import { Pool } from './utils';
import { cleanupResumeCtx, getAllFileEntries, getDirectoryUploadDst, getFileInput, isFileDrop, listResumeCtx } from './utils';
import { PolicyType, TaskType } from './types';

export const SelectType = {
  File: 0,
  Directory: 1
};

export default class UploadManager {
  constructor(o) {
    this.logger = new Logger(o.logLevel, 'MANAGER');
    this.logger.info(`Initialized with log level: ${o.logLevel}`);

    this.pool = new Pool(o.concurrentLimit);
    this.fileInput = getFileInput(this.id, false);
    this.directoryInput = getFileInput(this.id, true);

    if (o.dropZone) {
      this.logger.info(`Drag and drop container set to:`, o.dropZone);
      o.dropZone.addEventListener('dragenter', (e) => {
        if (isFileDrop(e)) {
          e.preventDefault();
          if (o.onDropOver) {
            o.onDropOver(e);
          }
        }
      });

      o.dropZone.addEventListener('dragleave', (e) => {
        if (isFileDrop(e)) {
          e.preventDefault();
          if (o.onDropLeave) {
            o.onDropLeave(e);
          }
        }
      });

      o.dropZone.addEventListener('drop', this.onFileDroppedIn);
    }
  }

  static id = 0;

  policy = undefined;
  fileInput;
  directoryInput;
  id = ++UploadManager.id;
  currentPath = '/';

  changeConcurrentLimit(newLimit) {
    this.pool.limit = newLimit;
  }

  dispatchUploader(task) {
    if (task.type === TaskType.resumeHint) {
      return new ResumeHint(task, this);
    }

    switch (task.policy.type) {
      case PolicyType.local:
        return new Local(task, this);
      case PolicyType.remote:
        return new Remote(task, this);
      case PolicyType.onedrive:
        return new OneDrive(task, this);
      case PolicyType.oss:
        return new OSS(task, this);
      case PolicyType.qiniu:
        return new Qiniu(task, this);
      case PolicyType.cos:
        return new COS(task, this);
      case PolicyType.upyun:
        return new Upyun(task, this);
      case PolicyType.s3:
        return new S3(task, this);
      default:
        throw new UnknownPolicyError('Unknown policy type.', task.policy);
    }
  }

  setPolicy(p, path) {
    this.policy = p;
    this.currentPath = path;
    if (p === undefined) {
      this.logger.info(`Currently no policy selected`);
      return;
    }

    this.logger.info(`Switching policy to:`, p);

    if (p.allowedSuffix !== undefined && p.allowedSuffix.length > 0) {
      const acceptVal = p.allowedSuffix.map((v) => `.${v}`).join(',');
      this.logger.info(`Set allowed file suffix to ${acceptVal}`);
      this.fileInput.setAttribute('accept', acceptVal);
    } else {
      this.logger.info(`Set allowed file suffix to *`);
      this.fileInput.removeAttribute('accept');
    }
  }

  select(dst, type = SelectType.File) {
    return new Promise((resolve) => {
      if (this.policy === undefined) {
        this.logger.warn(`Calling file selector while no policy is set`);
        throw new UploaderError(UploaderErrorName.NoPolicySelected, 'No policy selected.');
      }

      this.fileInput.onchange = (ev) => this.fileSelectCallback(ev, dst, resolve);
      this.directoryInput.onchange = (ev) => this.fileSelectCallback(ev, dst, resolve);
      this.fileInput.value = '';
      this.directoryInput.value = '';
      type === SelectType.File ? this.fileInput.click() : this.directoryInput.click();
    });
  }

  resumeTasks() {
    const tasks = listResumeCtx(this.logger);
    if (tasks.length > 0) {
      this.logger.info(`Resumed ${tasks.length} unfinished task(s) from local storage:`, tasks);
    }
    return tasks
      .filter((t) => t.chunkProgress.length > 0 && t.chunkProgress[0].loaded > 0)
      .map((t) => this.dispatchUploader({ ...t, type: TaskType.resumeHint }));
  }

  cleanupSessions() {
    cleanupResumeCtx(this.logger);
  }

  fileSelectCallback(ev, dst, resolve) {
    let files = [];
    if (ev instanceof Event) {
      const target = ev.target;
      if (!ev || !target || !target.files) return;
      if (target.files.length > 0) {
        files = Array.from(target.files);
      }
    } else {
      files = ev;
    }

    if (files.length > 0) {
      resolve(
        files.map((file) =>
          this.dispatchUploader({
            type: TaskType.file,
            policy: this.policy,
            dst: getDirectoryUploadDst(dst, file),
            file: file,
            size: file.size,
            name: file.name,
            chunkProgress: [],
            resumed: false
          })
        )
      );
    }
  }

  async onFileDroppedIn(e) {
    const containFile = e.dataTransfer && e.dataTransfer.types.includes('Files');
    if (containFile) {
      this.o.onDropLeave && this.o.onDropLeave(e);
      const items = await getAllFileEntries(e.dataTransfer.items);
      console.log(items);
      const uploaders = await new Promise((resolve) => this.fileSelectCallback(items, this.currentPath, resolve));
      this.o.onDropFileAdded && this.o.onDropFileAdded(uploaders);
    }
  }
}
