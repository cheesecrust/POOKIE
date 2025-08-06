import {create} from 'zustand';

const useGameStore = create((set, get) => ({

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

    roomInstance: null,
    participants: [],

    setRoomId: (id) => set({roomId:id}),
    setRtcToken: (token) => set({ rtctoken: token }),
    setTurn: (turn) => set({ turn }),
    setRound: (round) => set({ round }),
    setRed: (red) => set({ red }),
    setBlue: (blue) => set({ blue }),
    setMaster: (master) => set({ master }),
    setRoomInstance: (roomInstance) => set({ roomInstance }),
    setParticipants: (participants) => set({ participants }),
    
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
            
            console.log("역할 부여 완료", updatedParticipants);
            console.log("📌 repIdxList:", repIdxList, "📌 norIdxList:", norIdxList);
        },

}))

export default useGameStore;
