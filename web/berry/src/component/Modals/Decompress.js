import React, { useCallback, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Box,
    Typography,
    useTheme,
    useMediaQuery
} from "@mui/material";
import { useDispatch } from "react-redux";
import { setModalsLoading, toggleSnackbar } from "../../store/explorer";
import { submitDecompressTask } from "../../store/explorer/action";
import { Trans, useTranslation } from "react-i18next";
import PathSelector from "../FileManager/PathSelector";

export default function DecompressDialog(props) {
    const { t } = useTranslation();
    const [selectedPath, setSelectedPath] = useState("");
    const [selectedPathName, setSelectedPathName] = useState("");

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
    const SubmitDecompressTask = useCallback(
      (path) => dispatch(submitDecompressTask(path)),
      [dispatch]
    );

    const setMoveTarget = (folder) => {
        const path =
          folder.path === "/"
            ? folder.path + folder.name
            : folder.path + "/" + folder.name;
        setSelectedPath(path);
        setSelectedPathName(folder.name);
    };

    const submitMove = (e) => {
        if (e != null) {
            e.preventDefault();
        }
        SetModalsLoading(true);
        SubmitDecompressTask(selectedPath)
          .then(() => {
              props.onClose();
              ToggleSnackbar(
                "top",
                "right",
                t("modals.taskCreated"),
                "success"
              );
              SetModalsLoading(false);
          })
          .catch((error) => {
              ToggleSnackbar("top", "right", error.message, "error");
              SetModalsLoading(false);
          });
    };

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
      <Dialog
        open={props.open}
        onClose={props.onClose}
        aria-labelledby="form-dialog-title"
        fullScreen={fullScreen}
      >
          <DialogTitle id="form-dialog-title">
              {t("modals.decompressTo")}
          </DialogTitle>
          <DialogContent>
              <PathSelector
                presentPath={props.presentPath}
                selected={props.selected}
                onSelect={setMoveTarget}
              />

              {selectedPath !== "" && (
                <Box sx={{ p: 2 }}>
                    <Typography>
                        <Trans
                          i18nKey="modals.decompressToDst"
                          values={{
                              name: selectedPathName,
                          }}
                          components={[<strong key={0} />]}
                        />
                    </Typography>
                </Box>
              )}
          </DialogContent>
          <DialogActions>
              <Button onClick={props.onClose}>
                  {t("cancel", { ns: "common" })}
              </Button>
              <Box sx={{ position: "relative", m: 1 }}>
                  <Button
                    onClick={submitMove}
                    color="primary"
                    disabled={selectedPath === "" || props.modalsLoading}
                  >
                      {t("ok", { ns: "common" })}
                      {props.modalsLoading && (
                        <CircularProgress
                          size={24}
                          sx={{
                              color: theme.palette.secondary.light,
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              marginTop: -12,
                              marginLeft: -12,
                          }}
                        />
                      )}
                  </Button>
              </Box>
          </DialogActions>
      </Dialog>
    );
}
