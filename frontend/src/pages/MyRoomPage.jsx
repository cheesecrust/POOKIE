import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import background_myroom from "../assets/background/background_myroom.png";
import FriendMessageWrapper from "../components/organisms/common/FriendMessageWrapper";
import useAuthStore from "../store/useAuthStore";
import characterImageMap from "../utils/characterImageMap";
import RightButton from "../components/atoms/button/RightButton";
import UserExp from "../components/atoms/user/UserExp";
import InventoryList from "../components/organisms/myRoom/InventoryList";
import StoreList from "../components/organisms/myRoom/StoreList";
import CharacterDex from "../components/organisms/dex/CharacterDex";

import coinImg from "../assets/item/coin.png";
import evolveEffect from "../assets/effect/evolve.gif";
import axiosInstance from "../lib/axiosInstance";
import useSound from "../utils/useSound";

const MyRoomPage = () => {
  const navigate = useNavigate();
  const { playSound } = useSound();

  // 이펙트
  const [showEvolve, setShowEvolve] = useState(false);
  const evolveTimeRef = useRef(null);

  const [activeTab, setActiveTab] = useState("도감");
  const { setUser } = useAuthStore();
  const [userInfo, setUserInfo] = useState(null);

  const [coin, setCoin] = useState(null);
  const [step, setStep] = useState(null);
  const [exp, setExp] = useState(null);

  // 대표/성장 요약 (도감에서)
  const [dexSummary, setDexSummary] = useState({ repName: null, growingName: null });

  const repName = userInfo?.repCharacter?.characterName;
  const forceFull = repName ? (dexSummary.growingName ? dexSummary.growingName !== repName : true) : false;

  // 대표 변경 감지 (id가 있으면 우선, 없으면 name 폴백)
  const repKey = userInfo?.repCharacter?.characterId ?? userInfo?.repCharacter?.characterName;
  const prevRepKeyRef = useRef(null);

  // step 비교용
  const prevStepRef = useRef(null);

  // 도감 요약 조회 (growing/represent)
  const loadDexSummary = async () => {
    try {
      const res = await axiosInstance.get("/characters/catalog");
      const list = res.data || [];
      console.log("도감",list);
      const rep = list.find(d => d.represent)?.characterName ?? null;
      const growing = list.find(d => d.growing)?.characterName ?? null;
      setDexSummary({ repName: rep, growingName: growing });
    } catch (e) {
      console.log("도감 요약 조회 실패:", e);
    }
  };

  // auth/info
  const fetchAuthInfo = async () => {
    try {
      const res = await axiosInstance.get("/auth/info");
      setUserInfo(res.data.data);
      setCoin(res.data.data.coin);
      setStep(res.data.data.repCharacter.step);
      setUser(res.data.data);
      setExp(res.data.data.repCharacter.exp);
    } catch (err) {
      console.log("AuthInfo 에러", err);
    }
  };

  // 둘 다 새로고침 (도감/좌측 동기화)
  const refreshAll = async () => {
    await Promise.allSettled([fetchAuthInfo(), loadDexSummary()]);
  };

  // 공용 이펙트 트리거
  const triggerEvolveEffect = () => {
    playSound("grow");
    if (evolveTimeRef.current) clearTimeout(evolveTimeRef.current);
    setShowEvolve(true);
    evolveTimeRef.current = setTimeout(() => {
      setShowEvolve(false);
      // 이펙트 종료 뒤 한 번 더 동기화
      refreshAll();
    }, 1800);
  };

  // 초기 로드
  useEffect(() => {
    refreshAll();
  }, []);

  // 레벨업(진화) 이펙트
  useEffect(() => {
    if (typeof step !== "number") return;
    if (prevStepRef.current === null) {
      prevStepRef.current = step;
      return;
    }
    if (step > prevStepRef.current) {
      triggerEvolveEffect();
    }
    prevStepRef.current = step;
    return () => {
      if (evolveTimeRef.current) clearTimeout(evolveTimeRef.current);
    };
  }, [step]);

  // 대표 변경 이펙트
  useEffect(() => {
    if (!repKey) return;
    if (prevRepKeyRef.current === null) {
      prevRepKeyRef.current = repKey;
      return;
    }
    if (repKey !== prevRepKeyRef.current) {
      triggerEvolveEffect();
    }
    prevRepKeyRef.current = repKey;
  }, [repKey]);

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden font-['DungGeunMo'] bg-cover bg-center"
      style={{ backgroundImage: `url(${background_myroom})` }}
    >
      {/* 홈 버튼 */}
      <div className="absolute top-6 right-6">
        <RightButton onClick={() => navigate("/home")}>HOME</RightButton>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 mt-20">
          {/* 좌측 - 유저정보 + 캐릭터 */}
          <div className="w-full lg:w-1/3 xl:w-1/4 relative mt-20">
            {/* 유저 정보 박스 */}
            <div className="bg-[#FDE1F0] h-[300px] rounded-lg p-6 relative mb-6">
              <h2 className="text-2xl font-bold mb-4 text-center">마이룸</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-md">
                  <span className="font-semibold">닉네임:</span>
                  <span>{userInfo?.nickname}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-md">
                  <span className="font-semibold">대표 캐릭터:</span>
                  <span>{userInfo?.repCharacter?.characterName}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-md">
                  <span className="font-semibold">레벨:</span>
                  <span>LV {typeof step === "number" ? step + 1 : "-"}</span>
                </div>

                <div className="p-2 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">Exp:</span>
                    <UserExp step={step} exp={exp} forceFull={forceFull} />
                  </div>
                </div>
              </div>
            </div>

            {/* 캐릭터 이미지 + 진화 이펙트 */}
            <div className="relative w-full min-h-[300px] rounded-lg p-4 mt-4">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={
                    characterImageMap[userInfo?.repCharacter?.characterName] ||
                    characterImageMap.default
                  }
                  alt="대표 캐릭터"
                  className="max-w-full max-h-[250px] object-contain"
                  onClick={() => playSound("pookie")}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = characterImageMap.default;
                  }}
                />

                {showEvolve && (
                  <img
                    src={evolveEffect}
                    alt="evolve effect"
                    className="absolute z-20 pointer-events-none max-w-full max-h-[250px] object-contain"
                    style={{ inset: 0, margin: "auto" }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 돈 영역 */}
          <div className="absolute top-24 right-36 flex items-center gap-2">
            <img src={coinImg} alt="coin" className="w-10 h-10 object-contain" />
            <div className="w-[200px] h-[40px] flex justify-end items-center bg-white border-2 border-black rounded-full px-4 py-1 shadow-md">
              <span className="font-bold text-lg tracking-widest">
                {userInfo?.coin?.toLocaleString?.() ?? 0}
              </span>
            </div>
          </div>

          {/* 우측 - 탭 + 컨텐츠 영역 */}
          <div className="flex-1">
            {/* 탭 버튼 */}
            <div className="flex border-black">
              {["도감", "상점", "인벤토리"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-bold text-lg relative ${
                    activeTab === tab
                      ? "bg-pink-300 text-black border-t-2 border-l-2 border-r-2 border-black rounded-t-lg"
                      : "bg-white text-gray-600 hover:bg-pink-100"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-pink-500" />
                  )}
                </button>
              ))}
            </div>

            {/* 컨텐츠 영역 */}
            <div className="bg-[#FDE1F0] rounded-b-lg rounded-r-lg p-6 min-h-[600px] shadow-inner">
              {activeTab === "도감" && (
                <div className="text-center py-10">
                  <CharacterDex onAfterChange={refreshAll} />
                </div>
              )}

              {activeTab === "상점" && (
                <div className="text-center py-10">
                  <StoreList onBuySuccess={refreshAll} />
                </div>
              )}

              {activeTab === "인벤토리" && (
                <div className="text-center py-10">
                  <InventoryList onUseSuccess={refreshAll} refreshTrigger={activeTab} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 친구 버튼 */}
      <FriendMessageWrapper />
    </div>
  );
};

export default MyRoomPage;
