import { create } from 'zustand';
import { emitTimerStart, emitTurnOver, emitRoundOver } from '../sockets/game/emit';
import useAuthStore from './useAuthStore';

const useGameStore = create((set, get) => ({

    master: null,

    rtctoken: null,
    roomId: null,
    roomInfo: null,

    // 게임 타입
    gameType: null,
    setGameType: (gameType) => set({ gameType }),

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

    // 그림그리기 게임용 상태
    currentDrawTurn: 0, // 현재 그리기 턴 (0-1)
    maxDrawTurnsPerTeam: 2, // 팀당 최대 그리기 턴 수

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


    // 게임 시작할 때 전 게임 정보 초기화
    setTeamScore: (teamScore) => { set({ teamScore: teamScore }) },
    setScore: (score) => { set({ score: score }) },
    setWin: (win) => { set({ win: win }) },
    setKeywordIdx: (keywordIdx) => { set({ keywordIdx: keywordIdx }) },

    // 모달 상태 관리
    isGamestartModalOpen: false,
    isTurnModalOpen: false,
    isPassModalOpen: false,
    isCorrectModalOpen: false,
    isWrongModalOpen: false,

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
    closePassModal: () => set({ isPassModalOpen: false }), // 패스 모달 닫기
    closeCorrectModal: () => set({ isCorrectModalOpen: false }), // 답변 정답 모달 닫기
    closeWrongModal: () => set({ isWrongModalOpen: false }), // 답변 오답 모달 닫기

    // 타이머 끝을 알리는 상태 -> true 일경우 라운드,턴 오버버 
    isTimerEnd: false,
    gameTimerStarted: false,
    lastTurnResult: null, // 마지막 턴 처리 결과

    // 고요속의 외침 타이머 끝 상태 -> true 일경우 라운드,턴 오버버 
    isSilentScreamTimerEnd: false,
    // 고요속의 외침 타이머 상태 초기화
    resetIsSilentScreamTimerEnd: () => set({ isSilentScreamTimerEnd: false }),

    // 타이머 끝 상태 set 함수
    resetIsTimerEnd: () => set({ isTimerEnd: false, lastTurnResult: null }),
    // 타이머 SET 함수
    setGameTimerStart: () => set({ gameTimerStarted: true }),
    setGameTimerEnd: (data) => {
        set({ isSilentScreamTimerEnd: true });

        // // 다음 턴 처리 결과를 먼저 계산
        // const result = get().nextDrawTurn();
        // console.log("📊 nextDrawTurn 결과:", result);

        // // isTimerEnd와 턴 처리 결과를 함께 설정
        // set({
        //     isTimerEnd: true,
        //     lastTurnResult: result // 마지막 턴 처리 결과 저장
        // });

        // // 그림그리기 게임에서는 자동으로 다음 턴 처리
        // const { roomId, master, turn, score, round } = get();
        // const myIdx = useAuthStore.getState().user?.userAccountId;

        // console.log("🔔 GAME_TIMER_END 받음:", { roomId, master, myIdx, data, result, turn, score, round });

        // if (roomId && myIdx === master) {
        //     if (result?.roundComplete) {
        //         console.log("🏁 BLUE 팀 완료, ROUND_OVER 호출");
        //         emitRoundOver({
        //             roomId,
        //             team: "BLUE", // BLUE 팀이 완료된 상황
        //             score: score || 0
        //         });
        //         // 백엔드에서 라운드 증가 후 GAME_NEW_ROUND 또는 WAITING_GAME_OVER 응답
        //     } else if (result?.teamChanged && result?.newTeam === "BLUE") {
        //         // RED → BLUE 전환: TURN_OVER
        //         console.log("🔄 RED → BLUE 전환, TURN_OVER 전송");
        //         emitTurnOver({
        //             roomId,
        //             team: "RED", // 이전 팀
        //             score: score || 0
        //         });
        //         // 메시지 전송 후 백엔드에서 키워드와 함께 응답이 오면 자동으로 다음 타이머 시작
        //     } else if (result?.nextPainter) {
        //         // 같은 팀 내 턴 변경: 바로 타이머 시작
        //         console.log("🎨 같은 팀 내 턴 변경, 바로 타이머 시작");
        //         get().autoStartNextTimer(roomId);
        //     }
        // } else if (!roomId) {
        //     console.log("❌ roomId가 없음");
        // } else {
        //     console.log("👥 방장이 아니므로 대기");
        // }
    },

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


    setRtcToken: (token) => set({ rtctoken: token }),
    setTurn: (turn) => set({ turn }),
    setRound: (round) => set({ round }),
    setRed: (red) => set({ red }),
    setBlue: (blue) => set({ blue }),
    setMaster: (master) => set({ master }),
    setRoomInstance: (roomInstance) => set({ roomInstance }),
    setParticipants: (participants) => set({ participants }),

    // 타이머 set
    setTime: (data) => set({ time: data.time }),

    setRoomInfo: (data) => set({ roomInfo: data }),

    setGameKeyword: (data) => set({
        keywordList: data.keywordList,
        keywordIdx: data.keywordIdx,
        repIdx: data.repIdx,
        repIdxList: data.repIdxList,
        norIdxList: data.norIdxList,
    }),

    setGameAnswerSubmitted: (data) => {
        set((state) => ({
            nowInfo: data.nowInfo,
            keywordIdx: data.nowInfo.keywordIdx,
            repIdx: data.nowInfo.repIdx,
            score: data.answer ? state.score + 1 : state.score,
        }));

        // 모달 처리 따로
        if (data.answer) {
            set({ isCorrectModalOpen: true });
            setTimeout(() => set({ isCorrectModalOpen: false }), 1000);
        } else {
            set({ isWrongModalOpen: true });
            setTimeout(() => set({ isWrongModalOpen: false }), 1000);
        }
    },

    setGameTurnOvered: (data) => {
        set({
            turn: data.turn,
            tempTeamScore: data.tempTeamScore,
            round: data.round,
        });

        if (get().gameType === "SKETCHRELAY") {
            // TURN_OVER 후 자동으로 타이머 시작 (방장만)
            const { roomId, master } = get();
            const myIdx = useAuthStore.getState().user?.userAccountId;

            if (myIdx === master && roomId) {
                console.log("🔄 TURN_OVER 완료, 자동 타이머 시작");
                setTimeout(() => {
                    get().autoStartNextTimer(roomId);
                }, 1000);
            }
        }
    },

    // 라운드 끝
    setGameRoundOvered: (data) => set({
        round: data.round,
        gameResult: data.gameResult,
        roundResult: data.roundResult,
        // win: data.win,
    }),

    setGameNewRound: (data) => {
        set({
            turn: data.turn, // 새 라운드는 항상 RED팀부터 시작
            round: data.round,
            teamScore: data.teamScore,
            currentDrawTurn: 0, // 새 라운드 시작 시 그리기 턴 초기화
        });

        if (get().gameType === "SKETCHRELAY") {
            console.log("🆕 새 라운드 시작:", { round: data.round, turn: "RED" });

            // NEW_ROUND 후 자동으로 타이머 시작 (방장만)
            const { roomId, master } = get();
            const myIdx = useAuthStore.getState().user?.userAccountId;

            if (myIdx === master && roomId) {
                console.log("🆕 NEW_ROUND 완료, 자동 타이머 시작");
                setTimeout(() => {
                    get().autoStartNextTimer(roomId);
                }, 1000);
            }
        }
    },

    // 발화자 패스 
    setGamePassed: (data) => {
        set({
            nowInfo: data.nowInfo,
            keywordIdx: data.nowInfo.keywordIdx,
            repIdx: data.nowInfo.repIdx,
            isPassModalOpen: true,  // 모달 열기
        });

        // 1초 뒤 자동으로 닫기
        setTimeout(() => {
            set({ isPassModalOpen: false });
        }, 1000);
    },

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

    // 일심동체 게임 역할
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

    setGameRoles2: ({ repIdxList }) => {
        const participants = get().participants;

        const updatedParticipants = participants.map((p) => {
            const role = repIdxList.includes(p.userAccountId)
                ? "REP"
                : null;
            return { ...p, role };
        });

        set(() => ({
            repIdxList,
            participants: updatedParticipants,
        }));
    },

    setWaitingGameOver: (data) => {
        console.log("🎉 게임 종료:", data);
        set({
            win: data.gameResult.win,
            finalScore: data.gameResult.finalScore,
        });
    },

    setGameStarted: (data) => set({
        rtctoken: data.rtc_token,
        turn: data.turn,
        round: data.round,
        teamScore: data.game_init?.teamScore || { RED: 0, BLUE: 0 },
        score: data.game_init?.score || 0,
        win: data.game_init?.win || 0,
        currentDrawTurn: 0 // 게임 시작 시 초기화
    }),

    // 다음 그리기 턴으로 이동
    nextDrawTurn: () => {
        const { currentDrawTurn, maxDrawTurnsPerTeam, turn } = get();
        const newDrawTurn = currentDrawTurn + 1;

        if (newDrawTurn >= maxDrawTurnsPerTeam) {
            // 팀의 2번 완료
            if (turn === "RED") {
                // RED 팀 완료 → BLUE 팀으로 전환
                set({
                    turn: "BLUE",
                    currentDrawTurn: 0,
                    repIdx: 0
                });
                console.log("🔄 RED → BLUE 팀 전환");
                return { teamChanged: true, newTeam: "BLUE" };
            } else {
                // BLUE 팀 완료 → 라운드 종료
                set({
                    currentDrawTurn: 0,
                    repIdx: 0
                });
                console.log("🏁 BLUE 팀 완료, 라운드 종료");
                return { roundComplete: true };
            }
        } else {
            // 같은 팀 내에서 다음 그리는 사람으로
            set({
                currentDrawTurn: newDrawTurn,
                repIdx: newDrawTurn % get().repIdxList.length // 순환
            });
            console.log("🎨 같은 팀 내 다음 그리는 사람:", newDrawTurn);
            return { nextPainter: true };
        }
    },

    // 그림그리기 게임용 타이머 자동 시작
    autoStartNextTimer: (roomId) => {
        const master = get().master;
        const myIdx = useAuthStore.getState().user?.userAccountId;

        console.log("⏰ autoStartNextTimer 호출:", { roomId, master, myIdx, isMaster: myIdx === master });

        if (myIdx === master) {
            console.log("🔄 방장이므로 1초 후 타이머 시작 예약");
            setTimeout(() => {
                console.log("⚡ emitTimerStart 실행:", { roomId });
                emitTimerStart({ roomId });
            }, 1000); // 1초 후 다음 타이머 시작
        } else {
            console.log("⛔ 방장이 아니므로 타이머 시작하지 않음");
        }
    },

    // Livekit 정보 초기화(track 포함)
    resetLiveKit: () => set({
        participants: [],
        roomInstance: null,
        red: null,
        blue: null,
        repIdxList: [],
        norIdxList: [],
        rtctoken: null,
        roomId: null,
    }),

}))

export default useGameStore;
