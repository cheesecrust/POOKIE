// src/components/atoms/button/PookieButton.jsx
import pookiepookie from "../../../assets/character/pookiepookie.png";

const PookieButton = ({ onClick, className = "", alt = "POOKIE 버튼" }) => {
  return (
    <button
      onClick={onClick}
      className={`p-0 bg-transparent border-none hover:scale-105 transition transform ${className}`}
    >
      <img
        src={pookiepookie}
        alt={alt}
        className="w-24 h-auto select-none"
        draggable="false"
      />
    </button>
  );
};

export default PookieButton;
