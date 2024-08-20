import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import FolderIcon from "@mui/icons-material/Folder";
import RightIcon from "@mui/icons-material/KeyboardArrowRight";
import UpIcon from "@mui/icons-material/ArrowUpward";
import { useDispatch, useSelector } from "react-redux";
import { IconButton, ListItemIcon, ListItemSecondaryAction, ListItemText, MenuItem, MenuList, Box } from "@mui/material";
import Sort, { sortMethodFuncs } from './Sort';
import API from "../../middleware/Api";
import { toggleSnackbar } from "../../store/explorer";
import { useTranslation } from "react-i18next";

const PathSelectorComponent = (props) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const search = useSelector((state) => state.explorer.search);

    const [presentPath, setPresentPath] = useState("/");
    const [sortBy, setSortBy] = useState('');
    const [dirList, setDirList] = useState([]);
    const [selectedTarget, setSelectedTarget] = useState(null);

    const sourceDirList = React.useRef([]);

    useEffect(() => {
        const toBeLoad = props.presentPath;
        enterFolder(!search ? toBeLoad : "/");
    }, [props.presentPath, search]);

    const back = () => {
        const paths = presentPath.split("/");
        paths.pop();
        const toBeLoad = paths.join("/");
        enterFolder(toBeLoad === "" ? "/" : toBeLoad);
    };

    const enterFolder = (toBeLoad) => {
        API.get(
          (props.api ? props.api : "/directory") +
          encodeURIComponent(toBeLoad)
        )
          .then((response) => {
              const dirList = response.data.objects.filter((x) => {
                  return (
                    x.type === "dir" &&
                    props.selected.findIndex((value) => {
                        return (
                          value.name === x.name && value.path === x.path
                        );
                    }) === -1
                  );
              });
              dirList.forEach((value) => {
                  value.displayName = value.name;
              });
              sourceDirList.current = dirList;
              setPresentPath(toBeLoad);
              setSelectedTarget(null);
              updateDirList();
          })
          .catch((error) => {
              dispatch(toggleSnackbar("top", "right", error.message, "warning"));
          });
    };

    const handleSelect = (index) => {
        setSelectedTarget(index);
        props.onSelect(dirList[index]);
    };

    const onChangeSort = (sortBy) => {
        setSortBy(sortBy);
        updateDirList();
    };

    const updateDirList = () => {
        const dirList = [...sourceDirList.current];
        const sortMethod = sortMethodFuncs[sortBy];
        if (sortMethod) dirList.sort(sortMethod);

        if (presentPath === "/") {
            dirList.unshift({ name: "/", path: "", displayName: "/" });
        } else {
            let path = presentPath;
            let name = presentPath;
            const displayNames = ["fileManager.currentFolder", "fileManager.backToParentFolder"];
            for (let i = 0; i < 2; i++) {
                const paths = path.split("/");
                name = paths.pop();
                name = name === "" ? "/" : name;
                path = paths.join("/");
                dirList.unshift({
                    name: name,
                    path: path,
                    displayName: t(displayNames[i]),
                });
            }
        }
        setDirList(dirList);
    };

    const showActionIcon = (index) => {
        if (presentPath === "/") {
            return index !== 0;
        }
        return index !== 1;
    };

    const actionIcon = (index) => {
        if (presentPath === "/") {
            return <RightIcon />;
        }

        if (index === 0) {
            return <UpIcon />;
        }
        return <RightIcon />;
    };

    return (
      <Box sx={{ maxHeight: "330px", overflowY: "auto" }}>
          <Box sx={{ textAlign: "right", paddingRight: "30px" }}>
              <Sort value={sortBy} isSmall sx={{ padding: 0 }} onChange={onChangeSort} />
          </Box>
          <MenuList sx={{ minWidth: "300px" }}>
              {dirList.map((value, index) => (
                <MenuItem
                  key={index}
                  selected={selectedTarget === index}
                  onClick={() => handleSelect(index)}
                  sx={{
                      backgroundColor: selectedTarget === index ? (theme) => theme.palette.primary.main : 'inherit',
                      '& .MuiListItemIcon-root': {
                          color: selectedTarget === index ? (theme) => theme.palette.common.white : 'inherit',
                      },
                  }}
                >
                    <ListItemIcon>
                        <FolderIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={value.displayName}
                      primaryTypographyProps={{ sx: { whiteSpace: "normal" } }}
                    />
                    {showActionIcon(index) && (
                      <ListItemSecondaryAction>
                          <IconButton
                            sx={{
                                color: selectedTarget === index ? (theme) => theme.palette.common.white : 'inherit',
                            }}
                            onClick={() =>
                              index === 0
                                ? back()
                                : enterFolder(
                                  value.path === "/"
                                    ? value.path + value.name
                                    : value.path + "/" + value.name
                                )
                            }
                          >
                              {actionIcon(index)}
                          </IconButton>
                      </ListItemSecondaryAction>
                    )}
                </MenuItem>
              ))}
          </MenuList>
      </Box>
    );
};

PathSelectorComponent.propTypes = {
    presentPath: PropTypes.string.isRequired,
    selected: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    api: PropTypes.string,
};

export default PathSelectorComponent;
