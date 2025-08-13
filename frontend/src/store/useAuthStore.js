// src/store/useAuthStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from "../lib/axiosInstance";
import { connectSocket, getSocket } from '../sockets/websocket'; // getSocket 추가
import useRoomStore from './useRoomStore';
import useGameStore from './useGameStore';
import useHomeStore from './useHomeStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isLoggedIn: false,
      isLoggingOut: false, // 로그아웃 중 여부 플래그, 로그아웃 중에는 socket 재연결 로직을 skip 하기 위함


      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),

        // ✅ 소켓 초기화 단일 함수
        initializeSocketConnection: async (navigate) => {
        const { accessToken, user, isLoggingOut } = get();
        const setRoomList = useRoomStore.getState().setRoomList;

        if (!accessToken || !user || isLoggingOut) {
          console.warn("❌ 소켓 초기화 조건 미충족 - accessToken/user/isLoggingOut");
          return;
        }

        // 소켓 연결 상태 확인
        const { isSocketConnected } = await import('../sockets/websocket');

        if (isSocketConnected()) {
          console.log("✅ 소켓이 이미 연결되어 있음 - 재연결 생략");
          return;
        }

        console.log("🔌 소켓 연결 초기화 시작");

        connectSocket({
          url: import.meta.env.VITE_SOCKET_URL,
          token: accessToken,
          handlers: {
            navigate,
            setRoomList,

            // waiting handler
            user,
            setRoom: () => { },
            setTeam: () => { },
            setIsReady: () => { },

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
            onGamePassed: (data) => {
              useGameStore.getState().setGamePassed(data);
            },
            onTimer: (data) => {
              useGameStore.getState().setTime(data);
            },
            onGameTimerEnd: (data) => {
              useGameStore.getState().setGameTimerEnd(data);
            },
            onWaitingGameOver: (data) => {
              // useGameStore.getState().setGameResult(data);
              useGameStore.getState().setWaitingGameOver(data);
            },
            onInterrupt: (data) => {
              useGameStore.getState().setInterrupt(data);
            },
            onNotification: (data) => {
              useHomeStore.getState().setNotification(data);
            },
          }
        });
      },
      
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
          await get().initializeSocketConnection(navigate);
        

          return { success: true };
        } catch (err) {
          console.error("로그인 에러:", err);

          const message =
            err.response?.data?.message ||
            err.message ||
            '로그인 실패';

          if (navigate) {
            console.log('❗ 로그인 실패: 메인 페이지로 이동');
            navigate('/');
          }

          return { success: false, message };
        }
      },

      // 🚪 로그아웃 처리
      logout: async (navigate) => {
        const { closeSocket } = await import('../sockets/websocket');
        set({ isLoggingOut: true }); //  로그아웃 중

        try {
          const res = await axiosInstance.post('/auth/logout');
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
        // 상태와 localStorage에서 인증 정보 제거
        await closeSocket();
        set({ accessToken: null, isLoggedIn: false, user: null });
        localStorage.removeItem('auth'); // persist 저장소 비우기
        if (navigate) navigate('/');
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
          set({ user: null, isLoggedIn: false });
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
        const { accessToken, isLoggedIn, isLoggingOut } = get();
        const { closeSocket } = await import('../sockets/websocket');

        if (!accessToken || isLoggingOut) {
          await closeSocket();
          return;
        }

        try {
          if (!get().user) {
            await get().fetchUserInfo();
          }

          if (!isLoggedIn) {
            set({ isLoggedIn: true });
          }

          await get().initializeSocketConnection(navigate);

        } catch (err) {
          console.error('자동 로그인 실패 (accessToken 만료)');
          set({ accessToken: null, isLoggedIn: false });
          await closeSocket();
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