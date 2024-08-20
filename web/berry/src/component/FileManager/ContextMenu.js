import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import {
    Divider,
    ListItemIcon,
    MenuItem,
    Typography,
    Menu,
    styled
} from "@mui/material";
import {
    Archive,
    InfoOutlined,
    Unarchive,
    BorderColor as RenameIcon,
    CloudDownload as DownloadIcon,
    CloudUpload as UploadIcon,
    CreateNewFolder as NewFolderIcon,
    Delete as DeleteIcon,
    FileCopy as FileCopyIcon,
    FolderOpen as OpenFolderIcon,
    Input as MoveIcon,
    InsertLink as LinkIcon,
    OpenInNew as OpenIcon,
    Share as ShareIcon,
} from "@mui/icons-material";
import {
    FolderDownload,
    FolderUpload,
    MagnetOn,
    FilePlus,
} from "mdi-material-ui";
import Auth from "../../middleware/Auth";
import pathHelper from "../../utils/page";
import {
    batchGetSource,
    openParentFolder,
    openPreview,
    openTorrentDownload,
    setSelectedTarget,
    startBatchDownload,
    startDirectoryDownload,
    startDownload,
    toggleObjectInfoSidebar,
} from "../../store/explorer/action";
import {
    changeContextMenu,
    navigateTo,
    openCompressDialog,
    openCopyDialog,
    openCreateFileDialog,
    openCreateFolderDialog,
    openDecompressDialog,
    openLoadingDialog,
    openMoveDialog,
    openMusicDialog,
    openRemoteDownloadDialog,
    openRemoveDialog,
    openRenameDialog,
    openShareDialog,
    refreshFileList,
    setNavigatorLoadingStatus,
    showImgPreivew,
    toggleSnackbar,
} from "../../store/explorer";
import { pathJoin } from "../Uploader/core/utils";
import {
    openFileSelector,
    openFolderSelector,
} from "../../store/viewUpdate/action";
import { useTranslation } from "react-i18next";
import RefreshIcon from '@mui/icons-material/Refresh';
import { isPreviewable } from '../../config';

// Define styled components
const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
    minWidth: 38,
}));

const DividerStyled = styled(Divider)(({ theme }) => ({
    marginTop: 4,
    marginBottom: 4,
}));

