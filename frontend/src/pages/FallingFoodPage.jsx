import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import background from "../assets/background/background_falling_food.png";
import defaultCharacter from "../assets/character/pookiepookie.png";
import characterImageMap from "../utils/characterImageMap";
import useAuthStore from "../store/useAuthStore";
import egg from "../assets/fallingfood/egg.png";
import milk from "../assets/fallingfood/milk.png";
import poop from "../assets/fallingfood/poop.png";
import sugar from "../assets/fallingfood/sugar.png";
import coin from "../assets/item/coin.png";
import useSound from "../utils/useSound";
import PopUpModal from "../components/atoms/modal/PopUpModal";

import {
  emitMiniGameJoin,
  emitMiniGameScoreUpdate,
  emitMiniGameOver,
  emitMiniGameLeave,
} from "../sockets/minigame/emit";
import handleMiniGameMessage from "../sockets/minigame/handleMiniGameMessage";
import { updateHandlers } from "../sockets/websocket";

// =================== 튜닝 포인트 ===================
const GAME_TIME = 30; // 초
const OVER_REPORT_DELAY_MS = 0; // ✅ 종료 보고 지연(ms). 0 이면 즉시 서버 보고
// ===================================================

const ITEM_TYPES = {
  EGG: { img: egg, score: 30, size: 64 },
  MILK: { img: milk, score: 20, size: 72 },
  SUGAR: { img: sugar, score: 10, size: 60 },
  POOP: { img: poop, score: -20, size: 64 },
};
const ITEM_KEYS = Object.keys(ITEM_TYPES);

const PLAYER_SIZE = 140;
const PLAYER_SPEED_PPS = 600;
const BASE_FALL_SPEED_PPS = 240;
const MAX_FALL_BONUS_PPS = 360;
const FALL_ACCEL_PPS_PER_SEC = 30;

const SPAWN_INTERVAL_MS = 600;
const SPAWN_INTERVAL_MIN_MS = 220;
const SPAWN_REDUCE_MS_PER_SEC = 9;

