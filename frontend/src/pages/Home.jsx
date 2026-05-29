import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="home-page">
            {/* Navbar */}
            <nav className="home-navbar">
                <div className="home-nav-logo">
                    <div className="logo-icon">✦</div>
                    <span>TaskMaster</span>
                </div>
                <div className="home-nav-links">
                    <a href="#features" className="home-nav-link">Features</a>
                    <a href="#pricing" className="home-nav-link">Pricing</a>
                    <a href="#about" className="home-nav-link">About</a>
                </div>
                <div className="home-nav-actions">
                    <Link to="/login" className="home-nav-link">Login</Link>
                    <Link to="/register" className="home-btn-outline">Register</Link>
                    <Link to={isAuthenticated ? '/dashboard' : '/register'} className="home-btn-primary">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                {/* Animated background orb */}
                <div className="hero-orb"></div>
                <div className="hero-orb hero-orb-2"></div>

                <div className="hero-content">
                    <h1 className="hero-title">
                        The Smarter,<br />
                        <span className="gradient-text">AI Powered</span><br />
                        Task Management
                    </h1>
                    <p className="hero-subtitle">
                        Kaara the power of intelligent task organization with TaskMaster.
                        Streamline your workflow, collaborate seamlessly, and achieve more.
                    </p>
                    <div className="hero-cta">
                        <Link to={isAuthenticated ? '/dashboard' : '/register'} className="hero-btn-primary">
                            Get Started →
                        </Link>
                        <Link to="/login" className="hero-btn-secondary">
                            Sign In
                        </Link>
                    </div>
                    <p className="hero-lorem">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </div>

                {/* Animated visual */}
                <div className="hero-visual">
                    <div className="hero-ring hero-ring-1"></div>
                    <div className="hero-ring hero-ring-2"></div>
                    <div className="hero-ring hero-ring-3"></div>
                    <div className="hero-coin"></div>
                    <div className="hero-glow"></div>
                </div>
            </section>
        </div>
    );
}