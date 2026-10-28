import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.js';
import GlobalStyles from '~/components/GlobalStyles';

// Bỏ qua cảnh báo tương thích tạm thời giữa React 19 và thư viện @tippyjs/react
const originalError = console.error;
console.error = (...args) => {
   if (typeof args[0] === 'string' && args[0].includes('Accessing element.ref was removed in React 19')) {
      return;
   }
   originalError(...args);
};

createRoot(document.getElementById('root')).render(
   <StrictMode>
      <GlobalStyles>
         <App />
      </GlobalStyles>
   </StrictMode>,
);
