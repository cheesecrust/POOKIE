import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import InventoryCard from "../../molecules/myRoom/InventoryCard";




const InventoryList = ({onUseSuccess}) => {
  const [inventoryItems, setInventoryItems] = useState([]);

  // 인벤토리 아이템 전체조회
  const fetchInventoryItems = async () => {
    try {
      const res = await axiosInstance.get("/inventories");
      console.log("인벤토리아이템",res);
      console.log("data",res.data)
      if (res.data.length > 0){
        setInventoryItems(res.data); // 응답 데이터 상태 저장
      }
    } catch (err) {
      console.log("인벤토리 아이템 전체조회 실패:", err);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {inventoryItems.length >0 ? (
        inventoryItems.map((item) => <InventoryCard key={item.idx} item={item} onUseSuccess={onUseSuccess} />)
      ) : (
        <div className="col-span-3 text-center text-gray-500 py-10">
        </div>
      )}
    </div>
  );
};

export default InventoryList;
