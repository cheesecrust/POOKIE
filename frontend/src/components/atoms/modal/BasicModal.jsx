// src/components/atoms/modal/BasicModal.jsx
// 사용 예시: 
// <BasicModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
//     <p>Modal content</p>
// </BasicModal>
import { useEffect } from 'react'

const BasicModal = ({ isOpen, onClose, children }) => {

    useEffect(() => {
        if (!isOpen) return;

        // ESC 키 닫기
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "auto";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    
    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-pink-200 opacity-70 backdrop-blur-sm rounded-xl w-[720px] h-[420px] p-4 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
            {children}
          </div>  
        </div>
    );
};

export default BasicModal;