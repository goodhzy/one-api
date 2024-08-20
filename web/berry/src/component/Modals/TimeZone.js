import React, { useCallback, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    TextField,
    Box,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
    refreshTimeZone,
    timeZone,
    validateTimeZone,
} from "../../utils/datetime";
import Auth from "../../middleware/Auth";
import { toggleSnackbar } from "../../store/explorer";

export default function TimeZoneDialog(props) {
    const { t } = useTranslation();
    const [timeZoneValue, setTimeZoneValue] = useState(timeZone);
    const dispatch = useDispatch();

    const ToggleSnackbar = useCallback(
      (vertical, horizontal, msg, color) =>
        dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
      [dispatch]
    );

    const saveZoneInfo = () => {
        if (!validateTimeZone(timeZoneValue)) {
            ToggleSnackbar("top", "right", "无效的时区名称", "warning");
            return;
        }
        Auth.SetPreference("timeZone", timeZoneValue);
        refreshTimeZone();
        props.onClose();
    };

    return (
      <Dialog
        open={props.open}
        onClose={props.onClose}
        aria-labelledby="form-dialog-title"
        fullWidth
      >
          <DialogTitle id="form-dialog-title">
              {t("setting.timeZone")}
          </DialogTitle>

          <DialogContent>
              <FormControl fullWidth>
                  <TextField
                    label={t("setting.timeZoneCode")}
                    value={timeZoneValue}
                    onChange={(e) => setTimeZoneValue(e.target.value)}
                    variant="outlined"
                  />
              </FormControl>
          </DialogContent>

          <DialogActions>
              <Button onClick={props.onClose}>
                  {t("cancel", { ns: "common" })}
              </Button>
              <Box sx={{ position: 'relative', margin: 1 }}>
                  <Button
                    color="primary"
                    disabled={timeZoneValue === ""}
                    onClick={saveZoneInfo}
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
