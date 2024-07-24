import { useState, useEffect } from 'react';
import { showError, showSuccess } from 'utils/common';
import {  Button, Container,LinearProgress,ButtonGroup,Toolbar,TableContainer,Table,TableBody } from '@mui/material';
import { IconRefresh } from '@tabler/icons-react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import AccountTableHead from './component/AccountTable/AccountTableHead';
import AccountTableRow from './component/AccountTable/AccountTableRow'
import { API } from '../../utils/api';


export default function AccountEbay() {
  const [accounts, setAccounts] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadAccounts = async () => {
    setSearching(true);
    const res = await API.get(`/api/ebay_account_list`);
    const { success, message, data } = res.data;
    if(success) {
      setAccounts(data);
    }else {
      showError(message)
    }
    setSearching(false);
  }

  const deleteAccount = async (id)=>{
    setSearching(true);
    const res = await API.post(`/api/ebay_account_delete`,{id:id});
    const { success, message } = res.data;
    if (success) {
      showSuccess('操作成功完成！');
      await loadAccounts();
    } else {
      showError(message);
    }
  }

  // 处理刷新
  const handleRefresh = async () => {
    await loadAccounts();
  };


  useEffect(() => {
    loadAccounts(0)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  }, []);

  return(
    <>
      <Toolbar
        sx={{
          textAlign: 'right',
          height: 50,
          display: 'flex',
          justifyContent: 'space-between',
          p: (theme) => theme.spacing(0, 1, 0, 3)
        }}
      >
        <Container>
          <ButtonGroup variant="outlined" aria-label="outlined small primary button group" sx={{marginBottom: 2}}>
            <Button onClick={handleRefresh} startIcon={<IconRefresh width={'18px'} />}>
              刷新
            </Button>
          </ButtonGroup>
        </Container>
      </Toolbar>
      {searching && <LinearProgress />}
      <PerfectScrollbar component="div">
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 800 }}>
            <AccountTableHead/>
            <TableBody>
              {accounts.map((row) => (
                <AccountTableRow key={row.id} item={row} deleteAccount={deleteAccount}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      </PerfectScrollbar>
    </>
  )
}