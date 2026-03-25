// ========================================
// 地雷战 - 游戏配置 v3 (关卡制)
// ========================================

const CONFIG = {
    COLS: 9,
    ROWS: 16,
    ENEMY_HP_SCALE: 1.08,
    ENEMY_ARMOR_PER_5: 2,
    RESOURCE_DROP_SCALE: 1.10,
    CAVALRY_DODGE: 0.25,
    ARMORED_AOE_REDUCE: 0.5,
    TANK_MIN_DMG: 60,
    START_IRON: 30,
    START_POWDER: 50,
    HOUSE_COUNT: 5,
    BURN_DAMAGE: {infantry:1, cavalry:1, engineer:1, truck:2, armored:3, lightTank:6, heavyTank:9, sweeper:2},
    HOUSE_HP: 3,
    SPAWN_INTERVAL: 1200,
    WAVES_PER_LEVEL: 3,
    COUNTDOWN_TIME: 15,
};

// ====== 地雷 ======
// 资源策略: 纯火药(反步兵) / 偏铁(反车辆) / 偏火药(特效)
// 目标策略: footOnly(反步兵) / vehicleOnly(反车辆) / 通用
const MINE_TYPES = {
    trip: {
        name: '绊雷', icon: '⚡', color: '#e8c44a',
        damage: 60, radius: 0.6, iron: 0, powder: 6, armTime: 1.5,
        desc: '纯火药, 流血, 防排雷',
        special: 'bleed', bleedDmg: 8, bleedTime: 3, footOnly: true, noMetal: true,
    },
    dirt: {
        name: '土雷', icon: '◉', color: '#9a8060',
        damage: 100, radius: 1.0, iron: 0, powder: 10, armTime: 2.0,
        desc: '纯火药, 溅射, 防排雷',
        special: 'shrapnel', shrapCount: 3, shrapDmg: 25, footOnly: true, noMetal: true,
    },
    iron: {
        name: '铁雷', icon: '⬢', color: '#7a8a9a',
        damage: 180, radius: 1.6, iron: 12, powder: 4, armTime: 2.5,
        desc: '通用, 削装甲, 偏铁',
        special: 'armorShred', shredAmount: 15, shredTime: 8,
    },
    antitank: {
        name: '反坦克雷', icon: '⊕', color: '#c45a3a',
        damage: 450, radius: 0.7, iron: 18, powder: 4, armTime: 3.0,
        desc: '仅对车辆, 穿甲, 纯铁',
        special: 'pierce', pierceRatio: 0.8, vehicleOnly: true,
    },
    chain: {
        name: '连环雷', icon: '⛓', color: '#c47a2a',
        damage: 130, radius: 1.8, iron: 10, powder: 16, armTime: 4.0,
        desc: '连锁×3, 防扫雷, 偏火药',
        special: 'chain', chainCount: 3, chainDelay: 0.3, sweepImmune: true,
    },
    sky: {
        name: '天雷', icon: '☄', color: '#aa3a6a',
        damage: 550, radius: 2.6, iron: 10, powder: 28, armTime: 5.0,
        desc: '无视装甲, 眩晕, 偏火药',
        special: 'sky', stunTime: 2.5, sweepImmune: true,
    },
    ap: {
        name: '穿甲雷', icon: '◆', color: '#4a6aaa',
        damage: 800, radius: 1.1, iron: 26, powder: 6, armTime: 3.5,
        desc: '破重甲, 纯铁',
        special: 'deepPierce', pierceRatio: 1.0,
    },
    magnetic: {
        name: '磁性雷', icon: '⊗', color: '#6a3aaa',
        damage: 380, radius: 1.5, iron: 8, powder: 20, armTime: 3.0,
        desc: '反扫雷车, 偏火药',
        special: 'magnetic', sweepImmune: true, vehicleOnly: true,
    },
};

