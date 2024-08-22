import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import RightIcon from '@mui/icons-material/KeyboardArrowRight';
import ShareIcon from '@mui/icons-material/Share';
import NewFolderIcon from '@mui/icons-material/CreateNewFolder';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Divider, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import PathButton from './PathButton';
import DropDown from './DropDown';
import pathHelper from '../../../utils/page';
import Auth from '../../../middleware/Auth';
import { Archive } from '@mui/icons-material';
import { FilePlus } from 'mdi-material-ui';
import SubActions from './SubActions';
import {
  drawerToggleAction,
  navigateTo,
  navigateUp,
  openCompressDialog,
  openCreateFileDialog,
  openCreateFolderDialog,
  openShareDialog,
  refreshFileList,
  setCurrentPolicy,
  setNavigatorError,
  setNavigatorLoadingStatus,
  setSelectedTarget,
  updateFileList
} from '../../../store/explorer';
import { list } from '../../../services/navigate';
import { useTranslation } from 'react-i18next';
import { fixUrlHash, setGetParameter } from '../../../utils';


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const NavigatorComponent = (props) => {
  const {
    path,
    isShare,
    handleDesktopToggle,
    refresh,
    search,
    setNavigatorError,
    updateFileList,
    setNavigatorLoadingStatus,
    setCurrentPolicy,
    refreshFileList,
    setSelectedTarget,
    openCreateFolderDialog,
    openCreateFileDialog,
    openShareDialog,
    openCompressDialog,
    drawerDesktopOpen,
    navigateToPath
  } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [state, setState] = useState({
    hidden: false,
    hiddenFolders: [],
    folders: [],
    anchorEl: null,
    hiddenMode: false,
    anchorHidden: null
  });

  const element = useRef(null);
  const currentID = useRef(0);
  const searchRef = useRef(undefined);

  useEffect(() => {
    const url = new URL(fixUrlHash(window.location.href));
    const c = url.searchParams.get('path');
    renderPath(c === null ? '/' : c);

    if (!isShare) {
      handleDesktopToggle(true);
    }

    // Handle back navigation
    const handlePopState = () => {
      const url = new URL(fixUrlHash(window.location.href));
      const c = url.searchParams.get('path');
      if (c !== null) {
        navigateToPath(c);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isShare, handleDesktopToggle, navigateToPath]);

  useEffect(() => {
    if (path !== props.path) {
      renderPath(path);
    }
    if (refresh !== props.refresh) {
      refreshFileList();
    }
  }, [path, refresh, props.path, props.refresh, refreshFileList]);

  useEffect(() => {
    checkOverFlow(true);
  }, [state.folders]);

  useEffect(() => {
    delay(500).then(() => checkOverFlow());
  }, [drawerDesktopOpen]);

  const renderPath = (path = null) => {
    setNavigatorError(false, null);
    setState((prevState) => ({
      ...prevState,
      folders: path !== null ? path.substr(1).split('/') : path.substr(1).split('/')
    }));
    const newPath = path !== null ? path : path;
    list(newPath, props.share, searchRef.current ? searchRef.current.keywords : '', searchRef.current ? searchRef.current.searchPath : '')
      .then((response) => {
        currentID.current = response.data.parent;
        updateFileList(response.data.objects);
        setNavigatorLoadingStatus(false);
        if (!searchRef.current) {
          setGetParameter('path', encodeURIComponent(newPath));
        }
        if (response.data.policy) {
          setCurrentPolicy({
            id: response.data.policy.id,
            name: response.data.policy.name,
            type: response.data.policy.type,
            maxSize: response.data.policy.max_size,
            allowedSuffix: response.data.policy.file_type
          });
        }
      })
      .catch((error) => {
        setNavigatorError(true, error);
      });

    checkOverFlow(true);
  };
  let overflowInitLock = false;
  const checkOverFlow = (force) => {
    if (overflowInitLock && !force) {
      return;
    }
    if (element.current !== null) {
      const hasOverflowingChildren =
        element.current.offsetHeight < element.current.scrollHeight || element.current.offsetWidth < element.current.scrollWidth;
      if (hasOverflowingChildren) {
        overflowInitLock = true;
        setState((prevState) => ({ ...prevState, hiddenMode: true }));
      }
      if (!hasOverflowingChildren && state.hiddenMode) {
        setState((prevState) => ({ ...prevState, hiddenMode: false }));
      }
    }
  };

  const navigateTo = (event, id) => {
    if (id === state.folders.length - 1) {
      // Last path
      setState((prevState) => ({ ...prevState, anchorEl: event.currentTarget }));
    } else if (id === -1 && state.folders.length === 1 && state.folders[0] === '') {
      refreshFileList();
      handleClose();
    } else if (id === -1) {
      navigateToPath('/');
      handleClose();
    } else {
      navigateToPath('/' + state.folders.slice(0, id + 1).join('/'));
      handleClose();
    }
  };

  const handleClose = () => {
    setState((prevState) => ({ ...prevState, anchorEl: null, anchorHidden: null }));
  };

  const showHiddenPath = (e) => {
    setState((prevState) => ({ ...prevState, anchorHidden: e.currentTarget }));
  };

  const performAction = (e) => {
    handleClose();
    if (e === 'refresh') {
      refresh();
      return;
    }
    const presentPath = path.split('/');
    const newTarget = [
      {
        id: currentID.current,
        type: 'dir',
        name: presentPath.pop(),
        path: presentPath.length === 1 ? '/' : presentPath.join('/')
      }
    ];

    switch (e) {
      case 'share':
        setSelectedTarget(newTarget);
        openShareDialog();
        break;
      case 'newfolder':
        openCreateFolderDialog();
        break;
      case 'compress':
        setSelectedTarget(newTarget);
        openCompressDialog();
        break;
      case 'newFile':
        openCreateFileDialog();
        break;
      default:
        break;
    }
  };

  const presentFolderMenu = (
    <Menu id="presentFolderMenu" anchorEl={state.anchorEl} open={Boolean(state.anchorEl)} onClose={handleClose} disableAutoFocusItem>
      <MenuItem onClick={() => performAction('refresh')}>
        <ListItemIcon>
          <RefreshIcon />
        </ListItemIcon>
        {t('fileManager.refresh')}
      </MenuItem>
      {!search && pathHelper.isHomePage(location.pathname) && (
        <>
          <Divider />
          <MenuItem onClick={() => performAction('share')}>
            <ListItemIcon>
              <ShareIcon />
            </ListItemIcon>
            {t('fileManager.share')}
          </MenuItem>
          {Auth.GetUser().group.compress && (
            <MenuItem onClick={() => performAction('compress')}>
              <ListItemIcon>
                <Archive />
              </ListItemIcon>
              {t('fileManager.compress')}
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={() => performAction('newfolder')}>
            <ListItemIcon>
              <NewFolderIcon />
            </ListItemIcon>
            {t('fileManager.newFolder')}
          </MenuItem>
          <MenuItem onClick={() => performAction('newFile')}>
            <ListItemIcon>
              <FilePlus />
            </ListItemIcon>
            {t('fileManager.newFile')}
          </MenuItem>
        </>
      )}
    </Menu>
  );

  return (
    <Box sx={{ display: { xs: 'none', sm: 'flex' }, backgroundColor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ height: '48px', padding: '5px 15px', display: 'flex' }} ref={element}>
          <Typography variant="body2">
            <PathButton folder="/" path="/" onClick={(e) => navigateTo(e, -1)} />
            <RightIcon sx={{ marginTop: '6px', verticalAlign: 'top', color: '#868686' }} />
          </Typography>
          {state.hiddenMode && (
            <Typography variant="body2">
              <PathButton more title={t('fileManager.showFullPath')} onClick={showHiddenPath} />
              <Menu
                id="hiddenPathMenu"
                anchorEl={state.anchorHidden}
                open={Boolean(state.anchorHidden)}
                onClose={handleClose}
                disableAutoFocusItem
              >
                <DropDown onClose={handleClose} folders={state.folders.slice(0, -1)} navigateTo={navigateTo} />
              </Menu>
              <RightIcon sx={{ marginTop: '6px', verticalAlign: 'top', color: '#868686' }} />
              <PathButton
                folder={state.folders.slice(-1)}
                path={'/' + state.folders.slice(0, -1).join('/')}
                last
                onClick={(e) => navigateTo(e, state.folders.length - 1)}
              />
              {presentFolderMenu}
            </Typography>
          )}
          {!state.hiddenMode &&
            state.folders.map((folder, id, folders) => (
              <Typography variant="body2" key={id}>
                {folder !== '' && (
                  <>
                    <PathButton
                      folder={folder}
                      path={'/' + folders.slice(0, id).join('/')}
                      last={id === folders.length - 1}
                      onClick={(e) => navigateTo(e, id)}
                    />
                    {id === folders.length - 1 && presentFolderMenu}
                    {id !== folders.length - 1 && <RightIcon sx={{ marginTop: '6px', verticalAlign: 'top', color: '#868686' }} />}
                  </>
                )}
              </Typography>
            ))}
        </Box>
        <Box sx={{ paddingTop: '6px', marginRight: '10px' }}>
          <SubActions isSmall />
        </Box>
      </Box>
      <Divider />
    </Box>
  );
};

NavigatorComponent.propTypes = {
  path: PropTypes.string.isRequired,
  isShare: PropTypes.bool.isRequired,
  handleDesktopToggle: PropTypes.func.isRequired,
  refresh: PropTypes.bool.isRequired,
  search: PropTypes.object,
  setNavigatorError: PropTypes.func.isRequired,
  updateFileList: PropTypes.func.isRequired,
  setNavigatorLoadingStatus: PropTypes.func.isRequired,
  setCurrentPolicy: PropTypes.func.isRequired,
  refreshFileList: PropTypes.func.isRequired,
  setSelectedTarget: PropTypes.func.isRequired,
  openCreateFolderDialog: PropTypes.func.isRequired,
  openCreateFileDialog: PropTypes.func.isRequired,
  openShareDialog: PropTypes.func.isRequired,
  openCompressDialog: PropTypes.func.isRequired,
  drawerDesktopOpen: PropTypes.bool.isRequired,
  navigateToPath: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  path: state.navigator.path,
  refresh: state.navigator.refresh,
  drawerDesktopOpen: state.viewUpdate.open,
  viewMethod: state.viewUpdate.explorerViewMethod,
  search: state.explorer.search,
  sortMethod: state.viewUpdate.sortMethod
});

const mapDispatchToProps = {
  navigateToPath: navigateTo,
  navigateUp,
  setNavigatorError,
  updateFileList,
  setNavigatorLoadingStatus,
  refreshFileList,
  setSelectedTarget,
  openCreateFolderDialog,
  openCreateFileDialog,
  openShareDialog,
  openCompressDialog,
  handleDesktopToggle: drawerToggleAction,
  setCurrentPolicy
};

export default connect(mapStateToProps, mapDispatchToProps)(NavigatorComponent);
