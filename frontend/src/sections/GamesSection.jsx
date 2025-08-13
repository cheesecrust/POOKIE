// src/sections/GamesSection.jsx
import { motion } from "framer-motion";
import useInViewMotion from "../utils/useInViewMotion";
import silentScream from "../assets/background/background_silentscream.gif";
import sketchRelay from "../assets/background/background_sketchrelay.gif";
import samePose from "../assets/background/background_samepose.gif";
import scrollArrow from "../assets/icon/toggle_down.png";

import silentScreamThumb from "../assets/background/Thumbnail/silentscreamThumb.png"
import sketchRelayThumb from "../assets/background/Thumbnail/sketchrelayThumb.png"
import samePoseThumb from "../assets/background/Thumbnail/sameposeThumb.png"

const GAMES = [
    {
      key: "silentScream",
      title: "고요 속의 외침",  
      desc: "소리x, 입모양만 보고 맞춰요!",
      bg: silentScream,
      img: silentScreamThumb,
    },
    {
      key: "sketchRelay",
      title: "이어 그리기",
      desc: "그림으로 이어가는 릴레이!",
      bg: sketchRelay,
      img: sketchRelayThumb,
    },
    {
      key: "samePose",
      title: "일심동체",
      desc: "AI가 맞춰주는 팀원과의 유사도!",
      bg: samePose,
      img: samePoseThumb,
    },
  ];

const GamesSection = () => {
    const { ref, inView } = useInViewMotion();
    
    return (
      <section id="games" ref={ref} className="h-screen relative w-full flex flex-col" aria-label="Games">
        <div className="flex-1 flex lg:flex-row flex-col">
          {GAMES.map((g, i) => (
            <motion.div
              key={g.key}
              className="relative lg:w-1/3 w-full h-full lg:h-full group overflow-hidden"
              style={{
                backgroundImage: `url(${g.bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              {/* overlay */}
              <div className="absolute inset-0 bg-black/40 transition-all group-hover:bg-black/20" />

              {/* content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                {/* 이미지 카드 */}
                <img
                  src={g.img ?? g.bg}
                  alt={`${g.title} 카드`}
                  className="w-100 aspect-[16/9] object-cover rounded-xl shadow-xl border border-white/30 mb-4 pointer-events-none
                            transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <h2 className="text-3xl md:text-4xl mt-10 font-extrabold tracking-wide drop-shadow">
                  {g.title}
                </h2>
                <p className="mt-3 text-base md:text-lg opacity-90">{g.desc}</p>
              </div>
            </motion.div>
          ))}

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8, repeat: Infinity, repeatType: "mirror" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            aria-hidden
          >
            <a href="#myroom" className="block cursor-pointer">
              <img src={scrollArrow} alt="다음 섹션으로 이동" className="w-12 opacity-70" />
            </a>
          </motion.div>
        </div>
      </section>
  );
};

export default GamesSection;
