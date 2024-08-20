import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { baseURL } from "../../middleware/Api";
import { imgPreviewSuffix } from "../../config";
import { styled } from '@mui/material/styles';
import pathHelper from "../../utils/page";
import { PhotoSlider } from "react-photo-view";
import { showImgPreivew } from "../../store/explorer";
import * as explorer from "../../store/explorer/reducer";

const StyledDiv = styled('div')(() => ({}));

const ImagPreviewComponent = () => {
    const [items, setItems] = useState([]);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const location = useLocation();
    const dispatch = useDispatch();

    const first = useSelector((state) => state.explorer.imgPreview.first);
    const other = useSelector((state) => state.explorer.imgPreview.other);

    useEffect(() => {
        const newItems = [];
        let firstOne = 0;

        if (first.id !== "") {
            if (
              pathHelper.isSharePage(location.pathname) &&
              !first.path
            ) {
                const newImg = {
                    intro: first.name,
                    src: baseURL + "/share/preview/" + first.key,
                };
                firstOne = 0;
                newItems.push(newImg);
                setPhotoIndex(firstOne);
                setItems(newItems);
                setIsOpen(true);
                return;
            }

            other.forEach((value) => {
                const fileType = value.name.split(".").pop().toLowerCase();
                if (imgPreviewSuffix.indexOf(fileType) !== -1) {
                    let src = "";
                    if (pathHelper.isSharePage(location.pathname)) {
                        src = baseURL + "/share/preview/" + value.key;
                        src =
                          src +
                          "?path=" +
                          encodeURIComponent(
                            value.path === "/"
                              ? value.path + value.name
                              : value.path + "/" + value.name
                          );
                    } else {
                        src = baseURL + "/file/preview/" + value.id;
                    }
                    const newImg = {
                        intro: value.name,
                        src: src,
                    };
                    if (
                      value.path === first.path &&
                      value.name === first.name
                    ) {
                        firstOne = newItems.length;
                    }
                    newItems.push(newImg);
                }
            });
            setPhotoIndex(firstOne);
            setItems(newItems);
            setIsOpen(true);
        }
    }, [first, other, location.pathname]);

    const handleClose = useCallback(() => {
        dispatch(showImgPreivew(explorer.initState.imgPreview.first));
        setIsOpen(false);
    }, [dispatch]);

    return (
      <StyledDiv>
          {isOpen && (
            <PhotoSlider
              images={items}
              visible={isOpen}
              onClose={handleClose}
              index={photoIndex}
              onIndexChange={setPhotoIndex}
            />
          )}
      </StyledDiv>
    );
};

ImagPreviewComponent.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default ImagPreviewComponent;
