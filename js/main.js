// ========================================
// 地雷战 - 主入口 v3 (关卡制)
// ========================================

(function () {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    const renderer = new Renderer(game);
    const audioManager = new AudioManager();
    game.audio = audioManager;
    let gameSpeed = 1;

    // --- Resize ---
    const MOBILE_BP = 640;
    function resize() {
        const container = document.getElementById('game-container');
        const isMobile = window.innerWidth <= MOBILE_BP;
        const availW = container.clientWidth;
        const availH = isMobile
            ? container.clientHeight
            : container.clientHeight - document.getElementById('ui-panel').offsetHeight;

        const tsW = Math.floor(availW / CONFIG.COLS);
        const tsH = Math.floor(availH / CONFIG.ROWS);
        game.tileSize = Math.min(tsW, tsH);

        canvas.width = availW;
        canvas.height = availH;

        const mapW = CONFIG.COLS * game.tileSize;
        const mapH = CONFIG.ROWS * game.tileSize;
        game.offsetX = Math.floor((availW - mapW) / 2);
        game.offsetY = Math.floor((availH - mapH) / 2);
    }
    window.addEventListener('resize', resize);
    resize();

    // --- 地雷按钮 ---
    function buildMineUI() {
        const sel = document.getElementById('mine-selector');
        sel.innerHTML = '';

        for (const [key, mt] of Object.entries(MINE_TYPES)) {
            const btn = document.createElement('div');
            btn.className = 'mine-btn';
            if (!game.currentLevel.mines.includes(key)) btn.classList.add('locked');
            btn.dataset.type = key;

            const costParts = [];
            if (mt.iron > 0) costParts.push(`🔩${mt.iron}`);
            if (mt.powder > 0) costParts.push(`💥${mt.powder}`);

            btn.innerHTML = `
                <span class="icon">${mt.icon}</span>
                <span class="name">${mt.name}</span>
                <span class="cost">${costParts.join(' ')}</span>
                <span class="desc-tag">${mt.desc}</span>
            `;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.classList.contains('locked')) return;
                document.querySelectorAll('.mine-btn').forEach(b => b.classList.remove('selected'));
                if (game.selectedMine === key) {
                    game.selectedMine = null;
                } else {
                    game.selectedMine = key;
                    btn.classList.add('selected');
                }
            });

            sel.appendChild(btn);
        }
    }
    buildMineUI();

    // --- 波次预览 ---
    function updateWavePreview() {
        const el = document.getElementById('wave-preview');
        if (game.waveInLevel >= game.currentLevel.waves.length) { el.textContent = ''; return; }
        const def = game.currentLevel.waves[game.waveInLevel];
        if (!def) { el.textContent = ''; return; }
        const parts = def.map(g => {
            const et = ENEMY_TYPES[g.t];
            return `${et.name}×${g.n}`;
        });
        el.textContent = `来敌: ${parts.join(' ')}`;
    }

    // --- 输入 ---
    let touchHandled = false;

    function handleInput(e) {
        if (e.type === 'touchstart') { touchHandled = true; e.preventDefault(); }
        else if (e.type === 'click' && touchHandled) { touchHandled = false; return; }

        let cx, cy;
        if (e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
        else { cx = e.clientX; cy = e.clientY; }

        const rect = canvas.getBoundingClientRect();
        const sx = (cx - rect.left) * (canvas.width / rect.width);
        const sy = (cy - rect.top) * (canvas.height / rect.height);
        const {col, row} = game.screenToGrid(sx, sy);

        if (game.state === 'prep' || game.state === 'wave') {
            if (game.selectedMine) {
                if (!game.placeMine(col, row)) {
                    if (game.hasMineAt(col, row)) game.removeMine(col, row);
                }
            } else {
                if (game.hasMineAt(col, row)) game.removeMine(col, row);
            }
        }
    }

    function handleMove(e) {
        let cx, cy;
        if (e.touches) { e.preventDefault(); cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
        else { cx = e.clientX; cy = e.clientY; }

        const rect = canvas.getBoundingClientRect();
        const sx = (cx - rect.left) * (canvas.width / rect.width);
        const sy = (cy - rect.top) * (canvas.height / rect.height);
        game.hoverTile = game.screenToGrid(sx, sy);
    }

    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput, {passive: false});
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, {passive: false});
    canvas.addEventListener('mouseleave', () => { game.hoverTile = null; });

    // --- 按钮 ---
    const startBtn = document.getElementById('start-wave-btn');
    const speedBtn = document.getElementById('speed-btn');

    startBtn.addEventListener('click', () => {
        if (game.state === 'prep') {
            audioManager.init();
            audioManager.resume();
            if (!audioManager.bgmPlaying) {
                audioManager.startBGM(game.level - 1);
            }
            game.startWave();
            speedBtn.classList.remove('hidden');
            document.getElementById('wave-preview').textContent = '';
        }
    });

    // --- 帮助 ---
    document.getElementById('help-btn').addEventListener('click', () => {
        game.showMessage('游戏说明', [
            '【目标】布置地雷阻击鬼子, 保卫村庄',
            '',
            '【操作】',
            '  选择地雷 → 点击路径布雷',
            '  点已有地雷可回收(退80%材料)',
            '  战斗中也可以继续补充布雷',
            '',
            '【关卡】共7关, 每关3波',
            '  每关解锁新敌人和新地雷',
            '  通关后进入下一关(新地图/BGM)',
            '',
            '【地雷】',
            '  ⚡绊雷 — 反步兵, 附带流血',
            '  ◉土雷 — 通用, 碎片溅射',
            '  ⬢铁雷 — 高威力, 削减装甲',
            '  ⊕反坦克雷 — 仅对车辆, 穿甲',
            '  ⛓连环雷 — 连锁爆炸×3, 防扫雷',
            '  ☄天雷 — 无视装甲, 眩晕, 防扫雷',
            '  ◆穿甲雷 — 穿透重甲, 破甲一击',
            '  ⊗磁性雷 — 反扫雷车, 磁感应',
            '',
            '【敌人】',
            '  步兵/骑兵/工兵/卡车/装甲车',
            '  轻型坦克/重型坦克/扫雷车',
            '  骑兵有25%闪避几率',
            '  工兵会排除地雷, 优先消灭!',
            '  坦克装甲厚, 需要高威力雷',
            '  扫雷车会清除普通地雷',
            '    只有防扫雷的雷能对付它!',
            '',
            '【伤害减速】',
            '  受伤敌人速度与血量成正比(最低40%)',
            '  受伤步兵会阻碍后方友军1~2秒',
            '  车辆等1~2秒后碾压受伤步兵',
            '  受伤车辆阻挡后方车辆无法绕过',
            '  坦克等3秒后可击毁挡路友军车辆',
            '  低伤害雷也能通过减速制造拥堵!',
            '',
            '【经济】',
            '  击杀敌人缴获🔩铁和💥火药',
            '  每波结束有过关奖励',
            '  合理选择雷种, 避免浪费材料',
            '',
            '【房屋】',
            '  每座房3点HP, 全毁则游戏结束',
            '  步兵=1伤害  重型坦克=9伤害(毁3屋)',
        ].join('\n'), () => {});
    });

    // --- 静音 ---
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
        audioManager.init();
        const muted = audioManager.toggleMute();
        muteBtn.textContent = muted ? '🔇' : '🔊';
    });

    // --- 更多菜单 (手机端) ---
    const detailPanel = document.getElementById('detail-panel');
    document.getElementById('more-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        detailPanel.classList.toggle('show');
    });
    detailPanel.addEventListener('click', (e) => { e.stopPropagation(); });
    document.addEventListener('click', () => { detailPanel.classList.remove('show'); });
    canvas.addEventListener('touchstart', () => { detailPanel.classList.remove('show'); }, true);

    speedBtn.addEventListener('click', () => {
        gameSpeed = gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 1;
        speedBtn.textContent = gameSpeed === 1 ? '⏩' : gameSpeed === 2 ? '⏩×2' : '⏩×3';
        speedBtn.classList.toggle('active', gameSpeed > 1);
    });

    // 波次/关卡结束后的 UI 恢复
    game.onWaveReset = () => {
        gameSpeed = 1;
        speedBtn.textContent = '⏩';
        speedBtn.classList.remove('active');
        speedBtn.classList.add('hidden');
        buildMineUI();
        updateWavePreview();
    };

    // --- 游戏循环 ---
    let lastTime = 0;
    function loop(ts) {
        let dt = Math.min((ts - lastTime) / 1000, 0.1);
        lastTime = ts;
        game.update(dt * gameSpeed);
        renderer.render(dt);
        requestAnimationFrame(loop);
    }

    game.updateUI();
    updateWavePreview();
    requestAnimationFrame(loop);

    // 开场难度选择
    setTimeout(() => {
        const ov = document.getElementById('message-overlay');
        const msgBox = document.getElementById('message-box');
        const msgBtn = document.getElementById('msg-btn');
        document.getElementById('msg-title').textContent = `地雷战 — ${LEVEL_DEFS[0].name}`;
        document.getElementById('msg-text').textContent =
            '鬼子要进村了!\n选择地雷 → 点路径布雷\n点已有地雷可回收(退80%材料)\n⚠️ 工兵会排雷, 注意纵深布置!\n房屋全毁则游戏结束\n\n共7关, 每关3波, 逐步解锁新装备\n\n请选择难度:';
        msgBtn.style.display = 'none';
        ov.classList.remove('hidden');

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-top:12px;';
        const diffs = [
            { name:'新手', desc:'缴获100%', mul:1.0, bg:'linear-gradient(180deg,#4a8a4a 0%,#2a5a2a 100%)', bd:'#5aaa5a' },
            { name:'专家', desc:'缴获90%', mul:0.9, bg:'linear-gradient(180deg,#c4881a 0%,#8a5a0a 100%)', bd:'#e8a83a' },
            { name:'大师', desc:'缴获80%', mul:0.8, bg:'linear-gradient(180deg,#c44a3a 0%,#8b2e1a 100%)', bd:'#e8773a' },
        ];
        for (const d of diffs) {
            const b = document.createElement('button');
            b.style.cssText = `background:${d.bg};color:#fff;border:2px solid ${d.bd};border-radius:8px;padding:8px 16px;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;transition:transform 0.15s;`;
            b.innerHTML = `${d.name}<br><span style="font-size:11px;font-weight:normal;opacity:0.85">${d.desc}</span>`;
            b.addEventListener('click', () => {
                game.dropMul = d.mul;
                game.difficultyName = d.name;
                ov.classList.add('hidden');
                msgBtn.style.display = '';
                row.remove();
                audioManager.init();
                audioManager.resume();
            });
            row.appendChild(b);
        }
        msgBox.appendChild(row);
    }, 300);
})();