const ContextMenuComponent = (props) => {
    const location = useLocation();
    const { t } = useTranslation();
    const [anchorPosition, setAnchorPosition] = useState(null);
    const [Y, setY] = useState(0);
    const [X, setX] = useState(0);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setY(e.clientY);
            setX(e.clientX);
        };
        window.document.addEventListener("mousemove", handleMouseMove);
        return () => window.document.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        setAnchorPosition({ top: Y, left: X });
    }, [Y, X]);

    const openArchiveDownload = () => {
        props.startBatchDownload(props.share);
    };

    const openDirectoryDownload = () => {
        props.startDirectoryDownload(props.share);
    };

    const openDownload = () => {
        props.startDownload(props.share, props.selected[0]);
    };

    const enterFolder = () => {
        props.navigateTo(pathJoin([props.path, props.selected[0].name]));
    };

    const renderMenuItems = (items) => {
        const res = [];
        let key = 0;

        ["top", "center", "bottom"].forEach((position) => {
            let visibleCount = 0;
            items[position].forEach((item) => {
                if (item.condition) {
                    res.push(
                      <MenuItem dense key={key} onClick={item.onClick}>
                          <StyledListItemIcon>{item.icon}</StyledListItemIcon>
                          <Typography variant="inherit">{item.text}</Typography>
                      </MenuItem>
                    );
                    key++;
                    visibleCount++;
                }
            });
            if (visibleCount > 0 && position !== "bottom") {
                res.push(
                  <DividerStyled key={key} />
                );
                key++;
            }
        });

        return res;
    };

    const user = Auth.GetUser();
    const isHomePage = pathHelper.isHomePage(location.pathname);
    const emptyMenuList = {
        top: [
            {
                condition: true,
                onClick: () => {
                    props.refreshFileList();
                    props.changeContextMenu(props.menuType, false);
                },
                icon: <RefreshIcon />,
                text: "刷新",
            },
        ],
        center: [
            {
                condition: true,
                onClick: () => props.openFileSelector(),
                icon: <UploadIcon />,
                text: "上传文件",
            },
            {
                condition: true,
                onClick: () => props.openFolderSelector(),
                icon: <FolderUpload />,
                text: "上传目录",
            },
            {
                condition: user?.group?.allowRemoteDownload,
                onClick: () => props.openRemoteDownloadDialog(),
                icon: <DownloadIcon />,
                text: "离线下载",
            },
        ],
        bottom: [
            {
                condition: true,
                onClick: () => props.openCreateFolderDialog(),
                icon: <NewFolderIcon />,
                text: "创建文件夹",
            },
            {
                condition: true,
                onClick: () => props.openCreateFileDialog(),
                icon: <FilePlus />,
                text: "创建文件",
            },
        ],
    };

    return (
      <div>
          <Menu
            keepMounted
            open={props.menuOpen}
            onClose={() => props.changeContextMenu(props.menuType, false)}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition}
            anchorOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
          >
              {props.menuType === "empty" && (
                <div>
                    <MenuItem
                      dense
                      onClick={() => {
                          props.refreshFileList();
                          props.changeContextMenu(props.menuType, false);
                      }}
                    >
                        <StyledListItemIcon>
                            <RefreshIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.refresh")}
                        </Typography>
                    </MenuItem>
                    <DividerStyled />
                    <MenuItem
                      dense
                      onClick={() => props.openFileSelector()}
                    >
                        <StyledListItemIcon>
                            <UploadIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.uploadFiles")}
                        </Typography>
                    </MenuItem>
                    <MenuItem
                      dense
                      onClick={() => props.openFolderSelector()}
                    >
                        <StyledListItemIcon>
                            <FolderUpload />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.uploadFolder")}
                        </Typography>
                    </MenuItem>
                    {user.group.allowRemoteDownload && (
                      <MenuItem
                        dense
                        onClick={() => props.openRemoteDownloadDialog()}
                      >
                          <StyledListItemIcon>
                              <DownloadIcon />
                          </StyledListItemIcon>
                          <Typography variant="inherit">
                              {t("fileManager.newRemoteDownloads")}
                          </Typography>
                      </MenuItem>
                    )}
                    <DividerStyled />
                    <MenuItem
                      dense
                      onClick={() => props.openCreateFolderDialog()}
                    >
                        <StyledListItemIcon>
                            <NewFolderIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.newFolder")}
                        </Typography>
                    </MenuItem>
                    <MenuItem
                      dense
                      onClick={() => props.openCreateFileDialog()}
                    >
                        <StyledListItemIcon>
                            <FilePlus />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.newFile")}
                        </Typography>
                    </MenuItem>
                </div>
              )}
              {props.menuType !== "empty" && (
                <div>
                    {!props.isMultiple && props.withFolder && (
                      <div>
                          <MenuItem dense onClick={enterFolder}>
                              <StyledListItemIcon>
                                  <OpenFolderIcon />
                              </StyledListItemIcon>
                              <Typography variant="inherit">
                                  {t("fileManager.enter")}
                              </Typography>
                          </MenuItem>
                          {isHomePage && (
                            <DividerStyled />
                          )}
                      </div>
                    )}
                    {!props.isMultiple && props.withFile && (!props.share || props.share.preview) && isPreviewable(props.selected[0].name) && (
                      <div>
                          <MenuItem dense onClick={() => props.openPreview()}>
                              <StyledListItemIcon>
                                  <OpenIcon />
                              </StyledListItemIcon>
                              <Typography variant="inherit">
                                  {t("fileManager.preview")}
                              </Typography>
                          </MenuItem>
                          <DividerStyled />
                      </div>
                    )}
                    {props.isMultiple && (
                      <div>
                          <MenuItem dense onClick={openArchiveDownload}>
                              <StyledListItemIcon>
                                  <Archive />
                              </StyledListItemIcon>
                              <Typography variant="inherit">
                                  {t("fileManager.downloadZip")}
                              </Typography>
                          </MenuItem>
                          <DividerStyled />
                      </div>
                    )}
                    <MenuItem dense onClick={() => props.openRenameDialog()}>
                        <StyledListItemIcon>
                            <RenameIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.rename")}
                        </Typography>
                    </MenuItem>
                    <MenuItem dense onClick={() => props.openMoveDialog()}>
                        <StyledListItemIcon>
                            <MoveIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.move")}
                        </Typography>
                    </MenuItem>
                    <MenuItem dense onClick={() => props.openCopyDialog()}>
                        <StyledListItemIcon>
                            <FileCopyIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.copy")}
                        </Typography>
                    </MenuItem>
                    <DividerStyled />
                    <MenuItem dense onClick={() => props.openRemoveDialog()}>
                        <StyledListItemIcon>
                            <DeleteIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.delete")}
                        </Typography>
                    </MenuItem>
                    <DividerStyled />
                    <MenuItem dense onClick={() => props.openShareDialog()}>
                        <StyledListItemIcon>
                            <ShareIcon />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.share")}
                        </Typography>
                    </MenuItem>
                    <MenuItem dense onClick={() => props.toggleObjectInfoSidebar()}>
                        <StyledListItemIcon>
                            <InfoOutlined />
                        </StyledListItemIcon>
                        <Typography variant="inherit">
                            {t("fileManager.info")}
                        </Typography>
                    </MenuItem>
                </div>
              )}
          </Menu>
      </div>
    );
};

ContextMenuComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    changeContextMenu: PropTypes.func.isRequired,
    menuType: PropTypes.string.isRequired,
    menuOpen: PropTypes.bool.isRequired,
    path: PropTypes.string.isRequired,
    refreshFileList: PropTypes.func.isRequired,
    startBatchDownload: PropTypes.func.isRequired,
    startDirectoryDownload: PropTypes.func.isRequired,
    startDownload: PropTypes.func.isRequired,
    openFileSelector: PropTypes.func.isRequired,
    openFolderSelector: PropTypes.func.isRequired,
    openRemoteDownloadDialog: PropTypes.func.isRequired,
    openCreateFolderDialog: PropTypes.func.isRequired,
    openCreateFileDialog: PropTypes.func.isRequired,
    openRenameDialog: PropTypes.func.isRequired,
    openMoveDialog: PropTypes.func.isRequired,
    openCopyDialog: PropTypes.func.isRequired,
    openRemoveDialog: PropTypes.func.isRequired,
    openShareDialog: PropTypes.func.isRequired,
    openPreview: PropTypes.func.isRequired,
    toggleObjectInfoSidebar: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired,
    showImgPreivew: PropTypes.func.isRequired,
    isMultiple: PropTypes.bool.isRequired,
    withFolder: PropTypes.bool.isRequired,
    withFile: PropTypes.bool.isRequired,
    selected: PropTypes.array.isRequired,
    share: PropTypes.object,
    toggleSnackbar: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
    changeContextMenu,
    openFileSelector,
    openFolderSelector,
    openRemoteDownloadDialog,
    openCreateFolderDialog,
    openCreateFileDialog,
    openRenameDialog,
    openMoveDialog,
    openCopyDialog,
    openRemoveDialog,
    openShareDialog,
    openPreview,
    toggleObjectInfoSidebar,
    startBatchDownload,
    startDirectoryDownload,
    startDownload,
    navigateTo,
    refreshFileList,
    showImgPreivew,
    toggleSnackbar,
};

export default connect(null, mapDispatchToProps)(ContextMenuComponent);
