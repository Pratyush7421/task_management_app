import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode> 
        <App />
    </StrictMode>,
);


//<StrictMode>: if you accidentally write code that causes side effects, strictmode may warn you during development, but it won't affect production