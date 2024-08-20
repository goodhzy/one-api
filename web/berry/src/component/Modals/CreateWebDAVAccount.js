import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    TextField,
    IconButton,
    Tooltip,
    Typography,
    Box,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { FolderOpenOutlined, LabelOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import PathSelector from "../FileManager/PathSelector";

export default function CreateWebDAVAccount(props) {
    const { t } = useTranslation();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const [value, setValue] = useState({
        name: "",
        path: "/",
    });
    const [pathSelectDialog, setPathSelectDialog] = useState(false);
    const [selectedPath, setSelectedPath] = useState("");

    const setMoveTarget = (folder) => {
        const path =
          folder.path === "/"
            ? folder.path + folder.name
            : folder.path + "/" + folder.name;
        setSelectedPath(path);
    };

    const handleInputChange = (name) => (e) => {
        setValue({
            ...value,
            [name]: e.target.value,
        });
    };

    const selectPath = () => {
        setValue({
            ...value,
            path: selectedPath === "//" ? "/" : selectedPath,
        });
        setPathSelectDialog(false);
    };

    return (
      <>
          <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby="form-dialog-title"
            fullScreen={fullScreen}
          >
              <DialogTitle id="form-dialog-title">
                  {t("navbar.addTagDialog.createWebDAVAccount")}
              </DialogTitle>

              <Box
                sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
              >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LabelOutlined sx={{ mr: 2, color: theme.palette.text.secondary }} />
                      <TextField
                        value={value.name}
                        onChange={handleInputChange("name")}
                        label={t("setting.annotation")}
                        fullWidth
                      />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                      <FolderOpenOutlined sx={{ mr: 2, color: theme.palette.text.secondary }} />
                      <Box sx={{ flexGrow: 1 }}>
                          <TextField
                            value={value.path}
                            onChange={handleInputChange("path")}
                            label={t("setting.rootFolder")}
                            fullWidth
                          />
                          <Box mt={1}>
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => setPathSelectDialog(true)}
                              >
                                  {t("navbar.addTagDialog.selectFolder")}
                              </Button>
                          </Box>
                      </Box>
                  </Box>
              </Box>

              <DialogActions>
                  <Button onClick={props.onClose}>
                      {t("cancel", { ns: "common" })}
                  </Button>
                  <Button
                    disabled={value.path === "" || value.name === ""}
                    color="primary"
                    onClick={() => props.callback(value)}
                  >
                      {t("ok", { ns: "common" })}
                  </Button>
              </DialogActions>
          </Dialog>

          <Dialog
            open={pathSelectDialog}
            onClose={() => setPathSelectDialog(false)}
            aria-labelledby="select-folder-dialog"
            fullScreen={fullScreen}
          >
              <DialogTitle id="select-folder-dialog">
                  {t("navbar.addTagDialog.selectFolder")}
              </DialogTitle>
              <PathSelector
                presentPath="/"
                selected={[]}
                onSelect={setMoveTarget}
              />
              <DialogActions>
                  <Button onClick={() => setPathSelectDialog(false)}>
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
