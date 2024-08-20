import React, { useCallback, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    AppBar,
    Tabs,
    Tab,
    TextField,
    Typography,
    FormLabel,
    ToggleButtonGroup,
    ToggleButton,
    useTheme,
    Box,
} from "@mui/material";
import { styled } from "@mui/system";
import PathSelector from "../FileManager/PathSelector";
import { useDispatch } from "react-redux";
import {
    Circle,
    CircleOutline,
    Heart,
    HeartOutline,
    Hexagon,
    HexagonOutline,
    Hexagram,
    HexagramOutline,
    Rhombus,
    RhombusOutline,
    Square,
    SquareOutline,
    Triangle,
} from "mdi-material-ui";
import { toggleSnackbar } from "../../store/explorer";
import { Trans, useTranslation } from "react-i18next";

const ContentFix = styled(Box)(({ theme }) => ({
    padding: "10px 24px 0px 24px",
}));

const Wrapper = styled(Box)(({ theme }) => ({
    margin: theme.spacing(1),
    position: "relative",
}));

const ButtonProgress = styled(CircularProgress)(({ theme }) => ({
    color: theme.palette.secondary.light,
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
}));

const DialogContentCustom = styled(DialogContent)(({ theme }) => ({
    marginTop: theme.spacing(2),
}));

const PathSelect = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(2),
    display: "flex",
}));

const icons = {
    Circle: <Circle />,
    CircleOutline: <CircleOutline />,
    Heart: <Heart />,
    HeartOutline: <HeartOutline />,
    Hexagon: <Hexagon />,
    HexagonOutline: <HexagonOutline />,
    Hexagram: <Hexagram />,
    HexagramOutline: <HexagramOutline />,
    Rhombus: <Rhombus />,
    RhombusOutline: <RhombusOutline />,
    Square: <Square />,
    SquareOutline: <SquareOutline />,
    Triangle: <Triangle />,
};

