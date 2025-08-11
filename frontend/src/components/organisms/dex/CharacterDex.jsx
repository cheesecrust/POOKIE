import { useEffect, useMemo, useState, useRef } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import CharacterCard from "../../molecules/dex/CharacterCard";
import RightButton from "../../atoms/button/RightButton";

// 기준 캔버스 크기 (현재 좌표에 맞게 숫자만 유지)
const BASE_W = 960;
const BASE_H = 360;

const CharacterDex = ({ onAfterChange }) => {
  const [dex, setDex] = useState([]);
  const outerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // 해금/대표
  const unlockedSet = useMemo(() => new Set(dex.map(d => d.characterName)), [dex]);
  const representName = useMemo(
    () => dex.find(d => d.represent)?.characterName || null,
    [dex]
  );

  // 새 푸키 받기 
  const handleGetNewPookie = async () => {
    try {
      await axiosInstance.post("/characters/new-pookie");
      // 갱신
      await fetchDex();          // 도감 새로고침
      onAfterChange?.();         // 좌측 유저정보/대표캐릭터 갱신
    } catch (e) {
      console.log("새 푸키 받기 실패:", e);
    }
  };

  // 기존 좌표 그대로 사용 (px)
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

  // 도감 조회 
  const fetchDex = async () => {
    try {
      const res = await axiosInstance.get("/characters/catalog");
      setDex(res.data || []);
      console.log("도감 조회",res.data);
    } catch (e) {
      console.log("도감 조회 실패:", e);
    }
  };

  const setRepresent = async (name) => {
    try {
      await axiosInstance.put("/characters/representative", { characterName: name });
      setDex(prev => prev.map(d => ({ ...d, represent: d.characterName === name })));
      onAfterChange?.();
    } catch (e) {
      console.log("대표 변경 실패:", e);
    }
  };

  useEffect(() => { fetchDex(); }, []);



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
        const ax = a.x + 42, ay = a.y + 84 ; // 카드(84x84) 기준 하단/상단 중앙
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
        onDoubleClick={() =>
          unlockedSet.has(name) && setRepresent(name)
        }
        // CharacterCard가 고정 크기라면 w/h 100%로 바꿔 쓰기
        className="w-full h-full"
      />
    </div>
  );

  return (
    <div className="w-full">
      {/* 탭 내부 상단 툴바 */}
      <div className="mb-3 flex items-center justify-end">
        <RightButton
          size="sm"
          onClick={handleGetNewPookie}
          className="rounded-md"
          children="새 푸키푸키 받기"
        />
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
