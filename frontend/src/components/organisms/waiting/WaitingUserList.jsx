// // src/components/organisms/waiting/WaitingUserList.jsx

// import WaitingUserCard from "../../molecules/waiting/WaitingUserCard";

// const WaitingUserList = ({ userSlots }) => {
//   return (
//     <div className="grid grid-cols-3 gap-8">
//       {/* 유저 슬롯 */}
//       {userSlots.map((user, index) => (
//         <div key={index} className="flex justify-center items-center">
//           {user ? (
//             <WaitingUserCard user={user} />
//           ) : (
//             <div className="w-[88px] h-[112px] bg-white border-2 border-dashed border-gray-300 rounded-xl opacity-50" />
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default WaitingUserList;

// src/components/organisms/waiting/WaitingUserList.jsx

import WaitingUserCard from "../../molecules/waiting/WaitingUserCard";
import useAuthStore from "../../../store/store";

const WaitingUserList = ({ userSlots, roomMasterId, onRightClickKick }) => {
  const { user } = useAuthStore();

  // 항상 6개의 슬롯을 만들어서 빈 슬롯도 표시되도록 함
  const paddedSlots = [...userSlots];
  while (paddedSlots.length < 6) {
    paddedSlots.push(null);
  }

  return (
    <div className="grid grid-cols-3 gap-6 w-full px-4 py-4">
      {paddedSlots.map((u, index) => (
        <div key={index} className="flex justify-center items-center">
          {u ? (
            <WaitingUserCard
              user={u}
              isMe={u.userId === user?.id}
              isMyRoomMaster={roomMasterId === user?.id}
              onRightClickKick={onRightClickKick}
            />
          ) : (
            <div className="w-36 h-48 bg-white border-4 border-dashed border-gray-300 rounded-xl opacity-50" />
          )}
        </div>
      ))}
    </div>
  );
};

export default WaitingUserList;
