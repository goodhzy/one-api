import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import RightIcon from "@mui/icons-material/KeyboardArrowRight";
import ShareIcon from "@mui/icons-material/Share";
import NewFolderIcon from "@mui/icons-material/CreateNewFolder";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Avatar, Divider, ListItemIcon, Menu, MenuItem, useTheme } from "@mui/material";
import PathButton from "./PathButton";
import DropDown from "./DropDown";
import pathHelper from "../../../utils/page";
import classNames from "classnames";
import Auth from "../../../middleware/Auth";
import { Archive } from "@mui/icons-material";
import { FilePlus } from "mdi-material-ui";
import SubActions from "./SubActions";
import { setCurrentPolicy, setSelectedTarget } from '../../../store/explorer/action';
import { list } from "../../../services/navigate";
import { withTranslation } from "react-i18next";
import { setGetParameter } from '../../../utils';
import explorer, {
    drawerToggleAction, navigateTo, navigateUp,
    openCompressDialog,
    openCreateFileDialog,
    openCreateFolderDialog,
    openShareDialog, refreshFileList, setNavigatorError, setNavigatorLoadingStatus
} from '../../../store/explorer';

const useStyles = (theme) => ({
    container: {
        [theme.breakpoints.down("xs")]: {
            display: "none",
        },
        backgroundColor: theme.palette.background.paper,
    },
    navigatorContainer: {
        display: "flex",
        justifyContent: "space-between",
    },
    nav: {
        height: "48px",
        padding: "5px 15px",
        display: "flex",
    },
    optionContainer: {
        paddingTop: "6px",
        marginRight: "10px",
    },
    rightIcon: {
        marginTop: "6px",
        verticalAlign: "top",
        color: "#868686",
    },
    expandMore: {
        color: "#8d8d8d",
    },
    roundBorder: {
        borderRadius: "4px 4px 0 0",
    },
});

