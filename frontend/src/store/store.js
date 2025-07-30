// src/store/store.js
import { create } from 'zustand';
import axiosInstance from "../lib/axiosInstance";

const useAuthStore = create((set) => ({
    accessToken: null,
    user: null,
    setUser: (user) => set({ user }),
    isLoggedIn: false,
  
    // 🔐 액세스 토큰만 상태로 관리
    setAccessToken: (token) => set({ accessToken: token }),
  
    // ✅ 로그인 요청 + user 상태 저장
    login: async ({ email, password }) => {
      try {
        const res = await axiosInstance.post('/auth/login', { email, password });
        const { accessToken, refreshToken, userAccountId, nickname } = res.data.data;
  
        // 저장
        set({
          accessToken,
          user: { id: userAccountId, nickname },
          isLoggedIn: true,
        });
  
        // refreshToken은 로컬에만!
        localStorage.setItem('refreshToken', refreshToken);
  
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || '로그인 실패';
        return { success: false, message };
      }
    },
  
    // 🚪 로그아웃 처리
    logout: async () => {
      try {
        await axiosInstance.post('/auth/logout');
      } catch (e) {
        console.warn('서버 로그아웃 실패 (무시)');
      }
  
      // 상태 초기화
      localStorage.removeItem('refreshToken');
      set({
        accessToken: null,
        isLoggedIn: false,
        user: null,
      });
    },

    // ✅ 회원가입 + 자동 로그인 처리
    signup: async ({ email, password, nickname }) => {
      try {
        // 1. 회원가입 요청
        await axiosInstance.post('/auth/signup', {
          email,
          password,
          nickname,
        });

        // 2. 자동 로그인 시도
        const loginRes = await useAuthStore.getState().login({ email, password });
        if (!loginRes.success) {
          return { success: false, message: "회원가입은 성공했지만 로그인 실패: " + loginRes.message };
        }

        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || '회원가입 실패';
        return { success: false, message };
      }
    },

  
    // 🌱 새로고침 후 로그인 상태 복원
    loadUserFromStorage: () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;
  
      // → 앱 시작 시 refresh로 accessToken 다시 받아오도록
      axiosInstance
        .post('/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })
        .then((res) => {
          const { accessToken, userAccountId, nickname } = res.data.data;
          set({
            accessToken,
            isLoggedIn: true,
            user: { id: userAccountId, nickname },
          });
        })
        .catch(() => {
          localStorage.removeItem('refreshToken');
          set({ accessToken: null, isLoggedIn: false });
        });
    },
  }));
  
  export default useAuthStore;