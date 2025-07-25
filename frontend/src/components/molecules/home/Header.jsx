// src/components/molecules/home/Header.jsx
// 사용 예시:
// ! 상위에 flex-column 레이아웃 구성 필요
// <div className="flex flex-col min-h-screen">
//     <Header/>
//     <main className="flex-grow">...</main>
//     <Footer/>
// </div>
import bgImage from '../../../assets/background/background_home.gif';
import title from '../../../assets/icon/title_logo.png'

const Header = () => {
    return (
        <header className="relative w-full h-[612px] overflow-hidden">
          {/* 배경 GIF */}
          <img
            src={bgImage}
            alt="Header Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
    
          {/* 중앙 타이틀 이미지 */}
          <div className="relative z-10 flex justify-center items-center w-full h-full">
            <img
              src={title}
              alt="Pookie Title"
              className="w-[650px] object-contain -translate-y-30"
            />
          </div>
        </header>
    );
};

export default Header;