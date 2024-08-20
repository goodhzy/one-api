import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import { Clear, Folder } from "@mui/icons-material";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import API from "../../../middleware/Api";
import { filename, sizeToString } from "../../../utils";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import TimeAgo from "timeago-react";
import ListLoading from "../../Placeholder/ListLoading";
import Hidden from "@mui/material/Hidden";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import AppBar from "@mui/material/AppBar";
import { formatLocalTime } from "../../../utils/datetime";
import { navigateTo, toggleSnackbar } from "../../../store/explorer";
import { Trans, useTranslation } from "react-i18next";
import { styled } from "@mui/system";
import { setSideBar } from '../../../store/explorer/action';
import TypeIcon from '../TypeIcon';

const drawerWidth = 350;

const DrawerContainer = styled(Box)(({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    boxShadow: "0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)",
}));

const Header = styled(Box)(({ theme }) => ({
    display: "flex",
    padding: theme.spacing(3),
    placeContent: "space-between",
}));

const FileIcon = styled("div")(({ theme }) => ({
    width: 33,
    height: 33,
}));

const FileIconSVG = styled("div")(({ theme }) => ({
    fontSize: 20,
}));

const FolderIcon = styled(Folder)(({ theme }) => ({
    color: theme.palette.text.secondary,
    width: 33,
    height: 33,
}));

const FileName = styled(Box)(({ theme }) => ({
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    wordBreak: "break-all",
    flexGrow: 2,
}));

const CloseIcon = styled(IconButton)(({ theme }) => ({
    placeSelf: "flex-start",
    marginTop: 2,
}));

const PropsContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
}));

const PropsLabel = styled(Box)(({ theme }) => ({
    color: theme.palette.text.secondary,
    padding: theme.spacing(1),
}));

const PropsTime = styled(Box)(({ theme }) => ({
    color: theme.palette.text.disabled,
    padding: theme.spacing(1),
}));

const PropsValue = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    wordBreak: "break-all",
}));

const AppBarStyled = styled(AppBar)(({ theme }) => ({
    position: "relative",
}));

