import React, { useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { changeSubTitle } from "../../store/viewUpdate/action";
import pathHelper from "../../utils/page";
import DragLayer from "./DnD/DragLayer";
import Explorer from "./Explorer";
import Modals from "./Modals";
import Navigator from "./Navigator/Navigator";
import SideDrawer from "./Sidebar/SideDrawer";
import classNames from "classnames";
import {
    closeAllModals,
    navigateTo,
    setSelectedTarget,
    toggleSnackbar,
} from "../../store/explorer";
import PaginationFooter from "./Pagination";
import { styled } from "@mui/material/styles";

const Root = styled('div')(({ theme, share }) => ({
    display: "flex",
    flexDirection: "column",
    height: share ? "100%" : "calc(100vh - 64px)",
    minHeight: share ? 500 : undefined,
    [theme.breakpoints.down("xs")]: {
        height: "100%",
    },
}));

const ExplorerContainer = styled('div')({
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
});

function FileManager({ share, isShare }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const image = useRef();

    useEffect(() => {
        if (pathHelper.isHomePage(location.pathname)) {
            dispatch(changeSubTitle(null));
        }

        return () => {
            dispatch(setSelectedTarget([]));
            dispatch(closeAllModals());
            navigate("/");
        };
    }, [location.pathname, dispatch, navigate]);

    return (
      <Root share={share}>
          <DndProvider backend={HTML5Backend}>
              <Modals share={share} />
              <Navigator isShare={isShare} share={share} />
              <ExplorerContainer id={"explorer-container"}>
                  <Explorer share={share} />
                  <PaginationFooter />
              </ExplorerContainer>
              <DragLayer />
          </DndProvider>
          <SideDrawer />
      </Root>
    );
}

export default FileManager;
