import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { InputAdornment, OutlinedInput, Stack, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { showInfo } from '../../../../utils/common';
import { useEffect, useState } from 'react';
import OptionsApi from '../../component/EditOptions/OptionsApi';
import LogType from '../../../Log/type/LogType';
import { ListingStatusList } from '../../../../constants/Ebay';

// ----------------------------------------------------------------------

export default function TableToolBar({ filterName, handleFilterName, accountList }) {
  const theme = useTheme();
  const grey500 = theme.palette.grey[500];

  useEffect(() => {});

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'} paddingBottom={'0px'}>
        <FormControl style={{ minWidth: 300 }} sx={{ ...theme.typography.otherInput }}>
          <InputLabel htmlFor="channel-ebayId-label">eBay账号</InputLabel>
          <Select
            id="channel-ebayId-label"
            label="eBay账号"
            value={filterName.ebayId}
            name="ebayId"
            onChange={async (e) => {
              handleFilterName(e);
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200
                }
              }
            }}
          >
            {accountList.map((option) => {
              return (
                <MenuItem key={option.id} value={option.id}>
                  {option.username}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: "22%" }}>
          <InputLabel htmlFor="channel-type-label">类型</InputLabel>
          <Select
            id="channel-type-label"
            label="类型"
            value={filterName.status}
            name="status"
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
            {ListingStatusList.map((option) => {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.text}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'}></Stack>
    </>
  );
}

TableToolBar.propTypes = {
  filterName: PropTypes.object,
  handleFilterName: PropTypes.func,
};
