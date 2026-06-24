import axios from 'axios';

const api = axios.create({
    // Sesuaikan dengan URL Laravel Anda (pastikan php artisan serve berjalan)
    baseURL: 'http://127.0.0.1:8000/api', 
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Interceptor: Otomatis menyisipkan token ke setiap request jika user sudah login
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;