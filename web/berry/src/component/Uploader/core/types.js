
export const PolicyType = {
    local: "local",
    remote: "remote",
    oss: "oss",
    qiniu: "qiniu",
    onedrive: "onedrive",
    cos: "cos",
    upyun: "upyun",
    s3: "s3",
};

export const TaskType = {
    file: 0,
    resumeHint: 1,
};



export class Task {
    constructor(type, name, size, policy, dst, file, child, session, chunkProgress, resumed) {
        this.type = type;
        this.name = name;
        this.size = size;
        this.policy = policy;
        this.dst = dst;
        this.file = file;
        this.child = child || [];
        this.session = session;
        this.chunkProgress = chunkProgress || [];
        this.resumed = resumed || false;
    }
}

