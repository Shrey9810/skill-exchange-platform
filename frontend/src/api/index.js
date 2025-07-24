import axios from 'axios';

// Create an Axios instance with a default base URL.
// In development, this will point to your local backend server.
// In production, you will set REACT_APP_API_URL to your deployed backend URL (e.g., on Render).
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

/*
  This interceptor adds the JWT token to the 'x-auth-token' header of every
  outgoing request if a token is found in localStorage. This automates the
  process of authenticating requests to protected backend routes.
*/
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;
