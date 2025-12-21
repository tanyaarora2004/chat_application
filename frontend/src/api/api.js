import axios from 'axios';

// Resolve API base URL safely and append /api if missing
const envUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_BASE_URL = envUrl.endsWith('/api')
    ? envUrl
    : `${envUrl.replace(/\/\/+$/, '')}/api`;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export default apiClient;