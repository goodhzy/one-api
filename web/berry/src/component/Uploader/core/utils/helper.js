import { UploaderError, UploaderErrorName } from "../errors";

// Convert bytes to a human-readable string
export const sizeToString = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
};

// Split a file into chunks
export function getChunks(file, chunkByteSize) {
    // If chunkByteSize is larger than the file size or 0, use the file size
    if (!chunkByteSize || chunkByteSize > file.size || chunkByteSize == 0) {
        chunkByteSize = file.size;
    }

    const chunks = [];
    const count = Math.ceil(file.size / chunkByteSize);
    for (let i = 0; i < count; i++) {
        const chunk = file.slice(
          chunkByteSize * i,
          i === count - 1 ? file.size : chunkByteSize * (i + 1)
        );
        chunks.push(chunk);
    }

    if (chunks.length == 0) {
        chunks.push(file.slice(0));
    }
    return chunks;
}

// Sum up the progress of chunks
export function sumChunk(list) {
    return list.reduce((data, loaded) => data + loaded.loaded, 0);
}

const resumeKeyPrefix = "cd_upload_ctx_";

function isTask(toBeDetermined) {
    return !!(toBeDetermined && toBeDetermined.name);
}

// Generate a key for resume context
export function getResumeCtxKey(task) {
    if (isTask(task)) {
        return `${resumeKeyPrefix}name_${task.name}_dst_${task.dst}_size_${task.size}_policy_${task.policy.id}`;
    }

    return task;
}

// Save resume context to localStorage
export function setResumeCtx(task, logger) {
    const ctxKey = getResumeCtxKey(task);
    try {
        localStorage.setItem(ctxKey, JSON.stringify(task));
    } catch (err) {
        logger.warn(
          new UploaderError(
            UploaderErrorName.WriteCtxFailed,
            `setResumeCtx failed: ${ctxKey}`
          )
        );
    }
}

// Remove resume context from localStorage
export function removeResumeCtx(task, logger) {
    const ctxKey = getResumeCtxKey(task);
    try {
        localStorage.removeItem(ctxKey);
    } catch (err) {
        logger.warn(
          new UploaderError(
            UploaderErrorName.RemoveCtxFailed,
            `removeResumeCtx failed. key: ${ctxKey}`
          )
        );
    }
}

// Clean up all resume contexts from localStorage
export function cleanupResumeCtx(logger) {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(resumeKeyPrefix)) {
            try {
                localStorage.removeItem(key);
            } catch (err) {
                logger.warn(
                  new UploaderError(
                    UploaderErrorName.RemoveCtxFailed,
                    `removeResumeCtx failed. key: ${key}`
                  )
                );
            }
        }
    }
}

// Retrieve resume context from localStorage
export function getResumeCtx(task, logger) {
    const ctxKey = getResumeCtxKey(task);
    let localInfoString = null;
    try {
        localInfoString = localStorage.getItem(ctxKey);
    } catch {
        logger.warn(
          new UploaderError(
            UploaderErrorName.ReadCtxFailed,
            `getResumeCtx failed. key: ${ctxKey}`
          )
        );
    }

    if (localInfoString == null) {
        return null;
    }

    let localInfo = null;
    try {
        localInfo = JSON.parse(localInfoString);
    } catch {
        // Data is corrupted, remove the context
        removeResumeCtx(task, logger);
        logger.warn(
          new UploaderError(
            UploaderErrorName.InvalidCtxData,
            `getResumeCtx failed to parse. key: ${ctxKey}`
          )
        );
    }

    if (
      localInfo &&
      localInfo.session &&
      localInfo.session.expires < Math.floor(Date.now() / 1000)
    ) {
        removeResumeCtx(task, logger);
        logger.warn(
          new UploaderError(
            UploaderErrorName.CtxExpired,
            `upload session already expired at ${localInfo.session.expires}. key: ${ctxKey}`
          )
        );
        return null;
    }

    return localInfo;
}

// List all resume contexts from localStorage
export function listResumeCtx(logger) {
    const res = [];
    for (let i = 0, len = localStorage.length; i < len; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(resumeKeyPrefix)) {
            const value = getResumeCtx(key, logger);
            if (value) {
                res.push(value);
            }
        }
    }

    return res;
}

