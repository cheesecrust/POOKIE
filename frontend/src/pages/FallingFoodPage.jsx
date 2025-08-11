// src/pages/FallingFoodPage.jsx
import background from "../assets/background/background_falling_food.png";

const FallingFoodPage = () => {
  return (
    <div
      className="w-full h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${background})` }}
    ></div>
  );
};

export default FallingFoodPage;
