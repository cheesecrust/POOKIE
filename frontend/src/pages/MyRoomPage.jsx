import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import background_myroom from "../assets/background/background_myroom.png";
import FriendMessageWrapper from "../components/organisms/common/FriendMessageWrapper";
import useAuthStore from "../store/useAuthStore";
import characterImageMap from "../utils/characterImageMap";
import RightButton from "../components/atoms/button/RightButton";
import UserExp from "../components/atoms/user/UserExp";
import TapButton from "../components/atoms/button/TapButton";
import InventoryList from "../components/organisms/myRoom/InventoryList";
import StoreList from "../components/organisms/myRoom/StoreList";

import coinImg from "../assets/item/coin.png";

import axiosInstance from "../lib/axiosInstance";

import characterImageMap from "../utils/characterImageMap";

const MyRoomPage = () => {

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("도감");
  const { user } = useAuthStore();
  const [userInfo, setUserInfo] = useState(null);

  // const [exp, setExp] = useState(null);
  const [coin, setCoin] = useState(null);
  const [step, setStep] = useState(null);

  const fetchAuthInfo = async () => {
    try {
      const res = await axiosInstance.get("/auth/info");

      console.log("AuthInfo",res.data.data);
      setUserInfo(res.data.data);
      setCoin(res.data.data.coin);
      setStep(res.data.data.repCharacter.step);

    } catch (err) {
      console.log("AuthInfo 에러", err);
    }
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  useEffect(() => {
    fetchAuthInfo();
  }, []);

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden font-['DungGeunMo'] bg-cover bg-center"
      style={{ backgroundImage: `url(${background_myroom})` }}
    >
      {/* 홈 버튼 */}
      <div className="absolute top-6 right-6">
        <RightButton children="HOME" onClick={() => navigate("/home")} />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 좌측 - 유저정보 + 캐릭터 */}
          <div className="w-full top-20  lg:w-1/3 xl:w-1/4 relative">
            {/* 유저 정보 박스 */}
            <div className="bg-[#FDE1F0]  h-[340px] rounded-lg p-6 relative mb-6">
              <h2 className="text-2xl font-bold mb-4 text-center">마이룸</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-md">
                  <span className="font-semibold">닉네임:</span>
                  <span>{userInfo?.nickname}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-md">
                  <span className="font-semibold">대표 캐릭터:</span>
                  <span>{userInfo?.repCharacter?.name}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-md">
                  <span className="font-semibold">레벨:</span>
                  <span>LV {step+1}</span>
                </div>

                <div className="p-2 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">Exp:</span>
                    <UserExp
                      step={step}
                      exp={user?.repCharacter?.exp || 0}
                    />
                  </div>
                </div>
                <div className="absolute bottom-1 right-1">
                  <RightButton
                    children="회원정보수정"
                    onClick={() => console.log("회원정보 수정")}
                  />
                </div>
              </div>
            </div>

            {/* 캐릭터 이미지 */}
            <div className="relative w-full min-h-[300px] rounded-lg p-4 mt-4">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={
                    characterImageMap[user?.repCharacter?.name] ||
                    characterImageMap.default
                  }
                  alt="대표 캐릭터"
                  className="max-w-full max-h-[250px] object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = characterImageMap.default;
                  }}
                />
              </div>
            </div>
          </div>

          {/* 돈 영역 */}
          <div className="absolute top-6 right-36 flex items-center gap-2">
            {/* 코인 이미지 */}
            <img
              src={coinImg}
              alt="coin"
              className="w-10 h-10 object-contain"
            />
            {/* 돈 표시 칸 */}
            <div className="w-[200px] h-[40px] flex justify-end items-center bg-white border-2 border-black rounded-full px-4 py-1 shadow-md">
              <span className="font-bold text-lg tracking-widest">
                {userInfo?.coin.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 우측 - 탭 + 컨텐츠 영역 */}
          <div className="flex-1">
            {/* 탭 버튼 */}
            <div className="flex  border-black mb-4">
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
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-pink-500"></div>
                  )}
                </button>
              ))}
            </div>

            {/* 컨텐츠 영역 */}
            <div className="bg-[#FDE1F0] rounded-b-lg rounded-r-lg  p-6 min-h-[600px] shadow-inner">
              {activeTab === "도감" && (
                <div className="text-center py-10"></div>
              )}

              {activeTab === "상점" && (
                <div className="text-center py-10">
                  <StoreList onBuySuccess={fetchAuthInfo}></StoreList>
                </div>
              )}

              {activeTab === "인벤토리" && (
                <div className="text-center py-10">
                  <InventoryList onUseSuccess={fetchAuthInfo}></InventoryList>
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
