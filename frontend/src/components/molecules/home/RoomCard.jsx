// src/components/molecules/home/RoomCard.jsx
// 백 연결 후 수정 로직 필요(+정원 초과 시, 버튼 비활성화)
// 사용 예시:
// <RoomCard
//   roomTitle="6반 모여라"
//   roomType="samepose" // 또는 sketchrelay, silentscream
//   participantCount={participantCount}
//   onClick={() => console.log("방 입장")}
// />
import ModalButton from '../../atoms/button/ModalButton'
import backgroundSamePose from '../../../assets/background/background_samepose.gif'
import backgroundSketchRelay from '../../../assets/background/background_sketchrelay.gif'
import backgroundSilentScream from '../../../assets/background/background_silentscream.gif'

const RoomCard = ({ roomTitle, roomType, participantCount, onClick }) => {
    const getBackgroundImage = (type) => {
      switch (type) {
        case 'samepose':
          return backgroundSamePose;
        case 'sketchrelay':
          return backgroundSketchRelay;
        case 'silentscream':
          return backgroundSilentScream;
        default:
          return backgroundSamePose; // fallback
      }
    };
  
    return (
      <div
        className="w-[300px] h-[200px] rounded-lg overflow-hidden shadow-md relative bg-cover bg-center"
        style={{ backgroundImage: `url(${getBackgroundImage(roomType)})` }}
      >
        {/* 우측 상단 인원 수 */}
        <div className="absolute top-3 right-4 text-black font-semibold text-sm">
          {participantCount }/ 6
        </div>
  
        {/* 좌측 하단 방 제목 */}
        <div className="absolute bottom-4 left-4 text-black font-bold text-lg">
          {roomTitle}
        </div>
  
        {/* 우측 하단 PLAY 버튼 (아이콘 제거) */}
        <ModalButton
          onClick={onClick}
          className="absolute bottom-4 right-4 text-black font-bold px-4 py-1 shadow hover:brightness-95"
        >
          PLAY
        </ModalButton>
      </div>
    );
  };
  
  export default RoomCard;
