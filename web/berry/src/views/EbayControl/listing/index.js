import { API } from '../../../utils/api';
import { showError, showInfo, showSuccess } from '../../../utils/common';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Container,
  LinearProgress,
  Table, TableBody,
  TableContainer,
  Toolbar
} from '@mui/material';
import { IconPlus, IconRefresh, IconSearch } from '@tabler/icons-react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import LogTableHead from './component/TableHead'
import LogTableRow from './component/TableRow';
import { useEffect, useState } from 'react';
import TableToolBar from './component/TableToolBar';
import OptionsApi from '../component/EditOptions/OptionsApi';
import { ITEMS_PER_PAGE } from '../../../constants';
import TablePagination from '@mui/material/TablePagination';
import { ListingStatus } from '../../../constants/Ebay';
import { LoadingButton } from '@mui/lab';

const {
  fetchEbayAccountOption,
} = OptionsApi();

export default function EbayListing() {
  const originalKeyword = {
    p: 0,
    ebayId: '',
    status: ListingStatus.ActiveList,
  };

  const [accounts, setAccounts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [accountList, setAccountList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);
  const [list, setList] = useState([]);
  const [activePage, setActivePage] = useState(0);
  const [publishBatchLoading, setPublishBatchLoading] = useState(false);


  const onPaginationChange = (event, activePage) => {
    (async () => {
      if (activePage === Math.ceil(list.length / ITEMS_PER_PAGE)) {
        // In this case we have to load more data and then append them.
        await loadList(activePage);
      }
      setActivePage(activePage);
    })();
  };

  const handleSearchKeyword = (event) => {
    setSearchKeyword({ ...searchKeyword, [event.target.name]: event.target.value });
  };

  // 处理刷新
  const handleRefresh = async () => {
    await loadList();
  };

  const getEbayAccountOptions = async () => {
    try {

      let accounts = await fetchEbayAccountOption();
      setAccountList(accounts);
        if (accounts[0]) {
          const ebayId = accounts[0].id
          setSearchKeyword({ ...searchKeyword, ebayId });
          localStorage.setItem('ebayId', ebayId);
        } else {
          showInfo('请添加先ebay账号');
        }
    } catch (e) {}
  };

  const loadList = async (startIdx) => {
    setSearching(true);
    const url = '/api/ebay_get_my_selling'
    const query = searchKeyword;

    query.p = startIdx;

    const res = await API.get(url, { params: query });
    const { success, message, data } = res.data;
    if (success) {
      const curList = data[searchKeyword.status]?.ItemArray?.Items || [];
      curList.forEach(item=> {
        item.operationType = searchKeyword.status

      })
      if (startIdx === 0) {
          setList(curList)
      } else {
        let newList = [...list];
        newList.splice((startIdx) * ITEMS_PER_PAGE, curList.length, ...curList);
        setList(newList);

      }
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const searchList = async (event) => {
    event.preventDefault();
    await loadList(0);
    setActivePage(0);
    return;
  };



  const handleAction = async (ItemID) => {
    setSearching(true);
    const url = searchKeyword.status === ListingStatus.ActiveList ? '/api/ebay_end_items' : '/api/ebay_re_items';
    const res = await API.post(url, {item_ids: ItemID });
    const { success, message } = res.data;
    if (success) {
      showSuccess('操作成功');
      await loadList(0);
    } else {
      showError(message);
    }
    setSearching(false);
  }

  const handleActionBatch = async () => {
    const ids = list.filter((item) => item.checked).map((item) => item.ItemID);
    if (ids.length === 0) {
      showSuccess('请先选择需要操作的商品！');
      return;
    }
    setPublishBatchLoading(true);
    const operationType = list[0]?.operationType;
    const url = operationType === ListingStatus.ActiveList ? '/api/ebay_end_items' : '/api/ebay_re_items';
    const res = await API.post(url, {item_ids: ids });
    const { success, message } = res.data;
    if (success) {
      showSuccess('操作成功');
      await loadList(0);
    } else {
      showError(message);
    }
    setPublishBatchLoading(false);
  }

  const handleCheckChange = (event) => {
    const newList = list.map((item) => {
      return { ...item, checked: event.target.checked };
    });
    setList(newList);
  }

  const handleItemCheckChange = (event, ItemID) => {
    console.log(event.target.checked)
    const newList = list.map((item, idx) => {
      if (item.ItemID === ItemID) {
        return { ...item, checked: event.target.checked };
      }
      return item;
    });
    setList(newList);
  }

  useEffect(() => {
    getEbayAccountOptions().then(()=>{
      loadList(0).then()
    });

  }, []);


  return(
    <Card>
      <Box component="form" onSubmit={searchList} noValidate>
        <TableToolBar filterName={searchKeyword} handleFilterName={handleSearchKeyword} accountList={accountList} />
      </Box>
      <Box component="form" noValidate sx={{ marginTop: 2 }}>
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
              <LoadingButton startIcon={<IconPlus width={'18px'} />} onClick={handleActionBatch} loading={publishBatchLoading}>
                {list[0]?.operationType === ListingStatus.ActiveList ? '批量下架' : '批量重新上架'}
              </LoadingButton>
              <Button onClick={handleRefresh} startIcon={<IconRefresh width={'18px'} />}>
                刷新
              </Button>
              <Button onClick={searchList} startIcon={<IconSearch width={'18px'} />}>
                搜索
              </Button>
            </ButtonGroup>
          </Container>
        </Toolbar>
      </Box>

      {searching && <LinearProgress />}
      <PerfectScrollbar component="div">
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 800 }}>
            <LogTableHead handleCheckChange={handleCheckChange} list={list} />
            <TableBody>
              {list.slice(activePage * ITEMS_PER_PAGE, (activePage + 1) * ITEMS_PER_PAGE).map((row, index) => (
                <LogTableRow key={row.ItemID} item={row} searchKeyword={searchKeyword}  handleAction={handleAction} handleItemCheckChange={handleItemCheckChange}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      </PerfectScrollbar>
      <TablePagination
        page={activePage}
        component="div"
        count={list.length + (list.length % ITEMS_PER_PAGE === 0 ? 1 : 0)}
        rowsPerPage={ITEMS_PER_PAGE}
        onPageChange={onPaginationChange}
        rowsPerPageOptions={[ITEMS_PER_PAGE]}
      />
    </Card>
  )
}