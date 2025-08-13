// src/sections/CharacterSection.jsx
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/navigation";
import { useRef, useEffect } from "react";

import characterImageMap from "../utils/characterImageMap";
import scrollArrow from "../assets/icon/toggle_down.png";
import toggleRight from "../assets/icon/toggle_left.png"
import toggleLeft from "../assets/icon/toggle_right.png"
import useInViewMotion from "../utils/useInViewMotion";
import backgroundRoom from "../assets/background/background_myroom.png"

const CHARACTERS = [
    { name: "불닭 푸딩", img: characterImageMap.buldakpudding, desc: "매콤한 매력" },
    { name: "딸기 푸딩", img: characterImageMap.strawberrypudding, desc: "상큼한 딸기맛" },
    { name: "블루베리 푸딩", img: characterImageMap.blueberrypudding, desc: "달콤한 블루베리" },
    { name: "카라멜 푸딩", img: characterImageMap.caramelpudding, desc: "부드러운 카라멜" },
    { name: "크림브륄레 푸딩", img: characterImageMap.creampudding, desc: "달콤 고소" },
    { name: "밀크 푸딩", img: characterImageMap.milkpudding, desc: "순수한 우유맛" },
    { name: "말차 푸딩", img: characterImageMap.greenteapudding, desc: "쌉싸름한 말차" },
    { name: "메론 푸딩", img: characterImageMap.melonpudding, desc: "시원한 메론" },
    { name: "초코 푸딩", img: characterImageMap.chocopudding, desc: "진한 초콜릿" },
];

const CharacterSection = () => {
    const { ref, inView } = useInViewMotion();
    const swiperRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    // 섹션 벗어날 때 안전 정지
    useEffect(() => {
      return () => {
        if (swiperRef.current?.autoplay) swiperRef.current.autoplay.stop();
      };
    }, []);

    const startFlow = (direction) => {
      const swiper = swiperRef.current;
      if (!swiper) return;
      // 방향 설정 후 시작
      swiper.params.autoplay.reverseDirection = direction === "left";
      // 딜레이 0으로 연속 이동
      swiper.params.autoplay.delay = 0;
      swiper.autoplay.start();
    };

    const stopFlow = () => {
      const swiper = swiperRef.current;
      if (!swiper) return;
      swiper.autoplay.stop();
    };

    
    return (
        <section
          id="character"
          ref={ref}
          className="h-screen relative flex flex-col justify-center overflow-hidden"
          aria-label="Characters"
        >

        {/* 흐린 배경 레이어 */}
        <div
          className="absolute inset-0 bg-cover bg-center blur-[3px]"
          style={{
            backgroundImage: `url(${backgroundRoom})`
          }}
        />

        <h2 className="text-3xl md:text-5xl font-extrabold text-center bottom-10 mb-20 relative">
          푸딩을 Pick! 하고 키워 보세요!
        </h2>

        {/* 캐러셀 + 버튼 래퍼 */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          {/* 상단: 네비게이션 버튼을 캐러셀 밖으로 */}
          <div className="mb-4 flex items-center justify-end gap-3">
            {/* 커스텀 버튼 */}
            <button
              ref={prevRef}
              type="button"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 group-hover:opacity-100 transition w-12 h-12 rounded-full grid place-items-center hover:scale-105 active:scale-95"
              aria-label="이전"
            >
              <img src={toggleLeft} alt="" className="w-8 h-8 z-20" />
            </button>
            <button
              ref={nextRef}
              type="button"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 group-hover:opacity-100 transition w-12 h-12 rounded-full grid place-items-center hover:scale-105 active:scale-95"
              aria-label="다음"
            >
              <img src={toggleRight} alt="" className="w-8 h-8 z-20" />
            </button>
          </div>

          <div className="relative group">
            {/* 좌우 hover zone 그대로 유지 (흐르는 애니메이션용) */}
            <div
              className="absolute left-0 top-0 h-full w-16 z-10 hidden md:block"
              onMouseEnter={() => startFlow("left")}
              onMouseLeave={stopFlow}
            />
            <div
              className="absolute right-0 top-0 h-full w-16 z-10 hidden md:block"
              onMouseEnter={() => startFlow("right")}
              onMouseLeave={stopFlow}
            />

          {/* Swiper */}
          <Swiper
            modules={[Navigation, Autoplay]}
            loop
            speed={1400}
            autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: false }}
            spaceBetween={32}
            slidesPerView={4}
            onSwiper={(sw) => (swiperRef.current = sw)}
            breakpoints={{
              0: { slidesPerView: 1.2 },
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 },
              1280: { slidesPerView: 4 },
            }}
            onInit={(sw) => {
              swiperRef.current = sw;
              sw.params.navigation.prevEl = prevRef.current;
              sw.params.navigation.nextEl = nextRef.current;
              sw.navigation.init();
              sw.navigation.update();
            }}
          >
          {CHARACTERS.map((c, i) => (
          <SwiperSlide key={i} className="!h-auto px-2 md:px-3">
            {/* 카드-안쪽 래퍼에만 scale 적용 + 버퍼 패딩 */}
            <div className="rounded-2xl border-2 border-black bg-white p-4 drop-shadow-xl
                            transition-transform duration-200 will-change-transform transform-gpu
                            hover:scale-[1.015] hover:-translate-y-0.5">
              <img src={c.img} alt={c.name} className="w-full h-56 object-contain mb-3" />
              <h3 className="text-lg font-bold">{c.name}</h3>
              <p className="text-sm text-gray-500">{c.desc}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

        <style>{`
          .swiper-wrapper { transition-timing-function: ease-out; }
        `}</style>
      </div>
    </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8, repeat: Infinity, repeatType: "mirror" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          aria-hidden
        >
          <a href="#outro" className="block cursor-pointer">
            <img src={scrollArrow} alt="다음 섹션으로 이동" className="w-12 opacity-70" />
          </a>
        </motion.div>
      </section>
    );
}

export default CharacterSection;
