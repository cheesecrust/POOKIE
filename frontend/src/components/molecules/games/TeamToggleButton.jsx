import BasicButton from "../../atoms/button/BasicButton";

const TeamToggleButton = ({
  currentTeam, // "red" 또는 "blue" 문자열
  onClick,
  disabled = false,
}) => {
  if (!["red", "blue"].includes(currentTeam)) return null;

  const isRedTeam = currentTeam === "red";
  const oppositeTeam = isRedTeam ? "BLUE" : "RED";
  const buttonStyle = isRedTeam
    ? "bg-blue-500 hover:bg-blue-400 border-blue-700 hover:border-blue-500"
    : "bg-red-500 hover:bg-red-400 border-red-700 hover:border-red-500";

  return (
    <BasicButton
      onClick={onClick}
      disabled={disabled}
      size="md"
      className={`w-20 h-20 text-lg font-bold ${buttonStyle}`}
    >
      {oppositeTeam}
    </BasicButton>
  );
};

export default TeamToggleButton;
