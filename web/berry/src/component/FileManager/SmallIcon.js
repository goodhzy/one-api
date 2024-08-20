import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { ButtonBase, Tooltip, Typography, Grow } from "@mui/material";
import { Folder } from "@mui/icons-material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TypeIcon from "./TypeIcon";
import FileName from "./FileName";
import { styled } from '@mui/material/styles';
import { alpha as fade } from "@mui/material/styles";

// 使用styled创建一个新的组件来代替withStyles
const StyledButtonBase = styled(ButtonBase)(({ theme, isSelected }) => ({
    padding: '7px',
    height: '50px',
    width: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxSizing: 'border-box',
    transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    display: 'flex',
    justifyContent: 'left',
    alignItems: 'initial',
    backgroundColor: isSelected
      ? fade(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.18)
      : theme.palette.background.paper,
    '&:hover': {
        border: '1px solid #d0d0d0',
        backgroundColor: isSelected ? fade(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.18) : theme.palette.background.default,
    },
}));

const StyledIcon = styled('div')(({ theme, isSelected }) => ({
    margin: '10px 10px 10px 16px',
    height: '30px',
    minWidth: '30px',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '90%',
    paddingTop: '3px',
    color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
}));

const StyledFolderName = styled(Typography)(({ theme, isSelected }) => ({
    marginTop: '15px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginRight: '20px',
    color: isSelected ? (theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.dark) : theme.palette.text.secondary,
}));

class SmallIconCompoment extends Component {
    state = {};

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const isSelectedCurrent = this.props.selected.includes(this.props.file);
        const isSelectedNext = nextProps.selected.includes(this.props.file);
        return nextProps.selected !== this.props.selected || isSelectedCurrent !== isSelectedNext;
    }

    render() {
        const { file, selected, isFolder, onIconClick } = this.props;
        const isSelected = selected.includes(file);

        return (
          <StyledButtonBase
            focusRipple
            isSelected={isSelected}
            onClick={onIconClick}
          >
              <StyledIcon isSelected={isSelected}>
                  {!isSelected && (
                    <>
                        {isFolder ? <Folder /> : <TypeIcon fileName={file.name} />}
                    </>
                  )}
                  {isSelected && (
                    <Grow in={isSelected}>
                        <CheckCircleRoundedIcon />
                    </Grow>
                  )}
              </StyledIcon>
              <Tooltip title={file.name} aria-label={file.name}>
                  <StyledFolderName variant="body2" isSelected={isSelected}>
                      <FileName name={file.name} />
                  </StyledFolderName>
              </Tooltip>
          </StyledButtonBase>
        );
    }
}

SmallIconCompoment.propTypes = {
    file: PropTypes.object.isRequired,
    selected: PropTypes.array.isRequired,
    onIconClick: PropTypes.func,
    isFolder: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    selected: state.explorer.selected,
});

export default connect(mapStateToProps)(SmallIconCompoment);
