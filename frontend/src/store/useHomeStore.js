import { create } from 'zustand';
import { emitRoomJoin } from '../sockets/home/emit';

//  게임 알람저장 store
//  게임 초대 저장 store

const useHomeStore = create((set, get) => ({
    
    // 알람
    notification: 0,
    setNotification: (data) => set({ 
        notification: data.data.notificationCnt,
     }),



    // 허용 페이지 플래그
    inviteGate: false,
    setInviteGate: (on) => {
      const wasOn = get().inviteGate;
      set({ inviteGate: !!on });
      // 페이지가 허용 → 비허용으로 바뀌면 모달 즉시 닫고 데이터 제거
      if (wasOn && !on) set({ invite: { open: false, data: null } });
    },

    // Invited 응답 데이터
    invite : { open: false, data: null},

    // 서버에서 INVITED 받았을 때 호출
    setInviteFromServer: (data) => {
        console.log("INVITED 메시지 수신:", data);
        const allowed = get().inviteGate;
        if (!allowed) return;
        set({ invite : { open: true, data: data }});
    },
    

    // 초대 모달 닫기
    closeInvite : () => set({ invite : { open: false, data: null }}),
    
    acceptInvite : () => {
      const data = get().invite?.data;
      console.log("acceptInvite", data);
      if (!data) return;

      // 방 입장 emit 
      emitRoomJoin({
        roomId: data.roomId,
        gameType: data.roomGameType,
        roomTitle: data.roomTitle,
        roomPw: "",
      });

      // 초대 모달 닫기
      set({ invite : { open: false, data: null }});
    },

}));

export default useHomeStore;