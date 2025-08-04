// src/store/useAuthStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from "../lib/axiosInstance";
import { connectSocket } from '../sockets/websocket';
import useRoomStore from './useRoomStore';
import useGameStore from './useGameStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
    accessToken: null,
    user: null,
    isLoggedIn: false,
    
    setUser: (user) => set({ user }),
    setAccessToken: (token) => set({ accessToken: token }),
  
    // ✅ 로그인 요청 + user 상태 저장
    login: async ({ email, password, navigate }) => {
      try {
        const res = await axiosInstance.post('/auth/login', { email, password });
        const { accessToken, userAccountId, nickname } = res.data.data;
  
        // 저장
        set({
          accessToken,
          user: { id: userAccountId, nickname },
          isLoggedIn: true,
        });
  
        await get().fetchUserInfo();

        // 📍소켓 연결📍
        connectSocket({
          url: import.meta.env.VITE_SOCKET_URL,
          token: accessToken,
          handlers: {
            // common handler
            navigate,

            // home handler
            setRoomList: useRoomStore.getState().setRoomList,
<<<<<<< HEAD
=======

            // waiting handler
            user: get().user,
            setRoom: () => {},
            setTeam: () => {},
            setIsReady: () => {},

            // game handler
            onGameStarted: (data) => {
                useGameStore.getState().setGameStarted(data);
            },
            onGameKeyword: (data) => {
              useGameStore.getState().setGameKeyword(data);
            },
            onGameAnswerSubmitted: (data) => {
              useGameStore.getState().setGameAnswerSubmitted(data);
            },
            onGameTurnOvered: (data) => {
              useGameStore.getState().setGameTurnOvered(data);
            },
            onGameRoundOvered: (data) => {
              useGameStore.getState().setGameRoundOvered(data);
            },
            onGameNewRound: (data) => {
              useGameStore.getState().setGameNewRound(data);
            },


            // chat handler
>>>>>>> ba30446 (Feat: game socket)
          }
        })
  
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || '로그인 실패';
        return { success: false, message };
      }
    },
  
    // 🚪 로그아웃 처리
    logout: async (navigate) => {
      const { closeSocket } = await import('../sockets/websocket');

      try {
        const res = await axiosInstance.get('/auth/logout');
        const { data } = res.data;

        // 카카오 로그아웃 리다이렉트 URL 존재 시
        if (data) {
          await closeSocket();
          set({ accessToken: null, isLoggedIn: false, user: null });
          localStorage.removeItem('accessToken');
          window.location.href = data;
          return;
        }
      } catch (e) {
        console.warn('서버 로그아웃 실패 (무시)');
      }

      // 일반 로그아웃 처리
      await closeSocket();
      set({ accessToken: null, isLoggedIn: false, user: null });
      localStorage.removeItem('accessToken');
      if (navigate) navigate('/home');
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
    loadUserFromStorage: async (navigate = null) => {
      const accessToken = get().accessToken;
      const isLoggedIn = get().isLoggedIn;

      if (!accessToken || isLoggedIn) return;

      try {
        await get().fetchUserInfo();
        set({ isLoggedIn: true });

        console.log("socket 재연결 호출");
        // 📍소켓 재연결📍
        connectSocket({
          url: import.meta.env.VITE_SOCKET_URL,
          token: accessToken,
          handlers: {
            // common handler
            navigate,

            // home handler
            setRoomList: useRoomStore.getState().setRoomList,
<<<<<<< HEAD
=======

            // waiting handler
            user: get().user,
            setRoom: () => {},
            setTeam: () => {},
            setIsReady: () => {},

            // game handler
            onGameStarted: (data) => {
              useGameStore.getState().setGameStarted(data);
            },
            onGameKeyword: (data) => {
              useGameStore.getState().setGameKeyword(data);
            },
            onGameAnswerSubmitted: (data) => {
              useGameStore.getState().setGameAnswerSubmitted(data);
            },
            onGameTurnOvered: (data) => {
              useGameStore.getState().setGameTurnOvered(data);
            },
            onGameRoundOvered: (data) => {
              useGameStore.getState().setGameRoundOvered(data);
            },
            onGameNewRound: (data) => {
              useGameStore.getState().setGameNewRound(data);
            },

            // chat handler
>>>>>>> ba30446 (Feat: game socket)
          }
        });
      } catch (err) {
        console.error('자동 로그인 실패 (accessToken 만료)');
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