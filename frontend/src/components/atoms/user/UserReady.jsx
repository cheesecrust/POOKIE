// 대기실방 user카드를 Relative로 설정하고 absolute로 Ready카드를 표시

const UserReady = ({ team }) => {
  const bgColor = team === "red" ? "bg-rose-300" : "bg-cyan-300";
  return (
    <div
      className={`absolute bottom-0 w-full h-1/5 ${bgColor} text-black flex items-center justify-center text-xl z-10`}
    >
      READY
      <div
        className="absolute top-0 left-0 w-full h-1/2 rounded-b-full
        bg-gradient-to-b from-white/60 to-transparent pointer-events-none"
      ></div>
    </div>
  );
};

export default UserReady;