const Title = styled(Typography)(({ theme }) => ({
    marginLeft: theme.spacing(2),
    flex: 1,
}));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function SideDrawer() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const sideBarOpen = useSelector((state) => state.explorer.sideBarOpen);
    const selected = useSelector((state) => state.explorer.selected);
    const SetSideBar = useCallback((open) => dispatch(setSideBar(open)), [dispatch]);
    const ToggleSnackbar = useCallback((vertical, horizontal, msg, color) => dispatch(toggleSnackbar(vertical, horizontal, msg, color)), [dispatch]);
    const NavigateTo = useCallback((k) => dispatch(navigateTo(k)), [dispatch]);
    const search = useSelector((state) => state.explorer.search);
    const [target, setTarget] = useState(null);
    const [details, setDetails] = useState(null);

    const loadProps = (object) => {
        API.get(`/object/property/${object.id}?trace_root=${search ? "true" : "false"}&is_folder=${object.type === "dir"}`)
          .then((response) => {
              setDetails(response.data);
          })
          .catch((error) => {
              ToggleSnackbar("top", "right", error.message, "error");
          });
    };

    useEffect(() => {
        setDetails(null);
        if (sideBarOpen) {
            if (selected.length !== 1) {
                SetSideBar(false);
            } else {
                setTarget(selected[0]);
                loadProps(selected[0]);
            }
        }
    }, [selected, sideBarOpen]);

    const propsItem = [
        {
            label: t("fileManager.size"),
            value: (d) => sizeToString(d.size) + t("fileManager.bytes", { bytes: d.size.toLocaleString() }),
            show: (d) => true,
        },
        {
            label: t("fileManager.storagePolicy"),
            value: (d) => d.policy,
            show: (d) => d.type === "file",
        },
        {
            label: t("fileManager.childFolders"),
            value: (d) => t("fileManager.childCount", { num: d.child_folder_num.toLocaleString() }),
            show: (d) => d.type === "dir",
        },
        {
            label: t("fileManager.childFiles"),
            value: (d) => t("fileManager.childCount", { num: d.child_file_num.toLocaleString() }),
            show: (d) => d.type === "dir",
        },
        {
            label: t("fileManager.parentFolder"),
            value: (d) => {
                const path = d.path === "" ? target.path : d.path;
                const name = filename(path);
                return (
                  <Tooltip title={path}>
                      <Link href="javascript:void(0)" onClick={() => NavigateTo(path)}>
                          {name === "" ? t("fileManager.rootFolder") : name}
                      </Link>
                  </Tooltip>
                );
            },
            show: (d) => true,
        },
        {
            label: t("fileManager.modifiedAt"),
            value: (d) => formatLocalTime(d.updated_at),
            show: (d) => true,
        },
        {
            label: t("fileManager.createdAt"),
            value: (d) => formatLocalTime(d.created_at),
            show: (d) => true,
        },
    ];

    const content = (
      <Grid container>
          {!details && <ListLoading />}
          {details && (
            <PropsContainer>
                {propsItem.map((item) => {
                    if (item.show(target)) {
                        return (
                          <React.Fragment key={item.label}>
                              <Grid item xs={5} className={PropsLabel}>
                                  {item.label}
                              </Grid>
                              <Grid item xs={7} className={PropsValue}>
                                  {item.value(details, target)}
                              </Grid>
                          </React.Fragment>
                        );
                    }
                    return null;
                })}
                {target.type === "dir" && (
                  <Grid item xs={12} className={PropsTime}>
                      <Trans
                        i18nKey="fileManager.statisticAt"
                        components={[
                            <span key={0} />,
                            <TimeAgo
                              key={1}
                              datetime={details.query_date}
                              locale={t("timeAgoLocaleCode", { ns: "common" })}
                            />,
                            <span key={2} />,
                        ]}
                      />
                  </Grid>
                )}
            </PropsContainer>
          )}
      </Grid>
    );

    return (
      <>
          <Hidden smUp>
              <Dialog
                fullScreen
                open={sideBarOpen}
                TransitionComponent={Transition}
              >
                  {target && (
                    <>
                        <AppBarStyled>
                            <Toolbar>
                                <IconButton
                                  edge="start"
                                  color="inherit"
                                  onClick={() => SetSideBar(false)}
                                  aria-label="close"
                                >
                                    <Clear />
                                </IconButton>
                                <Title variant="h6">
                                    {target.name}
                                </Title>
                            </Toolbar>
                        </AppBarStyled>
                        {content}
                    </>
                  )}
              </Dialog>
          </Hidden>
          <Hidden xsDown>
              <Drawer
                variant="persistent"
                open={sideBarOpen}
                anchor="right"
                sx={{ width: drawerWidth, flexShrink: 0 }}
                PaperProps={{
                    sx: {
                        width: drawerWidth,
                        boxShadow: "0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)",
                    },
                }}
              >
                  <Toolbar />
                  <DrawerContainer>
                      {target && (
                        <>
                            <Header>
                                {target.type === "dir" ? (
                                  <FolderIcon />
                                ) : (
                                  <FileIcon>
                                      <TypeIcon
                                        isUpload
                                        className={FileIconSVG}
                                        fileName={target.name}
                                      />
                                  </FileIcon>
                                )}
                                <FileName>
                                    <Typography variant="h6" gutterBottom>
                                        {target.name}
                                    </Typography>
                                </FileName>
                                <CloseIcon
                                  onClick={() => SetSideBar(false)}
                                  aria-label="close"
                                  size="small"
                                >
                                    <Clear />
                                </CloseIcon>
                            </Header>
                            <Divider />
                            {content}
                        </>
                      )}
                  </DrawerContainer>
              </Drawer>
          </Hidden>
      </>
    );
}
