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

const handleBuyItem = async(itemIdx) => {
    try{
        const res = axiosInstance.post('/store/items',{
            itemIdx
        })
        
    }
    catch(err){
        console.log(err);
    }
}

const StoreCard = ({ item }) => {
  return (
    <div className=" bg-white rounded-lg p-4 flex flex-col items-center shadow-md hover:scale-105 transition-transform">
      <img
        src={itemimage[item.image]}
        alt={item.name}
        className="w-14 h-16 object-contain mb-2"
      />
      <h3 className="font-bold text-lg">{item.name}</h3>
      <p className="text-sm text-gray-600">경험치: {item.exp}</p>
      <p className="text-sm text-gray-600">가격: {item.price}</p>
      <RightButton className="scale-75" children="구매" onClick={()=>{handleBuyItem(item.itemIdx)}} ></RightButton>

    </div>
  );
};

export default StoreCard;
