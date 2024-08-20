import React, { useEffect } from "react";
import { styled } from "@mui/material/styles";
import FolderIcon from "@mui/icons-material/Folder";
import { MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { useDrop } from "react-dnd";
import classNames from "classnames";

// Using styled utility for custom styles
const StyledMenuItem = styled(MenuItem)(({ theme, isActive }) => ({
    border: isActive ? `2px solid ${theme.palette.primary.light}` : 'none',
}));

const DropDownItem = (props) => {
    const [{ canDrop, isOver }, drop] = useDrop({
        accept: "object",
        drop: () => {
            console.log({
                folder: {
                    id: -1,
                    path: props.path,
                    name: props.folder === "/" ? "" : props.folder,
                },
            });
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const isActive = canDrop && isOver;

    useEffect(() => {
        props.setActiveStatus(props.id, isActive);
        // eslint-disable-next-line
    }, [isActive]);

    return (
      <StyledMenuItem
        ref={drop}
        isActive={isActive}
        onClick={(e) => props.navigateTo(e, props.id)}
      >
          <ListItemIcon>
              <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={props.folder} />
      </StyledMenuItem>
    );
};

export default DropDownItem;
