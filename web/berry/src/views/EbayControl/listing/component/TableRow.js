import PropTypes from 'prop-types';

import { TableRow, TableCell, Button, Checkbox, Link } from '@mui/material';

import { PhotoView, PhotoProvider } from 'react-photo-view';
import { ListingStatus } from '../../../../constants/Ebay';

export default function LogTableRow({ item, isDisabled, searchKeyword, handleItemCheckChange, handleAction }) {
  return (
    <>
      <TableRow>
        <TableCell>
          <Checkbox checked={item.checked ?? false} onChange={(event) => handleItemCheckChange(event, item.ItemID)} />
        </TableCell>

        <TableCell>{item.Title}</TableCell>
        <TableCell>
          {item?.PictureDetails?.GalleryURL && (
            <PhotoProvider maskOpacity={0.2}>
              <PhotoView key="1" src={item?.PictureDetails?.GalleryURL || ''}>
                <img alt={item.result} style={{ width: '140px', height: 'auto' }} src={item?.PictureDetails?.GalleryURL || ''} />
              </PhotoView>
            </PhotoProvider>
          )}
        </TableCell>
        {/*<TableCell>{item.ListingType}</TableCell>*/}
        <TableCell>{item.SKU}</TableCell>
        <TableCell>{item.Quantity}</TableCell>

        <TableCell style={{ minWidth: '80px' }}>
          <Link onClick={(event) => {
            event.stopPropagation();
            handleAction([item.ItemID]);
          }} underline="none" style={{cursor: 'pointer'}}>{item.operationType === ListingStatus.ActiveList ? '下架' : '重新上架'}</Link>
        </TableCell>
      </TableRow>
    </>
  );
}

LogTableRow.propTypes = {
  item: PropTypes.object,
  userIsAdmin: PropTypes.bool,
  handlePublish: PropTypes.func,
  isDisabled: PropTypes.bool,
  handleClick: PropTypes.func
};
