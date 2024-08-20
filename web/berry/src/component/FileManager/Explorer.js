import {
    CircularProgress,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import TableSortLabel from "@mui/material/TableSortLabel";
import { styled } from "@mui/material/styles";
import classNames from "classnames";
import React, { useCallback, useEffect, useMemo } from "react";
import { configure, GlobalHotKeys } from "react-hotkeys";
import explorer, {
    changeContextMenu,
    openRemoveDialog,
    setSelectedTarget,
} from "../../store/explorer";
import { isMac } from "../../utils";
import pathHelper from "../../utils/page";
import ContextMenu from "./ContextMenu";
import ImgPreivew from "./ImgPreview";
import ObjectIcon from "./ObjectIcon";
import Nothing from "../Placeholder/Nothing";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { usePagination } from "../../hooks/pagination";
import { useTranslation } from "react-i18next";

// Styled components
const PaperStyled = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary,
    margin: "10px",
}));

const Root = styled('div')(({ theme }) => ({
    padding: "10px",
    [theme.breakpoints.up("sm")]: {
        height: "calc(100vh - 113px)",
    },
}));

const RootTable = styled('div')(({ theme }) => ({
    padding: "0px",
    backgroundColor: theme.palette.background.paper.white,
    [theme.breakpoints.up("sm")]: {
        height: "calc(100vh - 113px)",
    },
}));

const TypeHeader = styled(Typography)(({ theme }) => ({
    margin: "10px 25px",
    color: "#6b6b6b",
    fontWeight: "500",
}));

const Loading = styled('div')(({ theme }) => ({
    justifyContent: "center",
    display: "flex",
    marginTop: "40px",
}));

const ErrorBox = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
}));

const ErrorMsg = styled(Typography)(({ theme }) => ({
    marginTop: "10px",
}));

const HideAuto = styled('div')(({ theme }) => ({
    [theme.breakpoints.down("sm")]: {
        display: "none",
    },
}));

const FlexFix = styled('div')(({ theme }) => ({
    minWidth: 0,
}));

const UpButton = styled('div')(({ theme }) => ({
    marginLeft: "20px",
    marginTop: "10px",
    marginBottom: "10px",
}));

const ClickAway = styled('div')(({ theme }) => ({
    height: "100%",
    width: "100%",
}));

const RootShare = styled('div')(({ theme }) => ({
    height: "100%",
    minHeight: 500,
}));

const VisuallyHidden = styled('span')(({ theme }) => ({
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    top: 20,
    width: 1,
}));

const GridContainer = styled(Grid)(({ theme }) => ({
    [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))!important",
    },
    [theme.breakpoints.up("md")]: {
        gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))!important",
    },
    display: "grid!important",
}));

const GridItem = styled(Grid)(({ theme }) => ({
    flex: "1 1 220px!important",
}));

const keyMap = {
    DELETE_FILE: "del",
    SELECT_ALL_SHOWED: `${isMac() ? "command" : "ctrl"}+a`,
    SELECT_ALL: `${isMac() ? "command" : "ctrl"}+shift+a`,
    DESELECT_ALL: "esc",
};

