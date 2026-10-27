import Following from '~/Pages/Following';
import Home from '~/Pages/Home';
import Profile from '~/Pages/Profile';

const publicRoutes = [
   { path: '/', component: Home },
   { path: '/following', component: Following },
   { path: '/profile', component: Profile },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
