// src/utils/useSound.js
import { Howl, Howler } from 'howler';
import { useCallback } from 'react';

// 사운드
import click from "../assets/audio/effect/click.mp3";
import pookie from "../assets/audio/effect/pookie_sound.mp3";
import buy from "../assets/audio/effect/buy.mp3";
import leave from "../assets/audio/effect/leave.mp3";
import entry from "../assets/audio/effect/entry.mp3";
import countdown from "../assets/audio/effect/countdown.mp3";
import correct from "../assets/audio/effect/correct.mp3";
import incorrect from "../assets/audio/effect/incorrect.mp3";
import grow from "../assets/audio/effect/grow.mp3";
import game_start from "../assets/audio/effect/game_start.mp3";
import turn_change from "../assets/audio/effect/turn_change.mp3";
import round_over from "../assets/audio/effect/round_over.mp3";
import game_over from "../assets/audio/effect/game_over.mp3";
import camera_shutter from "../assets/audio/effect/camera_shutter.mp3";

// 사운드 파일 경로 관리
const soundMap = {
    // 클릭 사운드(click)
    click,
    pookie,
    buy,

    // 이동 사운드(입장)
    entry,
    leave,

    // 모달 사운드(start, turn, round, end)
    countdown,
    game_start,
    turn_change,
    round_over,
    game_over,

    // 게임 사운드()
    correct,
    incorrect,
    grow,
    camera_shutter,
}

// useSound
const useSound = () => {
    const playSound = useCallback((key) => {
        const src = soundMap[key];
        if (!src) return;

        const sound = new Howl({
            src: [src],
            volume: 0.6,
            html5: true,
        });
        sound.play();
    }, []);

    // 전체 볼륨 변경
    const setVolume = useCallback((volume) => {
        Howler.volume(volume);
    }, []);

    // 전체 음소거
    const mute = useCallback(() => {
        Howler.mute(true);
    }, []);

    // 전체 음소거 해제
    const unmute = useCallback(() => {
        Howler.mute(false);
    }, []);

    return {
        playSound,
        setVolume,
        mute,
        unmute,
    }
}

export default useSound