export default function Explorer({ share }) {
    const { t } = useTranslation("application", { keyPrefix: "fileManager" });
    const location = useLocation();
    const dispatch = useDispatch();
    const selected = useSelector((state) => state.explorer.selected);
    const search = useSelector((state) => state.explorer.search);
    const loading = useSelector((state) => state.viewUpdate.navigatorLoading);
    const path = useSelector((state) => state.navigator.path);
    const sortMethod = useSelector((state) => state.viewUpdate.sortMethod);
    const navigatorErrorMsg = useSelector(
      (state) => state.viewUpdate.navigatorErrorMsg
    );
    const navigatorError = useSelector(
      (state) => state.viewUpdate.navigatorError
    );
    const viewMethod = useSelector(
      (state) => state.viewUpdate.explorerViewMethod
    );

    const OpenRemoveDialog = useCallback(() => dispatch(openRemoveDialog()), [
        dispatch,
    ]);
    const SetSelectedTarget = useCallback(
      (targets) => dispatch(setSelectedTarget(targets)),
      [dispatch]
    );
    const ChangeContextMenu = useCallback(
      (type, open) => dispatch(changeContextMenu(type, open)),
      [dispatch]
    );
    const ChangeSortMethod = useCallback(
      (method) => dispatch(explorer.actions.changeSortMethod(method)),
      [dispatch]
    );
    const SelectAll = useCallback(
      () => dispatch(explorer.actions.selectAll()),
      [dispatch]
    );

    const { dirList, fileList, startIndex } = usePagination();

    const handlers = {
        DELETE_FILE: () => {
            if (selected.length > 0 && !share) {
                OpenRemoveDialog();
            }
        },
        SELECT_ALL_SHOWED: (e) => {
            e.preventDefault();
            if (selected.length >= dirList.length + fileList.length) {
                SetSelectedTarget([]);
            } else {
                SetSelectedTarget([...dirList, ...fileList]);
            }
        },
        SELECT_ALL: (e) => {
            e.preventDefault();
            SelectAll();
        },
        DESELECT_ALL: (e) => {
            e.preventDefault();
            SetSelectedTarget([]);
        },
    };

    useEffect(
      () =>
        configure({
            ignoreTags: ["input", "select", "textarea"],
        }),
      []
    );

    const contextMenu = (e) => {
        e.preventDefault();
        if (!search && !pathHelper.isSharePage(location.pathname)) {
            if (!loading) {
                ChangeContextMenu("empty", true);
            }
        }
    };

    const ClickAway = (e) => {
        const element = e.target;
        if (element.dataset.clickaway) {
            SetSelectedTarget([]);
        }
    };

    const isHomePage = pathHelper.isHomePage(location.pathname);

    const showView =
      !loading && (dirList.length !== 0 || fileList.length !== 0);

    const listView = useMemo(
      () => (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>
                        <TableSortLabel
                          active={
                            sortMethod === "namePos" ||
                            sortMethod === "nameRev"
                          }
                          direction={
                              sortMethod === "namePos" ? "asc" : "desc"
                          }
                          onClick={() => {
                              ChangeSortMethod(
                                sortMethod === "namePos"
                                  ? "nameRev"
                                  : "namePos"
                              );
                          }}
                        >
                            {t("name")}
                            {sortMethod === "namePos" ||
                            sortMethod === "nameRev" ? (
                              <VisuallyHidden>
                                  {sortMethod === "nameRev"
                                    ? "sorted descending"
                                    : "sorted ascending"}
                              </VisuallyHidden>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                    <TableCell>
                        <TableSortLabel
                          active={
                            sortMethod === "sizePos" ||
                            sortMethod === "sizeRes"
                          }
                          direction={
                              sortMethod === "sizePos" ? "asc" : "desc"
                          }
                          onClick={() => {
                              ChangeSortMethod(
                                sortMethod === "sizePos"
                                  ? "sizeRes"
                                  : "sizePos"
                              );
                          }}
                        >
                            {t("size")}
                            {sortMethod === "sizePos" ||
                            sortMethod === "sizeRes" ? (
                              <VisuallyHidden>
                                  {sortMethod === "sizeRes"
                                    ? "sorted descending"
                                    : "sorted ascending"}
                              </VisuallyHidden>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                    <TableCell>
                        <TableSortLabel
                          active={
                            sortMethod === "modifyTimePos" ||
                            sortMethod === "modifyTimeRev"
                          }
                          direction={
                              sortMethod === "modifyTimePos"
                                ? "asc"
                                : "desc"
                          }
                          onClick={() => {
                              ChangeSortMethod(
                                sortMethod === "modifyTimePos"
                                  ? "modifyTimeRev"
                                  : "modifyTimePos"
                              );
                          }}
                        >
                            {t("modifyTime")}
                            {sortMethod === "modifyTimePos" ||
                            sortMethod === "modifyTimeRev" ? (
                              <VisuallyHidden>
                                  {sortMethod === "modifyTimeRev"
                                    ? "sorted descending"
                                    : "sorted ascending"}
                              </VisuallyHidden>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {pathHelper.isMobile() && path !== "/" && (
                  <ObjectIcon
                    file={{
                        type: "up",
                        name: t("backToParentFolder"),
                    }}
                  />
                )}
                {dirList.map((value, index) => (
                  <ObjectIcon
                    key={value.id}
                    file={value}
                    index={startIndex + index}
                  />
                ))}
                {fileList.map((value, index) => (
                  <ObjectIcon
                    key={value.id}
                    file={value}
                    index={startIndex + dirList.length + index}
                  />
                ))}
            </TableBody>
        </Table>
      ),
      [dirList, fileList, path, sortMethod, ChangeSortMethod]
    );

    const normalView = useMemo(
      () => (
        <div>
            {dirList.length !== 0 && (
              <>
                  <TypeHeader data-clickAway={"true"} variant="body2">
                      {t("folders")}
                  </TypeHeader>
                  <GridContainer
                    data-clickAway={"true"}
                    container
                    spacing={0}
                    alignItems="flex-start"
                  >
                      {dirList.map((value, index) => (
                        <GridItem key={value.id} item>
                            <ObjectIcon
                              key={value.id}
                              file={value}
                              index={startIndex + index}
                            />
                        </GridItem>
                      ))}
                  </GridContainer>
              </>
            )}
            {fileList.length !== 0 && (
              <>
                  <TypeHeader data-clickAway={"true"} variant="body2">
                      {t("files")}
                  </TypeHeader>
                  <GridContainer
                    data-clickAway={"true"}
                    container
                    spacing={0}
                    alignItems="flex-start"
                  >
                      {fileList.map((value, index) => (
                        <GridItem key={value.id} item>
                            <ObjectIcon
                              key={value.id}
                              index={
                                startIndex + dirList.length + index
                              }
                              file={value}
                            />
                        </GridItem>
                      ))}
                  </GridContainer>
              </>
            )}
        </div>
      ),
      [dirList, fileList]
    );

    const view = viewMethod === "list" ? listView : normalView;

    return (
      <Root
        onContextMenu={contextMenu}
        onClick={ClickAway}
        className={classNames(
          {
              [Root]: viewMethod !== "list",
              [RootTable]: viewMethod === "list",
              [RootShare]: share,
          },
          UpButton
        )}
      >
          <GlobalHotKeys handlers={handlers} allowChanges keyMap={keyMap} />
          <ContextMenu share={share} />
          <ImgPreivew />
          {navigatorError && (
            <ErrorBox elevation={1}>
                <Typography variant="h5" component="h3">
                    {t("listError")}
                </Typography>
                <ErrorMsg color={"textSecondary"}>
                    {navigatorErrorMsg.message}
                </ErrorMsg>
            </ErrorBox>
          )}

          {loading && !navigatorError && (
            <Loading>
                <CircularProgress />
            </Loading>
          )}
          {!search &&
            isHomePage &&
            dirList.length === 0 &&
            fileList.length === 0 &&
            !loading &&
            !navigatorError && (
              <Nothing
                primary={t("dropFileHere")}
                secondary={t("orClickUploadButton")}
              />
            )}
          {((search &&
              dirList.length === 0 &&
              fileList.length === 0 &&
              !loading &&
              !navigatorError) ||
            (dirList.length === 0 &&
              fileList.length === 0 &&
              !loading &&
              !navigatorError &&
              !isHomePage)) && <Nothing primary={t("nothingFound")} />}
          {showView && view}
      </Root>
    );
}

