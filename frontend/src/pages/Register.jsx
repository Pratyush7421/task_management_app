/**
 * ============================================================================
 * REGISTER PAGE
 * ============================================================================
 * Registration form for new users to create an account.
 * 
 * Features:
 * - Name, email, and password form
 * - Loading state during API call
 * - Error message display
 * - Redirect to dashboard on success
 * - Link to login page for existing users
 * 
 * State Management:
 * - formData: Controlled form inputs (name, email, password)
 * - error: Error message to display
 * - loading: Disables button during API call
 * 
 * Registration Flow:
 * 1. User fills form and submits
 * 2. Call register() from AuthContext
 * 3. AuthContext makes API call to /auth/register
 * 4. On success: token stored, user state set, redirect to /dashboard
 * 5. On failure: error message displayed
 * 
 * Validation:
 * - Name: min 2 characters (enforced by backend)
 * - Email: valid email format (HTML5 validation)
 * - Password: min 6 characters (enforced by backend)
 * 
 * UX Patterns:
 * - Same patterns as Login page for consistency
 * - Link to login for existing users
 * ============================================================================
 */

// React hooks for state management
import { useState } from 'react';

// React Router hooks for navigation
import { Link, useNavigate } from 'react-router-dom';

// Authentication context hook
import { useAuth } from '../context/AuthContext';

/**
 * Register Page Component
 * 
 * Renders registration form and handles account creation.
 * 
 * @returns {JSX.Element} Register page JSX
 */
export default function Register() {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    
    /**
     * Form Data State
     * 
     * Controlled inputs for name, email, and password.
     * Updated on every keystroke via handleChange.
     */
    const [formData, setFormData] = useState({ 
        name: '', 
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
     * register: Function from AuthContext to create account
     */
    const { register } = useAuth();
    
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
     * Creates new user account with provided information.
     * 
     * Flow:
     * 1. Prevent default form submission
     * 2. Clear previous errors
     * 3. Set loading state
     * 4. Call register() from AuthContext
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
            // Attempt registration via AuthContext
            // This makes API call and stores token on success
            await register(formData.name, formData.email, formData.password);
            
            // Success: redirect to main dashboard
            navigate('/dashboard');
        } catch (err) {
            // Failure: display error message
            // Optional chaining handles cases where response might be undefined
            // Fallback to generic message if no specific error from API
            setError(err.response?.data?.error || 'Registration failed');
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
                <h2>Register for TaskMaster</h2>

                {/* 
                    Error Message Display
                    Only renders if error state is non-empty
                */}
                {error && <div className="error-message">{error}</div>}

                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                    
                    {/* NAME FIELD */}
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"            // Text input for name
                            name="name"            // Matches formData key
                            value={formData.name}  // Controlled input
                            onChange={handleChange}
                            required               // HTML5 required validation
                            minLength={2}          // Minimum 2 characters
                        />
                    </div>

                    {/* EMAIL FIELD */}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"           // HTML5 email validation
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* PASSWORD FIELD */}
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"        // Hides input characters
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}          // Minimum 6 characters
                        />
                    </div>

                    {/* 
                        Submit Button
                        disabled={loading}: Prevents double submission
                        Dynamic text shows loading state
                    */}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                {/* Link to login page */}
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}