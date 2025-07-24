// 이거도 소켓으로 서버 timestart후 각 클라이언트에서 할 것인지 정해야 함

import timer from "../../../assets/icon/timer.png";

const Timer = ({ seconds = 0 }) => {
  return (
    <div className="flex items-center justify-center gap-2 font-pixel">
      {/* 이미지 아이콘 */}
      <img src={timer} alt="timer icon" className="w-8 h-8 object-contain" />

      {/* 타이머 숫자 */}
      <span className="text-4xl text-red-500  tracking-wider">{seconds}</span>
    </div>
  );
};

export default Timer;
