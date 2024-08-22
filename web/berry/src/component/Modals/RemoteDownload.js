import React, { useCallback, useEffect, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    InputAdornment,
    IconButton,
    Box
} from "@mui/material";
import PathSelector from "../FileManager/PathSelector";
import { useDispatch } from "react-redux";
import API, { AppError } from "../../middleware/Api";
import {
    refreshFileList,
    setModalsLoading,
    toggleSnackbar,
} from "../../store/explorer";
import { Trans, useTranslation } from "react-i18next";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import LinkIcon from "@mui/icons-material/Link";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { pathBack } from "../../utils";
export default function RemoteDownload(props) {
    const { t } = useTranslation();
    const [selectPathOpen, setSelectPathOpen] = useState(false);
    const [selectedPath, setSelectedPath] = useState("");
    const [selectedPathName, setSelectedPathName] = useState("");
    const [downloadTo, setDownloadTo] = useState("");
    const [url, setUrl] = useState("");
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (props.open) {
            setDownloadTo(props.presentPath);
        }
    }, [props.open, props.presentPath]);

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
      (vertical, horizontal, msg, color) =>
        dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
      [dispatch]
    );
    const SetModalsLoading = useCallback(
      (status) => {
          dispatch(setModalsLoading(status));
      },
      [dispatch]
    );

    const setDownloadToPath = (folder) => {
        const path =
          folder.path === "/"
            ? folder.path + folder.name
            : folder.path + "/" + folder.name;
        setSelectedPath(path);
        setSelectedPathName(folder.name);
    };

    const selectPath = () => {
        setDownloadTo(selectedPath === "//" ? "/" : selectedPath);
        setSelectPathOpen(false);
    };

    const submitTorrentDownload = (e) => {
        e.preventDefault();
        props.setModalsLoading(true);
        API.post("/aria2/torrent/" + props.torrent.id, {
            dst: downloadTo === "//" ? "/" : downloadTo,
        })
          .then(() => {
              ToggleSnackbar(
                "top",
                "right",
                t("modals.taskCreated"),
                "success"
              );
              props.onClose();
              props.setModalsLoading(false);
          })
          .catch((error) => {
              ToggleSnackbar(
                "top",
                "right",
                error.message,
                "error"
              );
              props.setModalsLoading(false);
          });
    };

    const submitDownload = (e) => {
        e.preventDefault();
        props.setModalsLoading(true);
        API.post("/aria2/url", {
            url: url.split("\n"),
            dst: downloadTo === "//" ? "/" : downloadTo,
        })
          .then((response) => {
              const failed = response.data
                .filter((r) => r.code !== 0)
                .map((r) => new AppError(r.msg, r.code, r.error).message);
              if (failed.length > 0) {
                  ToggleSnackbar(
                    "top",
                    "right",
                    t("modals.taskCreateFailed", {
                        failed: failed.length,
                        details: failed.join(","),
                    }),
                    "warning"
                  );
              } else {
                  ToggleSnackbar(
                    "top",
                    "right",
                    t("modals.taskCreated"),
                    "success"
                  );
              }

              props.onClose();
              props.setModalsLoading(false);
          })
          .catch((error) => {
              ToggleSnackbar(
                "top",
                "right",
                error.message,
                "error"
              );
              props.setModalsLoading(false);
          });
    };

    return (
      <>
          <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby="form-dialog-title"
            fullWidth
          >
              <DialogTitle id="form-dialog-title">
                  {t("modals.newRemoteDownloadTitle")}
              </DialogTitle>
              <DialogContent>
                  <DialogContentText>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            variant="outlined"
                            label={t("modals.remoteDownloadURL")}
                            autoFocus
                            fullWidth
                            disabled={props.torrent}
                            multiline
                            value={props.torrent ? props.torrent.name : url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={t("modals.remoteDownloadURLDescription")}
                            InputProps={{
                                startAdornment: !isMobile && (
                                  <InputAdornment position="start">
                                      <LinkIcon />
                                  </InputAdornment>
                                ),
                            }}
                          />
                          <TextField
                            variant="outlined"
                            fullWidth
                            value={downloadTo}
                            onChange={(e) => setDownloadTo(e.target.value)}
                            label={t("modals.remoteDownloadDst")}
                            InputProps={{
                                startAdornment: !isMobile && (
                                  <InputAdornment position="start">
                                      <FolderOpenOutlinedIcon />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                      <Button
                                        color="primary"
                                        onClick={() => setSelectPathOpen(true)}
                                      >
                                          {t("navbar.addTagDialog.selectFolder")}
                                      </Button>
                                  </InputAdornment>
                                ),
                            }}
                          />
                      </Box>
                  </DialogContentText>
              </DialogContent>
              <DialogActions>
                  <Button onClick={props.onClose}>
                      {t("cancel", { ns: "common" })}
                  </Button>
                  <Box sx={{ position: 'relative' }}>
                      <Button
                        onClick={props.torrent ? submitTorrentDownload : submitDownload}
                        color="primary"
                        disabled={(url === "" && props.torrent === null) || downloadTo === "" || props.modalsLoading}
                      >
                          {t("modals.createTask")}
                          {props.modalsLoading && (
                            <CircularProgress
                              size={24}
                              sx={{
                                  color: (theme) => theme.palette.secondary.light,
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  marginTop: -12,
                                  marginLeft: -12,
                              }}
                            />
                          )}
                      </Button>
                  </Box>
              </DialogActions>
          </Dialog>

          <Dialog
            open={selectPathOpen}
            onClose={() => setSelectPathOpen(false)}
            aria-labelledby="form-dialog-title"
          >
              <DialogTitle id="form-dialog-title">
                  {t("modals.remoteDownloadDst")}
              </DialogTitle>

              <PathSelector
                presentPath={pathBack(props.presentPath)}
                selected={[]}
                onSelect={setDownloadToPath}
              />
              {selectedPathName !== "" && (
                <DialogContent sx={{ padding: '10px 24px 0px 24px' }}>
                    <DialogContentText>
                        <Trans
                          i18nKey="modals.downloadTo"
                          values={{ name: selectedPathName }}
                          components={[<strong key={0} />]}
                        />
                    </DialogContentText>
                </DialogContent>
              )}
              <DialogActions>
                  <Button onClick={() => setSelectPathOpen(false)}>
                      {t("cancel", { ns: "common" })}
                  </Button>
                  <Button
                    onClick={selectPath}
                    color="primary"
                    disabled={selectedPath === ""}
                  >
                      {t("ok", { ns: "common" })}
                  </Button>
              </DialogActions>
          </Dialog>
      </>
    );
}
