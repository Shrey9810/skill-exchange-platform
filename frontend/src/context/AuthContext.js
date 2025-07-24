import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

// Create the context
export const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // --- NEW NOTIFICATION STATE ---
    const [notifications, setNotifications] = useState({ newProposalsCount: 0, unreadMessagesCount: 0 });

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/exchanges/notifications/counts');
            setNotifications(res.data);
        } catch (error) {
            console.log("Could not fetch notifications, user might be logged out.");
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth')
                .then(res => {
                    setUser(res.data);
                    fetchNotifications(); // Fetch notifications on login
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Function to handle user login
    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        const userRes = await api.get('/auth');
        setUser(userRes.data);
    };

    // Function to handle user registration
    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('token', res.data.token);
        const userRes = await api.get('/auth');
        setUser(userRes.data);
    };

    // Function to handle user logout
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // The value provided to consuming components
    const value = {
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        notifications, // --- EXPOSE STATE ---
        fetchNotifications, // --- EXPOSE FETCHER ---
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

