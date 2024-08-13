// assets
import {
  IconDashboard,
  IconSitemap,
  IconArticle,
  IconCoin,
  IconAdjustments,
  IconKey,
  IconGardenCart,
  IconUser,
  IconUserScan, IconCards,
  IconShoppingBag,
  IconBrandStorybook,
  IconPhotoScan
} from '@tabler/icons-react';

// constant
const icons = {IconShoppingBag,IconPhotoScan, IconCards,IconDashboard, IconSitemap, IconArticle, IconCoin, IconAdjustments, IconKey, IconGardenCart, IconUser, IconUserScan,IconBrandStorybook };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const panel = {
  id: 'panel',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: '总览',
      type: 'item',
      url: '/panel/dashboard',
      icon: icons.IconDashboard,
      breadcrumbs: false,
      isAdmin: false
    },
    {
      id: 'channel',
      title: '渠道',
      type: 'item',
      url: '/panel/channel',
      icon: icons.IconSitemap,
      breadcrumbs: false,
      isAdmin: true
    },
    {
      id:'ebayControl',
      title: 'ebay',
      type:'collapse',
      icon:icons.IconShoppingBag,
      breadcrumbs: false,
      isAdmin: false,
      children:[
        {
          id:'account',
          title:'账号',
          type:'item',
          url:'/panel/account',
          icon:icons.IconUser,
          breadcrumbs:false
        },
        {
          id:'goods',
          title:'商品',
          type:'item',
          url:'/panel/goods',
          icon:icons.IconShoppingBag,
          breadcrumbs:false
        },
        ]
    },
    {
      id: 'token',
      title: '令牌',
      type: 'item',
      url: '/panel/token',
      icon: icons.IconKey,
      breadcrumbs: false
    },
    {
      id:'identify',
      title:'AI标题',
      type:'item',
      url:'/panel/identify',
      icon:icons.IconCards,
      breadcrumbs:false
    },
    {
      id:'picture',
      title: '图片合成',
      type:'item',
      url:'/panel/picture',
      icon:icons.IconPhotoScan,
      breadcrumbs:false
    },
    {
      id: 'ProduceLog',
      title: '生成日志',
      type: 'item',
      url: '/panel/ProduceLog',
      icon: icons.IconBrandStorybook,
      breadcrumbs: false
    },
    {
      id: 'log',
      title: '日志',
      type: 'item',
      url: '/panel/log',
      icon: icons.IconArticle,
      breadcrumbs: false
    },
    {
      id: 'redemption',
      title: '兑换',
      type: 'item',
      url: '/panel/redemption',
      icon: icons.IconCoin,
      breadcrumbs: false,
      isAdmin: true
    },
    {
      id: 'topup',
      title: '充值',
      type: 'item',
      url: '/panel/topup',
      icon: icons.IconGardenCart,
      breadcrumbs: false
    },
    {
      id: 'user',
      title: '用户',
      type: 'item',
      url: '/panel/user',
      icon: icons.IconUser,
      breadcrumbs: false,
      isAdmin: true
    },
    {
      id: 'profile',
      title: '我的',
      type: 'item',
      url: '/panel/profile',
      icon: icons.IconUserScan,
      breadcrumbs: false,
      isAdmin: false
    },
    {
      id: 'setting',
      title: '设置',
      type: 'item',
      url: '/panel/setting',
      icon: icons.IconAdjustments,
      breadcrumbs: false,
      isAdmin: true
    }
  ]
};

export default panel;
