// src/store/useRoomStore.js
import { create } from 'zustand';

const useRoomStore = create((set) => ({
    roomList: [],
    setRoomList: (roomList) => {
        console.log("setRoomList 실행 완료:", roomList);
        set({ roomList });
    },
}));

export default useRoomStore;