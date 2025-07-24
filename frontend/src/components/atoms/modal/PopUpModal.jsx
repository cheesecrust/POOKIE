// src/components/atoms/modal/PopUpModal.jsx
// 사용 예시:
// <PopUpModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
//     <p>Modal content</p>
// </PopUpModal>
import { useEffect } from "react";
import toggleLeft from "../../../assets/icon/toggle_left.png";
import toggleRight from "../../../assets/icon/toggle_right.png";

const PopUpModal = ({isOpen, onClose, children}) => {

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
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
      <div className="relative bg-pink-200  opacity-80 backdrop-blur-sm rounded-full w-[858px] h-[420px] flex items-center justify-center px-6 shadow-lg">
        {/* 왼쪽 아이콘 */}
        <img
          src={toggleLeft}
          alt="left"
          className="absolute left-16 w-20 h-20"
        />
        {/* 중앙 텍스트 */}
        <div className="text-center font-pixel text-black text-lg">
          {children}
        </div>
        {/* 오른쪽 아이콘 */}
        <img
          src={toggleRight}
          alt="right"
          className="absolute right-16 w-20 h-20"
        />
      </div>
    </div>
  );
};

export default PopUpModal;