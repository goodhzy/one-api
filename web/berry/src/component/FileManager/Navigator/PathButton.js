import React, { useRef, useEffect } from "react";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MoreIcon from "@mui/icons-material/MoreHoriz";
import { Button } from "@mui/material";
import { useDrop } from "react-dnd";
import { styled } from "@mui/material/styles";
import classNames from "classnames";

const useStyles = styled((theme) => ({
    expandMore: {
        color: "#8d8d8d",
    },
    active: {
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
    button: {
        textTransform: "none",
    },
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
    const classes = useStyles();

    useEffect(() => {
        if (props.more && isActive) {
            inputRef.current?.click();
        }
        // eslint-disable-next-line
    }, [isActive]);

    return (
      <span onClick={props.onClick} ref={inputRef}>
            <Button
              ref={drop}
              className={classNames(
                {
                    [classes.active]: isActive,
                },
                classes.button
              )}
              component="span"
              title={props.title}
            >
                {props.more && <MoreIcon />}
                {!props.more && (
                  <>
                      {props.folder}
                      {props.last && <ExpandMore className={classes.expandMore} />}
                  </>
                )}
            </Button>
        </span>
    );
};

export default PathButton;
