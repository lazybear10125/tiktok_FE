import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Following from '~/Pages/Following';
import Home from '~/Pages/Home';

function App() {
   return (
      <Router>
         <div className="app">
            <Routes>
               <Route path="/" element={<Home />} />
               <Route path="/following" element={<Following />} />
            </Routes>
         </div>
      </Router>
   );
}

export default App;
