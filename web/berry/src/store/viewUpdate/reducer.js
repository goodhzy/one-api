import Auth from "../../middleware/Auth";

const initState = {
    isLogin: Auth.Check(),
    open: false,
    explorerViewMethod: "icon",
    sortMethod: Auth.GetPreferenceWithDefault("sort", "timePos"),
    subTitle: null,
    contextType: "none",
    contextOpen: false,
    menuOpen: false,
    navigatorLoading: true,
    navigatorError: false,
    navigatorErrorMsg: null,
    modalsLoading: false,
    storageRefresh: false,
    userPopoverAnchorEl: null,
    shareUserPopoverAnchorEl: null,
    modals: {
        createNewFolder: false,
        createNewFile: false,
        rename: false,
        move: false,
        remove: false,
        share: false,
        music: false,
        remoteDownload: false,
        remoteDownloadTorrent: null,
        getSource: "",
        copy: false,
        resave: false,
        compress: false,
        decompress: false,
        loading: false,
        loadingText: "",
        directoryDownloading: false,
        directoryDownloadLog: "",
        directoryDownloadDone: false,
    },
    snackbar: {
        toggle: false,
        vertical: "top",
        horizontal: "center",
        msg: "",
        color: "",
    },
    pagination: {
        page: 1,
        size: Auth.GetPreferenceWithDefault("pagination", 100),
    },
    openFileSelector: 0,
    openFolderSelector: 0,
    shareInfo: null,
};

const viewUpdate = (state = initState, action) => {
    switch (action.type) {
        case "DRAWER_TOGGLE":
            return {
                ...state,
                open: action.open,
            };
        case "CHANGE_VIEW_METHOD":
            return {
                ...state,
                explorerViewMethod: action.method,
            };
        case "SET_NAVIGATOR_LOADING_STATUE":
            return {
                ...state,
                navigatorLoading: action.status,
            };
        case "SET_NAVIGATOR_ERROR":
            return {
                ...state,
                navigatorError: action.status,
                navigatorErrorMsg: action.msg,
            };
        case "OPEN_CREATE_FOLDER_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    createNewFolder: true,
                },
                contextOpen: false,
            };
        case "OPEN_CREATE_FILE_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    createNewFile: true,
                },
                contextOpen: false,
            };
        case "OPEN_RENAME_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    rename: true,
                },
                contextOpen: false,
            };
        case "OPEN_REMOVE_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    remove: true,
                },
                contextOpen: false,
            };
        case "OPEN_MOVE_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    move: true,
                },
                contextOpen: false,
            };
        case "OPEN_RESAVE_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    resave: true,
                },
                contextOpen: false,
            };
        case "SET_USER_POPOVER":
            return {
                ...state,
                userPopoverAnchorEl: action.anchor,
            };
        case "SET_SHARE_USER_POPOVER":
            return {
                ...state,
                shareUserPopoverAnchorEl: action.anchor,
            };
        case "OPEN_SHARE_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    share: true,
                },
                contextOpen: false,
            };
        case "OPEN_MUSIC_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    music: true,
                },
                contextOpen: false,
            };
        case "OPEN_REMOTE_DOWNLOAD_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    remoteDownload: true,
                },
                contextOpen: false,
            };
        case "OPEN_TORRENT_DOWNLOAD_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    remoteDownload: true,
                    remoteDownloadTorrent: action.selected,
                },
                contextOpen: false,
            };
        case "OPEN_DECOMPRESS_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    decompress: true,
                },
                contextOpen: false,
            };
        case "OPEN_COMPRESS_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    compress: true,
                },
                contextOpen: false,
            };
        case "OPEN_GET_SOURCE_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    getSource: action.source,
                },
                contextOpen: false,
            };
        case "OPEN_COPY_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    copy: true,
                },
                contextOpen: false,
            };
        case "OPEN_LOADING_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    loading: true,
                    loadingText: action.text,
                },
                contextOpen: false,
            };
        case "OPEN_DIRECTORY_DOWNLOAD_DIALOG":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    directoryDownloading: action.downloading,
                    directoryDownloadLog: action.log,
                    directoryDownloadDone: action.done,
                },
                contextOpen: false,
            };
        case "CLOSE_CONTEXT_MENU":
            return {
                ...state,
                contextOpen: false,
            };
        case "CLOSE_ALL_MODALS":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    createNewFolder: false,
                    createNewFile: false,
                    rename: false,
                    move: false,
                    remove: false,
                    share: false,
                    music: false,
                    remoteDownload: false,
                    remoteDownloadTorrent: null,
                    getSource: "",
                    resave: false,
                    copy: false,
                    loading: false,
                    compress: false,
                    decompress: false,
                    option: undefined,
                    directoryDownloading: false,
                    directoryDownloadLog: "",
                    directoryDownloadDone: false,
                },
            };
        case "TOGGLE_SNACKBAR":
            return {
                ...state,
                snackbar: {
                    toggle: !state.snackbar.toggle,
                    vertical: action.vertical,
                    horizontal: action.horizontal,
                    msg: action.msg,
                    color: action.color,
                },
            };
        case "SET_MODALS_LOADING":
            return {
                ...state,
                modalsLoading: action.status,
            };
        case "SET_SESSION_STATUS":
            return {
                ...state,
                isLogin: action.status,
            };
        case "REFRESH_STORAGE":
            return {
                ...state,
                storageRefresh: !state.storageRefresh,
            };
        case "SEARCH_MY_FILE":
            return {
                ...state,
                contextOpen: false,
                navigatorError: false,
                navigatorLoading: true,
            };
        case "CHANGE_CONTEXT_MENU":
            if (state.contextOpen && action.open) {
                return {
                    ...state,
                };
            }
            return {
                ...state,
                contextOpen: action.open,
                contextType: action.menuType,
            };
        case "SET_SUBTITLE":
            return {
                ...state,
                subTitle: action.title,
            };
        case "SET_SORT_METHOD":
            return {
                ...state,
                sortMethod: action.method,
            };
        case "SET_NAVIGATOR":
            return {
                ...state,
                contextOpen: false,
                navigatorError: false,
                navigatorLoading: action.navigatorLoading,
            };
        case "SET_OPTION_MODAL":
            return {
                ...state,
                modals: {
                    ...state.modals,
                    option: action.option,
                },
                contextOpen: false,
            };
        case "OPEN_FILE_SELECTOR":
            return {
                ...state,
                openFileSelector: state.openFileSelector + 1,
                contextOpen: false,
            };
        case "OPEN_FOLDER_SELECTOR":
            return {
                ...state,
                openFolderSelector: state.openFolderSelector + 1,
                contextOpen: false,
            };
        case "SET_PAGINATION":
            return {
                ...state,
                pagination: action.pagination,
            };
        case "SET_SHARE_INFO":
            return {
                ...state,
                shareInfo: action.shareInfo,
            };
        default:
            return state;
    }
};


export default viewUpdate;
