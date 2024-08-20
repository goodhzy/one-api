import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { styled } from '@mui/material/styles';
import { ButtonBase, Divider, Tooltip, Typography, Grow } from "@mui/material";
import classNames from "classnames";
import PropTypes from "prop-types";
import ContentLoader from "react-content-loader";
import { LazyLoadImage } from "react-lazy-load-image-component";
import TypeIcon from "./TypeIcon";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FileName from "./FileName";
import { alpha } from '@mui/material/styles';
import pathHelper from "../../utils/page";
import statusHelper from "../../utils/page";
import { baseURL } from "../../middleware/Api";

// 替代 withStyles
const styles = (theme) => ({
    container: {},

    selected: {
        "&:hover": {
            border: "1px solid #d0d0d0",
        },
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.mode === "dark" ? 0.3 : 0.18
        ),
    },

    notSelected: {
        "&:hover": {
            backgroundColor: theme.palette.background.default,
            border: "1px solid #d0d0d0",
        },
        backgroundColor: theme.palette.background.paper,
    },

    button: {
        border: "1px solid " + theme.palette.divider,
        width: "100%",
        borderRadius: theme.shape.borderRadius,
        boxSizing: "border-box",
        transition:
          "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        alignItems: "initial",
        display: "initial",
    },
    folderNameSelected: {
        color:
          theme.palette.mode === "dark" ? "#fff" : theme.palette.primary.dark,
        fontWeight: "500",
    },
    folderNameNotSelected: {
        color: theme.palette.text.secondary,
    },
    folderName: {
        marginTop: "15px",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden",
        marginRight: "20px",
    },
    preview: {
        overflow: "hidden",
        height: "150px",
        width: "100%",
        borderRadius: "12px 12px 0 0",
        backgroundColor: theme.palette.background.default,
    },
    previewIcon: {
        overflow: "hidden",
        height: "149px",
        width: "100%",
        borderRadius: "12px 12px 0 0",
        backgroundColor: theme.palette.background.paper,
        paddingTop: "50px",
    },
    iconBig: {
        fontSize: 50,
    },
    picPreview: {
        objectFit: "cover",
        width: "100%",
        height: "100%",
    },
    fileInfo: {
        height: "50px",
        display: "flex",
    },
    icon: {
        margin: "10px 10px 10px 16px",
        height: "30px",
        minWidth: "30px",
        backgroundColor: theme.palette.background.paper,
        borderRadius: "90%",
        paddingTop: "3px",
        color: theme.palette.text.secondary,
    },
    hide: {
        display: "none",
    },
    loadingAnimation: {
        borderRadius: "12px 12px 0 0",
        height: "100%",
        width: "100%",
    },
    shareFix: {
        marginLeft: "20px",
    },
    checkIcon: {
        color: theme.palette.primary.main,
    },
    noDrag: {
        userDrag: "none",
    },
});

const StyledFileIcon = styled('div')(({ theme }) => ({
    ...styles(theme),
}));

const FileIconComponent = ({ file, onIconClick, share }) => {
    const [loading, setLoading] = useState(false);
    const [showPicIcon, setShowPicIcon] = useState(false);
    const location = useLocation();
    const selected = useSelector((state) => state.explorer.selected);
    const shareInfo = useSelector((state) => state.viewUpdate.shareInfo);

    const isSelected = useMemo(
      () => selected.findIndex((value) => value === file) !== -1,
      [selected, file]
    );

    const isSharePage = pathHelper.isSharePage(location.pathname);
    const isMobile = statusHelper.isMobile();

    return (
      <StyledFileIcon>
          <ButtonBase
            focusRipple
            className={classNames(
              {
                  [styles.selected]: isSelected,
                  [styles.notSelected]: !isSelected,
              },
              styles.button
            )}
          >
              {file.thumb && !showPicIcon && (
                <div className={styles.preview}>
                    <LazyLoadImage
                      className={classNames(
                        {
                            [styles.hide]: loading,
                            [styles.picPreview]: !loading,
                        },
                        styles.noDrag
                      )}
                      src={
                        baseURL +
                        (isSharePage && shareInfo
                          ? "/share/thumb/" +
                          shareInfo.key +
                          "/" +
                          file.id +
                          "?path=" +
                          encodeURIComponent(file.path)
                          : "/file/thumb/" + file.id)
                      }
                      afterLoad={() => setLoading(false)}
                      beforeLoad={() => setLoading(true)}
                      onError={() => setShowPicIcon(true)}
                    />
                    <ContentLoader
                      height={150}
                      width={170}
                      className={classNames(
                        {
                            [styles.hide]: !loading,
                        },
                        styles.loadingAnimation
                      )}
                    >
                        <rect x="0" y="0" width="100%" height="150" />
                    </ContentLoader>
                </div>
              )}
              {(!file.thumb || showPicIcon) && (
                <div className={styles.previewIcon}>
                    <TypeIcon className={styles.iconBig} fileName={file.name} />
                </div>
              )}
              {(!file.thumb || showPicIcon) && <Divider />}
              <div className={styles.fileInfo}>
                  {!share && (
                    <div
                      onClick={onIconClick}
                      className={classNames(styles.icon, {
                          [styles.iconSelected]: isSelected,
                          [styles.iconNotSelected]: !isSelected,
                      })}
                    >
                        {!isSelected && <TypeIcon fileName={file.name} />}
                        {isSelected && (
                          <Grow in={isSelected}>
                              <CheckCircleRoundedIcon className={styles.checkIcon} />
                          </Grow>
                        )}
                    </div>
                  )}
                  <Tooltip
                    title={file.name}
                    aria-label={file.name}
                  >
                      <Typography
                        variant="body2"
                        className={classNames(styles.folderName, {
                            [styles.folderNameSelected]: isSelected,
                            [styles.folderNameNotSelected]: !isSelected,
                            [styles.shareFix]: share,
                        })}
                      >
                          <FileName name={file.name} />
                      </Typography>
                  </Tooltip>
              </div>
          </ButtonBase>
      </StyledFileIcon>
    );
};

FileIconComponent.propTypes = {
    file: PropTypes.object.isRequired,
    onIconClick: PropTypes.func,
    share: PropTypes.bool,
};

export default FileIconComponent;
