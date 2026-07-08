import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() { // landing page with navigation and hero section
    const { isAuthenticated } = useAuth();

    return (
        <div className="home-page">
            <nav className="home-navbar">
                <div className="home-nav-logo">
                    <img src="/kaara.png" alt="Kaara" />
                    <span>TaskMaster</span>
                </div>

                <div className="home-nav-links">
                    <a href="#features" className="home-nav-link">Features</a>
                    <a href="#pricing" className="home-nav-link">Pricing</a>
                    <a href="#about" className="home-nav-link">About</a>
                </div>

                <div className="home-nav-actions">
                    <Link to="/login" className="home-nav-link">Login</Link>
                    <Link to="/register" className="btn btn-secondary btn-sm">Register</Link>
                    <Link 
                        to={isAuthenticated ? '/dashboard' : '/register'} 
                        className="btn btn-primary btn-sm"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        The Smarter,<br />
                        <span className="gradient-text">AI Powered</span><br />
                        Task Management
                    </h1>

                    <p className="hero-subtitle">
                        Experience the power of intelligent task organization with TaskMaster Pro.
                        Streamline your workflow, collaborate seamlessly, and achieve more.
                    </p>

                    <div className="hero-cta">
                        <Link 
                            to={isAuthenticated ? '/dashboard' : '/register'} 
                            className="hero-btn-primary"
                        >
                            Get Started →
                        </Link>
                        <Link to="/login" className="hero-btn-secondary">
                            Sign In
                        </Link>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-illustration">
                        <div className="gradient-orb orb-1"></div>
                        <div className="gradient-orb orb-2"></div>
                        <div className="gradient-orb orb-3"></div>
                        <div className="concentric-ring ring-1"></div>
                        <div className="concentric-ring ring-2"></div>
                        <div className="concentric-ring ring-3"></div>
                        <div className="floating-shape shape-1"></div>
                        <div className="floating-shape shape-2"></div>
                        <div className="floating-shape shape-3"></div>
                        <div className="particle particle-1"></div>
                        <div className="particle particle-2"></div>
                        <div className="particle particle-3"></div>
                        <div className="particle particle-4"></div>
                        <div className="particle particle-5"></div>
                    </div>
                </div>
            </section>
        </div>
    );
}
