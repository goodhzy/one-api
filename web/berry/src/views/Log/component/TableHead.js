import PropTypes from 'prop-types';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { isAdmin } from '../../../utils/common';

const LogTableHead = ({ userIsAdmin }) => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>时间</TableCell>
        <TableCell>卡片</TableCell>
        <TableCell>标题</TableCell>
        {/*{userIsAdmin && <TableCell>渠道</TableCell>}*/}
        {userIsAdmin && <TableCell>用户</TableCell>}
        {/*<TableCell>令牌</TableCell>*/}
        <TableCell>类型</TableCell>
        {/*<TableCell>模型</TableCell>*/}
        {/*<TableCell>提示</TableCell>*/}
        {/*<TableCell>补全</TableCell>*/}
        <TableCell>额度</TableCell>
        {/*{isAdmin() && <TableCell>详情</TableCell>}*/}
        <TableCell>操作</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default LogTableHead;

LogTableHead.propTypes = {
  userIsAdmin: PropTypes.bool
};
