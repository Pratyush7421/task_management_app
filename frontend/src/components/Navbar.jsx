import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/dashboard">TaskMaster Pro</Link>
            </div>
            <div className="nav-links">
                {user ? (
                    <>
                        <span className="user-info">
                            {user.name} ({user.role})
                        </span>
                        {isAdmin && (
                            <Link to="/admin" className="nav-link">Admin</Link>
                        )}
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="nav-link">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}