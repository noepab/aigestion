/* Sci-Fi Sound Hook */
import { useCallback } from 'react';

export const useSciFiSound = () => {
    // Uses Web Audio API to generate synthesized sounds
    // Avoids external file dependencies

    const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {return;}

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    };

    const playHover = useCallback(() => {
        playTone(800, 'sine', 0.05, 0.05); // High subtle blip
    }, []);

    const playClick = useCallback(() => {
        playTone(1200, 'square', 0.1, 0.05); // Sharp sci-fi click
    }, []);

    const playSuccess = useCallback(() => {
        // Arpeggio
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;
        [440, 554, 659, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.05, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }, []);

    const playError = useCallback(() => {
        playTone(150, 'sawtooth', 0.3, 0.1); // Low buzz
    }, []);

    return { playHover, playClick, playSuccess, playError };
};
