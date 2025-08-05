import {create} from 'zustand';

const useGameStore = create((set) => ({

    master: null,

    rtctoken: null,
    roomId: null,

    red: null,
    blue: null,

    round: 1,
    turn: "RED",

    timeleft: null,
    turnTimeLeft: null,

    keywordList: [],
    keywordIdx: null,

    norIdxList: [],
    repIdxList: [],
    repIdx: null,
    nowInfo: null,

    tempTeamScore: null,

    // gameResult 랑 teamScore 같은듯?
    score: null, // 현재 라운드 팀 점수 
    teamScore: null,
    gameResult: null,
    roundResult: null,

    win: null,

    setRoomId: (id) => set({roomId:id}),
    setRtcToken: (token) => set({ rtctoken: token }),
    setTurn: (turn) => set({ turn }),
    setRound: (round) => set({ round }),
    setRed: (red) => set({ red }),
    setBlue: (blue) => set({ blue }),
    setMaster: (master) => set({ master }),
    
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
        score: data.answer ? (state.score ?? 0) + 1 : state.score,
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
        win: data.win,
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

}))

export default useGameStore;
