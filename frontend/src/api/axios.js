import axios from 'axios';

const api = axios.create({ // creates axios instance with base URL and auth headers
    // baseURL: 'http://localhost:5000/api/v1',
    baseURL: "/api/v1",
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => { // adds JWT token to every request
    const token = localStorage.getItem('token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});

api.interceptors.response.use( // handles 401 errors by redirecting to login
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default api;