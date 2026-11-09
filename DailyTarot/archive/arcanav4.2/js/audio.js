// js/audio.js

let audioActive = false;
let audioContext = null;
let droneOsc = null;
let droneGain = null;

export function isAudioActive() {
    return audioActive;
}

export function toggleAudio(showToastCallback) {
    audioActive = !audioActive;

    if (audioActive) {
        playAmbientDrone();
        if (showToastCallback) showToastCallback("Ambient celestial audio enabled");
    } else {
        stopAmbientDrone();
        if (showToastCallback) showToastCallback("Audio muted");
    }

    return audioActive;
}

// Internal helper — no export needed
function getAudioContext() {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

// Internal helper — no export needed
function playAmbientDrone() {
    const ctx = getAudioContext();
    stopAmbientDrone(false);

    droneOsc = ctx.createOscillator();
    droneGain = ctx.createGain();

    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(65.41, ctx.currentTime);
    droneGain.gain.setValueAtTime(0.03, ctx.currentTime);

    droneOsc.connect(droneGain);
    droneGain.connect(ctx.destination);
    droneOsc.start();
}

// Internal helper — no export needed
function stopAmbientDrone(suspendContext = true) {
    if (droneOsc) {
        try {
            droneOsc.stop();
            droneOsc.disconnect();
        } catch (e) {}
        droneOsc = null;
    }
    if (droneGain) {
        try {
            droneGain.disconnect();
        } catch (e) {}
        droneGain = null;
    }

    if (suspendContext && audioContext && audioContext.state === 'running') {
        audioContext.suspend();
    }
}

// Exported because drawSingleCard() and drawTripleSpread() call it directly in main.js
export function playMysticChime() {
    if (!audioActive) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
    } catch (e) {}
}
