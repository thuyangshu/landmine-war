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
        if (g.state === 'prep' || g.state === 'wave') this.drawPrepIndicator();
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
                        ctx.moveTo(x + ts * 0.2, y + ts * 0.3);
                        ctx.lineTo(x + ts * 0.7, y + ts * 0.5);
                        ctx.lineTo(x + ts * 0.2, y + ts * 0.7);
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
        // 路线标签 (按起始行排序)
        const sorted = paths.map((p, i) => ({idx: i, row: p[0][1]})).sort((a, b) => a.row - b.row);
        const labelSets = {2:['北路','南路'], 3:['北路','中路','南路'], 4:['北路','中北路','中南路','南路']};
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

    // ===== 敌人 =====
    drawEnemies() {
        const g = this.game, ctx = this.ctx, ts = g.tileSize;
        for (const enemy of g.enemies) {
            if (enemy.dead || enemy.reached) continue;
            const et = ENEMY_TYPES[enemy.type];
            const cx = g.offsetX + (enemy.x + 0.5) * ts;
            const cy = g.offsetY + (enemy.y + 0.5) * ts;
            const sz = ts * et.size;

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

            const c1 = enemy.hitFlash > 0 ? '#ff8866' : et.baseColor;
            const c2 = et.darkColor;

            switch (enemy.type) {
                case 'infantry': this.drawInfantry(cx, cy, sz, c1, c2); break;
                case 'cavalry': this.drawCavalry(cx, cy, sz, c1, c2); break;
                case 'engineer': this.drawEngineer(cx, cy, sz, c1, c2, enemy); break;
                case 'truck': this.drawTruck(cx, cy, sz, c1, c2); break;
                case 'armored': this.drawArmored(cx, cy, sz, c1, c2); break;
                case 'lightTank': this.drawTank(cx, cy, sz, c1, c2); break;
                case 'heavyTank': this.drawHeavyTank(cx, cy, sz, c1, c2); break;
                case 'sweeper': this.drawSweeper(cx, cy, sz, c1, c2); break;
            }

            // 血条
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
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

            // 扫雷范围指示
            if (et.sweepRange) {
                ctx.globalAlpha = 0.12;
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(cx, cy, et.sweepRange * ts, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        }
    }

    // --- 通用士兵身体 ---
    _drawSoldier(cx, cy, sz, bodyColor, helmetColor) {
        const ctx = this.ctx;
        const headR = sz * 0.22;
        const headY = cy - sz * 0.35;
        const bodyTop = headY + headR * 0.6;
        const bodyW = sz * 0.44;
        const bodyH = sz * 0.5;
        const bodyBot = bodyTop + bodyH;
        const legLen = sz * 0.35;
        ctx.strokeStyle = bodyColor; ctx.lineWidth = Math.max(2, sz * 0.12); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - bodyW * 0.25, bodyBot); ctx.lineTo(cx - bodyW * 0.3, bodyBot + legLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + bodyW * 0.25, bodyBot); ctx.lineTo(cx + bodyW * 0.3, bodyBot + legLen); ctx.stroke();
        ctx.fillStyle = '#2a2a1a';
        ctx.fillRect(cx - bodyW * 0.3 - sz * 0.05, bodyBot + legLen - sz * 0.06, sz * 0.14, sz * 0.08);
        ctx.fillRect(cx + bodyW * 0.3 - sz * 0.08, bodyBot + legLen - sz * 0.06, sz * 0.14, sz * 0.08);
        ctx.fillStyle = bodyColor; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        ctx.fillRect(cx - bodyW * 0.5, bodyTop, bodyW, bodyH);
        ctx.strokeRect(cx - bodyW * 0.5, bodyTop, bodyW, bodyH);
        ctx.fillStyle = '#4a3a1a';
        ctx.fillRect(cx - bodyW * 0.5, bodyTop + bodyH * 0.7, bodyW, sz * 0.06);
        ctx.fillStyle = '#d4a574'; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = helmetColor;
        ctx.beginPath(); ctx.arc(cx, headY - headR * 0.15, headR * 1.15, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillRect(cx - headR * 1.3, headY - headR * 0.15, headR * 2.6, headR * 0.22);
        ctx.strokeStyle = bodyColor; ctx.lineWidth = Math.max(2, sz * 0.1); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - bodyW * 0.5, bodyTop + bodyH * 0.15);
        ctx.lineTo(cx - bodyW * 0.8, bodyTop + bodyH * 0.6); ctx.stroke();
        return { headY, bodyTop, bodyBot, bodyW, bodyH, headR };
    }

    drawInfantry(cx, cy, sz, c1, c2) {
        const ctx = this.ctx;
        ctx.save();
        const b = this._drawSoldier(cx, cy, sz, c1, c2);
        ctx.strokeStyle = c1; ctx.lineWidth = Math.max(2, sz * 0.1); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + b.bodyW * 0.5, b.bodyTop + b.bodyH * 0.15);
        ctx.lineTo(cx + sz * 0.45, b.bodyTop + b.bodyH * 0.45); ctx.stroke();
        ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = Math.max(1.5, sz * 0.07);
        ctx.beginPath(); ctx.moveTo(cx + sz * 0.2, b.bodyBot - sz * 0.05);
        ctx.lineTo(cx + sz * 0.5, b.headY - sz * 0.2); ctx.stroke();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = Math.max(1, sz * 0.04);
        ctx.beginPath(); ctx.moveTo(cx + sz * 0.5, b.headY - sz * 0.2);
        ctx.lineTo(cx + sz * 0.55, b.headY - sz * 0.45); ctx.stroke();
        ctx.restore();
    }

    drawCavalry(cx, cy, sz, c1, c2) {
        const ctx = this.ctx;
        ctx.save();
        const mw = sz * 1.2, mh = sz * 0.45;
        const my = cy + sz * 0.2;
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = Math.max(2, sz * 0.1); ctx.lineCap = 'round';
        for (const lx of [-0.6, -0.2, 0.2, 0.55]) {
            ctx.beginPath(); ctx.moveTo(cx + mw * lx, my + mh * 0.6);
            ctx.lineTo(cx + mw * lx, my + mh + sz * 0.35); ctx.stroke();
        }
        ctx.fillStyle = '#222';
        for (const lx of [-0.6, -0.2, 0.2, 0.55]) {
            ctx.beginPath(); ctx.arc(cx + mw * lx, my + mh + sz * 0.35, sz * 0.04, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#7a5a2a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, my, mw, mh, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8a6a3a';
        ctx.beginPath(); ctx.ellipse(cx + mw + sz * 0.15, my - mh * 0.3, sz * 0.22, sz * 0.16, -0.4, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + mw + sz * 0.15, my - mh * 0.5);
        ctx.lineTo(cx + mw + sz * 0.08, my - mh * 0.8);
        ctx.lineTo(cx + mw + sz * 0.22, my - mh * 0.55); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(cx + mw + sz * 0.22, my - mh * 0.35, sz * 0.03, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4a3a1a'; ctx.lineWidth = Math.max(1.5, sz * 0.06);
        ctx.beginPath(); ctx.moveTo(cx - mw, my);
        ctx.quadraticCurveTo(cx - mw - sz * 0.3, my + sz * 0.2, cx - mw - sz * 0.15, my + sz * 0.4); ctx.stroke();
        const riderY = my - mh - sz * 0.15;
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        ctx.fillRect(cx - sz * 0.15, riderY, sz * 0.3, sz * 0.35);
        ctx.strokeRect(cx - sz * 0.15, riderY, sz * 0.3, sz * 0.35);
        ctx.fillStyle = '#d4a574';
        ctx.beginPath(); ctx.arc(cx, riderY - sz * 0.08, sz * 0.14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillStyle = c2;
        ctx.beginPath(); ctx.arc(cx, riderY - sz * 0.12, sz * 0.16, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = Math.max(1.5, sz * 0.05);
        ctx.beginPath(); ctx.moveTo(cx + sz * 0.15, riderY + sz * 0.1);
        ctx.lineTo(cx + sz * 0.7, riderY - sz * 0.3); ctx.stroke();
        ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = Math.max(2, sz * 0.07);
        ctx.beginPath(); ctx.moveTo(cx + sz * 0.15, riderY + sz * 0.1);
        ctx.lineTo(cx + sz * 0.1, riderY + sz * 0.18); ctx.stroke();
        ctx.restore();
    }

    drawEngineer(cx, cy, sz, c1, c2, enemy) {
        const ctx = this.ctx;
        ctx.save();
        const b = this._drawSoldier(cx, cy, sz, c1, c2);
        ctx.strokeStyle = c1; ctx.lineWidth = Math.max(2, sz * 0.1); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + b.bodyW * 0.5, b.bodyTop + b.bodyH * 0.15);
        ctx.lineTo(cx + sz * 0.45, b.bodyTop + b.bodyH * 0.5); ctx.stroke();
        ctx.strokeStyle = '#888'; ctx.lineWidth = Math.max(2, sz * 0.08);
        ctx.beginPath(); ctx.moveTo(cx + sz * 0.3, b.bodyBot);
        ctx.lineTo(cx + sz * 0.45, b.headY); ctx.stroke();
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = Math.max(2.5, sz * 0.12);
        ctx.beginPath(); ctx.moveTo(cx + sz * 0.42, b.headY + sz * 0.05);
        ctx.lineTo(cx + sz * 0.48, b.headY - sz * 0.08); ctx.stroke();
        ctx.fillStyle = '#6a5a3a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
        ctx.fillRect(cx - b.bodyW * 0.55 - sz * 0.1, b.bodyTop + b.bodyH * 0.1, sz * 0.12, b.bodyH * 0.6);
        ctx.strokeRect(cx - b.bodyW * 0.55 - sz * 0.1, b.bodyTop + b.bodyH * 0.1, sz * 0.12, b.bodyH * 0.6);
        if (enemy.disarmCharges > 0) {
            ctx.fillStyle = '#ff0'; ctx.font = `bold ${Math.max(8, Math.floor(sz * 0.6))}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`${enemy.disarmCharges}`, cx + sz * 0.7, b.headY - sz * 0.15);
        }
        ctx.restore();
    }

    drawTruck(cx, cy, sz, c1, c2) {
        const ctx = this.ctx;
        ctx.save();
        const w = sz * 1.6, h = sz * 0.9;
        ctx.fillStyle = '#1a1a1a';
        for (const wx of [-0.45, -0.15, 0.35, 0.55]) {
            ctx.beginPath(); ctx.arc(cx + w * wx, cy + h * 0.55, sz * 0.13, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#444';
            ctx.beginPath(); ctx.arc(cx + w * wx, cy + h * 0.55, sz * 0.06, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a1a1a';
        }
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(cx - w * 0.55, cy + h * 0.3, w * 1.2, h * 0.15);
        ctx.fillStyle = '#6a6a5a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.fillRect(cx - w * 0.55, cy - h * 0.35, w * 0.75, h * 0.7);
        ctx.strokeRect(cx - w * 0.55, cy - h * 0.35, w * 0.75, h * 0.7);
        ctx.fillStyle = '#8a8a6a'; ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.55, cy - h * 0.35);
        ctx.quadraticCurveTo(cx - w * 0.18, cy - h * 0.75, cx + w * 0.2, cy - h * 0.35);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.fillRect(cx + w * 0.22, cy - h * 0.3, w * 0.35, h * 0.65);
        ctx.strokeRect(cx + w * 0.22, cy - h * 0.3, w * 0.35, h * 0.65);
        ctx.fillStyle = c2;
        ctx.fillRect(cx + w * 0.57, cy - h * 0.15, w * 0.1, h * 0.45);
        ctx.strokeRect(cx + w * 0.57, cy - h * 0.15, w * 0.1, h * 0.45);
        ctx.fillStyle = '#8abbd8';
        ctx.fillRect(cx + w * 0.24, cy - h * 0.25, w * 0.08, h * 0.4);
        ctx.fillStyle = '#ffdd66';
        ctx.beginPath(); ctx.arc(cx + w * 0.67, cy + h * 0.05, sz * 0.05, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + w * 0.67, cy + h * 0.2, sz * 0.05, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - w * 0.2, cy - h * 0.32, sz * 0.22, sz * 0.22);
        ctx.fillStyle = '#c33';
        ctx.beginPath(); ctx.arc(cx - w * 0.2 + sz * 0.11, cy - h * 0.32 + sz * 0.11, sz * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    drawArmored(cx, cy, sz, c1, c2) {
        const ctx = this.ctx;
        ctx.save();
        const w = sz * 1.5, h = sz * 0.8;
        ctx.fillStyle = '#1a1a1a';
        for (const wx of [-0.65, -0.25, 0.15, 0.55]) {
            ctx.beginPath(); ctx.arc(cx + w * wx, cy + h * 0.65, sz * 0.12, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.8, cy + h * 0.4);
        ctx.lineTo(cx - w * 0.6, cy - h * 0.45);
        ctx.lineTo(cx + w * 0.6, cy - h * 0.45);
        ctx.lineTo(cx + w * 0.8, cy + h * 0.4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.1, cy - h * 0.45); ctx.lineTo(cx - w * 0.2, cy + h * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + w * 0.3, cy - h * 0.45); ctx.lineTo(cx + w * 0.4, cy + h * 0.4); ctx.stroke();
        ctx.fillStyle = '#3a5a6a';
        ctx.fillRect(cx + w * 0.45, cy - h * 0.2, w * 0.12, h * 0.3);
        ctx.fillRect(cx - w * 0.55, cy - h * 0.15, w * 0.1, h * 0.2);
        ctx.fillStyle = c2; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx - w * 0.05, cy - h * 0.55, sz * 0.28, sz * 0.2, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(2, sz * 0.08);
        ctx.beginPath(); ctx.moveTo(cx + sz * 0.15, cy - h * 0.55);
        ctx.lineTo(cx + sz * 0.7, cy - h * 0.55); ctx.stroke();
        ctx.fillStyle = '#999';
        for (const [rx, ry] of [[-0.4, -0.15], [0.15, -0.15], [-0.4, 0.2], [0.15, 0.2]]) {
            ctx.beginPath(); ctx.arc(cx + w * rx, cy + h * ry, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    // --- 轻型坦克 ---
    drawTank(cx, cy, sz, c1, c2) {
        const ctx = this.ctx;
        ctx.save();
        const w = sz * 1.7, h = sz * 0.75;
        const trackH = sz * 0.28;
        ctx.fillStyle = '#222'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        this._drawTrack(cx, cy - h * 0.5, w, trackH, sz);
        this._drawTrack(cx, cy + h * 0.5 - trackH, w, trackH, sz);
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.85, cy + h * 0.5 - trackH);
        ctx.lineTo(cx - w * 0.7, cy - h * 0.5 + trackH);
        ctx.lineTo(cx + w * 0.7, cy - h * 0.5 + trackH);
        ctx.lineTo(cx + w * 0.85, cy + h * 0.5 - trackH);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.5 + trackH); ctx.lineTo(cx, cy + h * 0.5 - trackH); ctx.stroke();
        ctx.fillStyle = c2; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx - w * 0.08, cy, sz * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(cx - w * 0.15, cy - sz * 0.05, sz * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillStyle = '#333'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        const barrelW = sz * 0.14, barrelL = sz * 1.4;
        ctx.fillRect(cx + sz * 0.2, cy - barrelW / 2, barrelL, barrelW);
        ctx.strokeRect(cx + sz * 0.2, cy - barrelW / 2, barrelL, barrelW);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx + sz * 0.2 + barrelL - sz * 0.06, cy - barrelW * 0.7, sz * 0.06, barrelW * 1.4);
        ctx.restore();
    }

    // --- 重型坦克 (更大更厚) ---
    drawHeavyTank(cx, cy, sz, c1, c2) {
        const ctx = this.ctx;
        ctx.save();
        const w = sz * 1.85, h = sz * 0.9;
        const trackH = sz * 0.32;
        ctx.fillStyle = '#222'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        this._drawTrack(cx, cy - h * 0.5, w, trackH, sz);
        this._drawTrack(cx, cy + h * 0.5 - trackH, w, trackH, sz);
        // 车体 (更厚)
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.85, cy + h * 0.5 - trackH);
        ctx.lineTo(cx - w * 0.7, cy - h * 0.5 + trackH);
        ctx.lineTo(cx + w * 0.7, cy - h * 0.5 + trackH);
        ctx.lineTo(cx + w * 0.85, cy + h * 0.5 - trackH);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // 装甲接缝
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.25, cy - h * 0.5 + trackH); ctx.lineTo(cx - w * 0.3, cy + h * 0.5 - trackH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + w * 0.25, cy - h * 0.5 + trackH); ctx.lineTo(cx + w * 0.3, cy + h * 0.5 - trackH); ctx.stroke();
        // 侧裙甲
        ctx.fillStyle = '#333'; ctx.globalAlpha = 0.6;
        ctx.fillRect(cx - w * 0.82, cy - h * 0.5, w * 1.64, trackH * 0.4);
        ctx.fillRect(cx - w * 0.82, cy + h * 0.5 - trackH * 0.4, w * 1.64, trackH * 0.4);
        ctx.globalAlpha = 1;
        // 炮塔 (更大)
        ctx.fillStyle = c2; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx - w * 0.06, cy, sz * 0.46, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // 指挥塔
        ctx.fillStyle = '#444';
        ctx.beginPath(); ctx.arc(cx - w * 0.22, cy - sz * 0.12, sz * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8; ctx.stroke();
        // 主炮 (更粗更长)
        ctx.fillStyle = '#333'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        const bW = sz * 0.2, bL = sz * 1.7;
        ctx.fillRect(cx + sz * 0.3, cy - bW / 2, bL, bW);
        ctx.strokeRect(cx + sz * 0.3, cy - bW / 2, bL, bW);
        // 炮口制退器
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx + sz * 0.3 + bL - sz * 0.12, cy - bW * 0.8, sz * 0.12, bW * 1.6);
        // 铆钉
        ctx.fillStyle = '#888';
        for (const [rx, ry] of [[-0.5, -0.15], [0.1, -0.15], [-0.5, 0.15], [0.1, 0.15], [-0.2, 0], [0.35, 0]]) {
            ctx.beginPath(); ctx.arc(cx + w * rx, cy + h * ry, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    // --- 扫雷车 ---
    drawSweeper(cx, cy, sz, c1, c2) {
        const ctx = this.ctx;
        ctx.save();
        const w = sz * 1.5, h = sz * 0.85;
        // 车轮
        ctx.fillStyle = '#1a1a1a';
        for (const wx of [-0.5, -0.1, 0.3]) {
            ctx.beginPath(); ctx.arc(cx + w * wx, cy + h * 0.55, sz * 0.12, 0, Math.PI * 2); ctx.fill();
        }
        // 车体
        ctx.fillStyle = c1; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.65, cy + h * 0.35);
        ctx.lineTo(cx - w * 0.5, cy - h * 0.35);
        ctx.lineTo(cx + w * 0.45, cy - h * 0.35);
        ctx.lineTo(cx + w * 0.6, cy + h * 0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // 驾驶舱
        ctx.fillStyle = '#8abbd8';
        ctx.fillRect(cx - w * 0.35, cy - h * 0.28, w * 0.15, h * 0.35);
        // 扫雷臂
        ctx.strokeStyle = '#888'; ctx.lineWidth = Math.max(3, sz * 0.1);
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.5, cy - h * 0.1);
        ctx.lineTo(cx + w * 0.95, cy + h * 0.15);
        ctx.stroke();
        // 扫雷滚筒
        const rollerX = cx + w * 0.95, rollerY = cy + h * 0.25;
        ctx.fillStyle = '#555'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(rollerX, rollerY, sz * 0.28, sz * 0.12, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        // 滚筒链条 (旋转动画)
        ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + this.animTime * 6;
            const sx = rollerX + Math.cos(a) * sz * 0.2;
            const sy = rollerY + Math.sin(a) * sz * 0.08;
            const ex = rollerX + Math.cos(a) * sz * 0.35;
            const ey = rollerY + Math.sin(a) * sz * 0.14;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
            // 链锤头
            ctx.fillStyle = '#777';
            ctx.beginPath(); ctx.arc(ex, ey, sz * 0.04, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5;
        }
        // 警示标志
        ctx.fillStyle = '#ffaa00';
        ctx.font = `bold ${Math.max(8, Math.floor(sz * 0.4))}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚠', cx, cy - h * 0.15);
        ctx.restore();
    }

    _drawTrack(cx, ty, w, h, sz) {
        const ctx = this.ctx;
        ctx.fillStyle = '#222';
        const r = h * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.75, ty);
        ctx.lineTo(cx + w * 0.75, ty);
        ctx.arcTo(cx + w * 0.85, ty, cx + w * 0.85, ty + h, r);
        ctx.lineTo(cx + w * 0.85, ty + h);
        ctx.lineTo(cx - w * 0.85, ty + h);
        ctx.arcTo(cx - w * 0.85, ty + h, cx - w * 0.85, ty, r);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
        for (let i = -4; i <= 4; i++) {
            const tx = cx + i * w * 0.18;
            ctx.beginPath(); ctx.moveTo(tx, ty + 1); ctx.lineTo(tx, ty + h - 1); ctx.stroke();
        }
        ctx.fillStyle = '#333';
        for (let i = -2; i <= 2; i++) {
            const wx = cx + i * w * 0.3;
            ctx.beginPath(); ctx.arc(wx, ty + h * 0.5, h * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#555';
            ctx.beginPath(); ctx.arc(wx, ty + h * 0.5, h * 0.12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333';
        }
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
}
