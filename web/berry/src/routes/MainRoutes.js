import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import loadable from "ui-component/Loadable";
import AccountEbay from '../views/EbayControl/AccountEbay';
import MinimalLayout from '../layout/MinimalLayout';
import PublishEbay from '../views/EbayControl/PublishEbay';
import EbayListing from '../views/EbayControl/listing';
import EbayIdentify from '../views/EbayControl/eBayIdentify';

import CardHobbyIdentify from '../views/CardHobbyControl/CardHobbyIdentify'
import CardHobby from '../views/CardHobbyControl'

const Channel = Loadable(lazy(() => import('views/Channel')));
const Log = Loadable(lazy(() => import('views/Log')));
const ProduceLog = Loadable(lazy(() => import('views/ProduceLog')));
const Redemption = Loadable(lazy(() => import('views/Redemption')));
const Setting = Loadable(lazy(() => import('views/Setting')));
const Token = Loadable(lazy(() => import('views/Token')));
const Identify = Loadable(lazy(() => import('views/Identify')));
const EbayControl = loadable(lazy(()=>import ('views/EbayControl')))
const Picture = loadable(lazy(()=>import ('views/Picture')))
const Topup = Loadable(lazy(() => import('views/Topup')));
const User = Loadable(lazy(() => import('views/User')));
const Profile = Loadable(lazy(() => import('views/Profile')));
const NotFoundView = Loadable(lazy(() => import('views/Error')));
const Pan = Loadable(lazy(() => import('views/Pan')));
// dashboard routing
const Dashboard = Loadable(lazy(() => import('views/Dashboard')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/panel',
  element: <MainLayout />,
  children: [
    {
      path: '',
      element: <Dashboard />
    },
    {
      path: 'dashboard',
      element: <Dashboard />
    },
    {
      path: 'channel',
      element: <Channel />
    },
    {
      path: 'log',
      element: <Log />
    },
    {
      path: 'ProduceLog',
      element: <ProduceLog />
    },
    {
      path: 'redemption',
      element: <Redemption />
    },
    {
      path: 'setting',
      element: <Setting />
    },
    {
      path: 'token',
      element: <Token />
    },
    {
      type: 'collapse',
      component: <MinimalLayout />,
      children: [
        {
          path: 'ebayIdentify',
          element: <EbayIdentify />
        },
        {
          path: 'goods',
          element: <PublishEbay />
        },
        {
          path: 'account',
          element: <AccountEbay />
        },
        {
          path: 'listing',
          element: <EbayListing />
        },
        {
          path: 'cardHobbyIdentify',
          element: <CardHobbyIdentify />
        },
        {
          path: 'cardHobby',
          element: <CardHobby />
        }
      ]
    },
    {
      path: 'picture',
      element: <Picture />
    },
    {
      path: 'topup',
      element: <Topup />
    },
    {
      path: 'user',
      element: <User />
    },
    {
      path: 'profile',
      element: <Profile />
    },
    {
      path: 'pan',
      element: <Pan />
    },
    {
      path: '404',
      element: <NotFoundView />
    }
  ]
};

export default MainRoutes;
