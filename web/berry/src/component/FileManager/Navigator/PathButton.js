import React, { useRef, useEffect } from "react";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MoreIcon from "@mui/icons-material/MoreHoriz";
import { Button } from "@mui/material";
import { useDrop } from "react-dnd";
import { styled } from "@mui/material";
import classNames from "classnames";

const StyledButton = styled(Button)(({ theme, isActive }) => ({
    textTransform: "none",
    boxShadow: isActive ? `0 0 0 2px ${theme.palette.primary.light}` : "none",
}));

const ExpandMoreIcon = styled(ExpandMore)(({ theme }) => ({
    color: "#8d8d8d",
}));

const PathButton = (props) => {
    const inputRef = useRef(null);

    const [{ canDrop, isOver }, drop] = useDrop({
        accept: "object",
        drop: () => {
            if (props.more) {
                inputRef.current?.click();
            } else {
                return {
                    folder: {
                        id: -1,
                        path: props.path,
                        name: props.folder === "/" ? "" : props.folder,
                    },
                };
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const isActive = canDrop && isOver;

    useEffect(() => {
        if (props.more && isActive) {
            inputRef.current?.click();
        }
    }, [isActive, props.more]);

    return (
      <span onClick={props.onClick} ref={inputRef}>
            <StyledButton
              ref={drop}
              isActive={isActive}
              component="span"
              title={props.title}
            >
                {props.more && <MoreIcon />}
                {!props.more && (
                  <>
                      {props.folder}
                      {props.last && <ExpandMoreIcon />}
                  </>
                )}
            </StyledButton>
        </span>
    );
};

export default PathButton;
