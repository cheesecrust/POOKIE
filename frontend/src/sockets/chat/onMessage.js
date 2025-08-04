// src/sockets/chat/onMessage.js

/**
 * 채팅 메시지 수신 핸들러
 * @param {Object} msg
 * @param {Function} setMessages - ChatBox 내부 messages 상태 업데이트 함수
 */
export const handleChatMessage = (msg, setMessages) => {
    const { from, message, team, timeStamp } = msg;
    setMessages((prev) => [
        ...prev,
        { type: "chat", from, message, team, timeStamp },
    ]);
};

export const handleSystemMessage = (msg, setMessages) => {
    if (msg.msg) {
        setMessages((prev) => [
            ...prev,
            { type: "system", message: msg.msg },
        ]);
    }
};
