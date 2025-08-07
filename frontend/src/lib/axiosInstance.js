// src/lib/axiosInstance.js

import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const BASE_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    // withCredentials: false,
    withCredentials: true,
});

// 요청 인터셉터 - accessToken 있으면 헤더에 자동 추가
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (err) => {
        return Promise.reject(err);
    }
);

// 응답 인터셉터 - 401 발생 시, refreshToken 으로 재발급
axiosInstance.interceptors.response.use(
    (response) => response,
    async (err) => {
        const originalRequest = err.config;

        // acessToekn 만료 + 재시도x
        if (err.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

                      try {
                // ✅ RefreshToken은 쿠키로 전송됨 (헤더 필요 없음)
                const res = await axios.post(`${BASE_URL}/auth/refresh`, null, {
                    withCredentials: true, 
                });

                const newAccessToken = res.data.data.accessToken;
                useAuthStore.getState().setAccessToken(newAccessToken);

                // 재시도
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                console.log("refresh token 이용해서 재발급 성공, 요청 재시도");
                return axiosInstance(originalRequest);
            } catch (refreshErr) {
                console.log('리프레시 토큰 재발급 실패');
                useAuthStore.getState().logout?.();
                window.location.href = '/';
            }
        }

        return Promise.reject(err);
    }
)

export default axiosInstance;