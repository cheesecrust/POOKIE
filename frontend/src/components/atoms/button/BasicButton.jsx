// src/components/atoms/button/BasicButton.jsx
// 사용하실때  <BasicButton size="" className=''>텍스트</BasicButton>

const sizeMap = {
  sm: "text-sm px-2 py-1",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
};

const BasicButton = ({
  children = "버튼",
  onClick,
  disabled = false,
  type = "button",
  size = "",
  className = "",
}) => {
  const sizeStyle = sizeMap[size] || sizeMap.sm;

  const baseStyle = `
    bg-blue-500 hover:bg-blue-400 text-white py-2 px-4 border-b-3 border-blue-700 hover:border-blue-500 rounded
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

export default BasicButton;
