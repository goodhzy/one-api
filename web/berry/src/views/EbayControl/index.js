import { useState, useEffect,useMemo  } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box, Card } from '@mui/material';
import {  IconInnerShadowTop,IconRosetteFilled,IconCreditCard } from '@tabler/icons-react';
import AdminContainer from 'ui-component/AdminContainer';
import { useLocation, useNavigate } from 'react-router-dom';
import PublishEbay from './PublishEbay';
import AccountEbay from './AccountEbay';


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

function a11yProps(index) {
    return {
        id: `setting-tab-${index}`,
        'aria-controls': `setting-tabpanel-${index}`
    };
}

const EbayControl = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const hash = location.hash.replace('#', '');
    const tabMap =  useMemo(() => ({
        publish: 0,
        edit:1,
        account:2
    }), []);
    const [value, setValue] = useState(tabMap[hash] || 0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = location.hash.replace('#', '');
            setValue(tabMap[hash] || 0);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [location, tabMap]);

    return(
      <>
          <Card>
              <AdminContainer>
              <Box sx={{width:'100%'}}>
                  <Box sx={{ bFBottom: 1, borderColor: 'divider' }}>
                      <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
                          <Tab label="ebay刊登" {...a11yProps(0)} icon={<IconInnerShadowTop />} iconPosition="start" />
                          <Tab label="账号管理" {...a11yProps(1)} icon={<IconRosetteFilled />} iconPosition="start" />
                      </Tabs>
                  </Box>
                  <CustomTabPanel value={value} index={0}>
                      <PublishEbay />
                  </CustomTabPanel>
                  <CustomTabPanel value={value} index={1}>
                      <AccountEbay />
                  </CustomTabPanel>
              </Box>
              </AdminContainer>
          </Card>
      </>
    )
}

export default EbayControl;