import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import InventoryCard from "../../molecules/myRoom/InventoryCard";




const InventoryList = ({onUseSuccess, refreshTrigger}) => {
  const [inventoryItems, setInventoryItems] = useState([]);

  // 인벤토리 아이템 전체조회
  const fetchInventoryItems = async () => {
    try {
      const res = await axiosInstance.get("/inventories");
      setInventoryItems(res.data || []);
      // console.log("인벤토리아이템",res);
      // console.log("data",res.data)
    } catch (err) {
      console.log("인벤토리 아이템 전체조회 실패:", err);
    }
  };

  const handleUseSuccess = () => {
    fetchInventoryItems();
    if (onUseSuccess) {
      onUseSuccess();
    };
  };

  useEffect(() => {
    fetchInventoryItems();
  }, [refreshTrigger]);

  return (
    <div className="grid grid-cols-3 gap-6 place-items-center">
      {inventoryItems.length >0 ? (
        inventoryItems.map((item) => <InventoryCard key={item.idx} item={item} onUseSuccess={handleUseSuccess} />)
      ) : (
        <div className="col-span-3 text-center text-gray-500 py-10">
          인벤토리에 아이템이 없습니다
        </div>
      )}
    </div>
  );
};

export default InventoryList;
