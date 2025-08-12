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

const StoreCard = ({ item, onBuySuccess }) => {
  const { playSound } = useSound();
  const [loading, setLoading] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const openModal = (msg) => {
    setModalMsg(msg);
    setModalOpen(true);
  };

  const handleBuyItem = async (itemIdx) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/store/items", { itemIdx });

      // 성공
      onBuySuccess && onBuySuccess(); // coin 등 갱신 (MyRoomPage에서 fetchAuthInfo 호출됨)
      playSound("buy");
      openModal("아이템을 구매했습니다!", "success");
    } catch (err) {
      // 실패
      if (err?.response?.status === 400) {
        openModal("잔액이 부족합니다.", "error");
      } else {
        openModal("구매 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.", "error");
      }
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-[250px] bg-white rounded-lg p-4 flex flex-col items-center shadow-md transition-transform">
      <img
        src={itemimage[item.image]}
        alt={item.name}
        className="w-14 h-16 object-contain mb-2"
      />
      <h3 className="font-bold text-lg">{item.name}</h3>
      <p className="text-sm text-gray-600">경험치: {item.exp}</p>
      <p className="text-sm text-gray-600">가격: {item.price.toLocaleString()}</p>

      <RightButton
        className={`scale-75 ${loading ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => handleBuyItem(item.idx)}
      >
        {loading ? "구매중..." : "구매"}
      </RightButton>

      {/*  알림 모달 */}
      <MyRoomModal
        isOpen={modalOpen}
        title="상점"
        message={modalMsg}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default StoreCard;
