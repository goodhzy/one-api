import React from "react";
import Backdrop from "@mui/material/Backdrop";
import { createStyles, makeStyles } from "@mui/material/styles";
import UploadIcon from "@mui/icons-material/CloudUpload";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) =>
    createStyles({
        backdrop: {
            zIndex: theme.zIndex.drawer + 1,
            color: "#fff",
            flexDirection: "column",
        },
    })
);

export function DropFileBackground({ open }) {
    const classes = useStyles();
    const { t } = useTranslation();
    return (
        <Backdrop className={classes.backdrop} open={open}>
            <div>
                <UploadIcon style={{ fontSize: 80 }} />
            </div>
            <div>
                <Typography variant={"h4"}>
                    {t("uploader.dropFileHere")}
                </Typography>
            </div>
        </Backdrop>
    );
}
