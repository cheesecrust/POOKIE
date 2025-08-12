// src/components/molecules/myRoom/InventoryCard.jsx
import { useState } from "react";
import milk from "../../../assets/item/milk.png";
import wine from "../../../assets/item/wine.png";
import water from "../../../assets/item/water.png";
import beer from "../../../assets/item/beer.png";
import coke from "../../../assets/item/coke.png";
import coffee from "../../../assets/item/coffee.png";

import RightButton from "../../atoms/button/RightButton";
import axiosInstance from "../../../lib/axiosInstance";
import useSound from "../../../utils/useSound";
import MyRoomModal from "../../atoms/modal/MyRoomModal"; 

const itemimage = {
  "milk.png": milk,
  "wine.png": wine,
  "water.png": water,
  "beer.png": beer,
  "coke.png": coke,
  "coffee.png": coffee,
};

const InventoryCard = ({ item, onUseSuccess }) => {
  const { playSound } = useSound();
  const [loading, setLoading] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const openModal = (msg) => {
    setModalMsg(msg);
    setModalOpen(true);
  };

  const handleUseItem = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/inventories/${item.idx}`);
      // 성공
      console.log("인벤토리 아이템 사용",res);
      onUseSuccess && onUseSuccess(); // 인벤토리/유저정보 갱신
      playSound("pookie");
      openModal("아이템을 사용했습니다!");
    } catch (err) {
      // 만렙 등 사용 불가 (백엔드에서 400 준다고 했음)
      if (err?.response?.status === 404) {
        openModal("더이상 먹지 못합니다!");
      } else {
        openModal("아이템 사용 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
      }
      console.log("인벤토리 아이템 사용 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || item.amount <= 0;

  return (
    <div
      className={`relative w-[250px] bg-white rounded-lg p-4 flex flex-col items-center shadow-md transition-transform`}
    >
      <img src={itemimage[item.image]} alt={item.itemName} className="w-14 h-16 object-contain mb-2" />
      <h3 className="font-bold text-lg">{item.itemName}</h3>
      <p className="text-sm text-gray-600">경험치: {item.exp}</p>
      <p className="text-sm text-gray-600">수량: {item.amount}</p>

      <RightButton
        className={`scale-75 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onClick={handleUseItem}
      >
        {loading ? "사용중..." : "사용"}
      </RightButton>

      {/* 카드 위에 바로 뜨는 모달 (백드롭 없음) */}
      <MyRoomModal
        isOpen={modalOpen}
        title="인벤토리"
        message={modalMsg}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default InventoryCard;