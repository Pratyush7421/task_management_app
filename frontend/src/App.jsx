/**
 * ============================================================================
 * REACT APPLICATION ROOT COMPONENT
 * ============================================================================
 * The top-level component that defines the application structure.
 * Sets up routing, authentication context, and global providers.
 * 
 * Key Concepts:
 * - React Router: Client-side routing for single-page applications (SPA)
 * - Context API: Global state management without prop drilling
 * - Protected Routes: Restrict access based on authentication/role
 * - Component Composition: Nesting components to build UI
 * 
 * Architecture:
 * - AuthProvider wraps everything (authentication state available everywhere)
 * - BrowserRouter enables routing (uses HTML5 history API)
 * - Routes define URL-to-component mapping
 * - ProtectedRoute guards sensitive pages
 * ============================================================================
 */

// React Router components for client-side navigation
// BrowserRouter: Uses HTML5 history API (clean URLs without #)
// Routes: Container for Route definitions
// Route: Maps URL path to component
// Navigate: Programmatically redirects
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Authentication context provider
// Wraps app to make auth state available to all components
import { AuthProvider } from './context/AuthContext';

// Route guard component - redirects unauthenticated users to login
import ProtectedRoute from './components/ProtectedRoute';

// Page components - each represents a distinct page/URL
import Home from './pages/Home';           // Landing page
import Login from './pages/Login';         // Login form
import Register from './pages/Register';   // Registration form
import Dashboard from './pages/Dashboard'; // Main app dashboard
import AdminPanel from './pages/AdminPanel'; // Admin management

// Component-specific styles
import './App.css';

/**
 * App Component
 * 
 * Root component that sets up the entire application structure.
 * Returns JSX that defines the component tree.
 * 
 * Component Hierarchy:
 * AuthProvider
 *   └─ BrowserRouter
 *        └─ Routes
 *             ├─ Route "/" → Home
 *             ├─ Route "/login" → Login
 *             ├─ Route "/register" → Register
 *             ├─ Route "/dashboard" → ProtectedRoute → Dashboard
 *             └─ Route "/admin" → ProtectedRoute → AdminPanel
 */
function App() {
    return (
        /**
         * AuthProvider Context
         * 
         * Provides authentication state to all child components:
         * - user: Current user object or null
         * - login: Function to authenticate
         * - logout: Function to sign out
         * - isAuthenticated: Boolean auth status
         * - isAdmin: Boolean admin status
         * 
         * Any component can access these via useAuth() hook
         */
        <AuthProvider>
            {/**
             * BrowserRouter
             * 
             * Enables client-side routing using HTML5 history API.
             * Syncs URL with UI without page reloads.
             * 
             * Alternative: HashRouter (uses # in URL, for static hosting)
             */}
            <BrowserRouter>
                {/**
                 * Routes
                 * 
                 * Container for all Route definitions.
                 * Only renders the first Route that matches the current URL.
                 */}
                <Routes>
                    {/**
                     * PUBLIC ROUTES
                     * 
                     * Accessible to everyone, including unauthenticated users.
                     * These are the landing pages and authentication forms.
                     */}

                    {/* Home/Landing Page - First page users see */}
                    <Route path="/" element={<Home />} />

                    {/* Login Page - Authentication form */}
                    <Route path="/login" element={<Login />} />

                    {/* Registration Page - New account creation */}
                    <Route path="/register" element={<Register />} />

                    {/**
                     * PROTECTED ROUTES
                     * 
                     * Wrapped in ProtectedRoute component which:
                     * 1. Checks if user is authenticated
                     * 2. If not, redirects to /login
                     * 3. If yes, renders the protected component
                     */}

                    {/* Dashboard - Main application interface */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />

                    {/**
                     * ROLE-BASED PROTECTED ROUTE
                     * 
                     * ProtectedRoute with requiredRole prop:
                     * 1. Checks authentication
                     * 2. Checks if user.role === requiredRole
                     * 3. If wrong role, redirects to /dashboard
                     * 4. If correct role, renders component
                     */}

                    {/* Admin Panel - Only accessible to admin users */}
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminPanel />
                            </ProtectedRoute>
                        } 
                    />

                    {/**
                     * CATCH-ALL ROUTE
                     * 
                     * Navigate component redirects any unknown URLs to home.
                     * replace: true prevents adding redirect to browser history.
                     * 
                     * Example: /unknown-page → redirects to /
                     */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

// Export App as default for main.jsx to import
export default App;