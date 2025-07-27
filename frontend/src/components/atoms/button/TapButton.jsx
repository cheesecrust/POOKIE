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
    font-semibold text-sm rounded-t-md transition
    text-center
    ${active ? "bg-[#EF8888] text-white" : "bg-[#F4C0C0] text-white hover:bg-[#EF8888]"}
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
