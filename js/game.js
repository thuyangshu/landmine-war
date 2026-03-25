// ========================================
// 地雷战 - 游戏引擎 v3 (关卡制)
// ========================================

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = 'prep';
        this.wave = 1;
        this.score = 0;

        this.iron = CONFIG.START_IRON;
        this.powder = CONFIG.START_POWDER;

        // 关卡系统
        this.level = 1;
        this.waveInLevel = 0;
        this.currentLevel = LEVEL_DEFS[0];
        this.mapGrid = null;
        this.rawPaths = [];
        this.pathPixels = [];
        this.pathTileSet = new Set();

        // 村庄房屋
        this.houses = HOUSE_POSITIONS.map(([c, r]) => ({col: c, row: r, hp: CONFIG.HOUSE_HP, maxHp: CONFIG.HOUSE_HP}));
        this.housesLeft = CONFIG.HOUSE_COUNT;

        this.tileSize = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        this.enemies = [];
        this.mines = [];
        this.effects = [];
        this.floatingTexts = [];

        this.selectedMine = null;
        this.hoverTile = null;

        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveEndTimer = 0;
        this.countdownTimer = 0;
        this.audio = null;

        this.waveStats = this._emptyStats();
        this.onWaveReset = null;

        // 难度 (DDA自适应, 无手动选择)

        // 动态难度调节 (DDA)
        this.dda = {
            mod: 1.0,           // 难度系数 (0.75=容易 ~ 1.25=困难)
            history: [],        // 近3波表现评分 (0~1)
            housesAtStart: CONFIG.HOUSE_COUNT, // 本波开始时的房屋数
            streak: 0,          // 连续满分波数 (用于触发"爽感爆发")
        };

        this.loadLevel(1);
    }

    loadLevel(levelNum) {
        this.level = levelNum;
        this.waveInLevel = 0;
        this.currentLevel = LEVEL_DEFS[levelNum - 1];
        const map = MAPS[this.currentLevel.mapIdx];
        this.mapGrid = map.grid;
        this.rawPaths = map.paths;
        this.pathPixels = map.paths.map(path => path.map(([c, r]) => ({col: c, row: r})));
        this.pathTileSet = new Set();
        for (const path of map.paths) {
            for (const [c, r] of path) this.pathTileSet.add(`${c},${r}`);
        }
        this.mines = [];
        this.enemies = [];
        this.effects = [];
        this.floatingTexts = [];
        if (this.audio && this.audio.bgmPlaying) this.audio.stopBGM();
    }

    _emptyStats() {
        return { kills: {}, ironGained: 0, powderGained: 0, minesPlaced: {}, minesDetonated: {}, minesDisarmed: 0 };
    }
    resetWaveStats() { this.waveStats = this._emptyStats(); }

    isPathTile(c, r) { return this.pathTileSet.has(`${c},${r}`); }
    isVillageTile(c, r) { return VILLAGE_TILES.some(([vc, vr]) => vc === c && vr === r); }
    hasMineAt(c, r) { return this.mines.some(m => m.col === c && m.row === r && !m.exploded); }

    canPlaceMine(col, row) {
        if (col < 0 || col >= CONFIG.COLS || row < 0 || row >= CONFIG.ROWS) return false;
        if (!this.isPathTile(col, row)) return false;
        if (this.isVillageTile(col, row)) return false;
        if (this.mapGrid[row]?.[col] === 5) return false;
        if (this.hasMineAt(col, row)) return false;
        return true;
    }

    canAfford(type) {
        const mt = MINE_TYPES[type];
        return this.iron >= mt.iron && this.powder >= mt.powder;
    }

    placeMine(col, row) {
        if (!this.selectedMine) return false;
        if (!this.canPlaceMine(col, row)) return false;
        if (!this.canAfford(this.selectedMine)) return false;
        if (!this.currentLevel.mines.includes(this.selectedMine)) return false;

        const mt = MINE_TYPES[this.selectedMine];
        this.iron -= mt.iron;
        this.powder -= mt.powder;

        this.mines.push(new Mine(this.selectedMine, col, row, mt.armTime));
        this.waveStats.minesPlaced[this.selectedMine] = (this.waveStats.minesPlaced[this.selectedMine] || 0) + 1;
        this.addEffect(col, row, 'place');
        if (this.audio) this.audio.playPlace();
        this.updateUI();
        return true;
    }

    removeMine(col, row) {
        const idx = this.mines.findIndex(m => m.col === col && m.row === row && !m.exploded);
        if (idx === -1) return false;
        const mine = this.mines[idx];
        const mt = MINE_TYPES[mine.type];
        this.iron += Math.floor(mt.iron * 0.8);
        this.powder += Math.floor(mt.powder * 0.8);
        this.mines.splice(idx, 1);
        this.updateUI();
        return true;
    }

    // ===== 开始波次 =====
    startWave() {
        if (this.state !== 'prep') return;
        this.state = 'countdown';
        this.countdownTimer = CONFIG.COUNTDOWN_TIME;
        this.waveEndTimer = 0;
        this.dda.housesAtStart = this.housesLeft;
        if (this.audio) this.audio.playWaveStart();

        const waveDef = this.currentLevel.waves[this.waveInLevel];
        if (!waveDef) { this.victory(); return; }

        this.spawnQueue = [];
        for (const group of waveDef) {
            for (let i = 0; i < group.n; i++) {
                let pathIdx = group.p;
                if (pathIdx === 0) pathIdx = Math.floor(Math.random() * this.rawPaths.length) + 1;
                this.spawnQueue.push({type: group.t, pathIdx: pathIdx - 1});
            }
        }
        const pri = {infantry:0, cavalry:1, engineer:2, truck:3, armored:4, lightTank:5, heavyTank:6, sweeper:7};
        this.spawnQueue.sort((a, b) => (pri[a.type]??99) - (pri[b.type]??99));
        this.spawnTimer = 0;

        const btn = document.getElementById('start-wave-btn');
        btn.textContent = `布雷! ${Math.ceil(this.countdownTimer)}s`;
        btn.disabled = true;
        btn.classList.add('in-wave');
    }

    spawnEnemy(type, pathIdx) {
        const et = ENEMY_TYPES[type];
        const waveOff = Math.max(0, this.wave - (et.firstWave || 1));
        const hp = Math.floor(et.hp * Math.pow(CONFIG.ENEMY_HP_SCALE, waveOff) * this.dda.mod);
        const armor = et.armor + Math.floor(this.wave / 5) * CONFIG.ENEMY_ARMOR_PER_5;
        const path = this.pathPixels[pathIdx];
        this.enemies.push(new Enemy(type, hp, et.speed, armor, path, this.wave, pathIdx));
    }

    // ===== 主更新 =====
    update(dt) {
        if (this.state === 'gameOver' || this.state === 'victory') return;

        for (const mine of this.mines) {
            if (!mine.exploded && mine.armTimer > 0) mine.armTimer -= dt;
            if (mine.exploded && mine.explosionTimer > 0) mine.explosionTimer -= dt;
        }

        // 倒计时阶段: 玩家布雷, 敌人未出现
        if (this.state === 'countdown') {
            this.countdownTimer -= dt;
            const btn = document.getElementById('start-wave-btn');
            const sec = Math.ceil(this.countdownTimer);
            if (sec <= 5) {
                btn.textContent = `敌军接近! ${sec}s`;
            } else {
                btn.textContent = `布雷! ${sec}s`;
            }
            if (this.countdownTimer <= 0) {
                this.countdownTimer = 0;
                this.state = 'wave';
                btn.textContent = '战斗中...';
            }
        }

        if (this.state === 'wave') {
            this.spawnTimer += dt;
            if (this.spawnQueue.length > 0 && this.spawnTimer >= CONFIG.SPAWN_INTERVAL / 1000) {
                this.spawnTimer -= CONFIG.SPAWN_INTERVAL / 1000;
                const s = this.spawnQueue.shift();
                this.spawnEnemy(s.type, s.pathIdx);
            }

            for (const enemy of this.enemies) {
                if (enemy.dead || enemy.reached) continue;
                this.updateEnemy(enemy, dt);
                if (enemy.pathProgress >= enemy.path.length - 1) {
                    enemy.reached = true;
                    this.onEnemyReachVillage(enemy);
                    if (this.housesLeft <= 0) { this.gameOver(); return; }
                }
            }

            for (const mine of this.mines) {
                if (mine.exploded || mine.armTimer > 0) continue;
                this.checkMineTrigger(mine);
            }

            this.enemies = this.enemies.filter(e => !e.dead && !e.reached);
            this.mines = this.mines.filter(m => !m.exploded || m.explosionTimer > 0);

            if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
                this.waveEndTimer += dt;
                if (this.waveEndTimer >= 1.8) { this.waveEndTimer = 0; this.waveComplete(); }
            } else {
                this.waveEndTimer = 0;
            }
        }

        this.updateEffects(dt);
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.timer -= dt;
            ft.y -= 30 * dt;
            ft.alpha = Math.max(0, ft.timer / ft.duration);
            return ft.timer > 0;
        });

        for (const enemy of this.enemies) {
            if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
            if (enemy.bleedTimer > 0) {
                enemy.bleedTimer -= dt;
                enemy.bleedTick -= dt;
                if (enemy.bleedTick <= 0) { enemy.bleedTick = 1; this.damageEnemy(enemy, enemy.bleedDmg, true); }
            }
            if (enemy.stunTimer > 0) enemy.stunTimer -= dt;
            if (enemy.armorShredTimer > 0) {
                enemy.armorShredTimer -= dt;
                if (enemy.armorShredTimer <= 0) enemy.currentArmor = enemy.baseArmor;
            }
        }
    }

    // ===== 敌人更新 =====
    updateEnemy(enemy, dt) {
        if (enemy.stunTimer > 0) return;

        const et = ENEMY_TYPES[enemy.type];

        // 工兵排雷
        if (enemy.type === 'engineer' && enemy.disarmCharges > 0) {
            if (enemy.disarming) {
                enemy.disarmTimer -= dt;
                if (enemy.disarmTimer <= 0) {
                    const mine = enemy.disarmTarget;
                    if (mine && !mine.exploded) {
                        mine.exploded = true;
                        mine.explosionTimer = 0;
                        this.waveStats.minesDisarmed++;
                        this.addFloatingText(mine.col, mine.row, '已排除!', '#ff8844');
                        this.addEffect(mine.col, mine.row, 'disarm');
                    }
                    enemy.disarming = false;
                    enemy.disarmTarget = null;
                    enemy.disarmCharges--;
                }
                return;
            }
            for (const mine of this.mines) {
                if (mine.exploded || mine.armTimer > 0) continue;
                if (MINE_TYPES[mine.type].noMetal) continue; // 无金属, 探测不到
                const dx = enemy.x - mine.col, dy = enemy.y - mine.row;
                if (Math.sqrt(dx * dx + dy * dy) < 0.6) {
                    enemy.disarming = true;
                    enemy.disarmTimer = MINE_TYPES[mine.type].armTime;
                    enemy.disarmTarget = mine;
                    return;
                }
            }
        }

        // 扫雷车逻辑
        if (et.sweepRange) {
            for (let i = this.mines.length - 1; i >= 0; i--) {
                const mine = this.mines[i];
                if (mine.exploded) continue;
                if (MINE_TYPES[mine.type].sweepImmune) continue;
                if (MINE_TYPES[mine.type].noMetal) continue; // 无金属, 扫不到
                const dx = enemy.x - mine.col, dy = enemy.y - mine.row;
                if (Math.sqrt(dx * dx + dy * dy) < et.sweepRange) {
                    mine.exploded = true;
                    mine.explosionTimer = 0;
                    this.waveStats.minesDisarmed++;
                    this.addFloatingText(mine.col, mine.row, '已扫除!', '#ff8844');
                    this.addEffect(mine.col, mine.row, 'disarm');
                }
            }
        }

        // 伤害减速: 最低40%
        let speedMul = 0.4 + 0.6 * (enemy.hp / enemy.maxHp);

        // 清理失效阻挡
        if (enemy.blockTarget && (enemy.blockTarget.dead || enemy.blockTarget.reached)) {
            enemy.blockTarget = null;
            enemy.blockTimer = 0;
        }
        if (enemy.blockTimer > 0) enemy.blockTimer -= dt;

        const selfIsVehicle = et.isVehicle;

        // 查找前方阻挡
        let nearestBlock = null, nearestDist = Infinity;
        for (const other of this.enemies) {
            if (other === enemy || other.dead || other.reached) continue;
            if (other.pathIdx !== enemy.pathIdx) continue;
            if (other.pathProgress <= enemy.pathProgress) continue;
            const ddx = other.x - enemy.x, ddy = other.y - enemy.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist >= 1.2) continue;
            const relevant = other.disarming ||
                (other.hp < other.maxHp && !enemy.bypassedUnits.has(other.id));
            if (relevant && dist < nearestDist) { nearestDist = dist; nearestBlock = other; }
        }

        if (nearestBlock) {
            const otherIsVehicle = ENEMY_TYPES[nearestBlock.type].isVehicle;
            if (nearestBlock.disarming) {
                speedMul *= 0.15;
            } else if (!selfIsVehicle && !otherIsVehicle) {
                // 步兵绕过受伤步兵: 1~2秒
                if (enemy.blockTarget !== nearestBlock) {
                    enemy.blockTarget = nearestBlock;
                    enemy.blockTimer = 1 + Math.random();
                }
                if (enemy.blockTimer > 0) {
                    speedMul *= 0.1;
                } else {
                    enemy.bypassedUnits.add(nearestBlock.id);
                    enemy.blockTarget = null;
                }
            } else if (selfIsVehicle && !otherIsVehicle) {
                // 车辆碾压受伤步兵: 等1~2秒
                if (enemy.blockTarget !== nearestBlock) {
                    enemy.blockTarget = nearestBlock;
                    enemy.blockTimer = 1 + Math.random();
                }
                if (enemy.blockTimer > 0) {
                    speedMul = 0;
                } else {
                    nearestBlock.dead = true;
                    this.addFloatingText(nearestBlock.x, nearestBlock.y, '碾压!', '#cc4444');
                    this.addEffect(nearestBlock.x, nearestBlock.y, 'crush');
                    if (this.audio) this.audio.playScream();
                    enemy.blockTarget = null;
                }
            } else if (selfIsVehicle && otherIsVehicle) {
                if (et.isTank) {
                    // 坦克等3秒后击毁友军车辆
                    if (enemy.blockTarget !== nearestBlock) {
                        enemy.blockTarget = nearestBlock;
                        enemy.blockTimer = 3;
                    }
                    if (enemy.blockTimer > 0) {
                        speedMul = 0;
                    } else {
                        nearestBlock.dead = true;
                        this.addFloatingText(nearestBlock.x, nearestBlock.y, '碾压友军!', '#cc4444');
                        this.addEffect(nearestBlock.x, nearestBlock.y, 'crush');
                        if (this.audio) this.audio.playScream();
                        enemy.blockTarget = null;
                    }
                } else {
                    // 非坦克车辆: 匹配受伤车辆速度
                    speedMul = Math.min(speedMul, 0.4 + 0.6 * (nearestBlock.hp / nearestBlock.maxHp));
                }
            }
        }

        const progress = enemy.speed * dt * speedMul;
        enemy.pathProgress += progress;

        if (enemy.pathProgress >= enemy.path.length - 1) {
            enemy.pathProgress = enemy.path.length - 1;
            const last = enemy.path[enemy.path.length - 1];
            enemy.x = last.col; enemy.y = last.row;
            return;
        }

        const idx = Math.floor(enemy.pathProgress);
        const frac = enemy.pathProgress - idx;
        const curr = enemy.path[idx];
        const next = enemy.path[Math.min(idx + 1, enemy.path.length - 1)];
        enemy.x = curr.col + (next.col - curr.col) * frac;
        enemy.y = curr.row + (next.row - curr.row) * frac;
    }

    // ===== 地雷触发 =====
    checkMineTrigger(mine) {
        const mt = MINE_TYPES[mine.type];
        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.reached) continue;
            const etype = ENEMY_TYPES[enemy.type];
            if (mt.footOnly && etype.isVehicle) continue;
            if (mt.vehicleOnly && !etype.isVehicle) continue;
            if (enemy.disarming) continue;
            const dx = enemy.x - mine.col, dy = enemy.y - mine.row;
            if (Math.sqrt(dx * dx + dy * dy) < 0.5) {
                if (enemy.type === 'cavalry' && Math.random() < CONFIG.CAVALRY_DODGE) {
                    this.addFloatingText(enemy.x, enemy.y, '闪避!', '#e8c44a');
                    mine.exploded = true;
                    mine.explosionTimer = 0;
                    return;
                }
                this.detonateMine(mine);
                return;
            }
        }
    }

    detonateMine(mine) {
        const mt = MINE_TYPES[mine.type];
        mine.exploded = true;
        mine.explosionTimer = 0.6;
        this.waveStats.minesDetonated[mine.type] = (this.waveStats.minesDetonated[mine.type] || 0) + 1;
        if (this.audio) this.audio.playExplosion(mine.type);
        this.addEffect(mine.col, mine.row, 'explosion', mt.radius, mt.color);

        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.reached) continue;
            const dx = enemy.x - mine.col, dy = enemy.y - mine.row;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= mt.radius) {
                let dmg = mt.damage;
                let armor = enemy.currentArmor;

                if (mt.special === 'pierce' || mt.special === 'deepPierce') armor = Math.floor(armor * (1 - mt.pierceRatio));
                if (mt.special === 'sky') armor = 0;

                const etype = ENEMY_TYPES[enemy.type];
                if (etype.isVehicle && enemy.type === 'armored' && dist > 0.3) {
                    dmg = Math.floor(dmg * (1 - CONFIG.ARMORED_AOE_REDUCE));
                }
                dmg = Math.max(1, dmg - armor);
                if (etype.isTank && mt.damage < CONFIG.TANK_MIN_DMG + enemy.currentArmor) dmg = 1;

                this.damageEnemy(enemy, dmg, false);

                if (!enemy.dead) {
                    if (mt.special === 'bleed') { enemy.bleedTimer = mt.bleedTime; enemy.bleedDmg = mt.bleedDmg; enemy.bleedTick = 1; }
                    if (mt.special === 'armorShred') { enemy.currentArmor = Math.max(0, enemy.currentArmor - mt.shredAmount); enemy.armorShredTimer = mt.shredTime; }
                    if (mt.special === 'sky') { enemy.stunTimer = mt.stunTime; }
                }
            }
        }

        if (mt.special === 'shrapnel') {
            for (let i = 0; i < mt.shrapCount; i++) {
                const targets = this.enemies.filter(e => !e.dead && !e.reached && Math.sqrt((e.x - mine.col) ** 2 + (e.y - mine.row) ** 2) <= 2);
                if (targets.length) {
                    const t = targets[Math.floor(Math.random() * targets.length)];
                    this.damageEnemy(t, Math.max(1, mt.shrapDmg - (t.currentArmor > 10 ? Math.floor(mt.shrapDmg / 2) : 0)), false);
                }
            }
        }
        if (mt.special === 'chain') this.scheduleChain(mine, mt);
    }

    scheduleChain(origin, mt) {
        let lx = origin.col, ly = origin.row;
        for (let i = 1; i < mt.chainCount; i++) {
            const cx = lx + (Math.random() - 0.5) * 2;
            const cy = ly + (Math.random() - 0.5) * 2;
            const delay = i * mt.chainDelay;
            setTimeout(() => {
                this.addEffect(cx, cy, 'explosion', mt.radius * 0.8, mt.color);
                for (const e of this.enemies) {
                    if (e.dead || e.reached) continue;
                    if (Math.sqrt((e.x - cx) ** 2 + (e.y - cy) ** 2) <= mt.radius * 0.8) {
                        this.damageEnemy(e, Math.max(1, mt.damage - e.currentArmor), false);
                    }
                }
            }, delay * 1000);
            lx = cx; ly = cy;
        }
    }

    damageEnemy(enemy, dmg, isBleed) {
        enemy.hp -= dmg;
        enemy.hitFlash = 0.15;
        if (!isBleed) this.addFloatingText(enemy.x, enemy.y - 0.3, `-${dmg}`, '#ff6644');
        if (enemy.hp <= 0) { enemy.dead = true; this.onEnemyKilled(enemy); }
    }

    onEnemyKilled(enemy) {
        const et = ENEMY_TYPES[enemy.type];
        const scale = Math.pow(CONFIG.RESOURCE_DROP_SCALE, this.wave - 1);
        // DDA缴获补偿: 苦战时多给一点, 碾压时不扣
        const ddaDrop = this.dda.mod < 1.0 ? (1 + (1 - this.dda.mod) * 0.5) : 1.0;
        let iron = Math.floor(et.dropIron * scale * ddaDrop);
        let powder = Math.floor(et.dropPowder * scale * ddaDrop);
        if (et.bonusDrop) { iron += et.bonusDrop.iron; powder += et.bonusDrop.powder; }
        this.iron += iron;
        this.powder += powder;
        this.score += Math.floor(enemy.maxHp / 10);
        this.waveStats.kills[enemy.type] = (this.waveStats.kills[enemy.type] || 0) + 1;
        this.waveStats.ironGained += iron;
        this.waveStats.powderGained += powder;
        this.addFloatingText(enemy.x, enemy.y, `+🔩${iron} +💥${powder}`, '#44cc44');
        this.addEffect(enemy.x, enemy.y, 'kill');
        this.updateUI();
    }

    onEnemyReachVillage(enemy) {
        let dmg = CONFIG.BURN_DAMAGE[enemy.type] || 1;
        let destroyed = 0;
        for (const house of this.houses) {
            if (house.hp <= 0) continue;
            if (dmg <= 0) break;
            const apply = Math.min(dmg, house.hp);
            house.hp -= apply;
            dmg -= apply;
            if (house.hp <= 0) {
                this.housesLeft--;
                destroyed++;
                this.addEffect(house.col, house.row, 'fire');
            }
        }
        if (destroyed > 0) {
            this.addFloatingText(enemy.x, enemy.y, `🔥-${destroyed}座房屋`, '#ff4444');
        } else {
            this.addFloatingText(enemy.x, enemy.y, `🔥房屋受损`, '#ff8844');
        }
        this.updateUI();
    }

    generateBattleReport() {
        const s = this.waveStats;
        const lines = [];
        const killParts = [];
        let totalKills = 0;
        for (const type of ['infantry','cavalry','engineer','truck','armored','lightTank','heavyTank','sweeper']) {
            if (s.kills[type]) {
                const et = ENEMY_TYPES[type];
                const unit = et.isVehicle ? '辆' : '人';
                killParts.push(`${et.name}${s.kills[type]}${unit}`);
                totalKills += s.kills[type];
            }
        }
        if (killParts.length) {
            lines.push(`🎯 消灭 ${totalKills} 敌:`);
            lines.push(`    ${killParts.join('  ')}`);
        }
        lines.push(`📦 缴获: 🔩${s.ironGained}  💥${s.powderGained}`);
        const placedParts = [];
        for (const type of ['trip','dirt','iron','antitank','chain','sky','ap','magnetic']) {
            const placed = s.minesPlaced[type] || 0;
            const used = s.minesDetonated[type] || 0;
            if (placed || used) {
                placedParts.push(`${MINE_TYPES[type].name}: 造${placed}炸${used}`);
            }
        }
        if (placedParts.length) lines.push(`💣 ${placedParts.join('  ')}`);
        if (s.minesDisarmed > 0) lines.push(`⚠️ 被排/扫雷 ${s.minesDisarmed} 枚`);
        return lines.join('\n');
    }

    // ===== 动态难度调节 (DDA) =====
    _ddaEvaluate() {
        // 计算本波表现评分 (0~1)
        const waveDef = this.currentLevel.waves[this.waveInLevel];
        const totalSpawned = waveDef ? waveDef.reduce((sum, g) => sum + g.n, 0) : 1;
        const totalKilled = Object.values(this.waveStats.kills).reduce((a, b) => a + b, 0);
        const killRate = Math.min(1, totalKilled / Math.max(1, totalSpawned));

        const housesLost = this.dda.housesAtStart - this.housesLeft;
        const housePenalty = housesLost * 0.2; // 每丢1座房扣0.2

        const placed = Object.values(this.waveStats.minesPlaced).reduce((a, b) => a + b, 0);
        const detonated = Object.values(this.waveStats.minesDetonated).reduce((a, b) => a + b, 0);
        const mineEff = placed > 0 ? Math.min(1, detonated / placed) : 1;

        // 综合评分: 击杀率权重最大, 房屋损失是惩罚项
        return Math.max(0, Math.min(1, killRate * 0.65 + mineEff * 0.15 + 0.2 - housePenalty));
    }

    _ddaAdjust() {
        const score = this._ddaEvaluate();
        this.dda.history.push(score);
        if (this.dda.history.length > 3) this.dda.history.shift();

        const avg = this.dda.history.reduce((a, b) => a + b, 0) / this.dda.history.length;

        // 连续满分追踪 (用于"爽感波次")
        if (score >= 0.95) this.dda.streak++;
        else this.dda.streak = 0;

        if (avg >= 0.9) {
            // 碾压: 缓慢加难 (让玩家多享受一会儿成就感)
            this.dda.mod = Math.min(1.25, this.dda.mod + 0.03);
        } else if (avg >= 0.7) {
            // 甜区: 缓慢回归1.0
            this.dda.mod += (1.0 - this.dda.mod) * 0.08;
        } else if (avg >= 0.5) {
            // 吃力: 快速降难
            this.dda.mod = Math.max(0.75, this.dda.mod - 0.06);
        } else {
            // 危机: 大幅降难
            this.dda.mod = Math.max(0.7, this.dda.mod - 0.10);
        }
    }

    waveComplete() {
        this._ddaAdjust();
        this.state = 'prep';
        if (this.audio) this.audio.playVictory();
        const report = this.generateBattleReport();

        // 波次奖励: DDA苦战补偿
        const ddaBonus = this.dda.mod < 0.9 ? 1.3 : 1.0;
        const bonusIron = Math.floor((10 + this.wave * 2) * ddaBonus);
        const bonusPowder = Math.floor((10 + this.wave * 2) * ddaBonus);
        this.iron += bonusIron;
        this.powder += bonusPowder;

        const completedWaveInLevel = this.waveInLevel;
        this.wave++;
        this.waveInLevel++;

        if (this.waveInLevel >= CONFIG.WAVES_PER_LEVEL) {
            // 关卡通过
            if (this.level >= LEVEL_DEFS.length) { this.victory(); return; }
            const nextLevel = this.level + 1;
            const nextDef = LEVEL_DEFS[nextLevel - 1];
            const newEnemies = nextDef.enemies.filter(e => !this.currentLevel.enemies.includes(e));
            const newMines = nextDef.mines.filter(m => !this.currentLevel.mines.includes(m));
            let unlockInfo = '';
            if (newEnemies.length) unlockInfo += '\n⚔️ 新敌人: ' + newEnemies.map(e => ENEMY_TYPES[e].name).join('、');
            if (newMines.length) unlockInfo += '\n💣 新地雷: ' + newMines.map(m => MINE_TYPES[m].name).join('、');

            this.showMessage(
                `第${this.level}关 ${this.currentLevel.name} 通过!`,
                `${report}\n🎁 奖励: 🔩+${bonusIron}  💥+${bonusPowder}\n🏠 剩余房屋: ${this.housesLeft}/${CONFIG.HOUSE_COUNT}\n\n▶️ 下一关: ${nextDef.name}${unlockInfo}`,
                () => {
                    this.loadLevel(nextLevel);
                    this.resetWaveStats();
                    this.updateUI();
                    const btn = document.getElementById('start-wave-btn');
                    btn.textContent = '开始战斗!';
                    btn.disabled = false;
                    btn.classList.remove('in-wave');
                    if (this.onWaveReset) this.onWaveReset();
                }
            );
        } else {
            this.showMessage(
                `第${completedWaveInLevel + 1}/${CONFIG.WAVES_PER_LEVEL}波 击退!`,
                `${report}\n🎁 奖励: 🔩+${bonusIron}  💥+${bonusPowder}\n🏠 剩余房屋: ${this.housesLeft}/${CONFIG.HOUSE_COUNT}`,
                () => {
                    this.resetWaveStats();
                    this.updateUI();
                    const btn = document.getElementById('start-wave-btn');
                    btn.textContent = '开始战斗!';
                    btn.disabled = false;
                    btn.classList.remove('in-wave');
                    if (this.onWaveReset) this.onWaveReset();
                }
            );
        }
    }

    gameOver() {
        this.state = 'gameOver';
        const report = this.generateBattleReport();
        this.showMessage('村庄沦陷!',
            `房屋全部被烧毁!\n坚守到第${this.level}关 第${this.waveInLevel + 1}波\n得分: ${this.score}\n\n${report}`,
            () => location.reload());
    }

    victory() {
        this.state = 'victory';
        if (this.audio) this.audio.playVictory();
        const report = this.generateBattleReport();
        this.showMessage('伟大胜利!',
            `成功保卫村庄, 击退全部${LEVEL_DEFS.length}关!\n得分: ${this.score}  剩余房屋: ${this.housesLeft}\n\n${report}`,
            () => location.reload());
    }

    showMessage(title, text, cb) {
        const ov = document.getElementById('message-overlay');
        document.getElementById('msg-title').textContent = title;
        document.getElementById('msg-text').textContent = text;
        ov.classList.remove('hidden');
        const btn = document.getElementById('msg-btn');
        const handler = () => { ov.classList.add('hidden'); btn.removeEventListener('click', handler); if (cb) cb(); };
        btn.addEventListener('click', handler);
    }

    // ===== 特效 =====
    addEffect(x, y, type, radius, color) {
        this.effects.push({
            x, y, type, radius: radius || 1, color: color || '#ff8844',
            timer: type === 'explosion' ? 0.6 : type === 'fire' ? 1.5 : type === 'crush' ? 1.2 : 0.3,
            duration: type === 'explosion' ? 0.6 : type === 'fire' ? 1.5 : type === 'crush' ? 1.2 : 0.3,
            particles: type === 'explosion' ? this.createParticles(x, y, radius || 1) : [],
        });
    }

    createParticles(x, y, radius) {
        const ps = [];
        for (let i = 0; i < 8 + radius * 4; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 1 + Math.random() * 3;
            ps.push({x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: 2 + Math.random() * 3, life: 0.3 + Math.random() * 0.3});
        }
        return ps;
    }

    updateEffects(dt) {
        this.effects = this.effects.filter(e => {
            e.timer -= dt;
            for (const p of e.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 3 * dt; p.life -= dt; }
            e.particles = e.particles.filter(p => p.life > 0);
            return e.timer > 0 || e.particles.length > 0;
        });
    }

    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({x, y, text, color, timer: 1.2, duration: 1.2, alpha: 1});
    }

    updateUI() {
        document.querySelector('#res-iron b').textContent = this.iron;
        document.querySelector('#res-powder b').textContent = this.powder;
        document.getElementById('level-info').innerHTML = `第<b>${this.level}</b>关 ${this.currentLevel.name}`;
        document.getElementById('wave-info').innerHTML = `第<b>${this.waveInLevel + 1}</b>/${CONFIG.WAVES_PER_LEVEL}波`;
        document.querySelector('#lives-info').innerHTML = `🏠 <b>${this.housesLeft}</b>/${CONFIG.HOUSE_COUNT}`;

        for (const [key] of Object.entries(MINE_TYPES)) {
            const btn = document.querySelector(`.mine-btn[data-type="${key}"]`);
            if (!btn) continue;
            const locked = !this.currentLevel.mines.includes(key);
            const afford = this.canAfford(key);
            btn.classList.toggle('locked', locked);
            btn.classList.toggle('no-res', !locked && !afford);
        }
    }

    screenToGrid(sx, sy) {
        return {col: Math.floor((sx - this.offsetX) / this.tileSize), row: Math.floor((sy - this.offsetY) / this.tileSize)};
    }

    gridToScreen(col, row) {
        return {x: this.offsetX + (col + 0.5) * this.tileSize, y: this.offsetY + (row + 0.5) * this.tileSize};
    }
}

