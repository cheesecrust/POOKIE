// 우클릭시 토글되는 버튼스타일
// src/components/atoms/button/RightButton.jsx

const sizeMap = {
  sm: "text-sm px-2 py-1",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
};

const RightButton = ({
  children = "버튼",
  onClick,
  disabled = false,
  type = "button",
  size = "",
  className = "",
}) => {
  const sizeStyle = sizeMap[size] || sizeMap.sm;

  const baseStyle = `
    bg-white hover:bg-gray-100 py-2 px-4 border-2 border-black-400 shadow
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
  `;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${sizeStyle} ${className}`}
    >
      {children}
    </button>
  );
};

export default RightButton;
