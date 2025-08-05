// src/components/atoms/button/KickButton.jsx

const KickButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute top-1 right-1 text-md hover:bg-rose-400 rounded-md w-5 h-5 flex items-center justify-center"
      title="강퇴"
    >
      X
    </button>
  );
};

export default KickButton;
