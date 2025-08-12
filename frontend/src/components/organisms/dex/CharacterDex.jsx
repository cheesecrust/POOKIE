import { useEffect, useMemo, useState, useRef } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import CharacterCard from "../../molecules/dex/CharacterCard";
import RightButton from "../../atoms/button/RightButton";

// 기준 캔버스 크기
const BASE_W = 960;
const BASE_H = 360;

const CharacterDex = ({ onAfterChange }) => {
  const [dex, setDex] = useState([]);
  const outerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // 새 푸키 버튼/로딩
  const [isPookieButtonActive, setIsPookieButtonActive] = useState(false);
  const [newPookieLoading, setNewPookieLoading] = useState(false);

  // 안내 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  // 해금/대표
  const unlockedSet = useMemo(() => new Set(dex.map(d => d.characterName)), [dex]);
  const representName = useMemo(
    () => dex.find(d => d.represent)?.characterName || null,
    [dex]
  );

  // 도감에서 바로 꺼내 쓰기: 이름 → 정보
  const nameToInfo = useMemo(() => {
    const m = new Map();
    dex.forEach(d => m.set(d.characterName, d)); // { id, characterId, ... }
    return m;
  }, [dex]);

  // 버튼 활성: 모든 캐릭터가 성장 종료일 때만
  useEffect(() => {
    setIsPookieButtonActive(dex.length > 0 && dex.every(d => d.growing === false));
  }, [dex]);

  // 도감 조회
  const fetchDex = async () => {
    try {
      const res = await axiosInstance.get("/characters/catalog");
      setDex(res.data || []);
    } catch (e) {
      console.log("도감 조회 실패:", e);
    }
  };

  // 새 푸키 받기
  const handleGetNewPookie = async () => {
    if (newPookieLoading) return;
    setNewPookieLoading(true);
    try {
      setIsPookieButtonActive(false);
      await axiosInstance.post("/characters/new-pookie");
      await fetchDex();      // 도감 새로고침
      onAfterChange?.();     // 좌측 정보 갱신
      setModalMsg("새 푸키푸키를 발급했어요!\n도감에서 확인해보세요.");
      setModalOpen(true);
    } catch (e) {
      console.log("새 푸키 받기 실패:", e);
      // 실패 시 복구 + 안내
      setIsPookieButtonActive(true);
      setModalMsg("발급 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.");
      setModalOpen(true);
    } finally {
      setNewPookieLoading(false);
    }
  };

  // 대표 캐릭터 변경
  const setRepresent = async (id, characterId) => {
    try {
      const res = await axiosInstance.put("/characters/representative", { id, characterId });
      setDex(prev => prev.map(d => ({ ...d, represent: d.id === id })));
      console.log("대표 변경",res);
      onAfterChange?.();
    } catch (e) {
      console.log("대표 변경 실패:", e);
    }
  };

  useEffect(() => { fetchDex(); }, []);

  // 좌표
  const pos = {
    strawberrypudding: { x: 40,  y: 20 },
    blueberrypudding:  { x: 130, y: 20 },
    buldakpudding:     { x: 220, y: 20 },
    greenteapudding:   { x: 365, y: 20 },
    melonpudding:      { x: 455, y: 20 },
    chocopudding:      { x: 545, y: 20 },
    milkpudding:       { x: 690, y: 20 },
    creampudding:      { x: 780, y: 20 },
    caramelpudding:    { x: 870, y: 20 },
    redpookie:    { x: 130, y: 130 },
    greenpookie:  { x: 455, y: 130 },
    yellowpookie: { x: 780, y: 130 },
    pookiepookie: { x: 455, y: 260 },
  };

  const edges = [
    ["strawberrypudding", "redpookie"],
    ["blueberrypudding",  "redpookie"],
    ["buldakpudding",     "redpookie"],
    ["greenteapudding",   "greenpookie"],
    ["melonpudding",      "greenpookie"],
    ["chocopudding",      "greenpookie"],
    ["milkpudding",       "yellowpookie"],
    ["creampudding",      "yellowpookie"],
    ["caramelpudding",    "yellowpookie"],
    ["redpookie",   "pookiepookie"],
    ["greenpookie", "pookiepookie"],
    ["yellowpookie","pookiepookie"],
  ];

  // 선 (SVG)
  const renderEdges = () => (
    <svg
      className="absolute inset-0"
      width={BASE_W}
      height={BASE_H}
      style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
    >
      {edges.map(([from, to], i) => {
        const a = pos[from], b = pos[to];
        if (!a || !b) return null;
        const ax = a.x + 42, ay = a.y + 84; // 카드(84x84) 기준 하단/상단 중앙
        const bx = b.x + 42, by = b.y;
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="#000" strokeWidth="2" />;
      })}
    </svg>
  );

  // 노드
  const Node = ({ name }) => (
    <div
      className="absolute"
      style={{
        left: pos[name].x * scale,
        top: pos[name].y * scale,
        width: 84 * scale,
        height: 84 * scale,
      }}
    >
      <CharacterCard
        name={name}
        unlocked={unlockedSet.has(name)}
        isRepresent={representName === name}
        onDoubleClick={() => {
          if (!unlockedSet.has(name)) return;
          const info = nameToInfo.get(name); // { id, characterId, ... }
          if (!info) return;
          setRepresent(info.id, info.characterId);
        }}
        className="w-full h-full"
      />
    </div>
  );

  // 현재 대표/성장 문자열
  const rep = dex.find(d => d.represent) || null;
  const growingNames = dex.filter(d => d.growing).map(d => d.characterName);
  const canGetNewPookie = isPookieButtonActive && !newPookieLoading;
  return (
    <div className="w-full">
      {/* 상단 안내 + 버튼 */}
      <div className="mb-3 flex flex-col items-center gap-2">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">푸키 LV3</span>되면 <span className="font-semibold">새로운 푸키푸키</span>를 발급받아요.
          <span className="font-semibold"> 더블클릭</span>하면 대표 푸키를 바꿀 수 있어요!
        </p>

        <div className="flex items-center gap-2 flex-wrap w-full justify-center">
          <span className="px-2 py-1 text-xs bg-white/80 border border-black/10 rounded-full">
            대표: <span className="font-semibold">{rep?.characterName ?? "없음"}</span>
          </span>
          <span className="px-2 py-1 text-xs bg-white/80 border border-black/10 rounded-full">
            성장 중: <span className="font-semibold">{growingNames.length ? growingNames.join(", ") : "없음"}</span>
          </span>

          {canGetNewPookie ? (
            <RightButton
              size="sm"
              onClick={handleGetNewPookie}
              className={`rounded-md ${newPookieLoading ? "pointer-events-none opacity-50" : ""}`}
            >
              {newPookieLoading ? "발급 중..." : "새 푸키푸키 받기"}
            </RightButton>
          ) : (
            <span className="text-xs text-gray-500">아직 푸키 재발급 버튼이 활성화되지않았어요!</span>
          )}
        </div>
      </div>

      {/* 트리(스케일 박스) */}
      <div ref={outerRef} className="relative w-full overflow-hidden">
        <div
          className="relative"
          style={{
            width: BASE_W,
            height: BASE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {renderEdges()}
          {/* 노드들 */}
          <Node name="strawberrypudding" />
          <Node name="blueberrypudding" />
          <Node name="buldakpudding" />
          <Node name="greenteapudding" />
          <Node name="melonpudding" />
          <Node name="chocopudding" />
          <Node name="milkpudding" />
          <Node name="creampudding" />
          <Node name="caramelpudding" />
          <Node name="redpookie" />
          <Node name="greenpookie" />
          <Node name="yellowpookie" />
          <Node name="pookiepookie" />
        </div>
      </div>


    </div>
  );
};

export default CharacterDex;