// ====== 敌人 ======
const ENEMY_TYPES = {
    // 步兵类: 掉落偏火药 (支撑反步兵雷经济)
    infantry: {
        name: '步兵', baseColor: '#6a8a3a', darkColor: '#3a5a1a',
        hp: 80, speed: 0.8, armor: 0, size: 0.35, firstWave: 1,
        dropIron: 4, dropPowder: 8, isVehicle: false,
    },
    cavalry: {
        name: '骑兵', baseColor: '#8a6a3a', darkColor: '#5a4a1a',
        hp: 150, speed: 2.0, armor: 5, size: 0.42, firstWave: 1,
        dropIron: 8, dropPowder: 12, isVehicle: false,
    },
    engineer: {
        name: '工兵', baseColor: '#8a8a3a', darkColor: '#5a5a1a',
        hp: 120, speed: 0.5, armor: 0, size: 0.36, firstWave: 4,
        dropIron: 12, dropPowder: 18, isVehicle: false,
        disarmCharges: 2, disarmTime: 1.5,
    },
    // 车辆类: 掉落偏铁 (支撑反车辆雷经济)
    truck: {
        name: '卡车', baseColor: '#6a6a6a', darkColor: '#3a3a3a',
        hp: 400, speed: 1.2, armor: 15, size: 0.52, firstWave: 7,
        dropIron: 32, dropPowder: 24, isVehicle: true,
        bonusDrop: {iron: 15, powder: 15},
    },
    armored: {
        name: '装甲车', baseColor: '#3a5a3a', darkColor: '#1a3a1a',
        hp: 800, speed: 1.0, armor: 30, size: 0.56, firstWave: 10,
        dropIron: 48, dropPowder: 38, isVehicle: true,
    },
    lightTank: {
        name: '轻型坦克', baseColor: '#5a5a3a', darkColor: '#3a3a1a',
        hp: 1000, speed: 0.7, armor: 40, size: 0.58, firstWave: 13,
        dropIron: 58, dropPowder: 45, isVehicle: true, isTank: true,
    },
    heavyTank: {
        name: '重型坦克', baseColor: '#4a4a4a', darkColor: '#2a2a2a',
        hp: 2500, speed: 0.4, armor: 70, size: 0.68, firstWave: 16,
        dropIron: 85, dropPowder: 65, isVehicle: true, isTank: true,
    },
    sweeper: {
        name: '扫雷车', baseColor: '#5a6a5a', darkColor: '#3a4a3a',
        hp: 600, speed: 0.6, armor: 20, size: 0.55, firstWave: 19,
        dropIron: 42, dropPowder: 30, isVehicle: true,
        sweepRange: 1.5,
    },
};

// ====== 关卡定义 ======
const LEVEL_DEFS = [
    { name:'黄土岭', mapIdx:0,
      enemies:['infantry','cavalry'],
      mines:['trip','dirt'],
      waves:[
        [{t:'infantry',n:3,p:0}],
        [{t:'infantry',n:3,p:0},{t:'cavalry',n:1,p:0}],
        [{t:'infantry',n:4,p:0},{t:'cavalry',n:2,p:0}],
    ]},
    { name:'狼牙山', mapIdx:1,
      enemies:['infantry','cavalry','engineer'],
      mines:['trip','dirt','iron'],
      waves:[
        [{t:'infantry',n:3,p:0},{t:'cavalry',n:1,p:0},{t:'engineer',n:1,p:0}],
        [{t:'infantry',n:4,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:1,p:0}],
        [{t:'infantry',n:5,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:2,p:0}],
    ]},
    { name:'太行山', mapIdx:2,
      enemies:['infantry','cavalry','engineer','truck'],
      mines:['trip','dirt','iron','antitank'],
      waves:[
        [{t:'infantry',n:4,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:1,p:0},{t:'truck',n:1,p:0}],
        [{t:'infantry',n:5,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:1,p:0},{t:'truck',n:1,p:0}],
        [{t:'infantry',n:6,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0}],
    ]},
    { name:'平型关', mapIdx:3,
      enemies:['infantry','cavalry','engineer','truck','armored'],
      mines:['trip','dirt','iron','antitank','chain'],
      waves:[
        [{t:'infantry',n:5,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:1,p:0},{t:'truck',n:1,p:0},{t:'armored',n:1,p:0}],
        [{t:'infantry',n:6,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0},{t:'armored',n:1,p:0}],
        [{t:'infantry',n:7,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0}],
    ]},
    { name:'百团大战', mapIdx:4,
      enemies:['infantry','cavalry','engineer','truck','armored','lightTank'],
      mines:['trip','dirt','iron','antitank','chain','sky'],
      waves:[
        [{t:'infantry',n:6,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:1,p:0},{t:'armored',n:1,p:0},{t:'lightTank',n:1,p:0}],
        [{t:'infantry',n:7,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0},{t:'armored',n:1,p:0},{t:'lightTank',n:1,p:0}],
        [{t:'infantry',n:8,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:2,p:0}],
    ]},
    { name:'铁壁合围', mapIdx:5,
      enemies:['infantry','cavalry','engineer','truck','armored','lightTank','heavyTank'],
      mines:['trip','dirt','iron','antitank','chain','sky','ap'],
      waves:[
        [{t:'infantry',n:7,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0},{t:'armored',n:1,p:0},{t:'lightTank',n:1,p:0},{t:'heavyTank',n:1,p:0}],
        [{t:'infantry',n:8,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:1,p:0},{t:'heavyTank',n:1,p:0}],
        [{t:'infantry',n:9,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:3,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:1,p:0}],
    ]},
    { name:'最终决战', mapIdx:6,
      enemies:['infantry','cavalry','engineer','truck','armored','lightTank','heavyTank','sweeper'],
      mines:['trip','dirt','iron','antitank','chain','sky','ap','magnetic'],
      waves:[
        [{t:'infantry',n:8,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:1,p:0},{t:'heavyTank',n:1,p:0},{t:'sweeper',n:1,p:0}],
        [{t:'infantry',n:9,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:3,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:1,p:0},{t:'sweeper',n:1,p:0}],
        [{t:'infantry',n:10,p:0},{t:'cavalry',n:5,p:0},{t:'engineer',n:4,p:0},{t:'truck',n:3,p:0},{t:'armored',n:3,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:2,p:0},{t:'sweeper',n:2,p:0}],
    ]},
];

