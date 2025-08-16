// 친구 초대가 가는 페이지 직접 설정정

// components/organisms/invite/InviteGateWatcher.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useHomeStore from "../../../store/useHomeStore";

export default function InviteGateWatcher() {
  const { pathname } = useLocation();
  const setInviteGate = useHomeStore(s => s.setInviteGate);

  useEffect(() => {
    // 허용 페이지만 true
    const allowed = pathname.startsWith("/home") || pathname.startsWith("/myroom");
    setInviteGate(allowed);
  }, [pathname, setInviteGate]);

  return null;
}
