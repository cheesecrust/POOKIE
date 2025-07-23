// src/components/atoms/button/TapButton.jsx
// 버튼 active로 상태 관리 하시면 됩니다
// 크기 조정 해서 쓰시거나 default 바꾸셔도 됩니다

const TabButton = ({
  label = "Tab",
  active = false,
  onClick,
  size = "md",
  className = "",
}) => {
  const baseStyle = `
    font-semibold text-sm rounded-md transition
    text-center
    ${active ? "bg-rose-400 text-white" : "bg-rose-300 text-white hover:bg-rose-400"}
  `;

  return (
    <button
      onClick={onClick}
      className={`
        w-32 h-10 
        ${baseStyle}
        ${className}
      `}
    >
      {label}
    </button>
  );
};

export default TabButton;
