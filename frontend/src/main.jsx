/**
 * ============================================================================
 * REACT APPLICATION ENTRY POINT
 * ============================================================================
 * This is the very first file executed when the React app starts.
 * It mounts the root React component into the HTML DOM.
 * 
 * Key Concepts:
 * - ReactDOM: Library for rendering React components to the browser DOM
 * - createRoot: Modern React 18 API for rendering (replaces ReactDOM.render)
 * - StrictMode: Development tool that highlights potential problems
 * - index.html: The HTML file with <div id="root"> where React mounts
 * 
 * How React Mounting Works:
 * 1. Browser loads index.html
 * 2. Vite bundles and serves main.jsx
 * 3. createRoot finds the #root div in index.html
 * 4. React renders the App component tree inside #root
 * 5. React takes over DOM management from that point
 * ============================================================================
 */

// StrictMode: React development helper that:
// - Detects components with unsafe lifecycle methods
// - Warns about deprecated API usage
// - Intentionally double-invokes functions to detect side effects
// - Only active in development, no impact on production
import { StrictMode } from 'react';

// createRoot: React 18's concurrent rendering API
// Enables features like automatic batching and concurrent features
import { createRoot } from 'react-dom/client';

// Global CSS styles applied to the entire application
import './index.css';

// Root App component - the top of the component tree
import App from './App.jsx';

/**
 * Mount React Application
 * 
 * createRoot(element) - Creates a React root for the DOM element
 * .render(<Component />) - Renders the component into the root
 * 
 * document.getElementById('root') - Finds <div id="root"> in index.html
 * 
 * StrictMode wraps App to enable development warnings
 * In production builds, StrictMode has zero performance impact
 */
createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/* App is the root component containing all routes and providers */}
        <App />
    </StrictMode>,
);