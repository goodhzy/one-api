import React, { useCallback, useRef } from "react";
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Input,
    TextField,
    List,
    ListItemText,
    ListItem,
    ListItemIcon,
    IconButton,
    InputAdornment,
    Tooltip,
    MenuItem,
    Select,
    Divider,
    Typography,
    OutlinedInput,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import { toggleSnackbar } from "../../store/explorer";
import { useDispatch } from "react-redux";
import { Lock, Timer, Casino, Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { API } from '../../utils/api';

const CreateShare = (props) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const ToggleSnackbar = useCallback(
      (vertical, horizontal, msg, color) =>
        dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
      [dispatch]
    );

    const lastSubmit = useRef(null);
    const [expanded, setExpanded] = React.useState(false);
    const [shareURL, setShareURL] = React.useState("");
    const [values, setValues] = React.useState({
        password: "",
        downloads: 1,
        expires: 24 * 3600,
        showPassword: false,
    });
    const [shareOption, setShareOption] = React.useState({
        password: false,
        expire: false,
        preview: true,
    });
    const [customExpires, setCustomExpires] = React.useState(3600);
    const [customDownloads, setCustomDownloads] = React.useState(10);

    const handleChange = (prop) => (event) => {
        if (prop === "password") {
            setShareOption({ ...shareOption, password: event.target.value !== "" });
        }

        setValues({ ...values, [prop]: event.target.value });
    };

    const handleClickShowPassword = () => {
        setValues({ ...values, showPassword: !values.showPassword });
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const randomPassword = () => {
        setShareOption({ ...shareOption, password: true });
        setValues({
            ...values,
            password: Math.random().toString(36).substr(2, 6),
            showPassword: true,
        });
    };

    const handleExpand = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleCheck = (prop) => () => {
        if (!shareOption[prop]) {
            handleExpand(prop)(null, true);
        }
        if (prop === "password" && shareOption[prop]) {
            setValues({ ...values, password: "" });
        }
        setShareOption({ ...shareOption, [prop]: !shareOption[prop] });
    };

    const onClose = () => {
        props.onClose();
        setTimeout(() => {
            setShareURL("");
        }, 500);
    };

    const senLink = () => {
        if (navigator.share) {
            let text = t("modals.shareLinkShareContent", {
                name: props.selected[0].name,
                link: shareURL,
            });
            if (lastSubmit.current && lastSubmit.current.password) {
                text += t("modals.shareLinkPasswordInfo", {
                    password: lastSubmit.current.password,
                });
            }
            navigator.share({ text });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareURL);
            ToggleSnackbar("top", "right", t("modals.linkCopied"), "info");
        }
    };

    const submitShare = (e) => {
        e.preventDefault();
        props.setModalsLoading(true);
        const submitFormBody = {
            id: props.selected[0].id,
            is_dir: props.selected[0].type === "dir",
            password: values.password,
            downloads: shareOption.expire
              ? values.downloads === -1
                ? parseInt(customDownloads)
                : values.downloads
              : -1,
            expire:
              values.expires === -1
                ? parseInt(customExpires)
                : values.expires,
            preview: shareOption.preview,
        };
        lastSubmit.current = submitFormBody;

        API.post("/share", submitFormBody)
          .then((response) => {
              setShareURL(response.data);
              setValues({
                  password: "",
                  downloads: 1,
                  expires: 24 * 3600,
                  showPassword: false,
              });
              setShareOption({
                  password: false,
                  expire: false,
              });
              props.setModalsLoading(false);
          })
          .catch((error) => {
              ToggleSnackbar("top", "right", error.message, "error");
              props.setModalsLoading(false);
          });
    };

    const handleFocus = (event) => event.target.select();

    return (
      <Dialog
        open={props.open}
        onClose={onClose}
        aria-labelledby="form-dialog-title"
        maxWidth="xs"
        fullWidth
      >
          <DialogTitle id="form-dialog-title">
              {t("modals.createShareLink")}
          </DialogTitle>

          {shareURL === "" && (
            <>
                <Divider />
                <List>
                    <Accordion
                      expanded={expanded === "password"}
                      onChange={handleExpand("password")}
                    >
                        <AccordionSummary>
                            <ListItem button>
                                <ListItemIcon>
                                    <Lock />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t("modals.usePasswordProtection")}
                                />
                                <Checkbox
                                  checked={shareOption.password}
                                  onChange={handleCheck("password")}
                                />
                            </ListItem>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormControl variant="outlined" fullWidth>
                                <OutlinedInput
                                  fullWidth
                                  id="outlined-adornment-password"
                                  type={values.showPassword ? "text" : "password"}
                                  value={values.password}
                                  onChange={handleChange("password")}
                                  endAdornment={
                                      <InputAdornment position="end">
                                          <Tooltip
                                            title={t("modals.randomlyGenerate")}
                                          >
                                              <IconButton
                                                aria-label="generate random password"
                                                onClick={randomPassword}
                                                edge="end"
                                              >
                                                  <Casino />
                                              </IconButton>
                                          </Tooltip>
                                          <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                          >
                                              {values.showPassword ? <Visibility /> : <VisibilityOff />}
                                          </IconButton>
                                      </InputAdornment>
                                  }
                                  label="Password"
                                />
                            </FormControl>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion
                      expanded={expanded === "expire"}
                      onChange={handleExpand("expire")}
                    >
                        <AccordionSummary>
                            <ListItem button>
                                <ListItemIcon>
                                    <Timer />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t("modals.expireAutomatically")}
                                />
                                <Checkbox
                                  checked={shareOption.expire}
                                  onChange={handleCheck("expire")}
                                />
                            </ListItem>
                        </AccordionSummary>
                        <AccordionDetails sx={{ display: "flex", alignItems: "center" }}>
                            <FormControl sx={{ marginRight: 1 }}>
                                {values.downloads >= 0 && (
                                  <Select
                                    value={values.downloads}
                                    onChange={handleChange("downloads")}
                                  >
                                      {[1, 2, 3, 4, 5, 20, 50, 100].map((v) => (
                                        <MenuItem value={v} key={v}>
                                            {t("modals.downloadLimitOptions", { num: v })}
                                        </MenuItem>
                                      ))}
                                      <MenuItem value={-1}>
                                          <em>{t("modals.custom")}</em>
                                      </MenuItem>
                                  </Select>
                                )}
                                {values.downloads === -1 && (
                                  <Input
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={customDownloads}
                                    onChange={(e) => setCustomDownloads(e.target.value)}
                                    endAdornment={
                                        <InputAdornment position="start">
                                            {t("modals.downloads")}
                                        </InputAdornment>
                                    }
                                  />
                                )}
                            </FormControl>
                            <Typography sx={{ whiteSpace: "nowrap" }}>
                                {t("modals.or")}
                            </Typography>
                            <FormControl sx={{ marginX: 1 }}>
                                {values.expires >= 0 && (
                                  <Select
                                    value={values.expires}
                                    onChange={handleChange("expires")}
                                  >
                                      <MenuItem value={300}>{t("modals.5minutes")}</MenuItem>
                                      <MenuItem value={3600}>{t("modals.hour")}</MenuItem>
                                      <MenuItem value={3600 * 24}>{t("modals.day")}</MenuItem>
                                      <MenuItem value={3600 * 24 * 7}>{t("modals.week")}</MenuItem>
                                      <MenuItem value={-1}>
                                          <em>{t("modals.custom")}</em>
                                      </MenuItem>
                                  </Select>
                                )}
                                {values.expires === -1 && (
                                  <Input
                                    type="number"
                                    inputProps={{ min: 60 }}
                                    value={customExpires}
                                    onChange={(e) => setCustomExpires(e.target.value)}
                                    endAdornment={
                                        <InputAdornment position="start">
                                            {t("modals.seconds")}
                                        </InputAdornment>
                                    }
                                  />
                                )}
                            </FormControl>
                        </AccordionDetails>
                    </Accordion>
                </List>
            </>
          )}
          <DialogActions>
              <Button onClick={onClose} color="secondary">
                  {t("modals.cancel")}
              </Button>
              {shareURL === "" ? (
                <Button
                  onClick={submitShare}
                  color="primary"
                  variant="contained"
                  disabled={props.loading}
                >
                    {props.loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      t("modals.createLink")
                    )}
                </Button>
              ) : (
                <Button
                  onClick={senLink}
                  color="primary"
                  variant="contained"
                >
                    {t("modals.shareLink")}
                </Button>
              )}
          </DialogActions>
      </Dialog>
    );
};

export default CreateShare;
