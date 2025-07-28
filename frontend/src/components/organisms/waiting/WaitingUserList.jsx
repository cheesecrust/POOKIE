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

import WaitingUserCard from '../../molecules/waiting/WaitingUserCard';
import useAuthStore from '../../../store/store';

const WaitingUserList = ({ userSlots, roomMasterId, onRightClickKick }) => {
	const { user } = useAuthStore();

	return (
		<div className="grid grid-cols-3 gap-8">
			{userSlots.map((u, index) => (
				<div key={index} className="flex justify-center items-center">
					{u ? (
						<WaitingUserCard
							user={u}
							isMe={u.userId === user?.id}
							isMyRoomMaster={roomMasterId === user?.id}
							onRightClickKick={onRightClickKick}
						/>
					) : (
						<div className="w-[88px] h-[112px] bg-white border-2 border-dashed border-gray-300 rounded-xl opacity-50" />
					)}
				</div>
			))}
		</div>
	);
};

export default WaitingUserList;
