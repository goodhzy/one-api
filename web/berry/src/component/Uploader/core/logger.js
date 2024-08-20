export default class Logger {
    constructor(level = "OFF", prefix = "UPLOAD", id = 1) {
        this.level = level;
        this.prefix = prefix;
        this.id = id;
    }

    getPrintPrefix(level) {
        return `Cloudreve-Uploader [${level}][${this.prefix}#${this.id}]:`;
    }

    info(...args) {
        const allowLevel = ["INFO"];
        if (allowLevel.includes(this.level)) {
            // eslint-disable-next-line no-console
            console.log(this.getPrintPrefix("INFO"), ...args);
        }
    }

    warn(...args) {
        const allowLevel = ["INFO", "WARN"];
        if (allowLevel.includes(this.level)) {
            // eslint-disable-next-line no-console
            console.warn(this.getPrintPrefix("WARN"), ...args);
        }
    }

    error(...args) {
        const allowLevel = ["INFO", "WARN", "ERROR"];
        if (allowLevel.includes(this.level)) {
            // eslint-disable-next-line no-console
            console.error(this.getPrintPrefix("ERROR"), ...args);
        }
    }
}
