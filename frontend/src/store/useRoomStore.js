// src/store/useRoomStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRoomStore = create(
    persist(
        (set) => ({
            roomList: [],
            setRoomList: (roomList) => set({ roomList }),
        }),
        {
            name: 'roomList',
            getStorage: () => localStorage,
            partialize: (state) => ({
                roomList: state.roomList,
            }),
        }
    )
);

export default useRoomStore;