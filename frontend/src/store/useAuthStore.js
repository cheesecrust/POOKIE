// src/store/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from "../lib/axiosInstance";
import { connectSocket } from '../sockets/websocket';
import { handleSocketMessage } from '../sockets/handler';
import useRoomStore from './useRoomStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
    accessToken: null,
    user: null,
    isLoggedIn: false,
    
    setUser: (user) => set({ user }),
    setAccessToken: (token) => set({ accessToken: token }),

    navigate: null,
    setNavigate: (navigateFn) => set({ navigate: navigateFn }),
  
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
        await get().fetchUserInfo();

        // 📍소켓 연결📍
        connectSocket({
          url: import.meta.env.VITE_SOCKET_URL,
          token: accessToken,
          handlers: {
            // home handler
            setRoomList: useRoomStore.getState().setRoomList,

            // waiting handler
            user: get().user,
            navigate: get().navigate,
            setRoom: () => {},
            setTeam: () => {},
            setIsReady: () => {},

            // game handler

            // chat handler
          }
        })
  
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


    // 유저 정보 불러오기: auth/info
    fetchUserInfo: async () => {
      try {
        const res = await axiosInstance.get('/auth/info');
        const user = res.data.data;
        set({ user });
        console.log('유저 정보 불러오기 성공:', user);
      } catch (err) {
        console.error('유저 정보 불러오기 실패:', err);
        set({ user:null, isLoggedIn: false });
      }
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
        const loginRes = await get().login({ email, password });
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
    loadUserFromStorage: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;

      try {
        const res = await axiosInstance.post('/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const { accessToken } = res.data.data;

        set({
          accessToken,
          isLoggedIn: true,
        });

        await get().fetchUserInfo();
      } catch (err) {
        console.error('리프레시 토큰 재발급 실패');
        localStorage.removeItem('refreshToken');
        set({ accessToken: null, isLoggedIn: false });
      }
    },
  }),
  {
    name: 'auth',
    getStorage: () => localStorage,
    partialize: (state) => ({
      accessToken: state.accessToken,
      user: state.user,
      isLoggedIn: state.isLoggedIn,
    }),
  }
));
  
export default useAuthStore;