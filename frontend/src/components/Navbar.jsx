/**
 * ============================================================================
 * NAVIGATION BAR COMPONENT
 * ============================================================================
 * Top navigation bar that displays branding and user actions.
 * 
 * Features:
 * - Shows app logo/brand
 * - Displays user info when logged in
 * - Shows admin link for admin users
 * - Login/Register links for guests
 * - Logout button for authenticated users
 * 
 * Responsive Design:
 * - Flexbox layout for alignment
 * - Conditional rendering based on auth state
 * - Role-based UI elements
 * 
 * Navigation:
 * - Uses React Router's Link for client-side navigation
 * - useNavigate for programmatic navigation (logout)
 * ============================================================================
 */

// React Router navigation components
// Link: Client-side navigation without page reload
// useNavigate: Programmatic navigation hook
import { Link, useNavigate } from 'react-router-dom';

// Authentication context hook
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component
 * 
 * Displays the top navigation bar with branding and user actions.
 * Adapts content based on authentication state and user role.
 * 
 * @returns {JSX.Element} Navigation bar JSX
 */
export default function Navbar() {
    // -------------------------------------------------------------------------
    // HOOKS
    // -------------------------------------------------------------------------
    
    /**
     * useAuth Hook
     * 
     * Provides authentication state and methods:
     * - user: Current user object or null
     * - logout: Function to sign out
     * - isAdmin: Boolean indicating admin status
     */
    const { user, logout, isAdmin } = useAuth();
    
    /**
     * useNavigate Hook
     * 
     * Returns a function to programmatically navigate to routes.
     * Used here to redirect after logout.
     */
    const navigate = useNavigate();

    // -------------------------------------------------------------------------
    // EVENT HANDLERS
    // -------------------------------------------------------------------------
    
    /**
     * Handle Logout
     * 
     * Signs out user and redirects to login page.
     * Flow:
     * 1. Call logout() from AuthContext (clears token + state)
     * 2. Navigate to /login page
     */
    const handleLogout = () => {
        logout();           // Clear auth state
        navigate('/login'); // Redirect to login
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    
    return (
        // Navigation container with CSS class for styling
        <nav className="navbar">
            {/* Brand/Logo Section */}
            <div className="nav-brand">
                {/**
                 * App Logo Link
                 * 
                 * Links to dashboard for quick access.
                 * Could also link to home page for unauthenticated users.
                 */}
                <Link to="/dashboard">TaskMaster Pro</Link>
            </div>

            {/* Navigation Links Section */}
            <div className="nav-links">
                {/**
                 * CONDITIONAL RENDERING
                 * 
                 * Shows different UI based on authentication state.
                 * 
                 * {user ? (authenticated) : (guest)}
                 */}
                {user ? (
                    // AUTHENTICATED USER UI
                    <>
                        {/**
                         * User Info Display
                         * 
                         * Shows user's name and role in parentheses.
                         * Example: "John Doe (admin)"
                         */}
                        <span className="user-info">
                            {user.name} ({user.role})
                        </span>

                        {/**
                         * Admin Link (Conditional)
                         * 
                         * Only visible to admin users.
                         * Uses isAdmin boolean from useAuth().
                         */}
                        {isAdmin && (
                            <Link to="/admin" className="nav-btn-admin">
                                Admin
                            </Link>
                        )}

                        {/**
                         * Logout Button
                         * 
                         * Calls handleLogout on click.
                         * Styled as button but could be a link.
                         */}
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    // GUEST USER UI
                    <>
                        {/**
                         * Login Link
                         * 
                         * Visible when not authenticated.
                         * Links to login page.
                         */}
                        <Link to="/login" className="nav-link">
                            Login
                        </Link>

                        {/**
                         * Register Link
                         * 
                         * Visible when not authenticated.
                         * Links to registration page.
                         */}
                        <Link to="/register" className="nav-link">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}