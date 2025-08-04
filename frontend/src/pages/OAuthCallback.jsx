// src/pages/OAuthCallback.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const OAuthCallback = () => {
    const navigate = useNavigate();
    const store = useAuthStore();

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const accessToken = params.get('accessToken');
            const email = params.get('email');
            const nickname = params.get('nickname');
            const userAccountId = params.get('userAccountId');

            console.log('🔐 accessToken:', accessToken);
            console.log('📧 email:', email);
            console.log('🙍 nickname:', nickname);
            console.log('🆔 userAccountId:', userAccountId);
    
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
                store.setAccessToken(accessToken);
                store.setUser({ email, nickname, userAccountId });
                store.setLoggedIn(true);
                navigate('/home');
            } else {
                navigate('/login');
            }
        } catch (err) {
            console.error('소셜 로그인 실패:', err);
            navigate('/login');
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="loader mb-4"></div>
            <p className="text-lg font-semibold">소셜 로그인 중입니다...</p>
        </div>
    )
}

export default OAuthCallback