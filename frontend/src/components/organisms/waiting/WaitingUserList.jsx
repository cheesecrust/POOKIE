// src/components/organisms/waiting/WaitingUserList.jsx

import WaitingUserCard from "../../molecules/waiting/WaitingUserCard";

const WaitingUserList = ({ userSlots }) => {
  return (
    <div className="grid grid-cols-3 gap-8">
      {/* 유저 슬롯 */}
      {userSlots.map((user, index) => (
        <div key={index} className="flex justify-center items-center">
          {user ? (
            <WaitingUserCard user={user} />
          ) : (
            <div className="w-[88px] h-[112px] bg-white border-2 border-dashed border-gray-300 rounded-xl opacity-50" />
          )}
        </div>
      ))}
    </div>
  );
};

export default WaitingUserList;
