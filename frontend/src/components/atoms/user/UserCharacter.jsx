// 경로: src/components/atoms/user/UserCharacter.jsx
// user 대표 캐릭터 이미지 
// name(ex.pudding_strawberry) 과 size를 props로 전달받으면 됩니다.
// size default 값은 100으로 설정해두었습니다.

import characterImageMap from '../../../utils/characterImageMap'

const UserCharacter = ({name, size = 100}) => {

    const src = characterImageMap[name];
    
    if(!src) return <div>이미지가 없습니다</div>;

    return (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="object-contain"
        />
      );
    };

export default UserCharacter;