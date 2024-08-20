import React, { useCallback, useState } from "react";
import { IconButton, Menu, MenuItem, Avatar, styled } from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewSmallIcon from "@mui/icons-material/ViewComfy";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import DownloadIcon from "@mui/icons-material/CloudDownload";
import { useDispatch, useSelector } from "react-redux";
import Auth from "../../../middleware/Auth";
import { changeViewMethod, setShareUserPopover } from "../../../store/explorer";
import { changeSortMethod, startBatchDownload } from "../../../store/explorer/action";
import pathHelper from "../../../utils/page";
import { changePageSize } from "../../../store/viewUpdate/action";
import { useTranslation } from "react-i18next";
import Sort from "../Sort";

// Define styles using styled utility
const SideButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(1),
    marginRight: theme.spacing(1),
}));

const paginationOptions = ["50", "100", "200", "500", "1000"];

const SubActions = ({ isSmall, inherit }) => {
    const { t } = useTranslation("application", { keyPrefix: "fileManager" });
    const { t: vasT } = useTranslation("application", { keyPrefix: "vas" });
    const dispatch = useDispatch();
    const viewMethod = useSelector(state => state.viewUpdate.explorerViewMethod);
    const share = useSelector(state => state.viewUpdate.shareInfo);
    const pageSize = useSelector(state => state.viewUpdate.pagination.size);

    const [anchorPagination, setAnchorPagination] = useState(null);

    const openLoadingDialog = useCallback((method) => dispatch(changeViewMethod(method)), [dispatch]);
    const changeSortMethod = useCallback((method) => dispatch(changeSortMethod(method)), [dispatch]);
    const setShareUserPopover = useCallback((e) => dispatch(setShareUserPopover(e)), [dispatch]);
    const startBatchDownloadAll = useCallback(() => dispatch(startBatchDownload(share)), [dispatch, share]);
    const changePageSize = useCallback((size) => dispatch(changePageSize(size)), [dispatch]);

    const showPaginationOptions = (e) => setAnchorPagination(e.currentTarget);

    const handlePaginationChange = (size) => {
        changePageSize(size);
        setAnchorPagination(null);
    };

    const toggleViewMethod = () => {
        const newMethod =
          viewMethod === "icon"
            ? "list"
            : viewMethod === "list"
              ? "smallIcon"
              : "icon";
        Auth.SetPreference("view_method", newMethod);
        openLoadingDialog(newMethod);
    };

    const isMobile = pathHelper.isMobile();

    return (
      <>
          <SideButton
            title={t("batchDownload")}
            onClick={startBatchDownloadAll}
            color={inherit ? "inherit" : "default"}
          >
              <DownloadIcon fontSize={isSmall ? "small" : "default"} />
          </SideButton>

          {viewMethod === "icon" && (
            <SideButton
              title={t("listView")}
              onClick={toggleViewMethod}
              color={inherit ? "inherit" : "default"}
            >
                <ViewListIcon fontSize={isSmall ? "small" : "default"} />
            </SideButton>
          )}
          {viewMethod === "list" && (
            <SideButton
              title={t("gridViewSmall")}
              onClick={toggleViewMethod}
              color={inherit ? "inherit" : "default"}
            >
                <ViewSmallIcon fontSize={isSmall ? "small" : "default"} />
            </SideButton>
          )}
          {viewMethod === "smallIcon" && (
            <SideButton
              title={t("gridViewLarge")}
              onClick={toggleViewMethod}
              color={inherit ? "inherit" : "default"}
            >
                <ViewModuleIcon fontSize={isSmall ? "small" : "default"} />
            </SideButton>
          )}

          {!isMobile && (
            <SideButton
              title={t("paginationSize")}
              onClick={showPaginationOptions}
              color={inherit ? "inherit" : "default"}
            >
                <ViewListIcon fontSize={isSmall ? "small" : "default"} />
            </SideButton>
          )}

          <Menu
            id="pagination-menu"
            anchorEl={anchorPagination}
            open={Boolean(anchorPagination)}
            onClose={() => setAnchorPagination(null)}
          >
              {paginationOptions.map((option) => (
                <MenuItem
                  key={option}
                  selected={option === pageSize.toString()}
                  onClick={() => handlePaginationChange(parseInt(option))}
                >
                    {t("paginationOption", { option })}
                </MenuItem>
              ))}
              <MenuItem
                selected={pageSize === -1}
                onClick={() => handlePaginationChange(-1)}
              >
                  {t("noPagination")}
              </MenuItem>
          </Menu>

          <Sort
            isSmall={isSmall}
            inherit={inherit}
            onChange={changeSortMethod}
          />
          {share && (
            <SideButton
              title={t("shareCreateBy", { nick: share.creator.nick })}
              onClick={(e) => setShareUserPopover(e.currentTarget)}
            >
                <Avatar
                  sx={{ height: 23, width: 23 }}
                  src={`/api/v3/user/avatar/${share.creator.key}/s`}
                />
            </SideButton>
          )}
      </>
    );
};

export default SubActions;
