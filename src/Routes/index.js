import Following from '~/Pages/Following';
import Home from '~/Pages/Home';

const publicRoutes = [
   { path: '/', component: Home },
   { path: '/following', component: Following },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
