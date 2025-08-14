// src/sections/MyRoomSection.jsx
import { motion } from "framer-motion";
import useInViewMotion from "../utils/useInViewMotion";
import characterMap from "../assets/background/characterMap.png"
import scrollArrow from "../assets/icon/toggle_down.png";

const MyRoomSection = () => {
    const { ref, inView } = useInViewMotion();

    return (
        <section
          id="myroom"
          ref={ref}
          className="h-screen relative bg-[#FEFFBE] flex items-center px-6 md:px-20"
          aria-label="Myroom"
        >
          {/* Left: Text */}
          <motion.div
            className="w-full md:w-1/3 left-5 relative"
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="bg-white text-black px-3 py-1 rounded-full text-xl font-semibold">
              Myroom
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold">
              나만의 <span className="text-pink-600">푸키 도감</span>
            </h2>
            <p className="mt-4 md:text-lg leading-relaxed text-black/80">
              미니게임에서 얻은 아이템과 캐릭터를 보관하는 공간!
              수집한 아이템으로 푸키를 꾸미고 성장시켜 보세요!
            </p>
            <ul className="mt-6 space-y-2 text-black/80">
              <li>🤍 아이템 세트 보너스</li>
              <li>🤍 진화 히스토리 열람</li>
              <li>🤍 희귀도 컬렉션</li>
            </ul>
          </motion.div>
    
          {/* Right: Illustration */}
          <div className="hidden md:flex justify-center relative">
            <img
              src={characterMap}
              alt="도감 일러스트"
              className="relative w-200 left-30 drop-shadow-xl"
            />

            {/* 배경 장식 */}
            <div className="absolute -z-10 w-40 h-40 rounded-full bg-white/40 blur-2xl top-8 left-8" />
            <div className="absolute -z-10 w-36 h-36 rounded-full bg-pink-300/40 blur-2xl bottom-8 right-12" />
          </div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8, repeat: Infinity, repeatType: "mirror" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            aria-hidden
          >
            <a href="#character" className="block cursor-pointer">
              <img src={scrollArrow} alt="다음 섹션으로 이동" className="w-12 opacity-70" />
            </a>
          </motion.div>
        </section>
    );
}

export default MyRoomSection;
