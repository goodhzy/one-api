
export const initState = {
    dndSignal: false,
    dndTarget: null,
    dndSource: null,
    fileList: [],
    dirList: [],
    selected: [],
    selectProps: {
        isMultiple: false,
        withFolder: false,
        withFile: false,
        withSourceEnabled: false,
    },
    lastSelect: {
        file: {
            id: "",
            name: "",
            size: 0,
            type: "file",
            date: "",
            path: "",
            create_date: "",
        },
        index: -1,
    },
    shiftSelectedIds: [],
    imgPreview: {
        first: {
            id: "",
            name: "",
            size: 0,
            type: "file",
            date: "",
            path: "",
            create_date: "",
        },
        other: [],
    },
    audioPreview: {
        first: {
            id: "",
            name: "",
            size: 0,
            type: "file",
            date: "",
            path: "",
            create_date: "",
        },
        other: [],
        playingName: null,
        paused: false,
        isOpen: false,
    },
    fileSave: false,
    sideBarOpen: false,
};

const checkSelectedProps = (selected) => {
    const isMultiple = selected.length > 1;
    let withFolder = false;
    let withFile = false;
    let withSourceEnabled = false;
    selected.forEach((value) => {
        if (value.type === "dir") {
            withFolder = true;
            withSourceEnabled = true;
        } else if (value.type === "file") {
            withFile = true;
            if (value.source_enabled) {
                withSourceEnabled = true;
            }
        }
    });
    return {
        isMultiple,
        withFolder,
        withFile,
        withSourceEnabled,
    };
};

const explorer = (state = initState, action) => {
    switch (action.type) {
        case "DRAG_AND_DROP":
            return {
                ...state,
                dndSignal: !state.dndSignal,
                dndTarget: action.target,
                dndSource: action.source,
            };
        case "SET_FILE_LIST":
            return {
                ...state,
                fileList: action.list,
            };
        case "SET_DIR_LIST":
            return {
                ...state,
                dirList: action.list,
            };
        case "ADD_SELECTED_TARGETS":
            const addedSelected = [...state.selected, ...action.targets];
            return {
                ...state,
                selected: addedSelected,
                selectProps: checkSelectedProps(addedSelected),
            };
        case "SET_SELECTED_TARGET":
            const newSelected = action.targets;
            return {
                ...state,
                selected: newSelected,
                selectProps: checkSelectedProps(newSelected),
            };
        case "REMOVE_SELECTED_TARGETS":
            const { fileIds } = action;
            const filteredSelected = state.selected.filter((file) => !fileIds.includes(file.id));
            return {
                ...state,
                selected: filteredSelected,
                selectProps: checkSelectedProps(filteredSelected),
            };
        case "REFRESH_FILE_LIST":
            return {
                ...state,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                    withSourceEnabled: false,
                },
            };
        case "SEARCH_MY_FILE":
            return {
                ...state,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                    withSourceEnabled: false,
                },
                search: {
                    keywords: action.keywords,
                    searchPath: action.path,
                },
            };
        case "SHOW_IMG_PREVIEW":
            return {
                ...state,
                imgPreview: {
                    first: action.first,
                    other: state.fileList,
                },
            };
        case "SHOW_AUDIO_PREVIEW":
            return {
                ...state,
                audioPreview: {
                    ...state.audioPreview,
                    first: action.first,
                    other: state.fileList,
                },
            };
        case "AUDIO_PREVIEW_SET_IS_OPEN":
            return {
                ...state,
                audioPreview: {
                    ...state.audioPreview,
                    isOpen: action.isOpen,
                },
            };
        case "AUDIO_PREVIEW_SET_PLAYING":
            return {
                ...state,
                audioPreview: {
                    ...state.audioPreview,
                    playingName: action.playingName,
                    paused: action.paused,
                },
            };
        case "SAVE_FILE":
            return {
                ...state,
                fileSave: !state.fileSave,
            };
        case "SET_LAST_SELECT":
            const { file, index } = action;
            return {
                ...state,
                lastSelect: {
                    file,
                    index,
                },
            };
        case "SET_SHIFT_SELECTED_IDS":
            const { shiftSelectedIds } = action;
            return {
                ...state,
                shiftSelectedIds,
            };
        case "SET_NAVIGATOR":
            return {
                ...state,
                selected: [],
                selectProps: {
                    isMultiple: false,
                    withFolder: false,
                    withFile: false,
                    withSourceEnabled: false,
                },
                search: undefined,
            };
        case "SET_SIDE_BAR":
            return {
                ...state,
                sideBarOpen: action.open,
            };
        case "SET_CURRENT_POLICY":
            return {
                ...state,
                currentPolicy: action.policy,
            };
        default:
            return state;
    }
};

export default explorer;
