import Highlighter from "react-highlight-words";
import { trimPrefix } from "../Uploader/core/utils";
import React from "react";
import { useSelector } from "react-redux";
import { styled } from '@mui/material/styles';

// 创建一个高亮样式的组件
const HighlightedText = styled('span')(({ theme }) => ({
    backgroundColor: theme.palette.warning.light,
}));

export default function FileName({ name }) {
    const search = useSelector((state) => state.explorer.search);
    if (!search) {
        return name;
    }

    return (
      <Highlighter
        highlightClassName={HighlightedText} // 使用styled组件
        searchWords={trimPrefix(search.keywords, "keywords/").split(" ")}
        autoEscape={true}
        textToHighlight={name}
      />
    );
}
