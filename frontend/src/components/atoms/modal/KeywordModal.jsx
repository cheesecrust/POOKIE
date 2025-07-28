// src/components/atoms/modal/KeywordModal.jsx
// 사용 예시:
// <KeywordModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
//     <p>Modal content</p>
// </KeywordModal>
import { useEffect } from "react";
import toggleLeft from "../../../assets/icon/toggle_left.png";

const KeywordModal = ({ isOpen, onClose, children }) => {
    
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
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <div
            className="bg-pink-100 rounded-full w-[900px] h-[510px] flex flex-col items-center px-6 py-8 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단: 픽셀 아이콘 + 제시어 */}
            <div className="flex items-center gap-3 mt-6 mb-6">
              <img
                src={toggleLeft}
                alt="left"
                className="w-14 h-14"
              />
              <span className="text-5xl font-pixel text-black">제시어</span>
            </div>

            <div className="mt-6 text-6xl font-pixel text-black text-center leading-tight">
              {children}
            </div>
          </div>
        </div>
      );      
    };
    
    export default KeywordModal;
