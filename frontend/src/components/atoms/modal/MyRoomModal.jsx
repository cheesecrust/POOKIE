// 경로 : src/components/atoms/modal/MyRoomModal.jsx

const MyRoomModal = ({
    isOpen,
    title = "알림",
    message,
    onClose,
  }) => {
    if (!isOpen) return null;
  

  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Dim */}
        <div className="absolute inset-0 " onClick={onClose} />
        {/* Modal */}
        <div className="relative z-10 w-[320px] rounded-xl bg-white shadow-xl border-2 border-black p-5">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-lg border-2 border-black px-4 py-2 bg-white hover:bg-gray-100 active:translate-y-[1px]"
          >
            확인
          </button>
        </div>
      </div>
    );
  };
  
  export default MyRoomModal;
  