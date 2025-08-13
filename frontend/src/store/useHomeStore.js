import { create } from 'zustand';

//  게임 알람저장 store

const useHomeStore = create((set, get) => ({
    notification: null,

    setNotification: (data) => set({ 
        notification: data.data.notificationCnt,
     }),
}));

export default useHomeStore;