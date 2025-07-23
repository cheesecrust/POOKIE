// 고요속의 외침에서 쓰는 pass 버튼
// src/components/atoms/button/PassButton.jsx

const sizeMap = {
  sm: "text-sm px-2 py-1",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
};

const PassButton = ({
  children = "PASS",
  onClick,
  disabled = false,
  type = "button",
  size = "",
  className = "",
}) => {
  const sizeStyle = sizeMap[size] || sizeMap.md;

  const baseStyle = `
    bg-white/70 hover:bg-gray-100 py-2 px-4 border-2 border-black-400 rounded shadow
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

export default PassButton;
