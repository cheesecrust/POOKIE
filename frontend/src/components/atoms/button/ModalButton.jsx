// src/components/atoms/button/ModalButton.jsx
import toggleLeft from "../../../assets/icon/toggle_left.png";
const ModalButton = ({
  children = "텍스트",
  onClick,
  disabled = false,
  type = "button",
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };
  const sizeStyle = sizeMap[size] || sizeMap.md;

  const baseStyle = `
    bg-pink-100 hover:bg-pink-200 text-black flex items-center gap-2 rounded-xl shadow-md
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${sizeStyle} ${className}`}
    >
      <img src={toggleLeft} alt="화살표" className="w-4 h-4" />
      {children}
    </button>
  );
};

export default ModalButton;
