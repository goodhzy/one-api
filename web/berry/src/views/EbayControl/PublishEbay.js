import { useState, useEffect } from 'react';
import { showError, showSuccess } from 'utils/common';

import PerfectScrollbar from 'react-perfect-scrollbar';
import LinearProgress from '@mui/material/LinearProgress';
import PublishTableToolBar from './component/PublishTable/PublishTableToolBar'

import {
  Button,
  Box,
  Container,
  TableContainer,
  Table,
  TableBody,
  ButtonGroup,
  Toolbar,
  TablePagination,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';

import { API } from 'utils/api';
import { ITEMS_PER_PAGE } from 'constants';
import { IconRefresh, IconPlus, IconSearch } from '@tabler/icons-react';
import PublishTableRow from './component/PublishTable/PublishTableRow';

export default function PublishEbay() {
  const originalKeyword = {
    p: 0,
    type: 0,
    goodsName:''
  };
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);
  const [activePage, setActivePage] = useState(0);
  const [searching, setSearching] = useState(false);
  const [initPage, setInitPage] = useState(true);
  const [goodsList, setGoodsList] = useState([]);

  const handleSearchKeyword = (event) => {
    setSearchKeyword({ ...searchKeyword, [event.target.name]: event.target.value });
  };

  const LoadGoodsList = async (startIdx) => {
    setSearching(true);
    const res = await API.get(`/api/ebay_get_goods_list/?p=${startIdx}`)
    const { success, message, data } = res.data;
    if (success) {
      setGoodsList(data);
      setActivePage(0);
    } else {
      showError(message);
    }
    setSearching(false);
  }

  const searchLogs = async (event) => {
    setTimeout(() => {
      setSearching(true)
    },1000)
  };

  // 处理刷新
  const handleRefresh = () => {
    setInitPage(true);
  };

  const onPaginationChange = (event, activePage) => {
    (async () => {
      if (activePage === Math.ceil(goodsList.length / ITEMS_PER_PAGE)) {
        // In this case we have to load more data and then append them.
        await LoadGoodsList(activePage);
      }
      setActivePage(activePage);
    })();
  };

  useEffect(() => {
    setSearchKeyword(originalKeyword);
    setInitPage(false);
    //setGoodsList虚拟数据
    LoadGoodsList(0)
      .then()
      .catch((reason)=>{
        showError(reason)
      })
  }, []);


  return(
     <>
       <Box component="form" noValidate sx={{marginTop: 2}}>
        <PublishTableToolBar filterName={searchKeyword} handleFilterName={handleSearchKeyword}></PublishTableToolBar>
       </Box>
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
               刷新/清除搜索条件
             </Button>
             <Button onClick={searchLogs} startIcon={<IconSearch width={'18px'} />}>
               搜索
             </Button>
           </ButtonGroup>
         </Container>
       </Toolbar>

       {searching && <LinearProgress />}
       <PerfectScrollbar component="div">
         <TableContainer sx={{ overflow: 'unset' }}>
           <Table sx={{minWidth:800}}>
             <TableHead>
               <TableRow>
                 <TableCell>图片</TableCell>
                 <TableCell>SKU</TableCell>
                 <TableCell>属地</TableCell>
                 <TableCell>标题</TableCell>
                 {/*<TableCell>eBay刊登</TableCell>*/}
                 <TableCell>操作</TableCell>
               </TableRow>
             </TableHead>

             <TableBody>
               {goodsList.slice(activePage * ITEMS_PER_PAGE, (activePage + 1) * ITEMS_PER_PAGE).map((row) => (
                 <PublishTableRow
                   item={row}
                   key={row.id}
                 />
               ))}
             </TableBody>
           </Table>
         </TableContainer>
       </PerfectScrollbar>

       <TablePagination
         page={activePage}
         component="div"
         count={goodsList.length + (goodsList.length % ITEMS_PER_PAGE === 0 ? 1 : 0)}
         rowsPerPage={ITEMS_PER_PAGE}
         onPageChange={onPaginationChange}
         rowsPerPageOptions={[ITEMS_PER_PAGE]}
       />

     </>
  )
}
