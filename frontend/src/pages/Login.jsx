/**
 * ============================================================================
 * LOGIN PAGE
 * ============================================================================
 * Authentication form for existing users to sign in.
 * 
 * Features:
 * - Email and password form
 * - Loading state during API call
 * - Error message display
 * - Redirect to dashboard on success
 * - Link to registration page
 * 
 * State Management:
 * - formData: Controlled form inputs
 * - error: Error message to display
 * - loading: Disables button during API call
 * 
 * Authentication Flow:
 * 1. User fills form and submits
 * 2. Call login() from AuthContext
 * 3. AuthContext makes API call to /auth/login
 * 4. On success: token stored, user state set, redirect to /dashboard
 * 5. On failure: error message displayed
 * 
 * UX Patterns:
 * - Disabled button during loading (prevents double submit)
 * - Clear error on new submission attempt
 * - Link to register for new users
 * ============================================================================
 */

// React hooks for state management
import { useState } from 'react';

// React Router hooks for navigation
// Link: Client-side navigation link
// useNavigate: Programmatic navigation
import { Link, useNavigate } from 'react-router-dom';

// Authentication context hook
import { useAuth } from '../context/AuthContext';

/**
 * Login Page Component
 * 
 * Renders login form and handles authentication.
 * 
 * @returns {JSX.Element} Login page JSX
 */
export default function Login() {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    
    /**
     * Form Data State
     * 
     * Controlled inputs for email and password.
     * Updated on every keystroke via handleChange.
     */
    const [formData, setFormData] = useState({ 
        email: '', 
        password: '' 
    });
    
    /**
     * Error State
     * 
     * Stores error message to display to user.
     * Cleared on each new submission attempt.
     */
    const [error, setError] = useState('');
    
    /**
     * Loading State
     * 
     * True while API call is in progress.
     * Disables submit button to prevent double submission.
     */
    const [loading, setLoading] = useState(false);

    // -------------------------------------------------------------------------
    // HOOKS
    // -------------------------------------------------------------------------
    
    /**
     * login: Function from AuthContext to authenticate user
     */
    const { login } = useAuth();
    
    /**
     * navigate: Function to programmatically change routes
     */
    const navigate = useNavigate();

    // -------------------------------------------------------------------------
    // EVENT HANDLERS
    // -------------------------------------------------------------------------
    
    /**
     * Handle Input Change
     * 
     * Updates formData state when user types in any input.
     * Uses computed property name to update the correct field.
     * 
     * @param {Object} e - React synthetic event
     */
    const handleChange = (e) => {
        // Spread existing values, update changed field
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /**
     * Handle Form Submit
     * 
     * Authenticates user with provided credentials.
     * 
     * Flow:
     * 1. Prevent default form submission
     * 2. Clear previous errors
     * 3. Set loading state
     * 4. Call login() from AuthContext
     * 5. On success: navigate to dashboard
     * 6. On failure: display error message
     * 7. Always: clear loading state
     * 
     * @param {Object} e - React form submit event
     */
    const handleSubmit = async (e) => {
        // Prevent browser's default form submission (page reload)
        e.preventDefault();
        
        // Clear any previous error messages
        setError('');
        
        // Show loading state
        setLoading(true);

        try {
            // Attempt login via AuthContext
            // This makes API call and stores token on success
            await login(formData.email, formData.password);
            
            // Success: redirect to main dashboard
            navigate('/dashboard');
        } catch (err) {
            // Failure: display error message
            // Optional chaining handles cases where response might be undefined
            // Fallback to generic message if no specific error from API
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            // Always clear loading state (success or failure)
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    
    return (
        // Centered container for auth forms
        <div className="auth-container">
            {/* Card-style form container */}
            <div className="auth-card">
                <h2>Login to TaskMaster</h2>

                {/* 
                    Error Message Display
                    Only renders if error state is non-empty
                    Short-circuit evaluation: error && <div>
                */}
                {error && <div className="error-message">{error}</div>}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    
                    {/* EMAIL FIELD */}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"           // HTML5 email validation
                            name="email"           // Matches formData key
                            value={formData.email} // Controlled input
                            onChange={handleChange}
                            required               // HTML5 required validation
                        />
                    </div>

                    {/* PASSWORD FIELD */}
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"           // Hides input characters
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* 
                        Submit Button
                        disabled={loading}: Prevents double submission
                        Dynamic text shows loading state
                    */}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Link to registration page */}
                <p>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}