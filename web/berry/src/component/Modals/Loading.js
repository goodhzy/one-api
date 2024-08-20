import React from "react";
import { CircularProgress, Dialog, DialogContent, DialogContentText, useTheme, Box, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { blue } from "@mui/material/colors";

export default function LoadingDialog() {
    const theme = useTheme();
    const open = useSelector((state) => state.viewUpdate.modals.loading);
    const text = useSelector((state) => state.viewUpdate.modals.loadingText);

    return (
      <Dialog aria-labelledby="simple-dialog-title" open={open}>
          <DialogContent>
              <DialogContentText
                sx={{
                    display: "flex",
                    alignItems: "center",
                    color: blue[600],
                }}
              >
                  <CircularProgress color="secondary" />
                  <Box sx={{ ml: 2 }}>
                      <Typography>{text}</Typography>
                  </Box>
              </DialogContentText>
          </DialogContent>
      </Dialog>
    );
}