const NavigatorComponent = (props) => {
    const theme = useTheme();
    const classes = useStyles(theme);
    const navigate = useNavigate();
    const location = useLocation();
    const [state, setState] = useState({
        hidden: false,
        hiddenFolders: [],
        folders: [],
        anchorEl: null,
        hiddenMode: false,
        anchorHidden: null,
    });
    const element = useRef(null);
    const search = useRef(undefined);
    const currentID = useRef(0);

    useEffect(() => {
        const url = new URL(window.location.href);
        const c = url.searchParams.get("path");
        renderPath(c === null ? "/" : c);

        if (!props.isShare) {
            props.handleDesktopToggle(true);
        }

        const handlePopState = () => {
            const url = new URL(window.location.href);
            const c = url.searchParams.get("path");
            if (c !== null) {
                props.navigateToPath(c);
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            props.updateFileList([]);
        };
    }, [props]);

    const renderPath = useCallback((path = null) => {
        props.setNavigatorError(false, null);
        setState((prevState) => ({
            ...prevState,
            folders: path !== null ? path.substr(1).split("/") : props.path.substr(1).split("/"),
        }));
        const newPath = path !== null ? path : props.path;
        list(
          newPath,
          props.share,
          search.current ? search.current.keywords : "",
          search.current ? search.current.searchPath : ""
        )
          .then((response) => {
              currentID.current = response.data.parent;
              props.updateFileList(response.data.objects);
              props.setNavigatorLoadingStatus(false);
              if (!search.current) {
                  setGetParameter("path", encodeURIComponent(newPath));
              }
              if (response.data.policy) {
                  props.setCurrentPolicy({
                      id: response.data.policy.id,
                      name: response.data.policy.name,
                      type: response.data.policy.type,
                      maxSize: response.data.policy.max_size,
                      allowedSuffix: response.data.policy.file_type,
                  });
              }
          })
          .catch((error) => {
              props.setNavigatorError(true, error);
          });

        checkOverFlow(true);
    }, [props]);

    const redresh = useCallback((path) => {
        props.setNavigatorLoadingStatus(true);
        props.setNavigatorError(false, "error");
        renderPath(path);
    }, [props, renderPath]);

    useEffect(() => {
        if (props.search !== search.current) {
            search.current = props.search;
        }
        if (props.path !== props.path) {
            renderPath(props.path);
        }
        if (props.refresh !== props.refresh) {
            redresh(props.path);
        }
    }, [props, renderPath, redresh]);

    const checkOverFlow = useCallback((force) => {
        if (element.current) {
            const hasOverflowingChildren =
              element.current.offsetHeight < element.current.scrollHeight ||
              element.current.offsetWidth < element.current.scrollWidth;
            if (hasOverflowingChildren) {
                setState((prevState) => ({
                    ...prevState,
                    hiddenMode: true,
                }));
            }
            if (!hasOverflowingChildren && state.hiddenMode) {
                setState((prevState) => ({
                    ...prevState,
                    hiddenMode: false,
                }));
            }
        }
    }, [state.hiddenMode]);

    useEffect(() => {
        checkOverFlow(true);
    }, [state.folders, checkOverFlow]);

    useEffect(() => {
        const timer = setTimeout(() => checkOverFlow(), 500);
        return () => clearTimeout(timer);
    }, [props.drawerDesktopOpen, checkOverFlow]);

    const navigateTo = (event, id) => {
        if (id === state.folders.length - 1) {
            setState((prevState) => ({
                ...prevState,
                anchorEl: event.currentTarget
            }));
        } else if (id === -1 && state.folders.length === 1 && state.folders[0] === "") {
            props.refreshFileList();
            handleClose();
        } else if (id === -1) {
            props.navigateToPath("/");
            handleClose();
        } else {
            props.navigateToPath("/" + state.folders.slice(0, id + 1).join("/"));
            handleClose();
        }
    };

    const handleClose = () => {
        setState((prevState) => ({
            ...prevState,
            anchorEl: null,
            anchorHidden: null,
        }));
    };

    const showHiddenPath = (e) => {
        setState((prevState) => ({
            ...prevState,
            anchorHidden: e.currentTarget
        }));
    };

    const performAction = (action) => {
        handleClose();
        if (action === "refresh") {
            redresh();
            return;
        }
        const presentPath = props.path.split("/");
        const newTarget = [
            {
                id: currentID.current,
                type: "dir",
                name: presentPath.pop(),
                path: presentPath.length === 1 ? "/" : presentPath.join("/"),
            },
        ];
        switch (action) {
            case "share":
                props.setSelectedTarget(newTarget);
                props.openShareDialog();
                break;
            case "newfolder":
                props.openCreateFolderDialog();
                break;
            case "compress":
                props.setSelectedTarget(newTarget);
                props.openCompressDialog();
                break;
            case "newFile":
                props.openCreateFileDialog();
                break;
            default:
                break;
        }
    };

    const { t } = props;
    const isHomePage = pathHelper.isHomePage(location.pathname);
    const user = Auth.GetUser();

    const presentFolderMenu = (
      <Menu
        id="presentFolderMenu"
        anchorEl={state.anchorEl}
        open={Boolean(state.anchorEl)}
        onClose={handleClose}
        disableAutoFocusItem
      >
          <MenuItem onClick={() => performAction("refresh")}>
              <ListItemIcon>
                  <RefreshIcon />
              </ListItemIcon>
              {t("fileManager.refresh")}
          </MenuItem>
          {!props.search && isHomePage && (
            <div>
                <Divider />
                <MenuItem onClick={() => performAction("share")}>
                    <ListItemIcon>
                        <ShareIcon />
                    </ListItemIcon>
                    {t("fileManager.share")}
                </MenuItem>
                {user.group.compress && (
                  <MenuItem onClick={() => performAction("compress")}>
                      <ListItemIcon>
                          <Archive />
                      </ListItemIcon>
                      {t("fileManager.compress")}
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={() => performAction("newfolder")}>
                    <ListItemIcon>
                        <NewFolderIcon />
                    </ListItemIcon>
                    {t("fileManager.newFolder")}
                </MenuItem>
                <MenuItem onClick={() => performAction("newFile")}>
                    <ListItemIcon>
                        <FilePlus />
                    </ListItemIcon>
                    {t("fileManager.newFile")}
                </MenuItem>
            </div>
          )}
      </Menu>
    );

    return (
      <div
        className={classNames(
          {
              [classes.roundBorder]: props.isShare,
          },
          classes.container
        )}
      >
          <div className={classes.navigatorContainer}>
              <div className={classes.nav} ref={element}>
                    <span>
                        <PathButton
                          folder="/"
                          path="/"
                          onClick={(e) => navigateTo(e, -1)}
                        />
                        <RightIcon className={classes.rightIcon} />
                    </span>
                  {state.hiddenMode && (
                    <span>
                            <PathButton
                              more
                              title={t("fileManager.showFullPath")}
                              onClick={showHiddenPath}
                            />
                            <Menu
                              id="hiddenPathMenu"
                              anchorEl={state.anchorHidden}
                              open={Boolean(state.anchorHidden)}
                              onClose={handleClose}
                              disableAutoFocusItem
                            >
                                <DropDown
                                  onClose={handleClose}
                                  folders={state.folders.slice(0, -1)}
                                  navigateTo={navigateTo}
                                />
                            </Menu>
                            <RightIcon className={classes.rightIcon} />
                            <PathButton
                              folder={state.folders.slice(-1)}
                              path={"/" + state.folders.slice(0, -1).join("/")}
                              last
                              onClick={(e) => navigateTo(e, state.folders.length - 1)}
                            />
                        {presentFolderMenu}
                        </span>
                  )}
                  {!state.hiddenMode && state.folders.map((folder, id, folders) => (
                    <span key={id}>
                            {folder !== "" && (
                              <span>
                                    <PathButton
                                      folder={folder}
                                      path={"/" + folders.slice(0, id).join("/")}
                                      last={id === folders.length - 1}
                                      onClick={(e) => navigateTo(e, id)}
                                    />
                                  {id === folders.length - 1 && presentFolderMenu}
                                  {id !== folders.length - 1 && (
                                    <RightIcon className={classes.rightIcon} />
                                  )}
                                </span>
                            )}
                        </span>
                  ))}
              </div>
              <div className={classes.optionContainer}>
                  <SubActions isSmall />
              </div>
          </div>
          <Divider />
      </div>
    );
};

NavigatorComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    path: PropTypes.string.isRequired,
    isShare: PropTypes.bool.isRequired,
    handleDesktopToggle: PropTypes.func.isRequired,
    navigateToPath: PropTypes.func.isRequired,
    updateFileList: PropTypes.func.isRequired,
    setNavigatorError: PropTypes.func.isRequired,
    setNavigatorLoadingStatus: PropTypes.func.isRequired,
    setCurrentPolicy: PropTypes.func.isRequired,
    refreshFileList: PropTypes.func.isRequired,
    setSelectedTarget: PropTypes.func.isRequired,
    openShareDialog: PropTypes.func.isRequired,
    openCreateFolderDialog: PropTypes.func.isRequired,
    openCompressDialog: PropTypes.func.isRequired,
    openCreateFileDialog: PropTypes.func.isRequired,
    search: PropTypes.object,
    refresh: PropTypes.bool,
};

const mapStateToProps = (state) => {
    return {
        path: state.navigator.path,
        refresh: state.navigator.refresh,
        drawerDesktopOpen: state.viewUpdate.open,
        viewMethod: state.viewUpdate.explorerViewMethod,
        search: state.explorer.search,
        sortMethod: state.viewUpdate.sortMethod,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        navigateToPath: (path) => {
            dispatch(navigateTo(path));
        },
        navigateUp: () => {
            dispatch(navigateUp());
        },
        setNavigatorError: (status, msg) => {
            dispatch(setNavigatorError(status, msg));
        },
        updateFileList: (list) => {
            dispatch(explorer.actions.updateFileList(list));
        },
        setNavigatorLoadingStatus: (status) => {
            dispatch(setNavigatorLoadingStatus(status));
        },
        refreshFileList: () => {
            dispatch(refreshFileList());
        },
        setSelectedTarget: (target) => {
            dispatch(setSelectedTarget(target));
        },
        openCreateFolderDialog: () => {
            dispatch(openCreateFolderDialog());
        },
        openCreateFileDialog: () => {
            dispatch(openCreateFileDialog());
        },
        openShareDialog: () => {
            dispatch(openShareDialog());
        },
        handleDesktopToggle: (open) => {
            dispatch(drawerToggleAction(open));
        },
        openCompressDialog: () => {
            dispatch(openCompressDialog());
        },
        setCurrentPolicy: (policy) => {
            dispatch(setCurrentPolicy(policy));
        },
    };
};

const Navigator = connect(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation()(NavigatorComponent));

export default Navigator;
