/**
 * ============================================================================
 * PROTECTED ROUTE COMPONENT
 * ============================================================================
 * A route guard component that restricts access to authenticated users.
 * 
 * Key Concepts:
 * - Route Guard: Component that checks conditions before rendering
 * - Authentication Check: Verifies user is logged in
 * - Role-Based Access: Optionally checks user role
 * - Redirect: Sends unauthorized users to appropriate page
 * 
 * How It Works:
 * 1. Component receives children (the protected page) and optional requiredRole
 * 2. Checks if user is authenticated via useAuth()
 * 3. If not authenticated → redirect to /login
 * 4. If authenticated but wrong role → redirect to /dashboard
 * 5. If authorized → render the children (protected page)
 * 
 * Usage in App.jsx:
 * // Authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // Authentication + role check
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * ============================================================================
 */

// Navigate: React Router component for declarative redirects
import { Navigate } from 'react-router-dom';

// Authentication context hook
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * Wraps protected pages and handles access control.
 * Returns either the protected content or a redirect.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - The protected page/component to render
 * @param {string} [props.requiredRole] - Optional role required to access route
 * @returns {JSX.Element} Children if authorized, Navigate redirect if not
 */
export default function ProtectedRoute({ children, requiredRole }) {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    
    /**
     * Get auth state from context
     * 
     * user: Current user object (null if not logged in)
     * isAuthenticated: Boolean shorthand for !!user
     */
    const { user, isAuthenticated } = useAuth();

    // -------------------------------------------------------------------------
    // GUARD 1: AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    
    /**
     * Check if user is logged in
     * 
     * If not authenticated, redirect to login page.
     * 
     * Navigate component:
     * - to="/login": Destination URL
     * - replace: Replaces current history entry (back button won't return here)
     *   This prevents the "back to protected page" issue
     */
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // -------------------------------------------------------------------------
    // GUARD 2: ROLE-BASED ACCESS CHECK (OPTIONAL)
    // -------------------------------------------------------------------------
    
    /**
     * Check if user has required role
     * 
     * Only runs if requiredRole prop was provided.
     * If user doesn't have the required role, redirect to dashboard.
     * 
     * Note: We redirect to /dashboard (not /login) because user IS authenticated,
     * just doesn't have the right role.
     * 
     * Optional chaining (?.) prevents crash if user is somehow null here
     */
    if (requiredRole && user?.role !== requiredRole) {
        // User is logged in but doesn't have required role
        // Redirect to dashboard instead of login
        return <Navigate to="/dashboard" replace />;
    }

    // -------------------------------------------------------------------------
    // AUTHORIZED - RENDER CHILDREN
    // -------------------------------------------------------------------------
    
    /**
     * User is authenticated and has required role (if specified)
     * Render the protected content
     * 
     * children is the component passed between ProtectedRoute tags:
     * <ProtectedRoute><Dashboard /></ProtectedRoute>
     * children = <Dashboard />
     */
    return children;
}