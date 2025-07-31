// src/components/molecules/waiting/TeamToggleButton.jsx
const TeamToggleButton = ({ currentTeam, onClick, disabled = false }) => {
  if (!currentTeam) return null;

  const team = currentTeam.toUpperCase(); // "RED" or "BLUE"

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-20 h-10 rounded-full transition-colors duration-300 ease-in-out
        ${team === "BLUE" ? "bg-blue-500" : "bg-red-500"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
    >
      <span
        className={`absolute left-1 top-1 w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300 
        ${team === "BLUE" ? "translate-x-10" : "translate-x-0"}`}
      ></span>
    </button>
  );
};

export default TeamToggleButton;
