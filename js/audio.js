// ========================================
// 地雷战 - 音频管理器 v2
// ========================================

class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.muted = false;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmBarIndex = 0;
        this.bgmStyle = 0;
        this.noiseBuffer = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.6;
            this.masterGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.12;
            this.bgmGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 1.0;
            this.sfxGain.connect(this.masterGain);

            const sr = this.ctx.sampleRate;
            this.noiseBuffer = this.ctx.createBuffer(1, sr, sr);
            const d = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < sr; i++) d[i] = Math.random() * 2 - 1;

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.6;
        return this.muted;
    }

    // ===== 爆炸音效 =====
    playExplosion(mineType) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const presets = {
            trip:     { f: 280, d: 0.15, nv: 0.3,  bv: 0.2,  ff: 2500 },
            dirt:     { f: 140, d: 0.28, nv: 0.45, bv: 0.4,  ff: 1800 },
            iron:     { f: 85,  d: 0.38, nv: 0.55, bv: 0.55, ff: 1200 },
            antitank: { f: 50,  d: 0.5,  nv: 0.65, bv: 0.7,  ff: 900  },
            chain:    { f: 110, d: 0.32, nv: 0.5,  bv: 0.45, ff: 1500 },
            sky:      { f: 35,  d: 0.75, nv: 0.75, bv: 0.85, ff: 700  },
            ap:       { f: 40,  d: 0.55, nv: 0.7,  bv: 0.8,  ff: 800  },
            magnetic: { f: 60,  d: 0.45, nv: 0.6,  bv: 0.6,  ff: 1000 },
        };
        const p = presets[mineType] || presets.dirt;

        const ns = this.ctx.createBufferSource();
        ns.buffer = this.noiseBuffer;
        const nf = this.ctx.createBiquadFilter();
        nf.type = 'lowpass';
        nf.frequency.setValueAtTime(p.ff, t);
        nf.frequency.exponentialRampToValueAtTime(200, t + p.d);
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(p.nv, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + p.d);
        ns.connect(nf); nf.connect(ng); ng.connect(this.sfxGain);
        ns.start(t); ns.stop(t + p.d + 0.05);

        const os = this.ctx.createOscillator();
        os.type = 'sine';
        os.frequency.setValueAtTime(p.f, t);
        os.frequency.exponentialRampToValueAtTime(20, t + p.d * 0.8);
        const og = this.ctx.createGain();
        og.gain.setValueAtTime(p.bv, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + p.d);
        os.connect(og); og.connect(this.sfxGain);
        os.start(t); os.stop(t + p.d + 0.05);
    }

    // ===== 碾压惨叫 =====
    playScream() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // 带通噪声突发
        const ns = this.ctx.createBufferSource();
        ns.buffer = this.noiseBuffer;
        const bf = this.ctx.createBiquadFilter();
        bf.type = 'bandpass';
        bf.frequency.setValueAtTime(2000, t);
        bf.frequency.exponentialRampToValueAtTime(800, t + 0.3);
        bf.Q.value = 3;
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.5, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        ns.connect(bf); bf.connect(ng); ng.connect(this.sfxGain);
        ns.start(t); ns.stop(t + 0.4);
        // 下降锯齿波
        const os = this.ctx.createOscillator();
        os.type = 'sawtooth';
        os.frequency.setValueAtTime(900, t);
        os.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1200;
        const og = this.ctx.createGain();
        og.gain.setValueAtTime(0.25, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        os.connect(lp); lp.connect(og); og.connect(this.sfxGain);
        os.start(t); os.stop(t + 0.4);
    }

    // 布雷音效
    playPlace() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(600, t);
        o.frequency.linearRampToValueAtTime(350, t + 0.08);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(g); g.connect(this.sfxGain);
        o.start(t); o.stop(t + 0.12);
    }

    // 开战警报
    playWaveStart() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        for (let i = 0; i < 2; i++) {
            const offset = i * 0.35;
            const o = this.ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(250, t + offset);
            o.frequency.linearRampToValueAtTime(500, t + offset + 0.25);
            const f = this.ctx.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = 900;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t + offset);
            g.gain.linearRampToValueAtTime(0.12, t + offset + 0.05);
            g.gain.setValueAtTime(0.12, t + offset + 0.2);
            g.gain.linearRampToValueAtTime(0, t + offset + 0.3);
            o.connect(f); f.connect(g); g.connect(this.sfxGain);
            o.start(t + offset); o.stop(t + offset + 0.35);
        }
    }

    // 胜利音效
    playVictory() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const notes = [330, 392, 494, 659];
        notes.forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            o.type = 'triangle';
            o.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t + i * 0.15);
            g.gain.linearRampToValueAtTime(0.15, t + i * 0.15 + 0.05);
            g.gain.setValueAtTime(0.15, t + i * 0.15 + 0.12);
            g.gain.linearRampToValueAtTime(0, t + i * 0.15 + 0.4);
            o.connect(g); g.connect(this.sfxGain);
            o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.45);
        });
    }

    // ===== BGM (按关卡风格) =====
    startBGM(styleIdx) {
        if (!this.initialized || this.bgmPlaying) return;
        this.bgmPlaying = true;
        this.bgmBarIndex = 0;
        this.bgmStyle = styleIdx || 0;
        this._nextBar();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) { clearTimeout(this.bgmTimer); this.bgmTimer = null; }
    }

    _nextBar() {
        if (!this.bgmPlaying) return;
        const style = BGM_STYLES[this.bgmStyle] || BGM_STYLES[0];
        const bpm = style.bpm;
        const beat = 60 / bpm;
        const barLen = beat * 4;
        const t = this.ctx.currentTime + 0.05;

        const bassNotes = style.notes;
        this._bass(t, bassNotes[this.bgmBarIndex % bassNotes.length], barLen);

        this._kick(t);
        this._snare(t + beat * 2);
        const bar = this.bgmBarIndex % 4;
        if (bar === 0) {
            this._hat(t + beat); this._hat(t + beat * 3);
        } else if (bar === 1) {
            this._hat(t + beat); this._hat(t + beat * 3); this._hat(t + beat * 3.5);
        } else if (bar === 2) {
            this._kick(t + beat); this._hat(t + beat * 1.5); this._hat(t + beat * 3);
        } else {
            this._hat(t + beat * 0.5); this._hat(t + beat * 1.5);
            this._kick(t + beat * 3); this._hat(t + beat * 3.5);
        }

        this.bgmBarIndex++;
        this.bgmTimer = setTimeout(() => this._nextBar(), (barLen - 0.05) * 1000);
    }

    _bass(t, freq, dur) {
        const o = this.ctx.createOscillator();
        o.type = 'sine'; o.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.1);
        g.gain.setValueAtTime(0.18, t + dur - 0.15);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); g.connect(this.bgmGain);
        o.start(t); o.stop(t + dur + 0.01);
        const o2 = this.ctx.createOscillator();
        o2.type = 'sine'; o2.frequency.value = freq * 1.5;
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.05, t + 0.1);
        g2.gain.setValueAtTime(0.05, t + dur - 0.15);
        g2.gain.linearRampToValueAtTime(0, t + dur);
        o2.connect(g2); g2.connect(this.bgmGain);
        o2.start(t); o2.stop(t + dur + 0.01);
    }

    _kick(t) {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(130, t);
        o.frequency.exponentialRampToValueAtTime(30, t + 0.12);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.connect(g); g.connect(this.bgmGain);
        o.start(t); o.stop(t + 0.18);
    }

    _snare(t) {
        const n = this.ctx.createBufferSource();
        n.buffer = this.noiseBuffer;
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = 0.8;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        n.connect(f); f.connect(g); g.connect(this.bgmGain);
        n.start(t); n.stop(t + 0.1);
        const o = this.ctx.createOscillator();
        o.type = 'triangle'; o.frequency.value = 190;
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.1, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        o.connect(g2); g2.connect(this.bgmGain);
        o.start(t); o.stop(t + 0.08);
    }

    _hat(t) {
        const n = this.ctx.createBufferSource();
        n.buffer = this.noiseBuffer;
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 7000;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        n.connect(f); f.connect(g); g.connect(this.bgmGain);
        n.start(t); n.stop(t + 0.04);
    }
}
