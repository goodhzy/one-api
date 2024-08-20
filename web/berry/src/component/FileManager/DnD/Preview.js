import React from "react";
import SmallIcon from "../SmallIcon";
import FileIcon from "../FileIcon";
import { useSelector } from "react-redux";
import { styled } from "@mui/material";
import Folder from "../Folder";

const DraggingContainer = styled('div')({
    width: "200px",
});

const CardDraggedContainer = styled('div')({
    position: "absolute",
    transformOrigin: "bottom left",
});

const diliverIcon = (object, viewMethod) => {
    if (object.type === "dir") {
        return (
          <DraggingContainer>
              <SmallIcon file={object} isFolder />
          </DraggingContainer>
        );
    }
    if (object.type === "file" && viewMethod === "icon") {
        return (
          <DraggingContainer>
              <FileIcon file={object} />
          </DraggingContainer>
        );
    }
    if (
      (object.type === "file" && viewMethod === "smallIcon") ||
      viewMethod === "list"
    ) {
        return (
          <DraggingContainer>
              <SmallIcon file={object} />
          </DraggingContainer>
        );
    }
};

const Preview = (props) => {
    const selected = useSelector((state) => state.explorer.selected);
    const viewMethod = useSelector(
      (state) => state.viewUpdate.explorerViewMethod
    );

    return (
      <>
          {selected.length === 0 &&
            diliverIcon(props.object, viewMethod)}
          {selected.length > 0 && (
            <>
                {selected.slice(0, 3).map((card, i) => (
                  <CardDraggedContainer
                    key={card.id}
                    style={{
                        zIndex: selected.length - i,
                        transform: `rotateZ(${-i * 2.5}deg)`,
                    }}
                  >
                      {diliverIcon(card, viewMethod)}
                  </CardDraggedContainer>
                ))}
            </>
          )}
      </>
    );
};

export default Preview;
