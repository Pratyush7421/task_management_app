import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) { // provides auth state and methods to all children
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { // loads user from localStorage on mount
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        
        setLoading(false);
    }, []);

    const login = async (email, password) => { // authenticates user, stores token and user data
        const response = await api.post('/auth/login', { email, password });
        const { user: userData, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return userData;
    };

    const register = async (name, email, password) => { // registers new user, stores token and user data
        const response = await api.post('/auth/register', { 
            name, 
            email, 
            password 
        });
        
        const { user: userData, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return userData;
    };

    const logout = () => { // clears token and user from storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager' || user?.role === 'admin'
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() { // hook to access auth context
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    
    return context;
}