export default function FallingFoodPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { playSound } = useSound();

  const playerImg =
    characterImageMap[user?.repCharacter?.characterName] || defaultCharacter;

  // ----- 화면 크기 -----
  const wrapRef = useRef(null);
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(720);

  // ----- 표시 상태 -----
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [running, setRunning] = useState(false);
  const [, forceRerender] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // ----- 내부 런타임 상태(ref) -----
  const runningRef = useRef(false);
  const playerRx = useRef(0); // 비율 좌표 [0, 1 - PLAYER_SIZE/vw]
  const keyRef = useRef({ left: false, right: false });
  const itemsRef = useRef([]);
  const idRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastTsRef = useRef(0);
  const startTsRef = useRef(0);
  const elapsedOffsetMsRef = useRef(0);
  const rafRef = useRef(null);
  const hitEffectsRef = useRef([]);
  const scoreRef = useRef(0);

  // 게임 식별자(재시작 레이스 방지)
  const gameIdRef = useRef(0);
  // 종료 타임아웃 ID
  const overTimeoutRef = useRef(null);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // ----- 서버 핸들러 등록 -----
  useEffect(() => {
    const onMiniGameMessage = (msg) =>
      handleMiniGameMessage(msg, {
        setScore, // 서버 권위 점수 동기화
        navigate,
        setErrorModalOpen,
        onScoreSynced: () => {},
      });
    updateHandlers({ onMiniGameMessage });
    return () => updateHandlers({ onMiniGameMessage: null });
  }, []);

  // ----- 초기 플레이어 위치 -----
  useLayoutEffect(() => {
    playerRx.current = Math.max(0, 0.5 - PLAYER_SIZE / (2 * vw));
  }, [vw]);

  // ----- 리사이즈 -----
  useEffect(() => {
    const resize = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      setVw(rect.width);
      setVh(rect.height);
      forceRerender((f) => f + 1);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // 포커스
  useEffect(() => {
    const t = setTimeout(() => wrapRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);
  const handleWrapperClick = () => wrapRef.current?.focus();

  // ----- 입력 -----
  const onKeyDown = useCallback((e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
    if (e.key === "ArrowLeft") keyRef.current.left = true;
    if (e.key === "ArrowRight") keyRef.current.right = true;
  }, []);
  const onKeyUp = useCallback((e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
    if (e.key === "ArrowLeft") keyRef.current.left = false;
    if (e.key === "ArrowRight") keyRef.current.right = false;
  }, []);

  // ----- 유틸 -----
  const isHit = (ax, ay, as, bx, by, bs) =>
    !(ax + as < bx || ax > bx + bs || ay + as < by || ay > by + bs);

  const spawnItem = () => {
    const key = ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)];
    const spec = ITEM_TYPES[key];
    const size = spec.size;
    const rx = Math.random() * (1 - size / vw);
    const ry = -size / vh;
    itemsRef.current.push({ id: idRef.current++, type: key, rx, ry, size });
  };

  const fallSpeedRatioPerSec = (elapsedSec) =>
    (BASE_FALL_SPEED_PPS +
      Math.min(MAX_FALL_BONUS_PPS, elapsedSec * FALL_ACCEL_PPS_PER_SEC)) /
    vh;

  const spawnIntervalMsByTime = (elapsedSec) =>
    Math.max(
      SPAWN_INTERVAL_MIN_MS,
      SPAWN_INTERVAL_MS - Math.min(350, elapsedSec * SPAWN_REDUCE_MS_PER_SEC)
    );

  // ----- 종료 처리(단일화) -----
  const stopGame = useCallback((why = "TIME_UP") => {
    if (!runningRef.current) return;
    const myGameId = gameIdRef.current;

    setRunning(false);
    runningRef.current = false;
    setTimeLeft(0);
    // 최종 점수 표시용(서버 동기화 전일 수도 있으니 ref 우선)
    setFinalScore(scoreRef.current);

    // RAF 정지
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // 종료 보고(지연 설정 반영 + gameId 일치 검사)
    const emitReport = () => {
      // 재시작 등으로 gameId 바뀌었으면 무시
      if (myGameId !== gameIdRef.current) return;
      emitMiniGameOver({ score: scoreRef.current, reason: why });
    };

    if (OVER_REPORT_DELAY_MS > 0) {
      // 이전 예약 제거
      if (overTimeoutRef.current) {
        clearTimeout(overTimeoutRef.current);
        overTimeoutRef.current = null;
      }
      overTimeoutRef.current = setTimeout(() => {
        overTimeoutRef.current = null;
        emitReport();
      }, OVER_REPORT_DELAY_MS);
    } else {
      emitReport();
    }
  }, []);

  // ----- 메인 루프 -----
  const tick = (ts) => {
    // 해당 프레임이 현재 게임인지 확인
    const myGameId = gameIdRef.current;
    if (!runningRef.current || myGameId !== gameIdRef.current) return;

    if (!lastTsRef.current) lastTsRef.current = ts;
    const dtSec = Math.min(0.05, (ts - lastTsRef.current) / 1000);
    lastTsRef.current = ts;

    const elapsedSec = Math.max(
      0,
      (ts - startTsRef.current + elapsedOffsetMsRef.current) / 1000
    );

    // 표시용 남은 시간(ceil)
    const remainDisplay = Math.max(0, Math.ceil(GAME_TIME - elapsedSec));
    if (remainDisplay !== timeLeft) setTimeLeft(remainDisplay);

    // 종료 판정(경과 시간 기준)
    if (elapsedSec >= GAME_TIME) {
      stopGame("TIME_UP");
      return;
    }

    // 플레이어 이동
    const dir = (keyRef.current.right ? 1 : 0) - (keyRef.current.left ? 1 : 0);
    const moveRatioPerSec = PLAYER_SPEED_PPS / vw;
    playerRx.current = Math.max(
      0,
      Math.min(
        1 - PLAYER_SIZE / vw,
        playerRx.current + dir * moveRatioPerSec * dtSec
      )
    );

    // 스폰
    const interval = spawnIntervalMsByTime(elapsedSec);
    if (!lastSpawnRef.current) lastSpawnRef.current = ts;
    if (ts - lastSpawnRef.current > interval) {
      lastSpawnRef.current = ts;
      spawnItem();
    }

    // 낙하 & 충돌 처리
    const dyRatio = fallSpeedRatioPerSec(elapsedSec) * dtSec;
    itemsRef.current = itemsRef.current
      .map((it) => ({ ...it, ry: it.ry + dyRatio }))
      .filter((it) => {
        const px = playerRx.current * vw;
        const py = vh - PLAYER_SIZE;
        const ix = it.rx * vw;
        const iy = it.ry * vh;

        if (isHit(px, py, PLAYER_SIZE, ix, iy, it.size)) {
          const itemScore = ITEM_TYPES[it.type].score;

          // 서버에 델타 보고
          emitMiniGameScoreUpdate({ score: itemScore });

          // 히트 이펙트
          hitEffectsRef.current.push({
            id: Date.now() + Math.random(),
            x: px + PLAYER_SIZE / 2,
            y: py,
            text: (itemScore > 0 ? "+" : "") + itemScore,
            color: itemScore > 0 ? "#4ade80" : "#f87171",
            start: performance.now(),
          });
          setTimeout(() => {
            // 만약 게임이 바뀌었으면(재시작) 그냥 버려도 무방
            hitEffectsRef.current = hitEffectsRef.current.filter(
              (fx) => fx.start + 1000 > performance.now()
            );
          }, 1000);
          return false;
        }
        if (iy > vh + 60) return false;
        return true;
      });

    // 렌더 트리거
    forceRerender((f) => f + 1);

    // 다음 프레임
    rafRef.current = requestAnimationFrame((nts) => {
      // 게임이 바뀌었거나 종료되었으면 중단
      if (!runningRef.current || myGameId !== gameIdRef.current) return;
      tick(nts);
    });
  };

  // ----- 시작/일시정지/재개 -----
  const internalStart = (fresh = false) => {
    // 이미 실행 중이면 무시
    if (runningRef.current) return;

    // 새로운 게임 ID 부여 (fresh일 때만 완전 초기화)
    if (fresh) {
      gameIdRef.current += 1;

      // 타이머/RAF 정리
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (overTimeoutRef.current) {
        clearTimeout(overTimeoutRef.current);
        overTimeoutRef.current = null;
      }

      // 상태/레퍼런스 초기화
      itemsRef.current = [];
      hitEffectsRef.current = [];
      idRef.current = 0;
      lastSpawnRef.current = 0;
      playerRx.current = Math.max(0, 0.5 - PLAYER_SIZE / (2 * vw));

      elapsedOffsetMsRef.current = 0;
      lastTsRef.current = 0;
      startTsRef.current = 0;

      setTimeLeft(GAME_TIME);
      setFinalScore(null);

      // 낙관적 점수 리셋(서버 동기화 오기 전 표시 안정)
      setScore(0);
    }

    setRunning(true);
    runningRef.current = true;

    startTsRef.current = performance.now();
    lastTsRef.current = startTsRef.current;
    lastSpawnRef.current = startTsRef.current;

    rafRef.current = requestAnimationFrame(tick);
    wrapRef.current?.focus();
  };

  const internalPause = () => {
    if (!runningRef.current) return;
    setRunning(false);
    runningRef.current = false;
    elapsedOffsetMsRef.current += performance.now() - startTsRef.current;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const goToHome = () => {
    try {
      emitMiniGameLeave();
    } catch {}
    navigate("/home");
  };

  // ----- 언마운트 정리 -----
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (overTimeoutRef.current) {
        clearTimeout(overTimeoutRef.current);
        overTimeoutRef.current = null;
      }
      try {
        emitMiniGameLeave();
      } catch {}
    };
  }, []);

  // =============== 렌더 ===============
  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onClick={handleWrapperClick}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      className="w-full h-screen bg-cover bg-center relative overflow-hidden outline-none"
      style={{ backgroundImage: `url(${background})` }}
    >
      {/* HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 text-rose-500 z-10">
        <div className="px-4 py-2 bg-rose-100/70 rounded-xl text-2xl font-semibold">
          ⏱ {timeLeft}s
        </div>
        <div className="px-4 py-2 bg-rose-100/70 rounded-xl text-2xl font-semibold">
          ⭐ {score}
        </div>
      </div>

      {/* 플레이어 */}
      <img
        src={playerImg}
        alt="대표캐릭터"
        className="absolute bottom-0 w-40 h-40 z-10 select-none"
        draggable={false}
        style={{ left: playerRx.current * vw }}
      />

      {/* 아이템 */}
      {itemsRef.current.map((it) => {
        const ix = it.rx * vw;
        const iy = it.ry * vh;
        return (
          <img
            key={it.id}
            src={ITEM_TYPES[it.type].img}
            alt={it.type}
            className="absolute z-0 select-none"
            draggable={false}
            style={{ left: ix, top: iy, width: it.size, height: it.size }}
          />
        );
      })}

      {/* 획득 효과 */}
      {hitEffectsRef.current.map((fx) => {
        const progress = Math.min(1, (performance.now() - fx.start) / 1000);
        return (
          <div
            key={fx.id}
            className="absolute z-20 font-bold text-3xl select-none pointer-events-none"
            style={{
              left: fx.x,
              top: fx.y - progress * 40,
              color: fx.color,
              opacity: 1 - progress,
              transform: "translateX(-50%)",
            }}
          >
            {fx.text}
          </div>
        );
      })}

      {/* 컨트롤 */}
      <div
        className={`absolute z-10 flex gap-3 ${
          !running && timeLeft === GAME_TIME
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : "top-20 left-1/2 -translate-x-1/2"
        }`}
      >
        {!running && timeLeft === GAME_TIME && (
          <button
            onClick={() => {
              emitMiniGameJoin();
              internalStart(true);
              playSound("game_start");
            }}
            className="px-5 py-2 h-15 w-28 text-md shadow-cyan-600 bg-cyan-500 text-white font-bold shadow"
          >
            게임시작
          </button>
        )}

        {running ? (
          <button
            onClick={() => {
              internalPause();
              playSound("click");
            }}
            className="px-5 py-2 shadow-amber-600 bg-amber-500 text-white font-bold shadow"
          >
            중지
          </button>
        ) : (
          timeLeft > 0 &&
          timeLeft < GAME_TIME && (
            <button
              onClick={() => {
                internalStart(false);
                playSound("click");
              }}
              className="px-5 py-2 shadow-sky-600 bg-sky-500 text-white font-bold shadow"
            >
              재개
            </button>
          )
        )}
      </div>

      {/* 나가기 */}
      <div className="absolute top-10 right-20 translate-x-1/2 flex gap-3 z-10">
        <button
          onClick={() => {
            goToHome();
            playSound("click");
          }}
          className="px-5 py-2 shadow-rose-600 bg-rose-500 text-white font-bold shadow"
        >
          나가기
        </button>
      </div>

      {/* 설명 버튼 */}
      <div className="absolute top-10 left-10 translate-x-1/2 flex gap-3 z-10">
        <button
          onClick={() => {
            setShowInfo(true);
            playSound("click");
          }}
          className="w-10 h-10 rounded-full bg-pink-500 shadow-rose-100 text-white font-bold shadow flex items-center justify-center"
          title="게임 설명"
        >
          i
        </button>
      </div>

      {/* 게임오버 */}
      {!running && timeLeft === 0 && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
          <div className="text-3xl font-bold mb-2">GAME OVER</div>
          <div
            className={`text-xl mb-6 font-bold ${
              (finalScore ?? score) >= 600 ? "text-green-400" : "text-rose-400"
            }`}
          >
            최종 점수: {finalScore ?? score}
          </div>
          <div className="text-lg mb-6">
            {(finalScore ?? score) >= 600 ? (
              <p className="flex items-center text-yellow-400 font-bold">
                <img src={coin} alt="coin" className="w-6 h-6 mr-1" />
                10코인 <span className="text-white ml-1">획득 !</span>
              </p>
            ) : (
              "ㅠㅠ 다시 도전하세요"
            )}
          </div>
          <div className="gap-3 flex">
            <button
              onClick={() => {
                emitMiniGameJoin();
                internalStart(true);
                playSound("click");
              }}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold shadow"
            >
              다시하기
            </button>
            <button
              onClick={() => {
                goToHome();
                playSound("click");
              }}
              className="px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold shadow"
            >
              홈으로
            </button>
          </div>
        </div>
      )}

      {/* 설명 모달 */}
      {showInfo && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-rose-100 text-black rounded-xl shadow-lg p-6 w-[400px]">
            <h2 className="text-xl font-bold mb-4">게임 설명</h2>
            <p className="mb-2">좌우 방향키로 푸키를 움직이세요!</p>
            <p className="mb-6 text-xs">
              떨어지는 재료를 먹으면 점수를 얻습니다.
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li className="flex items-center gap-2">
                <img src={egg} alt="계란" className="w-8 h-8" />
                계란: <b className="text-green-500">+30점</b>
              </li>
              <li className="flex items-center gap-2">
                <img src={milk} alt="우유" className="w-8 h-8" />
                우유: <b className="text-green-500">+20점</b>
              </li>
              <li className="flex items-center gap-2">
                <img src={sugar} alt="설탕" className="w-8 h-8" />
                설탕: <b className="text-green-500">+10점</b>
              </li>
              <li className="flex items-center gap-2">
                <img src={poop} alt="똥" className="w-8 h-8" />
                똥: <b className="text-red-500">-20점</b>
              </li>
            </ul>
            <p className="mb-6 text-md">
              <b className="text-pink-500">30초</b> 동안{" "}
              <b className="text-violet-500">600점</b> 이상이면{" "}
              <b className="text-amber-500">10코인</b> 지급!
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInfo(false)}
                className="px-4 py-2 bg-rose-500 text-white font-bold shadow"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에러 모달 */}
      <PopUpModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="요청 오류"
        description="요청 처리에 문제가 발생해 홈으로 이동합니다."
      />
    </div>
  );
}