// ====== 地图 ======
const VILLAGE_TILES = [[3,13],[4,13],[5,13],[3,14],[4,14],[5,14]];
const HOUSE_POSITIONS = [[3,13.2],[4.5,13],[5,13.5],[3.5,14.2],[5,14]];

const MAPS = [
    {// 0 黄土岭 — 2路
        paths:[
            [[2,0],[1,1],[1,2],[2,3],[2,4],[3,5],[3,6],[3,7],[3,8],[3,9],[4,10],[4,11],[4,12],[4,13]],
            [[6,0],[7,1],[7,2],[6,3],[6,4],[5,5],[5,6],[5,7],[5,8],[5,9],[4,10],[4,11],[4,12],[4,13]],
        ],
        trees:[[0,0],[8,0],[0,5],[8,5],[0,10],[8,10],[0,14],[8,14],[1,15],[7,15]],
    },
    {// 1 狼牙山 — 3路
        paths:[
            [[1,0],[1,1],[2,2],[2,3],[2,4],[3,5],[3,6],[3,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[7,0],[7,1],[6,2],[6,3],[6,4],[5,5],[5,6],[5,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
        ],
        trees:[[0,0],[8,1],[0,5],[8,5],[0,9],[8,9],[0,14],[8,14]],
    },
    {// 2 太行山 — 3路蜿蜒
        paths:[
            [[1,0],[1,1],[2,2],[3,3],[2,4],[2,5],[3,6],[3,7],[3,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[4,0],[4,1],[5,2],[5,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[7,0],[7,1],[6,2],[5,3],[6,4],[6,5],[5,6],[5,7],[5,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
        ],
        trees:[[0,1],[8,0],[0,4],[8,3],[0,8],[8,8],[0,12],[8,11],[1,15],[7,15]],
    },
    {// 3 平型关 — 3路开阔
        paths:[
            [[0,0],[0,1],[1,2],[1,3],[2,4],[2,5],[3,6],[3,7],[3,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[8,0],[8,1],[7,2],[7,3],[6,4],[6,5],[5,6],[5,7],[5,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
        ],
        trees:[[2,0],[6,0],[0,5],[8,4],[0,9],[8,9],[0,14],[8,14],[1,15],[7,15]],
    },
    {// 4 百团大战 — 4路
        paths:[
            [[0,0],[0,1],[1,2],[1,3],[2,4],[2,5],[3,6],[3,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[3,0],[3,1],[3,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[6,0],[6,1],[5,2],[5,3],[5,4],[5,5],[5,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[8,0],[8,1],[7,2],[7,3],[6,4],[6,5],[6,6],[5,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
        ],
        trees:[[2,0],[4,1],[0,4],[8,5],[0,9],[8,9],[0,14],[8,14]],
    },
    {// 5 铁壁合围 — 4路密集
        paths:[
            [[1,0],[1,1],[1,2],[2,3],[2,4],[2,5],[3,6],[3,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[3,0],[3,1],[4,2],[4,3],[3,4],[3,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[7,0],[7,1],[7,2],[6,3],[6,4],[6,5],[6,6],[5,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
        ],
        trees:[[0,0],[8,0],[0,5],[8,5],[0,10],[8,10],[0,14],[8,14]],
    },
    {// 6 最终决战 — 4路复杂
        paths:[
            [[0,0],[1,1],[1,2],[2,3],[1,4],[2,5],[3,6],[3,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[3,0],[3,1],[4,2],[3,3],[3,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[6,0],[5,1],[5,2],[6,3],[5,4],[5,5],[5,6],[5,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
            [[8,0],[7,1],[7,2],[7,3],[6,4],[6,5],[6,6],[6,7],[5,8],[4,9],[4,10],[4,11],[4,12],[4,13]],
        ],
        trees:[[2,0],[4,0],[0,4],[8,3],[0,7],[8,7],[0,11],[8,11],[1,15],[7,15]],
    },
];

// ====== BGM风格 ======
const BGM_STYLES = [
    { notes:[110, 130.81, 146.83, 164.81], bpm:80 },
    { notes:[146.83, 174.61, 196, 220], bpm:88 },
    { notes:[164.81, 196, 220, 246.94], bpm:92 },
    { notes:[130.81, 155.56, 174.61, 196], bpm:96 },
    { notes:[196, 233.08, 261.63, 293.66], bpm:100 },
    { notes:[174.61, 207.65, 233.08, 261.63], bpm:108 },
    { notes:[233.08, 277.18, 311.13, 349.23], bpm:116 },
];

// 从路径构建地图网格
function _buildGrid(mapData) {
    const grid = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < CONFIG.COLS; c++) grid[r][c] = 0;
    }
    for (const path of mapData.paths) {
        path.forEach(([c, r], i) => {
            if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS)
                grid[r][c] = i === 0 ? 5 : 1;
        });
    }
    for (const [c, r] of VILLAGE_TILES) {
        if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS) grid[r][c] = 2;
    }
    for (const [c, r] of mapData.trees) {
        if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS && grid[r][c] === 0) grid[r][c] = 4;
    }
    return grid;
}
for (const map of MAPS) map.grid = _buildGrid(map);
