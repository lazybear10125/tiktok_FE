import { lazy } from 'react';
import config from '~/config';
import { HeaderOnly } from '~/components/Layout';

const Feed = lazy(() => import('~/pages/Feed'));
const Following = lazy(() => import('~/pages/Following'));
const Live = lazy(() => import('~/pages/Live'));
const Profile = lazy(() => import('~/pages/Profile'));
const Upload = lazy(() => import('~/pages/Upload'));
const Search = lazy(() => import('~/pages/Search'));

const publicRoutes = [
   { path: config.routes.home, component: Feed },
   { path: config.routes.feed, component: Feed },
   { path: '/feed', component: Feed },
   { path: '/foryou', component: Feed },
   { path: '/for-you', component: Feed },
   { path: config.routes.login, component: Feed },
   { path: config.routes.following, component: Following },
   { path: config.routes.live, component: Live },
   { path: config.routes.search, component: Search },
   { path: '/profile', component: Profile },
   { path: config.routes.profile, component: Profile },
   { path: config.routes.upload, component: Upload, layout: HeaderOnly },
   { path: '*', component: Feed },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
