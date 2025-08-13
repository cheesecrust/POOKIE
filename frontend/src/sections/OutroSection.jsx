// src/sections/OutroSection.jsx
import { motion } from "framer-motion";
import useInViewMotion from "../utils/useInViewMotion";
import ModalButton from "../components/atoms/button/ModalButton";
import backgroundOutro from "../assets/background/background_login.png"

const OutroSection = ({ onStart, started }) => {
    const { ref, inView } = useInViewMotion();

    return (
      <section
        id="outro"
        ref={ref}
        className="h-screen flex flex-col items-center justify-center text-center px-6 relative"
        aria-label="Outro"
        style={{
          backgroundImage: `url(${backgroundOutro})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <motion.h2
          className="absolute top-60 text-3xl md:text-5xl font-extrabold mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          지금 시작해 보세요!
        </motion.h2>
  
        {/* 기존 START 버튼 재사용 */}
        {!started && (
          <motion.div
            className="absolute top-100 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ModalButton size="xl" onClick={onStart}>
              START
            </ModalButton>
          </motion.div>
        )}
  
        <motion.p
          className="absolute bottom-30 left-1/2 transform -translate-x-1/2 text-md md:text-base text-black leading-tight"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          ※ 원활한 진행을 위해 <b>F11</b>을 눌러 전체화면 사용을 권장합니다.
          <br />※ 본 게임은 사용자의 캠 화면을 이용하여 초상권을 침해할 수 있습니다.
        </motion.p>
      </section>
  );
};

export default OutroSection;
