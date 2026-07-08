import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function VerifyOTP() { // OTP verification page for email confirmation
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => { // verifies OTP and logs in user
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await api.post('/auth/verify-otp', { email, otp });
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            setMessage('Email verified successfully! Redirecting...');
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => { // requests new OTP to be sent
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await api.post('/auth/resend-otp', { email });
            setMessage('New OTP sent! Please check your email.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src="/kaara.png" alt="Kaara" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
                    <h2>Verify Your Email</h2>
                    <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Verification Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            required
                            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <p style={{ marginBottom: '8px' }}>Didn't receive the code?</p>
                    <button 
                        onClick={handleResend} 
                        className="btn btn-secondary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        Resend Code
                    </button>
                </div>
            </div>
        </div>
    );
}
