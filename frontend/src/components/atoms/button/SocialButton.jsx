// src/components/atoms/button/SocialButton.jsx
// 사용 예시
//   <SocialButton provider="google" />
//   <SocialButton provider="kakao" />

import google from "../../../assets/icon/google.png";
import kakao from "../../../assets/icon/kakao.png";

const BASE_URL = import.meta.env.VITE_API_URL;

const socialStyles = {
  google: {
    iconSrc: `${google}`,
    alt: "Google",
    bgColor: "bg-white",
    textColor: "text-black",
    border: "border border-black",
    label: "구글 회원가입",
    href: `${BASE_URL}/oauth2/authorization/google`
  },
  kakao: {
    iconSrc: `${kakao}`,
    alt: "Kakao",
    bgColor: "bg-[#FEE500]",
    textColor: "text-black",
    border: "border border-black",
    label: "카카오 회원가입",
    href: `${BASE_URL}/oauth2/authorization/kakao`
  },
};

const SocialButton = ({ provider = "google", className = "" }) => {
  const style = socialStyles[provider];

  if (!style) {
    console.error(`Unsupported provider: ${provider}`);
    return null;
  }

  return (
    <button
      onClick={() => window.location.href = style.href}
      className={`
        flex items-center justify-center gap-2
        ${style.bgColor} ${style.textColor} ${style.border}
        font-semibold text-sm px-4 py-2 rounded-md shadow
        hover:brightness-95 transform transition
        ${className}
      `}
    >
      <img src={style.iconSrc} alt={style.alt} className="w-5 h-5" />
      {style.label}
    </button>
  );
};

export default SocialButton;
