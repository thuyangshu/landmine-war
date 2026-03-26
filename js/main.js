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
                game.selectedMine = key;
                btn.classList.add('selected');
            });

            sel.appendChild(btn);
        }

        // 恢复或自动选中第一个可用雷种
        if (game.selectedMine && game.currentLevel.mines.includes(game.selectedMine)) {
            const cur = sel.querySelector(`.mine-btn[data-type="${game.selectedMine}"]`);
            if (cur) cur.classList.add('selected');
        } else {
            const firstAvail = game.currentLevel.mines[0];
            if (firstAvail) {
                game.selectedMine = firstAvail;
                const first = sel.querySelector(`.mine-btn[data-type="${firstAvail}"]`);
                if (first) first.classList.add('selected');
            }
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

        if (game.state === 'countdown' || game.state === 'wave') {
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
    const speedBtn = document.getElementById('speed-btn');

    // --- 帮助 ---
    document.getElementById('help-btn').addEventListener('click', () => {
        game.showMessage('游戏说明', [
            '【目标】布置地雷阻击鬼子, 保卫村庄',
            '',
            '【操作】',
            '  每波开始有15秒布雷倒计时',
            '  倒计时结束后敌人进攻',
            '  战斗中仍可补充布雷',
            '  点已有地雷可回收(退80%材料)',
            '',
            '【关卡】共7关, 每关3波',
            '  每关解锁新敌人和新地雷',
            '  通关后进入下一关(新地图/BGM)',
            '',
            '【地雷策略】',
            '  🔥纯火药(反步兵, 工兵无法排除):',
            '    ⚡绊雷 — 💥5 流血',
            '    ◉土雷 — 💥8 碎片溅射',
            '  🔩偏铁(反车辆/装甲):',
            '    ⬢铁雷 — 🔩12💥4 通用, 削装甲',
            '    ⊕反坦克雷 — 🔩18💥4 仅车辆, 穿甲',
            '    ◆穿甲雷 — 🔩26💥6 破重甲',
            '  💥偏火药(特效):',
            '    ⛓连环雷 — 🔩10💥16 连锁×3, 防扫雷',
            '    ☄天雷 — 🔩10💥28 无视装甲, 眩晕',
            '    ⊗磁性雷 — 🔩8💥20 仅车辆, 防扫雷',
            '',
            '【敌人】',
            '  步兵/骑兵/工兵 — 缴获偏💥火药',
            '  卡车/装甲车/坦克/扫雷车 — 缴获偏🔩铁',
            '  骑兵有25%闪避几率',
            '  工兵排雷只能排含金属的雷!',
            '    绊雷和土雷无金属, 工兵无法探测',
            '  坦克装甲厚, 需要穿甲/天雷',
            '  扫雷车清除金属雷, 防扫雷雷免疫',
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
            '  步兵类缴获偏火药, 车辆类缴获偏铁',
            '  每波结束有过关奖励',
            '  资源不平衡时选对应雷种:',
            '    火药多→绊雷/土雷/连环雷/天雷',
            '    铁多→铁雷/反坦克雷/穿甲雷',
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

    // --- 更多菜单 (手机端 detail-panel) ---
    const detailPanel = document.getElementById('detail-panel');
    document.getElementById('more-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        detailPanel.classList.toggle('show');
    });
    detailPanel.addEventListener('click', (e) => { e.stopPropagation(); });
    document.addEventListener('click', () => { detailPanel.classList.remove('show'); });
    canvas.addEventListener('touchstart', () => { detailPanel.classList.remove('show'); }, true);

    // --- 汉堡菜单 (重玩/退出) ---
    const menuBtn = document.getElementById('menu-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuOverlay.classList.remove('hidden');
    });
    document.getElementById('menu-close').addEventListener('click', () => {
        menuOverlay.classList.add('hidden');
    });
    document.getElementById('menu-restart').addEventListener('click', () => {
        menuOverlay.classList.add('hidden');
        game.restartLevel();
        buildMineUI();
        updateWavePreview();
        game.startWave();
    });
    document.getElementById('menu-quit').addEventListener('click', () => {
        location.reload();
    });

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
        // 确保音频继续
        audioManager.init();
        audioManager.resume();
        if (!audioManager.bgmPlaying) {
            audioManager.startBGM(game.level - 1);
        }
        speedBtn.classList.remove('hidden');
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

    // 开场提示
    setTimeout(() => {
        game.showMessage(`地雷战 — ${LEVEL_DEFS[0].name}`,
            '鬼子要进村了!\n\n【任务】布置地雷, 保卫村庄\n【规则】每波有15秒布雷时间\n　　　倒计时结束敌人进攻\n　　　战斗中仍可补充布雷\n　　　点已有地雷可回收\n\n绊雷/土雷无金属, 工兵无法排除\n反坦克雷仅对车辆, 对步兵无效\n\n共7关, 每关3波, 逐步解锁新装备\n房屋全毁则游戏结束',
            () => {
                audioManager.init();
                audioManager.resume();
                audioManager.startBGM(0);
                speedBtn.classList.remove('hidden');
                menuBtn.classList.remove('hidden');
                game.startWave();
            },
            '开始游戏');
    }, 300);
})();
