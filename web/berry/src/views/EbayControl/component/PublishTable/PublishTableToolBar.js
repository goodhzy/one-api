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


export default function PublishTableToolBar({ filterName,handleFilterName }){

  const theme = useTheme();
  const grey500 = theme.palette.grey[500];

  const publishTypes = [
    { value: "0", text: "全部" },
    { value: "1", text: "未刊登" },
    { value: "2", text: "已刊登" },
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
            name="type"
            value={filterName.type}
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
          <InputLabel htmlFor="channel-goodsLabel-label">用户名称</InputLabel>
          <OutlinedInput
            id="goodsLabel"
            name="goodsLabel"
            sx={{
              minWidth: "100%",
            }}
            label="商品标题"
            value={filterName.goodsName}
            onChange={handleFilterName}
            placeholder="商品标题"
            startAdornment={
              <InputAdornment position="start">
                <IconPaperclip stroke={1.5} size="20px" color={grey500} />
              </InputAdornment>
            }
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