// Convert an object to XML string
export function OBJtoXML(obj) {
    let xml = "";
    for (const prop in obj) {
        xml += "<" + prop + ">";
        if (Array.isArray(obj[prop])) {
            for (const array of obj[prop]) {
                // Fix to properly handle array items
                xml += "</" + prop + ">";
                xml += "<" + prop + ">";

                xml += OBJtoXML(new Object(array));
            }
        } else if (typeof obj[prop] == "object") {
            xml += OBJtoXML(new Object(obj[prop]));
        } else {
            xml += obj[prop];
        }
        xml += "</" + prop + ">";
    }
    return xml.replace(/<\/?[0-9]{1,}>/g, "");
}

// Create and return a file input element
export function getFileInput(id, isFolder) {
    const input = document.createElement("input");
    input.type = "file";
    input.id = `upload-file-input-${id}`;
    if (isFolder) {
        input.id = `upload-folder-input-${id}`;
        input.setAttribute("webkitdirectory", "true");
        input.setAttribute("mozdirectory", "true");
    } else {
        input.id = `upload-file-input-${id}`;
        input.multiple = true;
    }
    input.hidden = true;
    document.body.appendChild(input);
    return input;
}

// Join parts of a path with a separator
export function pathJoin(parts, sep = "/") {
    parts = parts.map((part, index) => {
        if (index) {
            part = part.replace(new RegExp("^" + sep), "");
        }
        if (index !== parts.length - 1) {
            part = part.replace(new RegExp(sep + "$"), "");
        }
        return part;
    });
    return parts.join(sep);
}

// Get the base name of a path
function basename(path) {
    const pathList = path.split("/");
    pathList.pop();
    return pathList.join("/") === "" ? "/" : pathList.join("/");
}

// Remove the prefix from a string
export function trimPrefix(src, prefix) {
    if (src.startsWith(prefix)) {
        return src.slice(prefix.length);
    }
    return src;
}

// Get the upload destination path for a file
export function getDirectoryUploadDst(dst, file) {
    let relPath = file.webkitRelativePath;
    if (!relPath || relPath == "") {
        relPath = file.fsPath;
        if (!relPath || relPath == "") {
            return dst;
        }
    }

    relPath = trimPrefix(relPath, "/");

    return basename(pathJoin([dst, relPath]));
}

// Wrap readEntries in a promise to make working with readEntries easier
async function readEntriesPromise(directoryReader) {
    try {
        return await new Promise((resolve, reject) => {
            directoryReader.readEntries(resolve, reject);
        });
    } catch (err) {
        console.log(err);
    }
}

// Read file using fileReader
async function readFilePromise(fileReader, path) {
    try {
        return await new Promise((resolve, reject) => {
            fileReader.file((file) => {
                file.fsPath = path;
                resolve(file);
            });
        });
    } catch (err) {
        console.log(err);
    }
}

// Get all entries (files or sub-directories) in a directory
async function readAllDirectoryEntries(directoryReader) {
    const entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
}

// Drop handler function to get all files
export async function getAllFileEntries(dataTransferItemList) {
    const fileEntries = [];
    // Use BFS to traverse entire directory/file structure
    const queue = [];
    // Unfortunately, dataTransferItemList is not iterable (i.e., no forEach)
    for (let i = 0; i < dataTransferItemList.length; i++) {
        const fileEntry = dataTransferItemList[i].webkitGetAsEntry();
        if (!fileEntry) {
            const file = dataTransferItemList[i].getAsFile();
            if (file) {
                fileEntries.push(file);
            }
        }

        queue.push(dataTransferItemList[i].webkitGetAsEntry());
    }
    while (queue.length > 0) {
        const entry = queue.shift();
        if (!entry) {
            continue;
        }
        if (entry.isFile) {
            fileEntries.push(await readFilePromise(entry, entry.fullPath));
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await readAllDirectoryEntries(reader);
            queue.push(...entries);
        }
    }
    return fileEntries;
}

// Check if the drag event contains files
export function isFileDrop(e) {
    return !!e.dataTransfer && e.dataTransfer.types.includes("Files");
}

