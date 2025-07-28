// src/components/molecules/games/TeamToggleButton.jsx
const TeamToggleButton = ({ currentTeam, onClick, disabled = false }) => {
  if (!["red", "blue"].includes(currentTeam)) return null;

  const isRed = currentTeam === "red";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-20 h-10 rounded-full transition-colors duration-300 ease-in-out 
        ${isRed ? "bg-blue-500" : "bg-red-500"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
    >
      <span
        className={`absolute left-1 top-1 w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300 
        ${isRed ? "translate-x-10" : "translate-x-0"}`}
      ></span>
    </button>
  );
};
export default TeamToggleButton;
