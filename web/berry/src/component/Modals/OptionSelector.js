import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box
} from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function OptionSelector() {
    const { t } = useTranslation("common");
    const option = useSelector((state) => state.viewUpdate.modals.option);

    return (
      <Dialog
        open={!!option?.open}
        onClose={option?.onClose}
        aria-labelledby="form-dialog-title"
        fullWidth
        maxWidth="sm"
      >
          <DialogTitle id="form-dialog-title">
              {option?.title}
          </DialogTitle>
          <DialogContent dividers sx={{ minWidth: 250 }}>
              <List component="nav" aria-label="main mailbox folders">
                  {option?.options.map((o) => (
                    <ListItem
                      key={o.key}
                      onClick={() => option?.callback(o)}
                      button
                    >
                        <ListItemText
                          primary={o.name}
                          secondary={o.description}
                        />
                    </ListItem>
                  ))}
              </List>
          </DialogContent>
          <DialogActions>
              <Button onClick={option?.onClose}>
                  {t("cancel")}
              </Button>
          </DialogActions>
      </Dialog>
    );
}
