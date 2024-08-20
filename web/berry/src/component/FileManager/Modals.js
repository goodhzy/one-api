import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import PathSelector from "./PathSelector";
import API from "../../middleware/Api";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    styled,
} from "@mui/material";
import Loading from "../Modals/Loading";
import CopyDialog from "../Modals/Copy";
import DirectoryDownloadDialog from "../Modals/DirectoryDownload";
import CreatShare from "../Modals/CreateShare";
import DecompressDialog from "../Modals/Decompress";
import CompressDialog from "../Modals/Compress";
import OptionSelector from "../Modals/OptionSelector";
import { getDownloadURL } from "../../services/file";
import { Trans, useTranslation } from "react-i18next";
import RemoteDownload from "../Modals/RemoteDownload";
import Delete from "../Modals/Delete";
import { useNavigate } from "react-router-dom";
import { closeAllModals, openLoadingDialog, refreshFileList, refreshStorage, setModalsLoading, toggleSnackbar } from "../../store/explorer";

const useStyles = styled((theme) => ({
    wrapper: {
        margin: theme.spacing(1),
        position: "relative",
    },
    buttonProgress: {
        color: theme.palette.secondary.light,
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    contentFix: {
        padding: "10px 24px 0px 24px",
    },
}));

const ModalsCompoment = (props) => {
    const [state, setState] = useState({
        newFolderName: "",
        newFileName: "",
        newName: "",
        selectedPath: "",
        selectedPathName: "",
        secretShare: false,
        sharePwd: "",
        shareUrl: "",
        purchaseCallback: null,
    });

    const { t } = useTranslation();
    const navigate = useNavigate();
    const classes = useStyles();

    // useEffect(() => {
    //     if (props.dndSignale !== props.prevDndSignale) {
    //         dragMove(props.dndSource, props.dndTarget);
    //     }
    //
    //     if (props.modalsStatus.rename !== props.prevModalsStatus.rename) {
    //         const name = props.selected[0].name;
    //         setState((prevState) => ({
    //             ...prevState,
    //             newName: name,
    //         }));
    //     }
    // }, [props]);

    const handleInputChange = (e) => {
        setState({
            ...state,
            [e.target.id]: e.target.value,
        });
    };

    const download = () => {
        getDownloadURL(props.selected[0])
          .then((response) => {
              window.location.assign(response.data);
              onClose();
              this.downloaded = true;
          })
          .catch((error) => {
              props.toggleSnackbar("top", "right", error.message, "error");
              onClose();
          });
    };

    const submitMove = (e) => {
        if (e) {
            e.preventDefault();
        }
        props.setModalsLoading(true);
        const dirs = [];
        const items = [];
        props.selected.forEach((value) => {
            if (value.type === "dir") {
                dirs.push(value.id);
            } else {
                items.push(value.id);
            }
        });
        API.patch("/object", {
            action: "move",
            src_dir: props.selected[0].path,
            src: {
                dirs: dirs,
                items: items,
            },
            dst: state.DragSelectedPath
              ? state.DragSelectedPath
              : state.selectedPath === "//"
                ? "/"
                : state.selectedPath,
        })
          .then(() => {
              onClose();
              props.refreshFileList();
              props.setModalsLoading(false);
              state.DragSelectedPath = "";
          })
          .catch((error) => {
              props.toggleSnackbar("top", "right", error.message, "error");
              props.setModalsLoading(false);
              state.DragSelectedPath = "";
          })
          .then(() => {
              props.closeAllModals();
          });
    };

    const dragMove = (source, target) => {
        if (props.selected.length === 0) {
            props.selected[0] = source;
        }
        let doMove = true;

        props.selected.forEach((value) => {
            if (value.id === target.id && value.type === target.type) {
                doMove = false;
                return;
            }
            if (
              value.path === target.path + (target.path === "/" ? "" : "/") + target.name
            ) {
                doMove = false;
                return;
            }
        });
        if (doMove) {
            state.DragSelectedPath =
              target.path === "/"
                ? target.path + target.name
                : target.path + "/" + target.name;
            props.openLoadingDialog(t("modals.processing"));
            submitMove();
        }
    };

    const submitRename = (e) => {
        e.preventDefault();
        props.setModalsLoading(true);
        const newName = state.newName;

        const src = {
            dirs: [],
            items: [],
        };

        if (props.selected[0].type === "dir") {
            src.dirs[0] = props.selected[0].id;
        } else {
            src.items[0] = props.selected[0].id;
        }

        if (
          props.dirList.findIndex((value) => value.name === newName) !== -1 ||
          props.fileList.findIndex((value) => value.name === newName) !== -1
        ) {
            props.toggleSnackbar("top", "right", t("modals.duplicatedObjectName"), "warning");
            props.setModalsLoading(false);
        } else {
            API.post("/object/rename", {
                action: "rename",
                src: src,
                new_name: newName,
            })
              .then(() => {
                  onClose();
                  props.refreshFileList();
                  props.setModalsLoading(false);
              })
              .catch((error) => {
                  props.toggleSnackbar("top", "right", error.message, "error");
                  props.setModalsLoading(false);
              });
        }
    };

    const submitCreateNewFolder = (e) => {
        e.preventDefault();
        props.setModalsLoading(true);
        if (
          props.dirList.findIndex((value) => value.name === state.newFolderName) !== -1
        ) {
            props.toggleSnackbar("top", "right", t("modals.duplicatedFolderName"), "warning");
            props.setModalsLoading(false);
        } else {
            API.put("/directory", {
                path: (props.path === "/" ? "" : props.path) + "/" + state.newFolderName,
            })
              .then(() => {
                  onClose();
                  props.refreshFileList();
                  props.setModalsLoading(false);
              })
              .catch((error) => {
                  props.setModalsLoading(false);
                  props.toggleSnackbar("top", "right", error.message, "error");
              });
        }
    };

    const submitCreateNewFile = (e) => {
        e.preventDefault();
        props.setModalsLoading(true);
        if (
          props.dirList.findIndex((value) => value.name === state.newFileName) !== -1
        ) {
            props.toggleSnackbar("top", "right", t("modals.duplicatedFolderName"), "warning");
            props.setModalsLoading(false);
        } else {
            API.post("/file/create", {
                path: (props.path === "/" ? "" : props.path) + "/" + state.newFileName,
            })
              .then(() => {
                  onClose();
                  props.refreshFileList();
                  props.setModalsLoading(false);
              })
              .catch((error) => {
                  props.setModalsLoading(false);
                  props.toggleSnackbar("top", "right", error.message, "error");
              });
        }
    };

    const setMoveTarget = (folder) => {
        const path =
          folder.path === "/"
            ? folder.path + folder.name
            : folder.path + "/" + folder.name;
        setState({
            ...state,
            selectedPath: path,
            selectedPathName: folder.name,
        });
    };

    const onClose = () => {
        setState({
            newFolderName: "",
            newFileName: "",
            newName: "",
            selectedPath: "",
            selectedPathName: "",
            secretShare: false,
            sharePwd: "",
            shareUrl: "",
        });
        state.newNameSuffix = "";
        props.closeAllModals();
    };

    const handleChange = (name) => (event) => {
        setState({ ...state, [name]: event.target.checked });
    };

    return (
      <React.Fragment>
          {/* Modal Components */}
          {/* Example for Rename Modal */}
          <Dialog open={props?.modalsStatus?.rename} onClose={onClose}>
              <DialogTitle>{t("modals.rename.title")}</DialogTitle>
              <DialogContent>
                  <DialogContentText>{t("modals.rename.message")}</DialogContentText>
                  <TextField
                    autoFocus
                    margin="dense"
                    id="newName"
                    label={t("modals.rename.newName")}
                    type="text"
                    fullWidth
                    variant="standard"
                    value={state.newName}
                    onChange={handleInputChange}
                  />
              </DialogContent>
              <DialogActions>
                  <Button onClick={onClose}>{t("common.cancel")}</Button>
                  <Button onClick={submitRename}>{t("common.save")}</Button>
              </DialogActions>
          </Dialog>

          {/* Add other modal dialogs similarly */}
      </React.Fragment>
    );
};

ModalsCompoment.propTypes = {
    modalsStatus: PropTypes.object.isRequired,
    selected: PropTypes.array.isRequired,
    closeAllModals: PropTypes.func.isRequired,
    openLoadingDialog: PropTypes.func.isRequired,
    setModalsLoading: PropTypes.func.isRequired,
    toggleSnackbar: PropTypes.func.isRequired,
    refreshFileList: PropTypes.func.isRequired,
    refreshStorage: PropTypes.func.isRequired,
    dndSource: PropTypes.object,
    dndTarget: PropTypes.object,
    dndSignale: PropTypes.number,
    prevDndSignale: PropTypes.number,
    prevModalsStatus: PropTypes.object,
    path: PropTypes.string,
    dirList: PropTypes.array,
    fileList: PropTypes.array,
};

const mapDispatchToProps = {
    closeAllModals,
    openLoadingDialog,
    setModalsLoading,
    toggleSnackbar,
    refreshFileList,
    refreshStorage,
};

const mapStateToProps = (state) => ({
    modalsStatus: state.explorer.modalsStatus,
    selected: state.explorer.selected,
    dndSource: state.explorer.dndSource,
    dndTarget: state.explorer.dndTarget,
    dndSignale: state.explorer.dndSignale,
    prevDndSignale: state.explorer.prevDndSignale,
    prevModalsStatus: state.explorer.prevModalsStatus,
    path: state.explorer.path,
    dirList: state.explorer.dirList,
    fileList: state.explorer.fileList,
});

export default connect(mapStateToProps, mapDispatchToProps)(ModalsCompoment);
