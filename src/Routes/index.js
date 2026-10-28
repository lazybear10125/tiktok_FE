import { HeaderOnly } from '~/components/Layout';

import Following from '~/Pages/Following';
import Home from '~/Pages/Home';
import Profile from '~/Pages/Profile';
import Upload from '~/Pages/Upload';

const publicRoutes = [
   { path: '/', component: Home },
   { path: '/following', component: Following },
   { path: '/profile', component: Profile },
   { path: '/upload', component: Upload, layout: HeaderOnly },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
