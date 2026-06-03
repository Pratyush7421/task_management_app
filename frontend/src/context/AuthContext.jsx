/**
 * ============================================================================
 * AUTHENTICATION CONTEXT
 * ============================================================================
 * React Context for global authentication state management.
 * 
 * Key Concepts:
 * - Context API: Share state across component tree without prop drilling
 * - Provider: Component that wraps app and provides context value
 * - useContext: Hook to consume context in child components
 * - Custom Hook: useAuth() provides clean API for components
 * 
 * State Management:
 * - user: Current user object or null if not logged in
 * - loading: Initial auth check state (prevents flash of login page)
 * 
 * Authentication Flow:
 * 1. User logs in → API call → Store token + user in localStorage
 * 2. Set user in context → Components re-render with auth state
 * 3. On page refresh → Check localStorage → Restore session
 * 4. Logout → Clear storage → Set user to null
 * 
 * Security:
 * - Token stored in localStorage (persists across refreshes)
 * - For production, consider httpOnly cookies (XSS protection)
 * - Password never stored client-side
 * ============================================================================
 */

// React hooks for context and state management
import { createContext, useContext, useState, useEffect } from 'react';

// API client for authentication requests
import api from '../api/axios';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * AuthContext
 * 
 * createContext() creates a context object with two parts:
 * 1. Provider: Component that provides the context value
 * 2. Consumer: Way to access the context (we use useContext hook instead)
 * 
 * Default value is null - will be overridden by AuthProvider
 */
const AuthContext = createContext(null);

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================

/**
 * AuthProvider Component
 * 
 * Wraps the application and provides authentication state to all children.
 * Must be used at the top level (in App.jsx) to make auth available everywhere.
 * 
 * Usage:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * @param {Object} props - React props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider with context value
 */
export function AuthProvider({ children }) {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    
    /**
     * User State
     * 
     * Stores the current authenticated user object or null.
     * Shape: { id, email, name, role } or null
     * 
     * When user changes, all components using useAuth() re-render
     */
    const [user, setUser] = useState(null);
    
    /**
     * Loading State
     * 
     * Tracks whether initial auth check is complete.
     * Prevents flashing login page while checking localStorage.
     * 
     * Flow:
     * 1. Component mounts → loading = true
     * 2. Check localStorage for stored user
     * 3. Set user if found → loading = false
     */
    const [loading, setLoading] = useState(true);

    // -------------------------------------------------------------------------
    // INITIAL AUTH CHECK (ON MOUNT)
    // -------------------------------------------------------------------------
    
    /**
     * Check for Stored Session
     * 
     * Runs once when AuthProvider mounts.
     * Restores session from localStorage if user previously logged in.
     * 
     * This enables "remember me" functionality across page refreshes.
     */
    useEffect(() => {
        // Get stored user from localStorage
        // localStorage persists until explicitly cleared
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
            // Parse JSON string back to object
            // JSON.parse is safe here since we control what gets stored
            setUser(JSON.parse(storedUser));
        }
        
        // Auth check complete - allow rendering
        setLoading(false);
    }, []); // Empty dependency array = run once on mount

    // -------------------------------------------------------------------------
    // AUTHENTICATION METHODS
    // -------------------------------------------------------------------------
    
    /**
     * Login Function
     * 
     * Authenticates user with email/password.
     * Stores token and user data on success.
     * 
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<Object>} User data object
     * @throws {Error} If authentication fails
     */
    const login = async (email, password) => {
        // Make API call to authenticate
        // api.post returns a Promise that resolves to response
        const response = await api.post('/auth/login', { email, password });
        
        // Destructure user data and token from response
        // Backend returns: { user, token, message }
        const { user: userData, token } = response.data;
        
        // Persist authentication data
        // localStorage survives page refreshes
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update React state
        // This triggers re-render of all components using useAuth()
        setUser(userData);
        
        // Return user data for component use
        return userData;
    };

    /**
     * Register Function
     * 
     * Creates new user account and logs them in immediately.
     * Same flow as login - stores token and user data.
     * 
     * @param {string} name - User's display name
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<Object>} User data object
     * @throws {Error} If registration fails
     */
    const register = async (name, email, password) => {
        // API call to create account
        const response = await api.post('/auth/register', { 
            name, 
            email, 
            password 
        });
        
        const { user: userData, token } = response.data;
        
        // Store auth data (same as login)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return userData;
    };

    /**
     * Logout Function
     * 
     * Clears authentication and redirects to login.
     * Removes all stored auth data.
     */
    const logout = () => {
        // Clear persisted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear React state
        // Components will re-render and show logged-out UI
        setUser(null);
    };

    // -------------------------------------------------------------------------
    // CONTEXT VALUE
    // -------------------------------------------------------------------------
    
    /**
     * Context Value Object
     * 
     * This object is provided to all children via AuthContext.Provider.
     * Any component can access these values using useAuth() hook.
     * 
     * Properties:
     * - user: Current user object or null
     * - login: Function to authenticate
     * - register: Function to create account
     * - logout: Function to sign out
     * - isAuthenticated: Boolean - true if user is logged in
     * - isAdmin: Boolean - true if user role is 'admin'
     * - isManager: Boolean - true if user role is 'manager' or 'admin'
     */
    const value = {
        user,           // User object or null
        login,          // Auth function
        register,       // Registration function
        logout,         // Sign out function
        isAuthenticated: !!user,  // Double-bang converts to boolean
        isAdmin: user?.role === 'admin',  // Optional chaining for safety
        isManager: user?.role === 'manager' || user?.role === 'admin'
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    
    // Show loading state while checking localStorage
    // Prevents flash of login page on refresh for logged-in users
    if (loading) {
        return <div>Loading...</div>;  // Could be a proper loading spinner
    }

    // Provide context value to all children
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * useAuth Hook
 * 
 * Custom hook that provides clean API for consuming AuthContext.
 * 
 * Usage in components:
 * const { user, login, logout, isAuthenticated, isAdmin } = useAuth();
 * 
 * Throws error if used outside AuthProvider (helps catch mistakes early).
 * 
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
    // Get context value
    const context = useContext(AuthContext);
    
    // Error if used outside provider
    // This is a common React pattern for required contexts
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    
    return context;
}