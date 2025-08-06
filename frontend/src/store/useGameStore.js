import {create} from 'zustand';
import {emitTimerStart} from '../sockets/game/emit';
import useAuthStore from './useAuthStore';

const useGameStore = create((set) => ({

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
    keywordIdx: null,

    norIdxList: [],
    repIdxList: [],
    repIdx: null,
    nowInfo: null,

    tempTeamScore: null,

    // gameResult 랑 teamScore 같은듯?
    score: 0, // 현재 라운드 팀 점수 
    teamScore: {RED:0,BLUE:0},
    gameResult: null,
    roundResult: null,
    finalScore: {RED:0,BLUE:0},

    win: null,

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
    
    // 타이머끝 상태 set 함수
    resetIsTimerEnd: () => set({ isTimerEnd:false }),

    // 타이머 SET 함수
    setTimerPrepareStart: () => set({ }),
    setTimerPrepareEnd: () => set({ }),
    setGameTimerStart: () => set({  }),
    setGameTimerEnd: () => set({ isTimerEnd:true }),

    handleTimerPrepareSequence: (roomId) => {
        const master = useGameStore.getState().master;
        const myIdx = useAuthStore.getState().user?.userAccountId;
        // 1) 게임 스타트 모달 ON
        set({ isGamestartModalOpen: true });
    
        setTimeout(() => {
          // 2) 게임 스타트 모달 OFF, 턴 모달 ON
          set({ isGamestartModalOpen: false, isTurnModalOpen: true });
    
          setTimeout(() => {
            // 3) 턴 모달 OFF, 서버에 타이머 시작 요청
            set({ isTurnModalOpen: false });
            if (myIdx === master){
                emitTimerStart({ roomId }); //  실제 타이머 시작
            }
          }, 2000);
    
        }, 2000);
      },


    
    setRoomId: (id) => set({roomId:id}),
    setRtcToken: (token) => set({ rtctoken: token }),
    setTurn: (turn) => set({ turn }),
    setRound: (round) => set({ round }),
    setRed: (red) => set({ red }),
    setBlue: (blue) => set({ blue }),
    setMaster: (master) => set({ master }),
    

    
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
    
    setWatingGameOver: (data) => set({
        win: data.gameResult.win,
        finalScore: data.gameResult.finalScore,
    })

}))

export default useGameStore;
