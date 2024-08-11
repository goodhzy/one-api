import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";

import {
  IconPaperclip
} from "@tabler/icons-react";
import {
  InputAdornment,
  OutlinedInput,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import TableToolBar from '../../../Log/component/TableToolBar';
import { EbayProductStatus } from '../../../../constants/Ebay';


export default function PublishTableToolBar({ filterName,handleFilterName }){

  const theme = useTheme();
  const grey500 = theme.palette.grey[500];

  const publishTypes = [
    { value: 'all', text: "全部" },
    { value: EbayProductStatus.NOT_PUBLISH,text: "未刊登" },
    { value: EbayProductStatus.PUBLISH, text: "已刊登" },
  ];

  return(
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 3, sm: 2, md: 4 }}
        paddingBottom={"0px"}
      >
        <FormControl sx={{ minWidth: "22%" }}>
          <InputLabel htmlFor="channel-type-label">状态</InputLabel>
          <Select
            id="channel-type-label"
            label="状态"
            name="status"
            value={filterName.status}
            onChange={handleFilterName}
            sx={{
              minWidth: "100%",
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200,
                },
              },
            }}
          >
            {Object.values(publishTypes).map((option) => {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.text}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel htmlFor="channel-goodsLabel-label">商品标题</InputLabel>
          <OutlinedInput
            id="title"
            name="title"
            sx={{
              minWidth: "100%",
            }}
            label="商品标题"
            value={filterName.title}
            onChange={handleFilterName}
            placeholder="商品标题"
          />
        </FormControl>
      </Stack>
    </>
  )
}

TableToolBar.propTypes = {
  filterName: PropTypes.object,
  handleFilterName: PropTypes.func,
};