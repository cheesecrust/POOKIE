import {create} from 'zustand';

const useGameStore = create((set) => ({
    rtctoken: null,
    roomId: null,
    round: 1,
    turn: "RED",
    timeleft: null,
    turnTimeLeft: null,
    keywordList: [],
    keywordIdx: null,
    norIdxList: [],
    repIdxList: [],
    repIdx: null,
    inputanswer: null,
    teamScore: { red: 0, blue: 0 },
    answer: null,
    nowInfo: null,
    tempTeamScore: null,
    gameResult: null,
    roundResult: null,

    setRoomId: (id) => set({roomId:id}),

    setGameStarted: (data) => set({
        rtctoken: data.rtctoken,
        round: data.round,
        turn: data.turn,
    }),

    setGameKeyword: (data) => set({
        keywordList: data.keywordList,
        keywordIdx: data.keywordIdx,
        repIdx: data.repIdx,
        repIdxList: data.repIdxList,
        norIdxList: data.norIdxList,
    }),

    setGameAnswerSubmitted: (data) => set({
        nowInfo: data.nowInfo,
        answer: data.answer,
    }),

    setGameTurnOvered: (data) => set({
        turn: data.turn,
        tempTeamScore: data.tempTeamScore,
        round: data.round,
    }),

    setGameRoundOvered: (data) => set({
        round: data.round,
        gameResult: data.gameResult,
        roundResult: data.roundResult,
    }),

    setGameNewRound: (data) => set({
        turn: data.turn,
        round: data.round,
        teamScore: data.teamScore,
    }),
    
    


}))

export default useGameStore;
