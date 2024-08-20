import React, { useEffect, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormGroup,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Box
} from "@mui/material";
import { Virtuoso } from "react-virtuoso";
import { useTranslation } from "react-i18next";

export default function SelectFileDialog(props) {
    const { t } = useTranslation();
    const [files, setFiles] = useState(props.files);

    useEffect(() => {
        setFiles(props.files);
    }, [props.files]);

    const handleChange = (index) => (event) => {
        const filesCopy = [...files];
        filesCopy.forEach((file) => {
            if (file.index === index) {
                file.selected = event.target.checked ? "true" : "false";
            }
        });
        setFiles(filesCopy);
    };

    const submit = () => {
        const selectedIndexes = files
          .filter((file) => file.selected === "true")
          .map((file) => parseInt(file.index));
        props.onSubmit(selectedIndexes);
    };

    return (
      <Dialog
        open={props.open}
        onClose={props.onClose}
        aria-labelledby="form-dialog-title"
        fullWidth
      >
          <DialogTitle id="form-dialog-title">
              {t("download.selectDownloadingFile")}
          </DialogTitle>
          <DialogContent dividers sx={{ padding: '0' }}>
              <Virtuoso
                style={{ height: 'calc(100vh - 200px)' }}
                data={files}
                itemContent={(index, file) => (
                  <MenuItem key={index}>
                      <FormGroup row>
                          <FormControlLabel
                            control={
                                <Checkbox
                                  onChange={handleChange(file.index)}
                                  checked={file.selected === "true"}
                                  value="checkedA"
                                />
                            }
                            label={file.path}
                          />
                      </FormGroup>
                  </MenuItem>
                )}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={props.onClose}>
                  {t("cancel", { ns: "common" })}
              </Button>
              <Box sx={{ position: 'relative', margin: 1 }}>
                  <Button
                    color="primary"
                    onClick={submit}
                    disabled={props.modalsLoading}
                  >
                      {t("ok", { ns: "common" })}
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
    );
}
