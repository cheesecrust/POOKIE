import { create } from 'zustand';
import { emitTimerStart } from '../sockets/game/emit';
import useAuthStore from './useAuthStore';

const useGameStore = create((set, get) => ({

    master: null,

    rtctoken: null,
    roomId: null,
    roomInfo: null,

    // 팀 유저 정보
    red: null,
    blue: null,

    round: 1,
    turn: "RED",

    time: 0,

    keywordList: [],
    keywordIdx: 0,

    norIdxList: [],
    repIdxList: [],
    repIdx: null,
    nowInfo: null,

    tempTeamScore: null,

    // gameResult 랑 teamScore 같은듯?
    score: 0, // 현재 라운드 팀 점수 
    teamScore: { RED: 0, BLUE: 0 },
    gameResult: null,
    roundResult: null,
    finalScore: { RED: 0, BLUE: 0 },

    win: 0,

    roomInstance: null,
    participants: [],

    setRoomId: (id) => set({ roomId: id }),

    setTeamScore: (teamScore) => { set({ teamScore: teamScore }) },
    setScore: (score) => { set({ score: score }) },
    setWin: (win) => { set({ win: win }) },

    // 게임 시작할 때 전 게임 정보 초기화
    setTeamScore: (teamScore) => { set({ teamScore: teamScore }) },
    setScore: (score) => { set({ score: score }) },
    setWin: (Win) => { set({ win: Win }) },

    // 모달 상태 관리
    isGamestartModalOpen: false,
    isTurnModalOpen: false,

    showTurnChangeModal: () => {
        set({ isTurnModalOpen: true });
        setTimeout(() => {
            set({ isTurnModalOpen: false });
        }, 2000);
    },

    // 모달 SET 함수
    openGamestartModal: () => set({ isGamestartModalOpen: true }),
    closeGamestartModal: () => set({ isGamestartModalOpen: false }),
    openTurnModal: () => set({ isTurnModalOpen: true }),
    closeTurnModal: () => set({ isTurnModalOpen: false }),


    // 타이머 끝을 알리는 상태 -> true 일경우 라운드,턴 오버버 
    isTimerEnd: false,
    gameTimerStarted: false,

    // 타이머끝 상태 set 함수
    resetIsTimerEnd: () => set({ isTimerEnd: false }),

    // 타이머 SET 함수
    setTimerPrepareStart: () => set({}),
    setTimerPrepareEnd: () => set({}),
    setGameTimerStart: () => set({ gameTimerStarted: true }),
    setGameTimerEnd: () => set({ isTimerEnd: true }),

    handleTimerPrepareSequence: (roomId) => {
        const master = useGameStore.getState().master;
        const myIdx = useAuthStore.getState().user?.userAccountId;

        // 1) 게임 시작 모달 ON
        set({ isGamestartModalOpen: true });

        // 2초 후 게임 시작 모달 OFF → 턴 모달 ON
        setTimeout(() => {
            set({ isGamestartModalOpen: false, isTurnModalOpen: true });

            // 3) 방장이면 이때 emitTimerStart 실행
            if (myIdx === master) {
                setTimeout(() => {
                    emitTimerStart({ roomId });
                }, 2000)
            }
            // 1초 후 턴 모달 OFF
            setTimeout(() => {
                set({ isTurnModalOpen: false });
            }, 2000);
        }, 2000);
    },

    setRoomId: (id) => set({ roomId: id }),

    setRtcToken: (token) => set({ rtctoken: token }),
    setTurn: (turn) => set({ turn }),
    setRound: (round) => set({ round }),
    setRed: (red) => set({ red }),
    setBlue: (blue) => set({ blue }),
    setMaster: (master) => set({ master }),
    setRoomInstance: (roomInstance) => set({ roomInstance }),
    setParticipants: (participants) => set({ participants }),

    setTime: (data) => set({ time: data.time }),

    setRoomInfo: (data) => set({ roomInfo: data }),

    setGameKeyword: (data) => set({
        keywordList: data.keywordList,
        keywordIdx: data.keywordIdx,
        repIdx: data.repIdx,
        repIdxList: data.repIdxList,
        norIdxList: data.norIdxList,
    }),

    setGameAnswerSubmitted: (data) => set((state) => ({
        nowInfo: data.nowInfo,
        keywordIdx: data.nowInfo.keywordIdx,
        repIdx: data.nowInfo.repIdx,
        score: data.answer ? (state.score + 1) : state.score,
    })),

    setGameTurnOvered: (data) => set({
        turn: data.turn,
        tempTeamScore: data.tempTeamScore,
        round: data.round,
    }),

    setGameRoundOvered: (data) => set({
        round: data.round,
        gameResult: data.gameResult,
        roundResult: data.roundResult,
        // win: data.win,
    }),

    setGameNewRound: (data) => set({
        turn: data.turn,
        round: data.round,
        teamScore: data.teamScore,
    }),

    setGamePassed: (data) => set({
        nowInfo: data.nowInfo,
        keywordIdx: data.nowInfo.keywordIdx,
        repIdx: data.nowInfo.repIdx,
    }),

    // Livekit 관련
    addParticipant: (participant) =>
        set((state) => {
            const current = Array.isArray(state.participants) ? state.participants : [];
            return {
                participants: [
                    ...current.filter((p) => p.identity !== participant.identity),
                    participant,
                ],
            };
        }),

    removeParticipant: (identity) =>
        set((state) => ({
            participants: state.participants.filter((p) => p.identity !== identity),
        })),

    updateParticipant: (identity, newData) =>
        set((state) => ({
            participants: state.participants.map((p) =>
                p.identity === identity ? { ...p, ...newData } : p
            ),
        })),

    setGameRoles: ({ repIdxList, norIdxList }) => {
        const participants = get().participants;

        const updatedParticipants = participants.map((p) => {
            const role = repIdxList.includes(p.userAccountId)
                ? "REP"
                : norIdxList.includes(p.userAccountId)
                    ? "NOR"
                    : null;
            return { ...p, role };
        });

        set(() => ({
            repIdxList,
            norIdxList,
            participants: updatedParticipants,
        }));
    },

    setWatingGameOver: (data) => set({
        win: data.gameResult.win,
        finalScore: data.gameResult.finalScore,
    })

}))

export default useGameStore;
