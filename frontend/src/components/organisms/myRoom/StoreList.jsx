import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import StoreCard from "../../molecules/myRoom/StoreCard";


const StoreList = () => {
  const [StoreItems, setStoreItems] = useState([]);

  // 상점 아이템 전체조회
  const fetchInventoryItems = async () => {
    try {
      const res = await axiosInstance.get("/store/items");
      console.log("상점아이템",res);
      console.log("data",res.data)
      if (res.data.length > 0){
        setStoreItems(res.data); // 응답 데이터 상태 저장
      }
      console.log("확인",setStoreItems)
    } catch (err) {
      console.log("인벤토리 아이템 전체조회 실패:", err);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {StoreItems.length >0 ? (
        StoreItems.map((item) => <StoreCard key={item.idx} item={item} />)
      ) : (
        <div className="col-span-3 text-center text-gray-500 py-10">
        </div>
      )}
    </div>
  );
};

export default StoreList;
