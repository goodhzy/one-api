import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import loadable from "ui-component/Loadable";
import AccountEbay from '../views/EbayControl/AccountEbay';
import MinimalLayout from '../layout/MinimalLayout';
import PublishEbay from '../views/EbayControl/PublishEbay';
import EbayListing from '../views/EbayControl/listing';

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
const FileManager = Loadable(lazy(() => import('component/FileManager/FileManager.js')));
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
      path: 'identify',
      element: <Identify />
    },
    {
      type: 'collapse',
      component: <MinimalLayout />,
      children: [
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
      element: <FileManager />
    },
    {
      path: '404',
      element: <NotFoundView />
    },

  ]
};

export default MainRoutes;
