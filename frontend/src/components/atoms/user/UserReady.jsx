// 대기실방 user카드를 Relative로 설정하고 absolute로 Ready카드를 표시

const UserReady = () => {
  return (
    <div className="absolute bottom-0 w-full h-1/5 bg-[#F4A8A8] text-black text-center py-1 text-lg z-10">
      READY
    </div>
  );
};

export default UserReady;
