import { queryClient } from './tanstack'
import axios from 'axios'
//export const BASE_API_URL = 'http://localhost:5000/api/v1';
//export const BASE_API_URL = 'https://drims-sbx.site/api/v1';
export const BASE_API_URL = 'https://drimsapi.umi.ac.ug/api/v1';
//export const BASE_API_URL = "https://drimsapi.alero.digital/api/v1";
//export const socketUrl = "https://drimsapi.alero.digital"
//export const socketUrl = "localhost:5000"
//export const socketUrl = "https://drims-sbx.site"
export const socketUrl = "https://drimsapi.umi.ac.ug"

const apiRequest = axios.create({
    baseURL: BASE_API_URL,
    withCredentials: true,
})

apiRequest.interceptors.request.use((config) => {
    const token = localStorage.getItem('umi_auth_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    config.headers["Content-Type"] = "application/json"


    // Device fingerprinting logic
    let deviceId = localStorage.getItem('umi_device_id')
    if (!deviceId) {
        deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('umi_device_id', deviceId);
    }
    config.headers['x-device-id'] = deviceId;

    // Public IP tracking for localhost
    let publicIp = localStorage.getItem('umi_public_ip');
    if (!publicIp && !window.ipFetchInitiated) {
        window.ipFetchInitiated = true; // Prevent multiple simultaneous fetches
        axios.get('https://api.ipify.org?format=json')
            .then(res => {
                localStorage.setItem('umi_public_ip', res.data.ip);
            }).catch(() => { });
    }
    if (publicIp) {
        config.headers['x-client-ip'] = publicIp;
    }

    return config
})

apiRequest.interceptors.response.use((response) => response, (error) => {
    if (error.response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        localStorage.removeItem("umi_auth_token")
        localStorage.removeItem("umi_auth_state")
        window.location.href = "/login"
    }
    return Promise.reject(error)
})

export default apiRequest

