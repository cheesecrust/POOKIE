// 대기실방 user카드를 Relative로 설정하고 absolute로 Ready카드를 표시

const UserReady = ({ team }) => {
  const bgColor = team === "red" ? "bg-rose-300" : "bg-cyan-300";
  return (
    <div
      className={`absolute bottom-0 w-full h-1/5 ${bgColor} text-black text-center py-1 text-lg z-10`}
    >
      READY
    </div>
  );
};

export default UserReady;
