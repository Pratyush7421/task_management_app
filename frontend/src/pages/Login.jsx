import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() { // login form with email/password validation
    const [formData, setFormData] = useState({ 
        email: '', 
        password: '' 
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => { // updates form field on input change
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => { // authenticates user and redirects to dashboard
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src="/kaara.png" alt="Kaara" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
                    <h2>Welcome Back</h2>
                    <p>Sign in to TaskMaster Pro</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px' }}>
                    Don't have an account? <Link to="/register">Create account</Link>
                </p>
            </div>
        </div>
    );
}