// ===== Enemy =====
class Enemy {
    constructor(type, hp, speed, armor, path, wave, pathIdx) {
        this.type = type;
        this.hp = hp; this.maxHp = hp;
        this.speed = speed;
        this.baseArmor = armor; this.currentArmor = armor;
        this.path = path; this.wave = wave;
        this.pathIdx = pathIdx;
        this.pathProgress = 0;
        this.x = path[0].col; this.y = path[0].row;
        this.dead = false; this.reached = false;
        this.hitFlash = 0;
        this.bleedTimer = 0; this.bleedDmg = 0; this.bleedTick = 0;
        this.stunTimer = 0; this.armorShredTimer = 0;
        const et = ENEMY_TYPES[type];
        this.disarmCharges = et.disarmCharges || 0;
        this.disarming = false; this.disarmTimer = 0; this.disarmTarget = null;
        this.id = Enemy._nextId++;
        this.bypassedUnits = new Set();
        this.blockTarget = null;
        this.blockTimer = 0;
    }
}
Enemy._nextId = 0;

// ===== Mine =====
class Mine {
    constructor(type, col, row, armTime) {
        this.type = type;
        this.col = col; this.row = row;
        this.armTimer = armTime;
        this.exploded = false;
        this.explosionTimer = 0;
    }
    get armed() { return this.armTimer <= 0 && !this.exploded; }
}
