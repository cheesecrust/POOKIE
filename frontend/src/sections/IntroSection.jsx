// src/sections/IntroSection.jsx
import { motion } from "framer-motion";
import useInViewMotion from "../utils/useInViewMotion";
import backgroundIntro from "../assets/background/background_login.png"
import Title from "../assets/icon/title_logo.png";
import scrollArrow from "../assets/icon/toggle_down.png";
import clovButton from "../assets/icon/clovButton.png"
import toggleRight from "../assets/icon/toggle_left.png"
import toggleLeft from "../assets/icon/toggle_right.png"

const IntroSection = () => {
    const { ref, inView } = useInViewMotion();

  return (
    <section
      ref={ref}
      id="intro"
      className="h-screen relative flex flex-col items-center justify-center"
      aria-label="Intro"
      style={{
        backgroundImage: `url(${backgroundIntro})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <motion.img
        src={Title}
        alt="푸키"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="w-180 animate-bounce z-10"
      />
      <motion.h1
        className="mt-1 text-4xl md:text-6xl font-extrabold text-pink-600 drop-shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        Pookie World
      </motion.h1>
      <motion.p
        className="mt-2 text-base md:text-xl text-black"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        나만의 푸키와 함께하는 귀여운 모험
      </motion.p>

      {/* Outro 이동 버튼 */}
      {/* <div className="absolute top-20 left-120 transform -translate-x-1/2 scale-x-[-1]">
        <a href="#outro" className="block cursor-pointer">
          <img
            src={moveBubble}
            alt="다음 섹션으로 이동"
            className="w-60 transition-transform duration-300 hover:scale-110 hover:drop-shadow-2xl"
          />
        </a>
      </div> */}
      <a
        href="#outro"
        className="absolute flex flex-row items-center gap-2 bottom-47 left-1/2 transform -translate-x-1/2 transition-transform duration-300 hover:scale-110 hover:drop-shadow-2xl"
      >
        <span>
          <img src={toggleRight} className="w-8" />
        </span>
        <p className="text-5xl">SKIP</p>
        <span>
          <img src={toggleLeft} className="w-8" />
        </span>
      </a>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.8, repeat: Infinity, repeatType: "mirror" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <a href="#games" className="block cursor-pointer">
         <img src={scrollArrow} alt="다음 섹션으로 이동" className="w-12 opacity-70" />
       </a>
      </motion.div>

      {/* 클로브 콜라보 버튼 */}
      <div className="absolute bottom-10 left-15 drop-shadow-xl">
        <a href="https://clov.co.kr/" target="_blank" className="block cursor-pointer">
          <img
            src={clovButton}
            alt="클로브로 이동"
            className="w-50 transition-transform duration-300 hover:scale-110 hover:drop-shadow-2xl"
          />
        </a>
      </div>
    </section>
  );
};

export default IntroSection;
