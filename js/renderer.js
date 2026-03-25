// ========================================
// 地雷战 - 渲染器 v3 (关卡制)
// ========================================

class Renderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.animTime = 0;
    }

    render(dt) {
        this.animTime += dt;
        const g = this.game;
        const ctx = this.ctx;

        ctx.fillStyle = '#2a3a1a';
        ctx.fillRect(0, 0, g.canvas.width, g.canvas.height);

        this.drawMap();
        this.drawPathLines();
        this.drawMines();
        this.drawEnemies();
        this.drawEffects();
        this.drawFloatingTexts();
        this.drawHoverPreview();
        if (g.state === 'prep' || g.state === 'countdown' || g.state === 'wave') this.drawPrepIndicator();
        if (g.state === 'countdown') this.drawCountdown();
    }

    // ===== 地图 =====
    drawMap() {
        const g = this.game, ctx = this.ctx, ts = g.tileSize;
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                const x = g.offsetX + c * ts, y = g.offsetY + r * ts;
                const tile = g.mapGrid[r]?.[c] ?? 0;

                switch (tile) {
                    case 0:
                        ctx.fillStyle = '#4a6a2a';
                        ctx.fillRect(x, y, ts, ts);
                        if ((c + r) % 3 === 0) { ctx.fillStyle = '#527530'; ctx.fillRect(x + ts * 0.2, y + ts * 0.3, ts * 0.08, ts * 0.25); }
                        if ((c * 3 + r * 7) % 7 === 0) { ctx.fillStyle = '#4f7028'; ctx.fillRect(x + ts * 0.6, y + ts * 0.5, ts * 0.08, ts * 0.2); }
                        break;
                    case 1:
                        ctx.fillStyle = '#8a7a5a';
                        ctx.fillRect(x, y, ts, ts);
                        ctx.fillStyle = '#7a6a4a';
                        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
                        break;
                    case 2:
                        ctx.fillStyle = '#5a7a3a';
                        ctx.fillRect(x, y, ts, ts);
                        break;
                    case 4:
                        ctx.fillStyle = '#4a6a2a';
                        ctx.fillRect(x, y, ts, ts);
                        this.drawTree(x, y, ts);
                        break;
                    case 5:
                        ctx.fillStyle = '#8a7a5a';
                        ctx.fillRect(x, y, ts, ts);
                        ctx.fillStyle = '#aa3333';
                        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.animTime * 3);
                        ctx.beginPath();
                        ctx.moveTo(x + ts * 0.3, y + ts * 0.2);
                        ctx.lineTo(x + ts * 0.5, y + ts * 0.7);
                        ctx.lineTo(x + ts * 0.7, y + ts * 0.2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                        break;
                }
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, ts, ts);
            }
        }

        // 渲染房屋
        for (const house of g.houses) {
            const hx = g.offsetX + house.col * ts;
            const hy = g.offsetY + house.row * ts;
            if (house.hp > 0) {
                this.drawHouse(hx, hy, ts);
                if (house.hp < house.maxHp) {
                    const hpPct = house.hp / house.maxHp;
                    const bw = ts * 0.6, bh = 4;
                    const bx = hx + ts * 0.2, by = hy + ts * 0.02;
                    ctx.fillStyle = '#333'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
                    ctx.fillStyle = hpPct > 0.5 ? '#4a4' : hpPct > 0.3 ? '#cc8822' : '#c44';
                    ctx.fillRect(bx, by, bw * hpPct, bh);
                }
            } else {
                this.drawRuins(hx, hy, ts);
            }
        }
    }

    drawTree(x, y, ts) {
        const ctx = this.ctx;
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(x + ts * 0.42, y + ts * 0.55, ts * 0.16, ts * 0.35);
        ctx.fillStyle = '#2a5a1a';
        ctx.beginPath(); ctx.arc(x + ts * 0.5, y + ts * 0.4, ts * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a6a2a';
        ctx.beginPath(); ctx.arc(x + ts * 0.42, y + ts * 0.33, ts * 0.18, 0, Math.PI * 2); ctx.fill();
    }

    drawHouse(x, y, ts) {
        const ctx = this.ctx;
        ctx.fillStyle = '#d4c4a4';
        ctx.fillRect(x + ts * 0.12, y + ts * 0.38, ts * 0.76, ts * 0.54);
        ctx.fillStyle = '#aa3333';
        ctx.beginPath();
        ctx.moveTo(x + ts * 0.08, y + ts * 0.4);
        ctx.lineTo(x + ts * 0.5, y + ts * 0.08);
        ctx.lineTo(x + ts * 0.92, y + ts * 0.4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(x + ts * 0.38, y + ts * 0.58, ts * 0.24, ts * 0.34);
    }

    drawRuins(x, y, ts) {
        const ctx = this.ctx;
        ctx.fillStyle = '#4a4a3a';
        ctx.fillRect(x + ts * 0.15, y + ts * 0.55, ts * 0.7, ts * 0.35);
        ctx.fillStyle = '#3a3a2a';
        ctx.fillRect(x + ts * 0.2, y + ts * 0.5, ts * 0.2, ts * 0.15);
        ctx.fillRect(x + ts * 0.55, y + ts * 0.48, ts * 0.15, ts * 0.12);
        const smokeY = y + ts * 0.3 - Math.sin(this.animTime * 2) * ts * 0.08;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(x + ts * 0.4, smokeY, ts * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + ts * 0.55, smokeY - ts * 0.1, ts * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawPathLines() {
        const g = this.game, ctx = this.ctx, ts = g.tileSize;
        const paths = g.rawPaths;
        const colors = ['rgba(200,180,140,0.3)', 'rgba(180,160,120,0.25)', 'rgba(170,150,110,0.25)', 'rgba(190,170,130,0.25)'];
        for (let pi = 0; pi < paths.length; pi++) {
            const path = paths[pi];
            ctx.strokeStyle = colors[pi % colors.length];
            ctx.lineWidth = ts * 0.3;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < path.length; i++) {
                const px = g.offsetX + (path[i][0] + 0.5) * ts;
                const py = g.offsetY + (path[i][1] + 0.5) * ts;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
        // 路线标签 (按起始列排序)
        const sorted = paths.map((p, i) => ({idx: i, col: p[0][0]})).sort((a, b) => a.col - b.col);
        const labelSets = {2:['左路','右路'], 3:['左路','中路','右路'], 4:['左路','中左路','中右路','右路']};
        const labels = labelSets[paths.length] || sorted.map((_, i) => `${i+1}路`);
        ctx.font = `bold ${Math.max(10, Math.floor(ts * 0.32))}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let si = 0; si < sorted.length; si++) {
            const pi = sorted[si].idx;
            const [c, r] = paths[pi][0];
            ctx.fillStyle = '#cc3333';
            ctx.fillText(labels[si], g.offsetX + (c + 0.5) * ts, g.offsetY + (r + 0.5) * ts - ts * 0.55);
        }
    }

    // ===== 地雷 =====
    drawMines() {
        const g = this.game, ctx = this.ctx, ts = g.tileSize;
        for (const mine of g.mines) {
            if (mine.exploded) continue;
            const mt = MINE_TYPES[mine.type];
            const cx = g.offsetX + (mine.col + 0.5) * ts;
            const cy = g.offsetY + (mine.row + 0.5) * ts;
            const r = ts * 0.22;

            if (mine.armTimer > 0) {
                ctx.globalAlpha = 0.45;
                ctx.fillStyle = mt.color;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const progress = 1 - mine.armTimer / mt.armTime;
                const barW = ts * 0.12, barH = ts * 0.5;
                const bx = cx + r + 2, by = cy + barH / 2;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(bx, by - barH, barW, barH);
                ctx.fillStyle = '#4a4';
                ctx.fillRect(bx, by - barH * progress, barW, barH * progress);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(bx, by - barH, barW, barH);
            } else {
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = mt.color;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.globalAlpha = mine.armTimer > 0 ? 0.6 : 0.4;
            ctx.fillStyle = '#222';
            ctx.font = `bold ${Math.max(10, Math.floor(ts * 0.28))}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(mt.icon, cx, cy);
            ctx.globalAlpha = 1;
        }
    }

    // ===== 敌人 (俯视视角) =====
    drawEnemies() {
        const g = this.game, ctx = this.ctx, ts = g.tileSize;
        for (const enemy of g.enemies) {
            if (enemy.dead || enemy.reached) continue;
            const et = ENEMY_TYPES[enemy.type];
            const cx = g.offsetX + (enemy.x + 0.5) * ts;
            const cy = g.offsetY + (enemy.y + 0.5) * ts;
            const sz = ts * et.size;

            // 计算移动方向角度
            let angle = Math.PI / 2; // 默认朝下
            const path = enemy.path;
            if (path && path.length > 1) {
                const pi = Math.floor(enemy.pathProgress);
                const i0 = Math.min(pi, path.length - 1);
                const i1 = Math.min(pi + 1, path.length - 1);
                if (i0 !== i1) {
                    const dx = path[i1].col - path[i0].col;
                    const dy = path[i1].row - path[i0].row;
                    angle = Math.atan2(dy, dx);
                }
            }

            // 受击闪白 & 眩晕环 (不旋转)
            ctx.save();
            if (enemy.hitFlash > 0) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(cx, cy, sz + 3, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            if (enemy.stunTimer > 0) {
                ctx.strokeStyle = '#ffe844'; ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.arc(cx, cy, sz + 4 + Math.sin(this.animTime * 10) * 2, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.restore();

            const c1 = enemy.hitFlash > 0 ? '#ff8866' : et.baseColor;
            const c2 = et.darkColor;

            // 旋转绘制精灵 (精灵默认朝下 = +y)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle - Math.PI / 2);

            switch (enemy.type) {
                case 'infantry': this.drawInfantry(sz, c1, c2, enemy); break;
                case 'cavalry': this.drawCavalry(sz, c1, c2, enemy); break;
                case 'engineer': this.drawEngineer(sz, c1, c2, enemy); break;
                case 'truck': this.drawTruck(sz, c1, c2); break;
                case 'armored': this.drawArmored(sz, c1, c2); break;
                case 'lightTank': this.drawTank(sz, c1, c2); break;
                case 'heavyTank': this.drawHeavyTank(sz, c1, c2); break;
                case 'sweeper': this.drawSweeper(sz, c1, c2); break;
            }
            ctx.restore();

            // 状态指示 (始终正向, 不旋转)
            ctx.save();
            const hpPct = enemy.hp / enemy.maxHp;
            const bw = Math.max(sz * 2.2, 18), bh = 4;
            const bx = cx - bw / 2, by = cy - sz - 10;
            ctx.fillStyle = '#333'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
            ctx.fillStyle = hpPct > 0.5 ? '#4a4' : hpPct > 0.25 ? '#aa4' : '#a44';
            ctx.fillRect(bx, by, bw * hpPct, bh);

            if (enemy.bleedTimer > 0) {
                ctx.fillStyle = '#c44'; ctx.font = `${Math.floor(ts * 0.2)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('🩸', cx + sz, cy - sz);
            }
            if (enemy.disarming) {
                ctx.fillStyle = '#ff0'; ctx.font = `bold ${Math.floor(ts * 0.22)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('🔧', cx, cy - sz - 14);
            }
            if (enemy.blockTarget && enemy.blockTimer > 0) {
                ctx.fillStyle = '#ffaa00'; ctx.font = `${Math.floor(ts * 0.2)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('⏳', cx - sz, cy - sz);
            }
            if (et.sweepRange) {
                ctx.globalAlpha = 0.12;
                ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.arc(cx, cy, et.sweepRange * ts, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]); ctx.globalAlpha = 1;
            }
            ctx.restore();
        }
    }

    // --- 俯视通用士兵 (原点绘制, 朝下 = +y) ---
    _drawSoldier(sz, bodyColor, helmetColor) {
        const ctx = this.ctx;
        const walk = Math.sin(this.animTime * 8) * sz * 0.15;

        // 腿 (行走动画)
        ctx.strokeStyle = bodyColor; ctx.lineWidth = Math.max(2, sz * 0.14); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-sz * 0.1, sz * 0.12); ctx.lineTo(-sz * 0.12, sz * 0.38 + walk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sz * 0.1, sz * 0.12); ctx.lineTo(sz * 0.12, sz * 0.38 - walk); ctx.stroke();
        // 靴子
        ctx.fillStyle = '#2a2a1a';
        ctx.beginPath(); ctx.arc(-sz * 0.12, sz * 0.4 + walk, sz * 0.06, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sz * 0.12, sz * 0.4 - walk, sz * 0.06, 0, Math.PI * 2); ctx.fill();

        // 躯干
        ctx.fillStyle = bodyColor; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, sz * 0.2, sz * 0.18, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // 腰带
        ctx.strokeStyle = '#4a3a1a'; ctx.lineWidth = Math.max(1.5, sz * 0.06);
        ctx.beginPath(); ctx.moveTo(-sz * 0.2, sz * 0.08); ctx.lineTo(sz * 0.2, sz * 0.08); ctx.stroke();

        // 手臂 (行走摆动)
        ctx.strokeStyle = bodyColor; ctx.lineWidth = Math.max(2, sz * 0.1); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-sz * 0.22, -sz * 0.02); ctx.lineTo(-sz * 0.32, sz * 0.12 - walk * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sz * 0.22, -sz * 0.02); ctx.lineTo(sz * 0.32, sz * 0.12 + walk * 0.4); ctx.stroke();

        // 头/钢盔 (俯视: 圆形钢盔覆盖头顶)
        ctx.fillStyle = helmetColor; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(0, -sz * 0.22, sz * 0.17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // 钢盔帽檐
        ctx.beginPath();
        ctx.ellipse(0, -sz * 0.18, sz * 0.19, sz * 0.08, 0, -Math.PI * 0.15, Math.PI * 1.15);
        ctx.stroke();
    }

    // --- 俯视步兵 ---
    drawInfantry(sz, c1, c2, enemy) {
        const ctx = this.ctx;
        this._drawSoldier(sz, c1, c2);
        // 步枪 (斜背在身上, 从右肩到左腰)
        ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = Math.max(1.5, sz * 0.06);
        ctx.beginPath(); ctx.moveTo(sz * 0.12, -sz * 0.15); ctx.lineTo(-sz * 0.08, sz * 0.22); ctx.stroke();
        // 枪管尖端
        ctx.strokeStyle = '#888'; ctx.lineWidth = Math.max(1, sz * 0.04);
        ctx.beginPath(); ctx.moveTo(sz * 0.12, -sz * 0.15); ctx.lineTo(sz * 0.16, -sz * 0.28); ctx.stroke();
    }

    // --- 俯视骑兵 ---
    drawCavalry(sz, c1, c2, enemy) {
        const ctx = this.ctx;
        const walk = Math.sin(this.animTime * 6) * sz * 0.1;

        // 马腿 (四条, 交替运动)
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = Math.max(2, sz * 0.08); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-sz * 0.22, sz * 0.25); ctx.lineTo(-sz * 0.32, sz * 0.42 + walk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sz * 0.22, sz * 0.25); ctx.lineTo(sz * 0.32, sz * 0.42 - walk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-sz * 0.18, -sz * 0.2); ctx.lineTo(-sz * 0.28, -sz * 0.38 - walk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sz * 0.18, -sz * 0.2); ctx.lineTo(sz * 0.28, -sz * 0.38 + walk); ctx.stroke();

        // 马身 (纵向椭圆)
        ctx.fillStyle = '#7a5a2a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.22, sz * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 马头 (前方 = +y)
        ctx.fillStyle = '#8a6a3a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(0, sz * 0.5, sz * 0.1, sz * 0.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // 耳朵
        ctx.fillStyle = '#6a4a2a';
        ctx.beginPath(); ctx.ellipse(-sz * 0.07, sz * 0.62, sz * 0.03, sz * 0.05, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sz * 0.07, sz * 0.62, sz * 0.03, sz * 0.05, 0.3, 0, Math.PI * 2); ctx.fill();

        // 马尾 (后方 = -y)
        ctx.strokeStyle = '#4a3a1a'; ctx.lineWidth = Math.max(1.5, sz * 0.05);
        ctx.beginPath(); ctx.moveTo(0, -sz * 0.42);
        ctx.quadraticCurveTo(-sz * 0.12, -sz * 0.58, -sz * 0.08, -sz * 0.68); ctx.stroke();

        // 骑手身体
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(0, -sz * 0.02, sz * 0.14, sz * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 骑手头 (钢盔)
        ctx.fillStyle = c2; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(0, -sz * 0.02, sz * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 军刀 (右侧)
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = Math.max(1.5, sz * 0.05);
        ctx.beginPath(); ctx.moveTo(sz * 0.16, -sz * 0.05); ctx.lineTo(sz * 0.35, sz * 0.2); ctx.stroke();
    }

    // --- 俯视工兵 ---
    drawEngineer(sz, c1, c2, enemy) {
        const ctx = this.ctx;
        this._drawSoldier(sz, c1, c2);

        // 探雷杆 (向前方 = +y 伸出)
        ctx.strokeStyle = '#888'; ctx.lineWidth = Math.max(2, sz * 0.07);
        ctx.beginPath(); ctx.moveTo(sz * 0.15, sz * 0.05); ctx.lineTo(sz * 0.18, sz * 0.55); ctx.stroke();
        // 探雷盘
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = Math.max(2, sz * 0.09);
        ctx.beginPath(); ctx.arc(sz * 0.18, sz * 0.6, sz * 0.1, 0, Math.PI * 2); ctx.stroke();

        // 工具包 (背上)
        ctx.fillStyle = '#6a5a3a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.fillRect(-sz * 0.28, -sz * 0.12, sz * 0.12, sz * 0.2);
        ctx.strokeRect(-sz * 0.28, -sz * 0.12, sz * 0.12, sz * 0.2);

        // 排雷次数
        if (enemy.disarmCharges > 0) {
            ctx.fillStyle = '#ff0'; ctx.font = `bold ${Math.max(8, Math.floor(sz * 0.55))}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`${enemy.disarmCharges}`, sz * 0.4, -sz * 0.35);
        }
    }

    // --- 俯视卡车 ---
    drawTruck(sz, c1, c2) {
        const ctx = this.ctx;
        const w = sz * 0.45, h = sz * 0.8;

        // 车轮 (两侧各2-3个)
        ctx.fillStyle = '#1a1a1a';
        for (const wy of [-0.35, 0.05, 0.35]) {
            ctx.beginPath(); ctx.arc(-w - sz * 0.06, h * wy, sz * 0.08, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(w + sz * 0.06, h * wy, sz * 0.08, 0, Math.PI * 2); ctx.fill();
        }

        // 车身 (货厢 = 后方-y, 驾驶室 = 前方+y)
        // 货厢
        ctx.fillStyle = '#6a6a5a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.fillRect(-w, -h * 0.65, w * 2, h * 0.75);
        ctx.strokeRect(-w, -h * 0.65, w * 2, h * 0.75);
        // 帆布篷
        ctx.strokeStyle = '#8a8a6a'; ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const ly = -h * 0.6 + i * h * 0.18;
            ctx.beginPath(); ctx.moveTo(-w * 0.85, ly); ctx.lineTo(w * 0.85, ly); ctx.stroke();
        }

        // 驾驶室
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.fillRect(-w * 0.8, h * 0.12, w * 1.6, h * 0.5);
        ctx.strokeRect(-w * 0.8, h * 0.12, w * 1.6, h * 0.5);
        // 挡风玻璃
        ctx.fillStyle = '#8abbd8';
        ctx.fillRect(-w * 0.6, h * 0.45, w * 1.2, h * 0.12);
        // 日军标志
        ctx.fillStyle = '#fff';
        ctx.fillRect(-sz * 0.08, -h * 0.1, sz * 0.16, sz * 0.16);
        ctx.fillStyle = '#c33';
        ctx.beginPath(); ctx.arc(0, -h * 0.1 + sz * 0.08, sz * 0.05, 0, Math.PI * 2); ctx.fill();
        // 车头灯
        ctx.fillStyle = '#ffdd66';
        ctx.beginPath(); ctx.arc(-w * 0.6, h * 0.6, sz * 0.04, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(w * 0.6, h * 0.6, sz * 0.04, 0, Math.PI * 2); ctx.fill();
    }

    // --- 俯视装甲车 ---
    drawArmored(sz, c1, c2) {
        const ctx = this.ctx;
        const w = sz * 0.42, h = sz * 0.75;

        // 车轮 (两侧各2个)
        ctx.fillStyle = '#1a1a1a';
        for (const wy of [-0.3, 0.25]) {
            ctx.beginPath(); ctx.arc(-w - sz * 0.08, h * wy, sz * 0.1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(w + sz * 0.08, h * wy, sz * 0.1, 0, Math.PI * 2); ctx.fill();
        }

        // 装甲车身 (梯形)
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.7, -h * 0.6);
        ctx.lineTo(w * 0.7, -h * 0.6);
        ctx.lineTo(w, h * 0.45);
        ctx.lineTo(w * 0.8, h * 0.6);
        ctx.lineTo(-w * 0.8, h * 0.6);
        ctx.lineTo(-w, h * 0.45);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // 装甲接缝
        ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 0.6); ctx.lineTo(-w * 0.6, h * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w * 0.5, -h * 0.6); ctx.lineTo(w * 0.6, h * 0.4); ctx.stroke();

        // 观察窗
        ctx.fillStyle = '#3a5a6a';
        ctx.fillRect(-w * 0.3, h * 0.25, w * 0.6, h * 0.12);

        // 炮塔 (椭圆)
        ctx.fillStyle = c2; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, -h * 0.08, sz * 0.22, sz * 0.18, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // 机枪 (向前 = +y)
        ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(2, sz * 0.07);
        ctx.beginPath(); ctx.moveTo(0, sz * 0.08); ctx.lineTo(0, sz * 0.55); ctx.stroke();
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-sz * 0.04, sz * 0.5, sz * 0.08, sz * 0.08);

        // 铆钉
        ctx.fillStyle = '#999';
        for (const [rx, ry] of [[-0.25, -0.35], [0.25, -0.35], [-0.25, 0.2], [0.25, 0.2]]) {
            ctx.beginPath(); ctx.arc(w * rx * 2, h * ry, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    // --- 俯视履带 (纵向, 在车体两侧) ---
    _drawTrackV(tx, ty, trackW, trackH, sz) {
        const ctx = this.ctx;
        const r = trackW * 0.5;
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(tx, ty + r);
        ctx.arcTo(tx, ty, tx + trackW, ty, r);
        ctx.lineTo(tx + trackW, ty);
        ctx.arcTo(tx + trackW, ty + trackH, tx, ty + trackH, r);
        ctx.lineTo(tx, ty + trackH);
        ctx.arcTo(tx, ty + trackH, tx, ty, r);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
        // 履带纹理 (横线)
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
        const steps = Math.floor(trackH / (trackW * 0.6));
        for (let i = 1; i < steps; i++) {
            const ly = ty + i * (trackH / steps);
            ctx.beginPath(); ctx.moveTo(tx + 1, ly); ctx.lineTo(tx + trackW - 1, ly); ctx.stroke();
        }
        // 负重轮
        ctx.fillStyle = '#333';
        const wheelCount = Math.max(2, Math.floor(trackH / (trackW * 1.2)));
        for (let i = 0; i < wheelCount; i++) {
            const wy = ty + trackW * 0.5 + i * ((trackH - trackW) / Math.max(1, wheelCount - 1));
            ctx.beginPath(); ctx.arc(tx + trackW * 0.5, wy, trackW * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#555';
            ctx.beginPath(); ctx.arc(tx + trackW * 0.5, wy, trackW * 0.12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333';
        }
    }

    // --- 俯视轻型坦克 ---
    drawTank(sz, c1, c2) {
        const ctx = this.ctx;
        const bw = sz * 0.5, bh = sz * 0.85;
        const trackW = sz * 0.16, trackH = bh * 1.6;

        // 履带 (左右两条)
        this._drawTrackV(-bw * 0.9 - trackW, -trackH * 0.5, trackW, trackH, sz);
        this._drawTrackV(bw * 0.9, -trackH * 0.5, trackW, trackH, sz);

        // 车体 (六边形)
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-bw * 0.7, -bh * 0.6);
        ctx.lineTo(bw * 0.7, -bh * 0.6);
        ctx.lineTo(bw * 0.85, -bh * 0.3);
        ctx.lineTo(bw * 0.85, bh * 0.45);
        ctx.lineTo(bw * 0.6, bh * 0.6);
        ctx.lineTo(-bw * 0.6, bh * 0.6);
        ctx.lineTo(-bw * 0.85, bh * 0.45);
        ctx.lineTo(-bw * 0.85, -bh * 0.3);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // 车体接缝
        ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-bw * 0.5, -bh * 0.55); ctx.lineTo(-bw * 0.5, bh * 0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bw * 0.5, -bh * 0.55); ctx.lineTo(bw * 0.5, bh * 0.55); ctx.stroke();

        // 炮塔 (圆形, 略偏后)
        ctx.fillStyle = c2; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -bh * 0.08, sz * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 指挥塔
        ctx.fillStyle = '#444';
        ctx.beginPath(); ctx.arc(0, -bh * 0.2, sz * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8; ctx.stroke();

        // 主炮 (向前 = +y)
        ctx.fillStyle = '#333'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        const barrelW = sz * 0.1, barrelL = sz * 0.9;
        ctx.fillRect(-barrelW / 2, bh * 0.05, barrelW, barrelL);
        ctx.strokeRect(-barrelW / 2, bh * 0.05, barrelW, barrelL);
        // 炮口制退器
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-barrelW * 0.8, bh * 0.05 + barrelL - sz * 0.05, barrelW * 1.6, sz * 0.05);
    }

    // --- 俯视重型坦克 ---
    drawHeavyTank(sz, c1, c2) {
        const ctx = this.ctx;
        const bw = sz * 0.58, bh = sz * 0.95;
        const trackW = sz * 0.2, trackH = bh * 1.65;

        // 履带
        this._drawTrackV(-bw * 0.88 - trackW, -trackH * 0.5, trackW, trackH, sz);
        this._drawTrackV(bw * 0.88, -trackH * 0.5, trackW, trackH, sz);

        // 侧裙甲
        ctx.fillStyle = '#333'; ctx.globalAlpha = 0.6;
        ctx.fillRect(-bw - trackW * 0.3, -trackH * 0.45, trackW * 0.5, trackH * 0.9);
        ctx.fillRect(bw - trackW * 0.2, -trackH * 0.45, trackW * 0.5, trackH * 0.9);
        ctx.globalAlpha = 1;

        // 车体 (更厚实)
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-bw * 0.65, -bh * 0.65);
        ctx.lineTo(bw * 0.65, -bh * 0.65);
        ctx.lineTo(bw * 0.85, -bh * 0.35);
        ctx.lineTo(bw * 0.85, bh * 0.5);
        ctx.lineTo(bw * 0.55, bh * 0.65);
        ctx.lineTo(-bw * 0.55, bh * 0.65);
        ctx.lineTo(-bw * 0.85, bh * 0.5);
        ctx.lineTo(-bw * 0.85, -bh * 0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // 装甲接缝
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, -bh * 0.6); ctx.lineTo(0, bh * 0.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-bw * 0.8, 0); ctx.lineTo(bw * 0.8, 0); ctx.stroke();

        // 炮塔 (更大)
        ctx.fillStyle = c2; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -bh * 0.05, sz * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 指挥塔
        ctx.fillStyle = '#444';
        ctx.beginPath(); ctx.arc(-sz * 0.12, -bh * 0.18, sz * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8; ctx.stroke();

        // 主炮 (更粗更长)
        ctx.fillStyle = '#333'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        const bW = sz * 0.14, bL = sz * 1.15;
        ctx.fillRect(-bW / 2, bh * 0.08, bW, bL);
        ctx.strokeRect(-bW / 2, bh * 0.08, bW, bL);
        // 炮口制退器
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-bW * 0.9, bh * 0.08 + bL - sz * 0.08, bW * 1.8, sz * 0.08);

        // 铆钉
        ctx.fillStyle = '#888';
        for (const [rx, ry] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.3], [0.5, 0.3], [0, -0.55], [0, 0.5]]) {
            ctx.beginPath(); ctx.arc(bw * rx, bh * ry, 1.8, 0, Math.PI * 2); ctx.fill();
        }
    }

    // --- 俯视扫雷车 ---
    drawSweeper(sz, c1, c2) {
        const ctx = this.ctx;
        const w = sz * 0.4, h = sz * 0.7;

        // 车轮 (两侧各2个)
        ctx.fillStyle = '#1a1a1a';
        for (const wy of [-0.25, 0.2]) {
            ctx.beginPath(); ctx.arc(-w - sz * 0.07, h * wy, sz * 0.09, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(w + sz * 0.07, h * wy, sz * 0.09, 0, Math.PI * 2); ctx.fill();
        }

        // 车体
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.7, -h * 0.55);
        ctx.lineTo(w * 0.7, -h * 0.55);
        ctx.lineTo(w, h * 0.3);
        ctx.lineTo(w * 0.8, h * 0.45);
        ctx.lineTo(-w * 0.8, h * 0.45);
        ctx.lineTo(-w, h * 0.3);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // 驾驶舱玻璃
        ctx.fillStyle = '#8abbd8';
        ctx.fillRect(-w * 0.4, h * 0.15, w * 0.8, h * 0.12);

        // 扫雷臂 (从车前伸出)
        ctx.strokeStyle = '#888'; ctx.lineWidth = Math.max(3, sz * 0.1);
        ctx.beginPath();
        ctx.moveTo(-sz * 0.05, h * 0.45);
        ctx.lineTo(-sz * 0.05, h * 0.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sz * 0.05, h * 0.45);
        ctx.lineTo(sz * 0.05, h * 0.85);
        ctx.stroke();

        // 扫雷滚筒 (横向圆柱)
        const rollerY = h * 0.92;
        ctx.fillStyle = '#555'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, rollerY, sz * 0.32, sz * 0.1, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // 滚筒链条 (旋转动画)
        ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + this.animTime * 6;
            const sx = Math.cos(a) * sz * 0.24;
            const sy = rollerY + Math.sin(a) * sz * 0.06;
            const ex = Math.cos(a) * sz * 0.38;
            const ey = rollerY + Math.sin(a) * sz * 0.1;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.fillStyle = '#777';
            ctx.beginPath(); ctx.arc(ex, ey, sz * 0.03, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5;
        }

        // 警示标志
        ctx.fillStyle = '#ffaa00';
        ctx.font = `bold ${Math.max(8, Math.floor(sz * 0.35))}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚠', 0, -h * 0.2);
    }

    // ===== 特效 =====
    drawEffects() {
        const g = this.game, ctx = this.ctx, ts = g.tileSize;
        for (const eff of g.effects) {
            const progress = 1 - eff.timer / eff.duration;
            const cx = g.offsetX + (eff.x + 0.5) * ts;
            const cy = g.offsetY + (eff.y + 0.5) * ts;

            if (eff.type === 'explosion') {
                const maxR = eff.radius * ts;
                const r = maxR * Math.min(1, progress * 2);
                ctx.globalAlpha = Math.max(0, 1 - progress);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.8);
                grad.addColorStop(0, 'rgba(255,200,50,0.8)');
                grad.addColorStop(0.5, 'rgba(255,100,20,0.5)');
                grad.addColorStop(1, 'rgba(100,30,10,0)');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                for (const p of eff.particles) {
                    const px = g.offsetX + (p.x + 0.5) * ts;
                    const py = g.offsetY + (p.y + 0.5) * ts;
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillStyle = p.life > 0.2 ? '#ffa030' : '#884020';
                    ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalAlpha = 1;
            } else if (eff.type === 'fire') {
                ctx.globalAlpha = Math.max(0, 1 - progress * 0.7);
                ctx.fillStyle = '#ff4411';
                ctx.beginPath(); ctx.arc(cx, cy, ts * (0.3 + 0.15 * Math.sin(this.animTime * 8)), 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff8844';
                ctx.beginPath(); ctx.arc(cx - ts * 0.1, cy - ts * 0.15, ts * 0.18, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            } else if (eff.type === 'kill') {
                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = '#ff4444'; ctx.font = `${Math.floor(ts * 0.4)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('💀', cx, cy - progress * ts);
                ctx.globalAlpha = 1;
            } else if (eff.type === 'crush') {
                // 白色骷髅头上升消失
                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = '#ffffff'; ctx.font = `${Math.floor(ts * 0.55)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('💀', cx, cy - progress * ts * 1.5);
                ctx.globalAlpha = 1;
            } else if (eff.type === 'disarm') {
                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = '#ff8844'; ctx.font = `${Math.floor(ts * 0.4)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('✂️', cx, cy - progress * ts * 0.5);
                ctx.globalAlpha = 1;
            } else if (eff.type === 'place') {
                ctx.globalAlpha = 1 - progress;
                ctx.strokeStyle = '#e8c44a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(cx, cy, ts * 0.3 * (1 + progress), 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }

    drawFloatingTexts() {
        const g = this.game, ctx = this.ctx, ts = g.tileSize;
        for (const ft of g.floatingTexts) {
            const cx = g.offsetX + (ft.x + 0.5) * ts;
            const cy = g.offsetY + (ft.y + 0.5) * ts;
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${Math.max(10, Math.floor(ts * 0.26))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, cx, cy);
            ctx.globalAlpha = 1;
        }
    }

    drawHoverPreview() {
        const g = this.game;
        if (!g.hoverTile || !g.selectedMine || (g.state !== 'prep' && g.state !== 'wave')) return;
        const ctx = this.ctx, ts = g.tileSize;
        const {col, row} = g.hoverTile;
        if (!g.canPlaceMine(col, row)) return;
        const cx = g.offsetX + (col + 0.5) * ts;
        const cy = g.offsetY + (row + 0.5) * ts;
        const mt = MINE_TYPES[g.selectedMine];

        ctx.globalAlpha = 0.15;
        ctx.fillStyle = mt.color;
        ctx.beginPath(); ctx.arc(cx, cy, mt.radius * ts, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = mt.color; ctx.lineWidth = 1; ctx.stroke();

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = mt.color;
        ctx.beginPath(); ctx.arc(cx, cy, ts * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawPrepIndicator() {
        const g = this.game;
        if (!g.selectedMine) return;
        const ctx = this.ctx, ts = g.tileSize;
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                if (g.canPlaceMine(c, r)) {
                    const x = g.offsetX + c * ts, y = g.offsetY + r * ts;
                    ctx.fillStyle = 'rgba(232,196,74,0.1)';
                    ctx.fillRect(x, y, ts, ts);
                    ctx.strokeStyle = 'rgba(232,196,74,0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
                }
            }
        }
    }

    drawCountdown() {
        const g = this.game, ctx = this.ctx;
        const sec = Math.ceil(g.countdownTimer);
        const frac = g.countdownTimer - Math.floor(g.countdownTimer);

        const mapCx = g.offsetX + (CONFIG.COLS * g.tileSize) / 2;
        const mapCy = g.offsetY + g.tileSize * 2.5;

        // 半透明背景胶囊, 局部区域, 不遮挡操作
        const pillW = g.tileSize * 5;
        const pillH = g.tileSize * 1.6;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        const r = pillH / 2;
        ctx.roundRect(mapCx - pillW / 2, mapCy - pillH / 2, pillW, pillH, r);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 倒计时数字
        const pulse = 1 + Math.max(0, frac - 0.7) * 1.0;
        const numSize = Math.floor(g.tileSize * 1.2 * pulse);
        ctx.font = `bold ${numSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = sec <= 5 ? '#e84a4a' : '#e8c44a';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 3;
        ctx.strokeText(sec, mapCx + g.tileSize * 0.6, mapCy);
        ctx.fillText(sec, mapCx + g.tileSize * 0.6, mapCy);

        // 提示文字
        const hint = sec <= 5 ? '敌军接近' : '布雷时间';
        ctx.font = `bold ${Math.floor(g.tileSize * 0.5)}px sans-serif`;
        ctx.fillStyle = sec <= 5 ? '#ff8888' : '#f0e6c8';
        ctx.strokeText(hint, mapCx - g.tileSize * 0.7, mapCy);
        ctx.fillText(hint, mapCx - g.tileSize * 0.7, mapCy);

        ctx.restore();
    }
}
