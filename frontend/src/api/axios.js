/**
 * ============================================================================
 * AXIOS HTTP CLIENT CONFIGURATION
 * ============================================================================
 * Configures a custom Axios instance for all API communication.
 * 
 * Key Concepts:
 * - Axios: Promise-based HTTP client for browser and Node.js
 * - Interceptors: Middleware for requests and responses
 * - Base URL: Common prefix for all API calls
 * - JWT Auto-injection: Automatically adds auth token to requests
 * 
 * Why a Custom Instance?
 * - Avoids repeating baseURL in every API call
 * - Centralized token management
 * - Global error handling (e.g., auto-logout on 401)
 * - Consistent headers across all requests
 * 
 * Usage:
 * import api from '../api/axios';
 * const response = await api.get('/tasks');
 * const response = await api.post('/auth/login', { email, password });
 * ============================================================================
 */

// Import Axios library
import axios from 'axios';

// ============================================================================
// CREATE AXIOS INSTANCE
// ============================================================================

/**
 * Custom Axios Instance
 * 
 * axios.create(config) creates a new instance with custom defaults.
 * All requests made with this instance will use these settings.
 * 
 * baseURL: Prepended to all request URLs
 *   - api.get('/tasks') → GET http://localhost:5000/api/v1/tasks
 * 
 * headers: Default headers for all requests
 *   - Content-Type: application/json tells server to expect JSON body
 */
const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',  // Backend API base URL
    headers: {
        'Content-Type': 'application/json'    // Default content type
    }
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Request Interceptor - Adds JWT Token to Every Request
 * 
 * Interceptors run before the request is sent.
 * This one automatically adds the Authorization header with JWT token.
 * 
 * Flow:
 * 1. Component calls api.get('/tasks')
 * 2. Interceptor runs before request is sent
 * 3. Gets token from localStorage
 * 4. Adds "Authorization: Bearer <token>" header
 * 5. Request is sent with auth header
 * 
 * Why localStorage?
 * - Persists across page refreshes
 * - Simple to implement
 * - Note: For higher security, consider httpOnly cookies
 */
api.interceptors.request.use((config) => {
    // Get JWT token from localStorage
    // Token was stored during login/register in AuthContext
    const token = localStorage.getItem('token');
    
    if (token) {
        // Add Bearer token to Authorization header
        // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
        // Backend auth middleware reads this header
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Must return config to continue the request
    return config;
});

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Response Interceptor - Global Error Handling
 * 
 * Interceptors run after receiving a response.
 * This one handles authentication errors globally.
 * 
 * Two functions:
 * 1. Success handler: Passes successful responses through unchanged
 * 2. Error handler: Handles errors before they reach the component
 * 
 * 401 Handling:
 * - Token expired or invalid
 * - Clear stored credentials
 * - Redirect to login page
 * - This prevents users from being stuck in a broken state
 */
api.interceptors.response.use(
    /**
     * Success Handler
     * Called for responses with 2xx status codes
     * Simply passes the response through unchanged
     * 
     * @param {Object} response - Axios response object
     * @returns {Object} Same response (pass-through)
     */
    (response) => response,

    /**
     * Error Handler
     * Called for responses with non-2xx status codes
     * 
     * @param {Object} error - Axios error object
     * @returns {Promise} Rejected promise with error
     */
    (error) => {
        // Check if error is a 401 Unauthorized response
        // Optional chaining (?.) prevents crash if error.response is undefined
        if (error.response?.status === 401) {
            // Token is invalid or expired
            // Clear all stored authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to login page
            // window.location.href causes a full page reload
            // This ensures React state is also cleared
            window.location.href = '/login';
        }
        
        // Re-throw error so components can handle it too
        // Components can catch this in try/catch blocks
        return Promise.reject(error);
    }
);

// Export the configured instance as default
// All API calls in the app should use this instance
export default api;