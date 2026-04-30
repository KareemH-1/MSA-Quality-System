import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // change the vite api with current domain (currently its locahost but when deployed it will be the same domain as frontend) and add withCredentials to send cookies
    withCredentials: true 
});

export default api;