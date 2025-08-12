// src/pages/FallingFoodPage.jsx
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

const ITEM_TYPES = {
  EGG: { img: egg, score: 30, size: 64 },
  MILK: { img: milk, score: 20, size: 72 },
  SUGAR: { img: sugar, score: 10, size: 56 },
  POOP: { img: poop, score: -20, size: 64 },
};
const ITEM_KEYS = Object.keys(ITEM_TYPES);

const PLAYER_SIZE = 140;

// ✅ 초당 픽셀(pps) 기반 속도들
const PLAYER_SPEED_PPS = 600; // 대략 10px/frame @60fps
const BASE_FALL_SPEED_PPS = 240; // 대략 4px/frame @60fps
const MAX_FALL_BONUS_PPS = 360; // 낙하 가속 최대 추가치
const FALL_ACCEL_PPS_PER_SEC = 30; // 초당 가속치

const SPAWN_INTERVAL_MS = 600; // 시작 스폰 주기
const SPAWN_INTERVAL_MIN_MS = 220; // 최소 스폰 주기
const SPAWN_REDUCE_MS_PER_SEC = 9; // 초당 스폰주기 감소

const GAME_TIME = 30;

export default function FallingFoodPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const playerImg =
    characterImageMap[user?.repCharacter?.characterName] || defaultCharacter;

  const wrapRef = useRef(null);
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(720);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [running, setRunning] = useState(false);
  const [, setFrame] = useState(0); // 렌더 트리거
  // 설명 모달
  const [showInfo, setShowInfo] = useState(false);

  // ==== 내부 동작용 refs ====
  const runningRef = useRef(false); // 최신 실행 상태
  const playerX = useRef(0);
  const keyRef = useRef({ left: false, right: false });
  const itemsRef = useRef([]); // {id,type,x,y,size}
  const idRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastTsRef = useRef(0);
  const startTsRef = useRef(0); // ✅ 게임 시작 시간(ms)
  const rafRef = useRef(null);
  const hitEffectsRef = useRef([]); // {id,x,y,text,color,start}

  // 첫 렌더: 중앙 배치
  useLayoutEffect(() => {
    const w =
      wrapRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    playerX.current = Math.max(0, (w - PLAYER_SIZE) / 2);
  }, []);

  // 컨테이너 리사이즈
  useEffect(() => {
    const resize = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      setVw(rect.width);
      setVh(rect.height);
      if (!runningRef.current && timeLeft === GAME_TIME) {
        playerX.current = Math.max(0, (rect.width - PLAYER_SIZE) / 2);
      } else {
        playerX.current = Math.min(
          playerX.current,
          Math.max(0, rect.width - PLAYER_SIZE)
        );
      }
      setFrame((f) => f + 1);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [timeLeft]);

  // 포커스 보장
  useEffect(() => {
    const t = setTimeout(() => wrapRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);
  const handleWrapperClick = () => wrapRef.current?.focus();

  // 방향키(래퍼에만 바인딩)
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

  // 충돌(AABB)
  const isHit = (ax, ay, as, bx, by, bs) =>
    !(ax + as < bx || ax > bx + bs || ay + as < by || ay > by + bs);

  // 스폰/난이도
  const spawnItem = () => {
    const key = ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)];
    const spec = ITEM_TYPES[key];
    const size = spec.size;
    const x = Math.random() * Math.max(1, vw - size);
    itemsRef.current.push({
      id: idRef.current++,
      type: key,
      x,
      y: -size,
      size,
    });
  };

  // ✅ 시간 기반 속도/주기 (실행마다 동일)
  const fallSpeedPps = (elapsedSec) =>
    BASE_FALL_SPEED_PPS +
    Math.min(MAX_FALL_BONUS_PPS, elapsedSec * FALL_ACCEL_PPS_PER_SEC);

  const spawnIntervalMsByTime = (elapsedSec) =>
    Math.max(
      SPAWN_INTERVAL_MIN_MS,
      SPAWN_INTERVAL_MS - Math.min(350, elapsedSec * SPAWN_REDUCE_MS_PER_SEC)
    );

  // RAF 루프 (runningRef로 최신값 확인)
  const tick = (ts) => {
    if (!runningRef.current) return; // 중지 상태면 종료

    // dt(초) 계산 (탭 복귀 급점프 방지 위해 50ms 캡)
    if (!lastTsRef.current) lastTsRef.current = ts;
    const dtSec = Math.min(0.05, (ts - lastTsRef.current) / 1000);
    lastTsRef.current = ts;

    // 경과/잔여 시간 (초) – setTimeout 없이 동일 동작
    const elapsedSec = Math.max(0, (ts - startTsRef.current) / 1000);
    const remain = Math.max(0, GAME_TIME - Math.floor(elapsedSec));
    if (remain !== timeLeft) setTimeLeft(remain);
    if (elapsedSec >= GAME_TIME) {
      setRunning(false);
      runningRef.current = false;
      return;
    }

    // 이동 (pps * dt)
    const dir = (keyRef.current.right ? 1 : 0) - (keyRef.current.left ? 1 : 0);
    playerX.current = Math.max(
      0,
      Math.min(
        vw - PLAYER_SIZE,
        playerX.current + dir * PLAYER_SPEED_PPS * dtSec
      )
    );

    // 스폰
    const interval = spawnIntervalMsByTime(elapsedSec);
    if (!lastSpawnRef.current) lastSpawnRef.current = ts;
    if (ts - lastSpawnRef.current > interval) {
      lastSpawnRef.current = ts;
      spawnItem();
    }

    // 낙하 + 충돌
    const dy = fallSpeedPps(elapsedSec) * dtSec;
    let delta = 0;
    itemsRef.current = itemsRef.current
      .map((it) => ({ ...it, y: it.y + dy }))
      .filter((it) => {
        const px = playerX.current;
        const py = vh - PLAYER_SIZE; // 캐릭터 실제 top 근처
        if (isHit(px, py, PLAYER_SIZE, it.x, it.y, it.size)) {
          const itemScore = ITEM_TYPES[it.type].score;
          delta += itemScore;

          // 획득 이펙트
          hitEffectsRef.current.push({
            id: Date.now() + Math.random(),
            x: px + PLAYER_SIZE / 2,
            y: py,
            text: (itemScore > 0 ? "+" : "") + itemScore,
            color: itemScore > 0 ? "#4ade80" : "#f87171",
            start: performance.now(),
          });
          // 1초 뒤 제거
          setTimeout(() => {
            hitEffectsRef.current = hitEffectsRef.current.filter(
              (fx) => fx.start + 1000 > performance.now()
            );
          }, 1000);

          return false;
        }
        if (it.y > vh + 60) return false;
        return true;
      });

    if (delta) setScore((s) => Math.max(0, s + delta));

    // 리렌더 + 다음 프레임
    setFrame((f) => f + 1);
    rafRef.current = requestAnimationFrame(tick);
  };

  // 제어
  const start = () => {
    if (runningRef.current) return;
    setRunning(true);
    runningRef.current = true; // ★ 즉시 ref 동기화
    startTsRef.current = performance.now(); // ✅ 시작 시각 저장
    lastTsRef.current = startTsRef.current; // 첫 dt 안정화
    lastSpawnRef.current = startTsRef.current;
    rafRef.current && cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    wrapRef.current?.focus();
  };
  const pause = () => {
    setRunning(false);
    runningRef.current = false; // ★ 즉시 ref 동기화
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
  const restart = () => {
    setScore(0);
    setTimeLeft(GAME_TIME - 1);
    itemsRef.current = [];
    hitEffectsRef.current = [];
    idRef.current = 0;
    lastSpawnRef.current = 0;
    playerX.current = Math.max(0, (vw - PLAYER_SIZE) / 2);
    setFrame((f) => f + 1);
    start();
  };
  const goToHome = () => {
    navigate("/home");
  };

  // 정리
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 text-white z-10">
        <div className="px-4 py-2 bg-black/50 rounded-xl text-lg font-semibold">
          ⏱ {timeLeft}s
        </div>
        <div className="px-4 py-2 bg-black/50 rounded-xl text-lg font-semibold">
          ⭐ {score}
        </div>
      </div>

      {/* 플레이어 */}
      <img
        src={playerImg}
        alt="대표캐릭터"
        className="absolute bottom-0 w-40 h-40 z-10 select-none"
        draggable={false}
        style={{ left: Math.round(playerX.current) }}
      />

      {/* 아이템 */}
      {itemsRef.current.map((it) => (
        <img
          key={it.id}
          src={ITEM_TYPES[it.type].img}
          alt={it.type}
          className="absolute z-0 select-none"
          draggable={false}
          style={{ left: it.x, top: it.y, width: it.size, height: it.size }}
        />
      ))}

      {/* 획득 효과 */}
      {hitEffectsRef.current.map((fx) => {
        const progress = Math.min(1, (performance.now() - fx.start) / 1000);
        const translateY = -progress * 40;
        const opacity = 1 - progress;
        return (
          <div
            key={fx.id}
            className="absolute z-20 font-bold text-xl select-none pointer-events-none"
            style={{
              left: fx.x,
              top: fx.y + translateY,
              color: fx.color,
              opacity,
              transform: "translateX(-50%)",
            }}
          >
            {fx.text}
          </div>
        );
      })}

      {/* 컨트롤 바 */}
      <div
        className={`absolute z-10 flex gap-3
    ${
      !running && timeLeft === GAME_TIME
        ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        : "top-20 left-1/2 -translate-x-1/2"
    }`}
      >
        {/* START: 아직 시작 전 */}
        {!running && timeLeft === GAME_TIME && (
          <button
            onClick={start}
            className="px-5 py-2 h-15 w-25 text-lg shadow-cyan-600 bg-cyan-500 text-white font-bold shadow"
          >
            START
          </button>
        )}

        {/* PAUSE / RESUME */}
        {running ? (
          <button
            onClick={pause}
            className="px-5 py-2 shadow-amber-600 bg-amber-500 text-white font-bold shadow"
          >
            PAUSE
          </button>
        ) : (
          timeLeft > 0 &&
          timeLeft < GAME_TIME && (
            <button
              onClick={start}
              className="px-5 py-2 shadow-sky-600 bg-sky-500 text-white font-bold shadow"
            >
              RESUME
            </button>
          )
        )}

        {/* RESTART */}
        {!running && timeLeft === 0 && (
          <button
            onClick={restart}
            className="px-5 py-2 shadow-rose-600 bg-rose-500 text-white font-bold shadow"
          >
            RESTART
          </button>
        )}
      </div>

      <div className="absolute top-10 right-20 translate-x-1/2 flex gap-3 z-10">
        <button
          onClick={goToHome}
          className="px-5 py-2 shadow-rose-600 bg-rose-500 text-white font-bold shadow"
        >
          나가기
        </button>
      </div>

      <div className="absolute top-10 left-10 translate-x-1/2 flex gap-3 z-10">
        {/* i: 설명 */}
        <button
          onClick={() => setShowInfo(true)}
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
          <div className="text-xl mb-6">최종 점수: {score}</div>
          <div className="gap-3 flex">
            <button
              onClick={restart}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold shadow"
            >
              다시하기
            </button>
            <button
              onClick={goToHome}
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
            <p className="mb-2">좌우 방향키로 당신의 푸키를 움직이세요 !</p>
            <p className="mb-6 text-xs">
              떨어지는 재료를 먹으면 점수를 얻을 수 있습니다
            </p>
            <ul className="list-disc pl-5 mb-4">
              <li>
                계란: <b className="text-green-500">+30점</b>
                <img src={egg} alt="계란" className="w-10 h-10" />
              </li>
              <li>
                우유: <b className="text-green-500">+20점</b>
                <img src={milk} alt="우유" className="w-10 h-10" />
              </li>
              <li>
                설탕: <b className="text-green-500">+10점</b>
                <img src={sugar} alt="설탕" className="w-10 h-10" />
              </li>
              <li>
                똥: <b className="text-red-500">-20점</b>
                <img src={poop} alt="똥" className="w-10 h-10" />
              </li>
            </ul>
            <p className="mb-6 text-xs">
              <b className="text-pink-500">30초</b> 동안{" "}
              <b className="text-violet-500">600점</b> 이상을 획득 시{" "}
              <b className="text-amber-500">10코인</b> 지급 !
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
    </div>
  );
}
