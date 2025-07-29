// 친구창 쪽지보내기 모달
// 경로: src/components/atoms/message/SendMessageModal.jsx
// 사용 예시
//   <SendMessageModal onClose={() => {}} senderId="1" targetId="2" />

import {useState} from "react";
import axios from "axios";

const SendMessageModal = ({onClose, senderId, targetId}) => {
    const [message, setMessage] = useState("");
    
    const handleSend = async () => {
        if (!message.trim()) return;
        try {await axios.post('/api/message/send', {
            receiver: targetId,
            content: message,
            sender: senderId,
        });
        alert("메시지 전송 성공!");
        onClose();
    }catch(err){
        console.error(err);
        alert("메시지 전송 실패!");
    }
    }
    
    return (
        <div>
            
        </div>
    );
};  

export default SendMessageModal;