export default function AddTag(props) {
    const theme = useTheme();
    const { t } = useTranslation();

    const [value, setValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [alignment, setAlignment] = useState("Circle");
    const [color, setColor] = useState(theme.palette.text.secondary);
    const [input, setInput] = useState({
        filename: "",
        tagName: "",
        path: "/",
    });
    const [pathSelectDialog, setPathSelectDialog] = useState(false);
    const [selectedPath, setSelectedPath] = useState("");
    const [selectedPathName, setSelectedPathName] = useState("");
    const setMoveTarget = (folder) => {
        const path =
          folder.path === "/"
            ? folder.path + folder.name
            : folder.path + "/" + folder.name;
        setSelectedPath(path);
        setSelectedPathName(folder.name);
    };

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleIconChange = (event, newAlignment) => {
        if (newAlignment) {
            setAlignment(newAlignment);
        }
    };

    const handleColorChange = (event, newAlignment) => {
        if (newAlignment) {
            setColor(newAlignment);
        }
    };

    const handleInputChange = (name) => (event) => {
        setInput({
            ...input,
            [name]: event.target.value,
        });
    };

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
      (vertical, horizontal, msg, color) =>
        dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
      [dispatch]
    );

    const submitNewLink = () => {
        setLoading(true);

        API.post("/tag/link", {
            path: input.path,
            name: input.tagName,
        })
          .then((response) => {
              setLoading(false);
              props.onClose();
              props.onSuccess({
                  type: 1,
                  name: input.tagName,
                  expression: input.path,
                  color: theme.palette.text.secondary,
                  icon: "FolderHeartOutline",
                  id: response.data,
              });
          })
          .catch((error) => {
              ToggleSnackbar("top", "right", error.message, "error");
          })
          .then(() => {
              setLoading(false);
          });
    };

    const submitNewTag = () => {
        setLoading(true);

        API.post("/tag/filter", {
            expression: input.filename,
            name: input.tagName,
            color: color,
            icon: alignment,
        })
          .then((response) => {
              setLoading(false);
              props.onClose();
              props.onSuccess({
                  type: 0,
                  name: input.tagName,
                  color: color,
                  icon: alignment,
                  id: response.data,
              });
          })
          .catch((error) => {
              ToggleSnackbar("top", "right", error.message, "error");
          })
          .then(() => {
              setLoading(false);
          });
    };

    const submit = () => {
        if (value === 0) {
            submitNewTag();
        } else {
            submitNewLink();
        }
    };

    const selectPath = () => {
        setInput({
            ...input,
            path: selectedPath === "//" ? "/" : selectedPath,
        });
        setPathSelectDialog(false);
    };

    return (
      <Dialog
        open={props.open}
        onClose={props.onClose}
        aria-labelledby="form-dialog-title"
        fullWidth
      >
          <Dialog
            open={pathSelectDialog}
            onClose={() => setPathSelectDialog(false)}
            aria-labelledby="form-dialog-title"
          >
              <DialogTitle id="form-dialog-title">
                  {t("navbar.addTagDialog.selectFolder")}
              </DialogTitle>
              <PathSelector
                presentPath="/"
                selected={[]}
                onSelect={setMoveTarget}
              />

              <DialogActions>
                  <Button onClick={() => setPathSelectDialog(false)}>
                      {t("common:cancel")}
                  </Button>
                  <Button
                    onClick={selectPath}
                    color="primary"
                    disabled={selectedPath === ""}
                  >
                      {t("common:ok")}
                  </Button>
              </DialogActions>
          </Dialog>

          <AppBar position="static">
              <Tabs
                value={value}
                onChange={handleChange}
                variant="fullWidth"
                aria-label="full width tabs example"
              >
                  <Tab label={t("navbar.addTagDialog.fileSelector")} />
                  <Tab label={t("navbar.addTagDialog.folderLink")} />
              </Tabs>
          </AppBar>
          {value === 0 && (
            <DialogContentCustom>
                <TextField
                  label={t("navbar.addTagDialog.tagName")}
                  id="filled-name"
                  value={input["tagName"]}
                  onChange={handleInputChange("tagName")}
                  fullWidth
                  sx={{ marginTop: 2 }}
                />
                <TextField
                  id="filled-name"
                  label={t("navbar.addTagDialog.matchPattern")}
                  value={input["filename"]}
                  onChange={handleInputChange("filename")}
                  fullWidth
                  multiline
                  sx={{ marginTop: 2 }}
                />
                <Typography variant="caption" color={"textSecondary"}>
                    <Trans i18nKey="navbar.addTagDialog.matchPatternDescription">
                        {[<code key={0} />, <code key={1} />]}
                    </Trans>
                </Typography>
                <FormLabel sx={{ marginTop: 2, display: "block" }}>
                    {t("navbar.addTagDialog.icon")}
                </FormLabel>
                <Box sx={{ overflowX: "auto" }}>
                    <ToggleButtonGroup
                      size="small"
                      value={alignment}
                      exclusive
                      onChange={handleIconChange}
                      sx={{ marginTop: 2 }}
                    >
                        {Object.keys(icons).map((key, index) => (
                          <ToggleButton key={index} value={key}>
                              {icons[key]}
                          </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
                <FormLabel sx={{ marginTop: 2, display: "block" }}>
                    {t("navbar.addTagDialog.color")}
                </FormLabel>
                <Box sx={{ overflowX: "auto" }}>
                    <ToggleButtonGroup
                      size="small"
                      value={color}
                      exclusive
                      onChange={handleColorChange}
                      sx={{ marginTop: 2 }}
                    >
                        {[
                            theme.palette.text.secondary,
                            "#f44336",
                            "#e91e63",
                            "#9c27b0",
                            "#673ab7",
                            "#3f51b5",
                            "#2196f3",
                            "#03a9f4",
                            "#00bcd4",
                            "#009688",
                            "#4caf50",
                            "#cddc39",
                            "#ffeb3b",
                            "#ffc107",
                            "#ff9800",
                            "#ff5722",
                            "#795548",
                        ].map((key, index) => (
                          <ToggleButton key={index} value={key}>
                              <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: key,
                                }}
                              />
                          </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
            </DialogContentCustom>
          )}
          {value === 1 && (
            <DialogContentCustom>
                <TextField
                  label={t("navbar.addTagDialog.tagName")}
                  id="filled-name"
                  value={input["tagName"]}
                  onChange={handleInputChange("tagName")}
                  fullWidth
                  sx={{ marginTop: 2 }}
                />
                <PathSelect>
                    <TextField
                      id="filled-name"
                      label={t("navbar.addTagDialog.path")}
                      value={selectedPath === "" ? "/" : selectedPath}
                      fullWidth
                      InputProps={{
                          readOnly: true,
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setPathSelectDialog(true)}
                      sx={{ marginLeft: 2 }}
                    >
                        {t("common:select")}
                    </Button>
                </PathSelect>
            </DialogContentCustom>
          )}
          <DialogActions>
              <Wrapper>
                  <Button
                    onClick={submit}
                    color="primary"
                    disabled={loading}
                  >
                      {t("common:ok")}
                  </Button>
                  {loading && <ButtonProgress size={24} />}
              </Wrapper>
              <Button onClick={props.onClose} color="default">
                  {t("common:cancel")}
              </Button>
          </DialogActions>
      </Dialog>
    );
}
