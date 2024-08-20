import React from "react";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { styled, alpha as fade, Tooltip, Typography, ButtonBase } from "@mui/material";
import { useSelector } from "react-redux";
import statusHelper from "../../utils/page";

const StyledButtonBase = styled(ButtonBase)(({ theme, isSelected, isActive }) => ({
    height: "50px",
    width: "100%",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxSizing: "border-box",
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    display: "flex",
    justifyContent: "left",
    alignItems: "initial",
    backgroundColor: isSelected
      ? fade(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.3 : 0.18)
      : theme.palette.background.paper,
    "&:hover": {
        backgroundColor: !isSelected && theme.palette.background.default,
        border: "1px solid #d0d0d0",
    },
    ...(isActive && {
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    }),
}));

const IconContainer = styled('div')(({ theme, isSelected }) => ({
    margin: "10px 10px 10px 16px",
    height: "30px",
    minWidth: "30px",
    backgroundColor: theme.palette.background.paper,
    borderRadius: "90%",
    paddingTop: "3px",
    color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
}));

const FolderName = styled(Typography)(({ theme, isSelected }) => ({
    marginTop: "15px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
    marginRight: "20px",
    color: isSelected
      ? theme.palette.mode === 'dark'
        ? "#fff"
        : theme.palette.primary.dark
      : theme.palette.text.secondary,
    fontWeight: isSelected ? '500' : 'normal',
}));

export default function Folder({ folder, isActive, onIconClick }) {
    const selected = useSelector((state) => state.explorer.selected);
    const isMobile = statusHelper.isMobile();
    const isSelected = selected.includes(folder);

    return (
      <StyledButtonBase
        focusRipple
        isSelected={isSelected}
        isActive={isActive}
      >
          <IconContainer
            onClick={onIconClick}
            isSelected={isSelected}
          >
              {!isSelected && <FolderIcon />}
              {isSelected && <CheckCircleRoundedIcon />}
          </IconContainer>
          <Tooltip title={folder.name} aria-label={folder.name}>
              <FolderName
                variant="body2"
                isSelected={isSelected}
              >
                  {folder.name}
              </FolderName>
          </Tooltip>
      </StyledButtonBase>
    );
}
