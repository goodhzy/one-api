import i18next from "./i18n";

const config = {
  // basename: only at build time to set, and Don't add '/' at end off BASENAME for breadcrumbs, also Don't put only '/' use blank('') instead,
  // like '/berry-material-react/react/default'
  basename: '/',
  defaultPath: '/panel',
  fontFamily: `'Roboto', sans-serif, Helvetica, Arial, sans-serif`,
  borderRadius: 12,
  siteInfo: {
    chat_link: '',
    display_in_currency: true,
    email_verification: false,
    footer_html: '',
    github_client_id: '',
    github_oauth: false,
    logo: '',
    quota_per_unit: 500000,
    server_address: '',
    start_time: 0,
    system_name: 'One API',
    top_up_link: '',
    turnstile_check: false,
    turnstile_site_key: '',
    version: '',
    wechat_login: false,
    wechat_qrcode: ''
  }
};

export const imgPreviewSuffix = [
  "bmp",
  "png",
  "gif",
  "jpg",
  "jpeg",
  "svg",
  "webp",
];
export let msDocPreviewSuffix = [
  "ppt",
  "pptx",
  "pps",
  "doc",
  "docx",
  "xlsx",
  "xls",
];
export const subtitleSuffix = ["ass", "srt", "vrr"];
export const audioPreviewSuffix = ["mp3", "ogg", "wav", "flac", "m4a"];
export const videoPreviewSuffix = ["mp4", "mkv", "webm", "avi", "m3u8", "mov"];
export const pdfPreviewSuffix = ["pdf"];
export const editSuffix = ["md", "txt"];
export const epubSuffix = ["epub"];
export const codePreviewSuffix = {
  json: "json",
  php: "php",
  py: "python",
  bat: "bat",
  cpp: "cpp",
  c: "cpp",
  h: "cpp",
  cs: "csharp",
  css: "css",
  dockerfile: "dockerfile",
  go: "go",
  html: "html",
  ini: "ini",
  java: "java",
  js: "javascript",
  jsx: "javascript",
  less: "less",
  lua: "lua",
  sh: "shell",
  sql: "sql",
  xml: "xml",
  yaml: "yaml",
};
export const mediaType = {
  audio: ["mp3", "flac", "ape", "wav", "acc", "ogg", "m4a"],
  video: ["mp4", "flv", "avi", "wmv", "mkv", "rm", "rmvb", "mov", "ogv"],
  image: [
    "bmp",
    "iff",
    "png",
    "gif",
    "jpg",
    "jpeg",
    "psd",
    "svg",
    "webp",
    "heif",
    "heic",
    "tiff",
    "avif",
  ],
  pdf: ["pdf"],
  word: ["doc", "docx"],
  ppt: ["ppt", "pptx"],
  excel: ["xls", "xlsx", "csv"],
  text: ["txt", "md", "html"],
  torrent: ["torrent"],
  zip: ["zip", "gz", "xz", "tar", "rar", "7z"],
  excute: ["exe"],
  android: ["apk"],
  php: ["php"],
  go: ["go"],
  python: ["py"],
  cpp: ["cpp"],
  c: ["c"],
  js: ["js", "jsx"],
  epub: epubSuffix,
};
export const isPreviewable = (name) => {
  const suffix = name.split(".").pop().toLowerCase();
  if (imgPreviewSuffix.indexOf(suffix) !== -1) {
    return "img";
  } else if (msDocPreviewSuffix.indexOf(suffix) !== -1) {
    return "msDoc";
  } else if (audioPreviewSuffix.indexOf(suffix) !== -1) {
    return "audio";
  } else if (videoPreviewSuffix.indexOf(suffix) !== -1) {
    return "video";
  } else if (editSuffix.indexOf(suffix) !== -1) {
    return "edit";
  } else if (pdfPreviewSuffix.indexOf(suffix) !== -1) {
    return "pdf";
  } else if (Object.keys(codePreviewSuffix).indexOf(suffix) !== -1) {
    return "code";
  } else if (epubSuffix.indexOf(suffix) !== -1) {
    return "epub";
  }
  return false;
};
export const isTorrent = (name) => {
  const suffix = name.split(".").pop().toLowerCase();
  return mediaType.torrent.indexOf(suffix) !== -1;
};

export const isCompressFile = (name) => {
  const suffix = name.split(".").pop().toLowerCase();
  return suffix !== "7z" && mediaType.zip.indexOf(suffix) !== -1;
};

export const encodingRequired = (name) => {
  const suffix = name.split(".").pop().toLowerCase();
  return suffix === "zip";
};

const taskStatus = [
  "setting.queueing",
  "setting.processing",
  "setting.failed",
  "setting.canceled",
  "setting.finished",
];
const taskType = [
  "fileManager.compress",
  "fileManager.decompress",
  "setting.fileTransfer",
  "setting.importFiles",
  "setting.fileRecycle",
];
const taskProgress = [
  "setting.waiting",
  "setting.compressing",
  "setting.decompressing",
  "setting.downloading",
  "setting.transferring",
  "setting.indexing",
  "setting.listing",
];

export const getTaskStatus = (status) => {
  return i18next.t(taskStatus[status]);
};

export const getTaskType = (status) => {
  return i18next.t(taskType[status]);
};

export const getTaskProgress = (type, status) => {
  if (type === 2) {
    return i18next.t("setting.transferProgress", {
      num: status,
    });
  }
  return i18next.t(taskProgress[status]);
};

export const setWopiExts = (exts) => {
  msDocPreviewSuffix = exts;
};


export default config;
