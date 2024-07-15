import { useState, useEffect,useMemo  } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box, Card } from '@mui/material';
import { IconSettings2, IconActivity, IconSettings,  IconChartCandle } from '@tabler/icons-react';
import AdminContainer from 'ui-component/AdminContainer';
import { useLocation, useNavigate } from 'react-router-dom';

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`setting-tabpanel-${index}`} aria-labelledby={`setting-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
};
