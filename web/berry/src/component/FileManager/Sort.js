import React, { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import TextRotateVerticalIcon from "@mui/icons-material/TextRotateVertical";
import { useTranslation } from "react-i18next";

const SORT_OPTIONS = [
    { value: "namePos", label: "A-Z" },
    { value: "nameRev", label: "Z-A" },
    { value: "timePos", label: "oldestUploaded" },
    { value: "timeRev", label: "newestUploaded" },
    { value: "modifyTimePos", label: "oldestModified" },
    { value: "modifyTimeRev", label: "newestModified" },
    { value: "sizePos", label: "smallest" },
    { value: "sizeRes", label: "largest" },
];

export default function Sort({ value, onChange, isSmall, inherit, className }) {
    const { t } = useTranslation("application", { keyPrefix: "fileManager.sortMethods" });

    const [anchorSort, setAnchorSort] = useState(null);
    const showSortOptions = (e) => {
        setAnchorSort(e.currentTarget);
    }

    const [sortBy, setSortBy] = useState(value || '');
    function onChangeSort(value) {
        setSortBy(value);
        onChange(value);
        setAnchorSort(null);
    }

    return (
      <>
          <IconButton
            title={t("sortMethod")}
            className={className}
            onClick={showSortOptions}
            color={inherit ? "inherit" : "default"}
          >
              <TextRotateVerticalIcon
                fontSize={isSmall ? "small" : "default"}
              />
          </IconButton>
          <Menu
            id="sort-menu"
            anchorEl={anchorSort}
            open={Boolean(anchorSort)}
            onClose={() => setAnchorSort(null)}
          >
              {
                  SORT_OPTIONS.map((option, index) => (
                    <MenuItem
                      key={index}
                      selected={option.value === sortBy}
                      onClick={() => onChangeSort(option.value)}
                    >
                        {t(option.label)}
                    </MenuItem>
                  ))
              }
          </Menu>
      </>
    );
}

export const sortMethodFuncs = {
    sizePos: (a, b) => a.size - b.size,
    sizeRes: (a, b) => b.size - a.size,
    namePos: (a, b) => {
        return a.name.localeCompare(
          b.name,
          navigator.languages[0] || navigator.language,
          { numeric: true, ignorePunctuation: true }
        );
    },
    nameRev: (a, b) => {
        return b.name.localeCompare(
          a.name,
          navigator.languages[0] || navigator.language,
          { numeric: true, ignorePunctuation: true }
        );
    },
    timePos: (a, b) => Date.parse(a.create_date) - Date.parse(b.create_date),
    timeRev: (a, b) => Date.parse(b.create_date) - Date.parse(a.create_date),
    modifyTimePos: (a, b) => Date.parse(a.date) - Date.parse(b.date),
    modifyTimeRev: (a, b) => Date.parse(b.date) - Date.parse(a.date),
};

