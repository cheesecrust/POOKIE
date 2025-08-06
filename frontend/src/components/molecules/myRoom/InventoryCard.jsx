import milk from "../../../assets/item/milk.png"
import wine from "../../../assets/item/wine.png"
import water from "../../../assets/item/water.png"
import beer from "../../../assets/item/beer.png"
import coke from "../../../assets/item/coke.png"
import coffee from "../../../assets/item/coffee.png"

import RightButton from "../../atoms/button/RightButton"

const itemimage = {
    "milk.png": milk,
    "wine.png": wine,
    "water.png" : water,
    "beer.png" : beer,
    "coke.png" : coke,
    "coffee.png" : coffee,
}

const InventoryCard = ({ item }) => {
  return (
    <div className=" bg-white rounded-lg p-4 flex flex-col items-center shadow-md hover:scale-105 transition-transform">
      <img
        src={itemimage[item.image]}
        alt={item.itemName}
        className="w-14 h-16 object-contain mb-2"
      />
      <h3 className="font-bold text-lg">{item.itemName}</h3>
      <p className="text-sm text-gray-600">경험치: {item.exp}</p>
      <p className="text-sm text-gray-600">수량: {item.amount}</p>
      <RightButton className="scale-75" children="사용" ></RightButton>

    </div>
  );
};

export default InventoryCard;
