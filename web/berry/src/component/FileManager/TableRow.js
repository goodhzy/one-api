import React, { memo } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import FolderIcon from "@mui/icons-material/Folder";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { styled, alpha as fade, Typography, TableCell, TableRow, Grow } from "@mui/material";
import TypeIcon from "./TypeIcon";
import FileName from "./FileName";
import { sizeToString } from "../../utils/index";
import pathHelper from "../../utils/page";
import statusHelper from "../../utils/page";
import { formatLocalTime } from "../../utils/datetime";

const StyledTableRow = styled(TableRow)(({ theme, isSelected, isShare, isActive }) => ({
  backgroundColor: isSelected
    ? isShare
      ? fade(theme.palette.primary.main, 0.18)
      : fade(theme.palette.primary.main, 0.18)
    : 'inherit',
  '&:hover': {
    backgroundColor: !isSelected && theme.palette.action.hover,
  },
  ...(isActive && {
    backgroundColor: fade(theme.palette.primary.main, 0.1),
  }),
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '10px 16px',
}));

const IconContainer = styled('div')(({ theme, isSelected }) => ({
  marginRight: '20px',
  verticalAlign: 'middle',
  color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
}));

const FolderName = styled(Typography)(({ theme, isSelected }) => ({
  marginRight: '20px',
  display: 'flex',
  alignItems: 'center',
  color: isSelected
    ? theme.palette.mode === 'dark'
      ? '#fff'
      : theme.palette.primary.dark
    : theme.palette.text.secondary,
  userSelect: 'none',
}));

const HideAuto = styled(Typography)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const TableRowComponent = ({
                             file,
                             handleClick,
                             handleDoubleClick,
                             contextMenu,
                             onIconClick,
                             isActive,
                             pref,
                             dref,
                           }) => {
  const location = useLocation();
  const selected = useSelector((state) => state.explorer.selected);

  const isShare = pathHelper.isSharePage(location.pathname);

  let icon;
  if (file.type === "dir") {
    icon = <FolderIcon />;
  } else if (file.type === "up") {
    icon = <KeyboardReturnIcon />;
  } else {
    icon = <TypeIcon fileName={file.name} />;
  }

  const isSelected = selected.includes(file);
  const isMobile = statusHelper.isMobile();

  return (
    <StyledTableRow
      ref={pref}
      onContextMenu={contextMenu}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      isSelected={isSelected}
      isShare={isShare}
      isActive={isActive}
    >
      <StyledTableCell ref={dref} component="th" scope="row">
        <FolderName variant="body2" isSelected={isSelected}>
          <IconContainer onClick={file.type !== "up" ? onIconClick : null} isSelected={isSelected}>
            {!isSelected && icon}
            {isSelected && (
              <Grow in={isSelected}>
                <CheckCircleRoundedIcon />
              </Grow>
            )}
          </IconContainer>
          <FileName name={file.name} />
        </FolderName>
      </StyledTableCell>
      <StyledTableCell>
        <HideAuto variant="body2">
          {file.type !== "dir" && file.type !== "up" && sizeToString(file.size)}
        </HideAuto>
      </StyledTableCell>
      <StyledTableCell>
        <HideAuto variant="body2">
          {formatLocalTime(file.date)}
        </HideAuto>
      </StyledTableCell>
    </StyledTableRow>
  );
};

TableRowComponent.propTypes = {
  file: PropTypes.object.isRequired,
  handleClick: PropTypes.func.isRequired,
  handleDoubleClick: PropTypes.func.isRequired,
  contextMenu: PropTypes.func.isRequired,
  onIconClick: PropTypes.func,
  isActive: PropTypes.bool,
  pref: PropTypes.object,
  dref: PropTypes.object,
};

export default memo(TableRowComponent);
