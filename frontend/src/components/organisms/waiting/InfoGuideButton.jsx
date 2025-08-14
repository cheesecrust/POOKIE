// components/organisms/waiting/InfoGuideButton.jsx
import { useState, useEffect } from "react";
import InformationTabs from "./InformationTabs";
import silentscream_cam from "../../../assets/info/silentscream_cam.png";
import silentscream_pass from "../../../assets/info/silentscream_pass.png";
import silentscream_submit from "../../../assets/info/silentscream_submit.png";
import samepose_pose from "../../../assets/info/samepose_pose.png";
import sketchrelay_draw from "../../../assets/info/sketchrelay_draw.png";
import sketchrelay_guess from "../../../assets/info/sketchrelay_guess.png";

export default function InfoGuideButton() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("silentscream");

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 스크롤
  useEffect(() => {
    if (open) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-20 h-12 m-2 bg-rose-400 text-sm rounded-xl text-white
         shadow-lg shadow-rose-400/50 font-semibold hover:bg-rose-500"
      >
        게임 소개
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* ===== Wrapper (탭 기준점) ===== */}
          <div className="relative z-10 w-[600px]">
            {/* ✅ 탭: 모달 '바깥' 위쪽에 붙이기 */}
            <div className="absolute -top-4 left-0 right-0 z-20 px-2">
              <InformationTabs activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {/* 모달 본체 (탭이 밖에 있으니 약간 내려줌) */}
            <div className="h-[500px] mt-6 rounded-xl bg-rose-100 shadow-xl overflow-hidden flex flex-col">
              {/* 닫기 버튼 */}
              <button
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="absolute top-6 right-4 p-2 rounded-full hover:bg-rose-200 z-30"
              >
                X
              </button>

              {/* 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5 pretty-scroll">
                <h3 className="text-xl font-bold mb-3">게임 설명</h3>
                {activeTab === "silentscream" && <SilentScreamGuide />}
                {activeTab === "sketchrelay" && <SketchRelayGuide />}
                {activeTab === "samepose" && <SamePoseGuide />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SilentScreamGuide() {
  return (
    <div className="space-y-3 text-sm leading-6">
      <h4 className="font-semibold text-lg">1. 고요 속의 외침</h4>
      <p>
        발화자가 제시어를 말하고, 옆 두 사람이{" "}
        <b className="text-rose-500">입 모양</b>만 보고 맞혀요
      </p>
      <img src={silentscream_cam} alt="silentcream_cam" className="w-2/3" />
      <ul className="list-disc pl-5">
        <li>
          <b>한 턴 30초 / 15개 제시어</b>
        </li>
        <p className="mb-2">최대한 많이 맞혀보세요!</p>
        <li>
          비발화자 2명만 엔터/클릭으로 <b className="text-pink-500">제출창</b>{" "}
          오픈 !
        </li>
        <img src={silentscream_submit} alt="silentcream_submit" />
        <li>우리 팀이 너무 답답하다면? 발화자가 PASS</li>
        <img src={silentscream_pass} alt="silentcream_pass" />
      </ul>
    </div>
  );
}

function SketchRelayGuide() {
  return (
    <div className="space-y-3 text-sm leading-6">
      <h4 className="font-semibold text-lg">2. 그림 이어 그리기</h4>
      <p>팀에서 한명이 정답을 맞히는 사람!</p>
      <p>나머지 팀원이 돌아가며 제시어를 보고 그림을 이어서 완성합니다</p>
      <ul className="list-disc pl-5">
        <li>
          턴마다 제한시간 <b className="text-rose-500">10초</b> 내 스케치
        </li>
        <img src={sketchrelay_draw} alt="sketchrelay_draw" className=" mb-2" />
        <li>팀원이 그리는 동안 제출자는 답은 맞히기!</li>
        <img src={sketchrelay_guess} alt="sketchrelay_guess" className="" />
      </ul>
    </div>
  );
}

function SamePoseGuide() {
  return (
    <div className="space-y-3 text-sm leading-6">
      <h4 className="font-semibold text-lg">3. 일심동체</h4>
      <p>제시어를 보고 팀원들이 같은 포즈를 취하면 성공! </p>
      <ul className="list-disc pl-5">
        <img src={samepose_pose} alt="samepose_pose" />
        <li>
          카운트 다운 <b className="text-cyan-500">3 2 1 </b>후{" "}
          <b className="text-rose-500">"찰 칵!"</b> 순간에 팀원들과 포즈 일치 시
          정답!
        </li>
        <li>
          <b>찰 칵 !</b> 순간을 잘 맞추는 것이 중요합니다
        </li>
      </ul>
    </div>
  );
}
