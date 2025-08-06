import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import InventoryCard from "../../molecules/myRoom/InventoryCard";


const dummydata = [
  {
    "idx": 1,
    "userAccountIdx": 3,
    "itemIdx": 1,
    "itemName": "우유",
    "image": "milk.png",
    "exp": 50,
    "amount": 3
  },
  {
    "idx": 2,
    "userAccountIdx": 3,
    "itemIdx": 2,
    "itemName": "물",
    "image": "coffee.png",
    "exp": 100,
    "amount": 1
  },
    {
    "idx": 3,
    "userAccountIdx": 3,
    "itemIdx": 2,
    "itemName": "물",
    "image": "water.png",
    "exp": 100,
    "amount": 1
  },
    {
    "idx": 4,
    "userAccountIdx": 3,
    "itemIdx": 2,
    "itemName": "물",
    "image": "wine.png",
    "exp": 100,
    "amount": 1
  },
    {
    "idx": 5,
    "userAccountIdx": 3,
    "itemIdx": 2,
    "itemName": "물",
    "image": "beer.png",
    "exp": 100,
    "amount": 1
  },
  {
    "idx": 6,
    "userAccountIdx": 3,
    "itemIdx": 2,
    "itemName": "물",
    "image": "coke.png",
    "exp": 100,
    "amount": 1
  },
]

const InventoryList = () => {
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
      setInventoryItems(dummydata)
      console.log("확인",inventoryItems)
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
        inventoryItems.map((item) => <InventoryCard key={item.idx} item={item} />)
      ) : (
        <div className="col-span-3 text-center text-gray-500 py-10">
        </div>
      )}
    </div>
  );
};

export default InventoryList;
