import React, { useEffect, useRef } from "react";
import { useDrop } from "react-dnd";
import PaginationItem from "@mui/material/PaginationItem";

export default function CustomPaginationItem(props) {
    const inputRef = useRef(null);

    const [{ canDrop, isOver }, drop] = useDrop({
        accept: "object",
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const isActive = canDrop && isOver;

    useEffect(() => {
        if (
          isActive &&
          props.onClick &&
          props.type !== "start-ellipsis" &&
          props.type !== "end-ellipsis"
        ) {
            props.onClick();
        }
    }, [isActive, props.onClick, props.type]);

    if (
      props.isMobile &&
      (props.type === "start-ellipsis" ||
        props.type === "end-ellipsis" ||
        props.type === "page")
    ) {
        if (props.selected) {
            return (
              <div>
                  {props.page} / {props.count}
              </div>
            );
        }
        return null;
    }

    return (
      <div ref={inputRef}>
          <PaginationItem ref={drop} {...props} />
      </div>
    );
}
