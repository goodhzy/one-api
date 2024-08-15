import PropTypes from 'prop-types';
import { TableCell, TableHead, TableRow,Checkbox } from '@mui/material';

const LogTableHead = ({ handleCheckChange,list }) => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>
          <Checkbox
            checked={list.length > 0 && list.every((item) => item.checked)}
            indeterminate={list.length > 0 && list.some((item) => item.checked) && !list.every((item) => item.checked)}
            onChange={handleCheckChange}
          />
        </TableCell>
        <TableCell>标题</TableCell>
        <TableCell>图片</TableCell>
        {/*<TableCell>类型</TableCell>*/}
        <TableCell>sku</TableCell>
        <TableCell>数量</TableCell>
        <TableCell>操作</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default LogTableHead;

LogTableHead.propTypes = {
  handleCheckChange: PropTypes.func,
  list: PropTypes.array
};
