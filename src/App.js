import { Fragment, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { publicRoutes } from './Routes';
import { DefaultLayout } from '~/components/Layout';
import { AuthProvider } from '~/context/AuthContext';
import { ScrollToTopOnRouteChange } from '~/components/ScrollToTop';

function App() {
   return (
      <Router>
         <AuthProvider>
            <div className="app">
               <ScrollToTopOnRouteChange />
               <Routes>
                  {publicRoutes.map((route, index) => {
                     const Page = route.component;
                     let Layout = DefaultLayout;

                     if (route.layout) {
                        Layout = route.layout;
                     } else if (route.layout === null) {
                        Layout = Fragment;
                     }

                     return (
                        <Route
                           key={index}
                           path={route.path}
                           element={
                              <Layout>
                                 <Suspense fallback={null}>
                                    <Page />
                                 </Suspense>
                              </Layout>
                           }
                        />
                     );
                  })}
               </Routes>
            </div>
         </AuthProvider>
      </Router>
   );
}

export default App;
