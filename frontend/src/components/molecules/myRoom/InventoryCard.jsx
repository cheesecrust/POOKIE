import milk from "../../../assets/item/milk.png"
import wine from "../../../assets/item/wine.png"
import water from "../../../assets/item/water.png"
import beer from "../../../assets/item/beer.png"
import coke from "../../../assets/item/coke.png"
import coffee from "../../../assets/item/coffee.png"

import RightButton from "../../atoms/button/RightButton"

import axiosInstance from "../../../lib/axiosInstance"

const itemimage = {
    "milk.png": milk,
    "wine.png": wine,
    "water.png" : water,
    "beer.png" : beer,
    "coke.png" : coke,
    "coffee.png" : coffee,
}

const handleUseItem = async(item,onUseSuccess) => {
  try {
    console.log("인벤토리 아이템:",item)
    const res = await axiosInstance.post(`/inventories/${item.idx}`)
    console.log("인벤토리 아이템 사용:",res.data)
    onUseSuccess(); 
    }
  catch(err){
    console.log("인벤토리 아이템 사용 실패:",err)
  }
} 

const InventoryCard = ({ item,onUseSuccess }) => {
  return (
    <div className=" w-[250px] bg-white rounded-lg p-4 flex flex-col items-center shadow-md hover:scale-105 transition-transform">
      <img
        src={itemimage[item.image]}
        alt={item.itemName}
        className="w-14 h-16 object-contain mb-2"
      />
      <h3 className="font-bold text-lg">{item.itemName}</h3>
      <p className="text-sm text-gray-600">경험치: {item.exp}</p>
      <p className="text-sm text-gray-600">수량: {item.amount}</p>
      <RightButton className="scale-75" children="사용" onClick={() => handleUseItem(item,onUseSuccess)}></RightButton>

    </div>
  );
};

export default InventoryCard;
