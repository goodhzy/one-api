import PropTypes from 'prop-types';

import { TableRow, TableCell,Button,Checkbox } from '@mui/material';

import { timestamp2string, renderQuota, isAdmin } from 'utils/common';
import Label from 'ui-component/Label';
import LogType from '../type/LogType';
import { ImageUrl } from 'utils/api';
import {  PhotoView,PhotoProvider } from 'react-photo-view';


function renderType(type) {
  const typeOption = LogType[type];
  if (typeOption) {
    return (
      <Label variant="filled" color={typeOption.color}>
        {' '}
        {typeOption.text}{' '}
      </Label>
    );
  } else {
    return (
      <Label variant="filled" color="error">
        {' '}
        未知{' '}
      </Label>
    );
  }
}

export default function LogTableRow({ item, userIsAdmin,labelId,isSelected,handleClick,handlePublish,isDisabled }) {
  return (
    <>
      <TableRow tabIndex={item.id}
                onClick={(event) => handleClick(event, item.id)}
                aria-checked={isSelected(item.id)}
      >
        <TableCell>
          <Checkbox
            checked={isSelected(item.id)}
            inputProps={{ 'aria-labelledby': labelId }}
          />
        </TableCell>
        <TableCell>{timestamp2string(item.created_at)}</TableCell>
        <TableCell>
          {item.oss_image && <PhotoProvider maskOpacity={0.2} >
            <PhotoView key='1' src={ImageUrl+item.oss_image}>
              <img alt={item.result} style={{width:'180px',height:'120px'}} src={ImageUrl+item.oss_image}/>
            </PhotoView>
          </PhotoProvider>}
        </TableCell>
        <TableCell>{item.result}</TableCell>

        {/*{userIsAdmin && <TableCell>{item.channel || ''}</TableCell>}*/}
        {userIsAdmin && (
          <TableCell>
            <Label color="default" variant="outlined">
              {item.username}
            </Label>
          </TableCell>
        )}
        {/*<TableCell>*/}
        {/*  {item.token_name && (*/}
        {/*    <Label color="default" variant="soft">*/}
        {/*      {item.token_name}*/}
        {/*    </Label>*/}
        {/*  )}*/}
        {/*</TableCell>*/}
        <TableCell>{renderType(item.type)}</TableCell>
        {/*<TableCell>*/}
        {/*  {item.model_name && (*/}
        {/*    <Label color="primary" variant="outlined">*/}
        {/*      {item.model_name}*/}
        {/*    </Label>*/}
        {/*  )}*/}
        {/*</TableCell>*/}
        {/*<TableCell>{item.prompt_tokens || ''}</TableCell>*/}
        {/*<TableCell>{item.completion_tokens || ''}</TableCell>*/}
        <TableCell>{item.quota ? renderQuota(item.quota, 6) : ''}</TableCell>
        {/*{isAdmin() && <TableCell>{item.content}</TableCell>}*/}
        <TableCell>
          <Button variant="contained" disabled={isDisabled} onClick={(event)=>{
            event.stopPropagation();
            handlePublish(item.id);
          }}>刊登</Button>
        </TableCell>
      </TableRow>
    </>
  );
}

LogTableRow.propTypes = {
  item: PropTypes.object,
  userIsAdmin: PropTypes.bool,
  handlePublish: PropTypes.func,
  isDisabled: PropTypes.bool
};
