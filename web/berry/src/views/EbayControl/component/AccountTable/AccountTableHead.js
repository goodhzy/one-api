import { TableCell, TableHead, TableRow } from '@mui/material';

const UsersTableHead = () => {
  return (
    <TableHead>
      <TableRow>
        {/*<TableCell>ID</TableCell>*/}
        <TableCell>店铺名字</TableCell>
        <TableCell>操作</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default UsersTableHead;
