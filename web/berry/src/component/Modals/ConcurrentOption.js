import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import Auth from "../../middleware/Auth";
import { useTranslation } from "react-i18next";

export default function ConcurrentOptionDialog({ open, onClose, onSave }) {
    const { t } = useTranslation();
    const [count, setCount] = useState(
      Auth.GetPreferenceWithDefault("concurrent_limit", "5")
    );

    return (
      <Dialog
        fullWidth
        maxWidth="xs"
        open={open}
        onClose={onClose}
        aria-labelledby="form-dialog-title"
      >
          <DialogTitle id="form-dialog-title">
              {t("uploader.setConcurrent")}
          </DialogTitle>

          <DialogContent>
              <TextField
                fullWidth
                label={t("uploader.concurrentTaskNumber")}
                type="number"
                inputProps={{
                    min: 1,
                    step: 1,
                    max: 20,
                }}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
          </DialogContent>

          <DialogActions>
              <Button onClick={onClose}>
                  {t("cancel", { ns: "common" })}
              </Button>
              <Button
                color="primary"
                disabled={count === ""}
                onClick={() => onSave(count)}
              >
                  {t("ok", { ns: "common" })}
              </Button>
          </DialogActions>
      </Dialog>
    );
}
