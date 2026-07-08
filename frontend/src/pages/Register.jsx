import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Register() { // registration form with name, email, password
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '' 
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => { // updates form field on input change
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => { // registers user and redirects to OTP verification
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            
            if (response.data.requiresVerification) {
                navigate(`/verify-otp?email=${encodeURIComponent(response.data.email)}`);
            } else {
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src="/kaara.png" alt="Kaara" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
                    <h2>Create Account</h2>
                    <p>Get started with TaskMaster Pro</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            minLength={2}
                            placeholder="Enter your full name"
                        />
                    </div>

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
                            minLength={6}
                            placeholder="Create a password (min 6 characters)"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px' }}>
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
