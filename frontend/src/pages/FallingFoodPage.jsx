// src/pages/FallingFoodPage.jsx
import background from "../assets/background/background_falling_food.png";
import characterImageMap from "../utils/characterImageMap";
import useAuthStore from "../store/useAuthStore";
import { useEffect } from "react";

const FallingFoodPage = () => {
  const { user } = useAuthStore();
  useEffect(() => {
    console.log(user);
  }, [user]);
  return (
    <div
      className="w-full h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${background})` }}
    >
      <img
        src={
          characterImageMap[user?.repCharacter?.characterName] ||
          defaultCharacter
        }
        alt="대표캐릭터"
        className="absolute left-1/2 bottom-0 w-40 h-40 transform -translate-x-1/2"
      />
    </div>
  );
};

export default FallingFoodPage;
