// src/components/atoms/modal/BasicModal.jsx
// 사용 예시: 
// <BasicModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
//     <p>Modal content</p>
// </BasicModal>
import { useEffect } from 'react'

const BasicModal = ({ isOpen, onClose, children, className=" ", backgroundPoacity = "opacity-70", }) => {

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
            className={`relative rounded-xl p-4 shadow-lg overflow-hidden ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 배경 박스만 따로 */}
            <div className={`absolute inset-0 bg-[#FDE1F0] ${backgroundPoacity} backdrop-blur-sm rounded-xl z-0`} />
      
            {/* 모달 내부 콘텐츠는 선명하게 유지 */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      )
}

export default BasicModal;