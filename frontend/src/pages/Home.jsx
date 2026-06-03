/**
 * ============================================================================
 * HOME PAGE (LANDING PAGE)
 * ============================================================================
 * The first page users see when visiting the application.
 * 
 * Purpose:
 * - Introduce the application
 * - Provide navigation to login/register
 * - Marketing content and call-to-action
 * 
 * Features:
 * - Responsive navigation bar
 * - Hero section with animated background
 * - Call-to-action buttons
 * - Conditional rendering based on auth state
 * 
 * Design:
 * - Modern gradient text effects
 * - Animated orbs and rings for visual interest
 * - Clean, professional layout
 * 
 * Navigation:
 * - Smooth scroll to sections (features, pricing, about)
 * - Get Started button redirects to dashboard if logged in
 * - Login/Register links for guests
 * ============================================================================
 */

// React Router Link for client-side navigation
import { Link } from 'react-router-dom';

// Authentication context hook
import { useAuth } from '../context/AuthContext';

/**
 * Home Page Component
 * 
 * Landing page with marketing content and navigation.
 * 
 * @returns {JSX.Element} Landing page JSX
 */
export default function Home() {
    // -------------------------------------------------------------------------
    // AUTHENTICATION STATE
    // -------------------------------------------------------------------------
    
    /**
     * Check if user is authenticated
     * 
     * isAuthenticated: Boolean from useAuth()
     * Used to conditionally show "Get Started" button destination
     * - Authenticated → goes to /dashboard
     * - Guest → goes to /register
     */
    const { isAuthenticated } = useAuth();

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    
    return (
        // Main container with CSS class for styling
        <div className="home-page">
            
            {/* =================================================================
                NAVIGATION BAR
                ================================================================= */}
            <nav className="home-navbar">
                {/* Logo/Brand */}
                <div className="home-nav-logo">
                    <div className="logo-icon">✦</div>
                    <span>TaskMaster</span>
                </div>

                {/* Navigation Links (anchor links for smooth scroll) */}
                <div className="home-nav-links">
                    <a href="#features" className="home-nav-link">Features</a>
                    <a href="#pricing" className="home-nav-link">Pricing</a>
                    <a href="#about" className="home-nav-link">About</a>
                </div>

                {/* Action Buttons */}
                <div className="home-nav-actions">
                    {/* Login link */}
                    <Link to="/login" className="home-nav-link">Login</Link>
                    
                    {/* Register button */}
                    <Link to="/register" className="home-btn-outline">Register</Link>
                    
                    {/* 
                        Get Started button
                        Conditional destination based on auth state
                        - Authenticated: /dashboard
                        - Guest: /register
                    */}
                    <Link 
                        to={isAuthenticated ? '/dashboard' : '/register'} 
                        className="home-btn-primary"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* =================================================================
                HERO SECTION
                ================================================================= */}
            <section className="hero-section">
                
                {/* Animated background orbs for visual effect */}
                <div className="hero-orb"></div>
                <div className="hero-orb hero-orb-2"></div>

                {/* Hero content container */}
                <div className="hero-content">
                    {/* Main headline with gradient text effect */}
                    <h1 className="hero-title">
                        The Smarter,<br />
                        <span className="gradient-text">AI Powered</span><br />
                        Task Management
                    </h1>

                    {/* Subtitle/description */}
                    <p className="hero-subtitle">
                        Kaara the power of intelligent task organization with TaskMaster.
                        Streamline your workflow, collaborate seamlessly, and achieve more.
                    </p>

                    {/* Call-to-action buttons */}
                    <div className="hero-cta">
                        {/* Primary CTA - Get Started */}
                        <Link 
                            to={isAuthenticated ? '/dashboard' : '/register'} 
                            className="hero-btn-primary"
                        >
                            Get Started →
                        </Link>
                        
                        {/* Secondary CTA - Sign In */}
                        <Link to="/login" className="hero-btn-secondary">
                            Sign In
                        </Link>
                    </div>

                    {/* Placeholder text (Lorem ipsum) */}
                    <p className="hero-lorem">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </div>

                {/* =================================================================
                    ANIMATED VISUAL ELEMENTS
                    ================================================================= */}
                <div className="hero-visual">
                    {/* Animated rings */}
                    <div className="hero-ring hero-ring-1"></div>
                    <div className="hero-ring hero-ring-2"></div>
                    <div className="hero-ring hero-ring-3"></div>
                    
                    {/* Decorative coin element */}
                    <div className="hero-coin"></div>
                    
                    {/* Glow effect */}
                    <div className="hero-glow"></div>
                </div>
            </section>
        </div>
    );
}