// src/pages/FallingFood.jsx
import background from "../assets/background/background_falling_food.png";

const FallingFood = () => {
  return (
    <div
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    ></div>
  );
};

export default FallingFood;
