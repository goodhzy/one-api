import PropTypes from 'prop-types';
import { useState } from 'react';

import {
  Popover,
  TableRow,
  MenuItem,
  TableCell,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
  Stack, Link, Checkbox
} from '@mui/material';
import TableSwitch from 'ui-component/Switch';
import { IconDotsVertical, IconEdit, IconTrash, IconUser } from '@tabler/icons-react';
import UsersTableRow from '../../../User/component/TableRow';
import EditEbayGoods from '../EditEbayGoods';
import {PhotoProvider, PhotoView} from "react-photo-view";
import { API, ImageUrl } from 'utils/api';
import { showError, showSuccess } from '../../../../utils/common';
import { width } from '@mui/system';

export default function PublishTableRow({item,setModalGoodsId, setSearching, LoadGoodsList, handleItemCheckChange}){
  const [statusSwitch, setStatusSwitch] = useState(item.status);
  const [open, setOpen] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [editEbayGoodsOpen,setEditEbayGoodsOpen] = useState(false);

  const handleStatus = async () => {
    const switchVlue = statusSwitch === 1 ? 2 : 1;
    // const { success } = await manageUser(item.username, 'status', switchVlue);
    // if (success) {
    //   setStatusSwitch(switchVlue);
    // }
  };

  const handleDeleteOpen = () => {
    handleCloseMenu();
    setOpenDelete(true);
  };

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleDeleteClose = () => {
    setOpenDelete(false);
  };

  const handleDelete = async () => {
    try {
      const res = await API.get(`/api/ebay_delete_goods?id=`+item.id);
      const { success, message } = res.data;
      if (success) {
        showSuccess('操作成功完成！');
        LoadGoodsList(0);
        handleDeleteClose();
      } else {
        showError(message);
      }
    }finally {
      setSearching(false);
    }
  };

  const  handlePublish = async () => {
    try {
      const res = await API.post(`/api/ebay_publish_goods_batch`,{
        ids: [item.id]
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess('操作成功完成！');
        LoadGoodsList(0);
      } else {
        showError(message);
      }
    }finally {
      setSearching(false);
    }
  }

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>
          <Checkbox checked={item.checked ?? false} onChange={(event) => handleItemCheckChange(event, item.id)} />
        </TableCell>
        <TableCell>
          <PhotoProvider maskOpacity={0.2}>
            <PhotoView key={item.id} src={ImageUrl + item.composite_image}>
              <img alt="" style={{ width: '180px', height: '120px' }} src={ImageUrl + item.composite_image} />
            </PhotoView>
          </PhotoProvider>
        </TableCell>

        <TableCell>{item.sku ?? '无'}</TableCell>

        <TableCell>{item.marketplaceId ?? '无'}</TableCell>

        <TableCell>{item.title}</TableCell>

        {/*<TableCell>*/}
        {/*  <TableSwitch id={`switch-${item.id}`} checked={statusSwitch === 1} onChange={handleStatus} />*/}
        {/*</TableCell>*/}

        <TableCell style={{ width: '100px' }}>
          <Link onClick={handlePublish}>刊登</Link>
          <IconButton onClick={handleOpenMenu} sx={{ color: 'rgb(99, 115, 129)' }}>
            <IconDotsVertical />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 140 }
        }}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setEditEbayGoodsOpen(true);
          }}
        >
          <IconEdit style={{ marginRight: '16px' }} />
          编辑
        </MenuItem>
        <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
          <IconTrash style={{ marginRight: '16px' }} />
          删除
        </MenuItem>
      </Popover>

      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>删除商品</DialogTitle>
        <DialogContent>
          <DialogContentText>是否删除商品 {item.name}？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>关闭</Button>
          <Button onClick={handleDelete} sx={{ color: 'error.main' }} autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      <EditEbayGoods open={editEbayGoodsOpen} setOpen={setEditEbayGoodsOpen} goodsId={item.id} />
    </>
  );
}

UsersTableRow.propTypes = {
  item: PropTypes.object,
  handleOpenModal: PropTypes.func,
  setModalGoodsId: PropTypes.func
};