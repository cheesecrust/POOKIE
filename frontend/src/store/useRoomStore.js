// src/store/useRoomStore.js
import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
    roomList: [],
    setRoomList: (roomList) => {
        console.log("🏪 useRoomStore setRoomList 호출됨");
        console.log("🏪 이전 roomList:", get().roomList?.length || 0, "개");
        console.log("🏪 새로운 roomList:", roomList?.length || 0, "개");
        console.log("🏪 새로운 roomList 데이터:", roomList);
        
        set({ roomList });
        
        console.log("🏪 setRoomList 실행 완료 - 상태 업데이트됨");
    },
}));

export default useRoomStore;