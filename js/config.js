// ========================================
// 地雷战 - 游戏配置 v3 (关卡制)
// ========================================

const CONFIG = {
    COLS: 18,
    ROWS: 11,
    ENEMY_HP_SCALE: 1.12,
    ENEMY_ARMOR_PER_5: 3,
    RESOURCE_DROP_SCALE: 1.10,
    CAVALRY_DODGE: 0.25,
    ARMORED_AOE_REDUCE: 0.5,
    TANK_MIN_DMG: 60,
    START_IRON: 40,
    START_POWDER: 40,
    HOUSE_COUNT: 5,
    BURN_DAMAGE: {infantry:1, cavalry:1, engineer:1, truck:2, armored:3, lightTank:6, heavyTank:9, sweeper:2},
    HOUSE_HP: 3,
    SPAWN_INTERVAL: 1200,
    WAVES_PER_LEVEL: 3,
};

// ====== 地雷 ======
const MINE_TYPES = {
    trip: {
        name: '绊雷', icon: '⚡', color: '#e8c44a',
        damage: 50, radius: 0.6, iron: 4, powder: 4, armTime: 1.5,
        desc: '反步兵, 附带流血',
        special: 'bleed', bleedDmg: 8, bleedTime: 3, footOnly: true,
    },
    dirt: {
        name: '土雷', icon: '◉', color: '#9a8060',
        damage: 90, radius: 1.0, iron: 6, powder: 6, armTime: 2.2,
        desc: '通用型, 碎片溅射',
        special: 'shrapnel', shrapCount: 3, shrapDmg: 20,
    },
    iron: {
        name: '铁雷', icon: '⬢', color: '#7a8a9a',
        damage: 160, radius: 1.6, iron: 14, powder: 10, armTime: 2.8,
        desc: '高威力, 削减装甲',
        special: 'armorShred', shredAmount: 12, shredTime: 8,
    },
    antitank: {
        name: '反坦克雷', icon: '⊕', color: '#c45a3a',
        damage: 450, radius: 0.7, iron: 22, powder: 14, armTime: 3.5,
        desc: '仅对车辆, 穿甲伤害',
        special: 'pierce', pierceRatio: 0.8, vehicleOnly: true,
    },
    chain: {
        name: '连环雷', icon: '⛓', color: '#c47a2a',
        damage: 110, radius: 1.8, iron: 26, powder: 18, armTime: 4.5,
        desc: '连锁爆炸x3, 大面积',
        special: 'chain', chainCount: 3, chainDelay: 0.3, sweepImmune: true,
    },
    sky: {
        name: '天雷', icon: '☄', color: '#aa3a6a',
        damage: 550, radius: 2.6, iron: 36, powder: 26, armTime: 5.5,
        desc: '无视装甲, 眩晕全场',
        special: 'sky', stunTime: 2.5, sweepImmune: true,
    },
    ap: {
        name: '穿甲雷', icon: '◆', color: '#4a6aaa',
        damage: 800, radius: 1.1, iron: 34, powder: 24, armTime: 4,
        desc: '穿透重甲, 破甲一击',
        special: 'deepPierce', pierceRatio: 1.0,
    },
    magnetic: {
        name: '磁性雷', icon: '⊗', color: '#6a3aaa',
        damage: 350, radius: 1.5, iron: 24, powder: 34, armTime: 3.5,
        desc: '反扫雷, 磁感应引爆',
        special: 'magnetic', sweepImmune: true, vehicleOnly: true,
    },
};

// ====== 敌人 ======
const ENEMY_TYPES = {
    infantry: {
        name: '步兵', baseColor: '#6a8a3a', darkColor: '#3a5a1a',
        hp: 80, speed: 0.8, armor: 0, size: 0.35, firstWave: 1,
        dropIron: 5, dropPowder: 5, isVehicle: false,
    },
    cavalry: {
        name: '骑兵', baseColor: '#8a6a3a', darkColor: '#5a4a1a',
        hp: 150, speed: 2.0, armor: 5, size: 0.42, firstWave: 1,
        dropIron: 10, dropPowder: 9, isVehicle: false,
    },
    engineer: {
        name: '工兵', baseColor: '#8a8a3a', darkColor: '#5a5a1a',
        hp: 120, speed: 0.5, armor: 0, size: 0.36, firstWave: 4,
        dropIron: 15, dropPowder: 15, isVehicle: false,
        disarmCharges: 2, disarmTime: 1.5,
    },
    truck: {
        name: '卡车', baseColor: '#6a6a6a', darkColor: '#3a3a3a',
        hp: 400, speed: 1.2, armor: 15, size: 0.52, firstWave: 7,
        dropIron: 30, dropPowder: 28, isVehicle: true,
        bonusDrop: {iron: 15, powder: 15},
    },
    armored: {
        name: '装甲车', baseColor: '#3a5a3a', darkColor: '#1a3a1a',
        hp: 800, speed: 1.0, armor: 30, size: 0.56, firstWave: 10,
        dropIron: 45, dropPowder: 42, isVehicle: true,
    },
    lightTank: {
        name: '轻型坦克', baseColor: '#5a5a3a', darkColor: '#3a3a1a',
        hp: 1000, speed: 0.7, armor: 40, size: 0.58, firstWave: 13,
        dropIron: 55, dropPowder: 50, isVehicle: true, isTank: true,
    },
    heavyTank: {
        name: '重型坦克', baseColor: '#4a4a4a', darkColor: '#2a2a2a',
        hp: 2500, speed: 0.4, armor: 70, size: 0.68, firstWave: 16,
        dropIron: 80, dropPowder: 75, isVehicle: true, isTank: true,
    },
    sweeper: {
        name: '扫雷车', baseColor: '#5a6a5a', darkColor: '#3a4a3a',
        hp: 600, speed: 0.6, armor: 20, size: 0.55, firstWave: 19,
        dropIron: 40, dropPowder: 35, isVehicle: true,
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
        [{t:'infantry',n:4,p:0},{t:'cavalry',n:1,p:0}],
        [{t:'infantry',n:5,p:0},{t:'cavalry',n:2,p:0}],
    ]},
    { name:'狼牙山', mapIdx:1,
      enemies:['infantry','cavalry','engineer'],
      mines:['trip','dirt','iron'],
      waves:[
        [{t:'infantry',n:4,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:1,p:0}],
        [{t:'infantry',n:5,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:2,p:0}],
        [{t:'infantry',n:6,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0}],
    ]},
    { name:'太行山', mapIdx:2,
      enemies:['infantry','cavalry','engineer','truck'],
      mines:['trip','dirt','iron','antitank'],
      waves:[
        [{t:'infantry',n:5,p:0},{t:'cavalry',n:2,p:0},{t:'engineer',n:1,p:0},{t:'truck',n:1,p:0}],
        [{t:'infantry',n:6,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:1,p:0}],
        [{t:'infantry',n:7,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0}],
    ]},
    { name:'平型关', mapIdx:3,
      enemies:['infantry','cavalry','engineer','truck','armored'],
      mines:['trip','dirt','iron','antitank','chain'],
      waves:[
        [{t:'infantry',n:6,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0},{t:'armored',n:1,p:0}],
        [{t:'infantry',n:7,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0},{t:'armored',n:1,p:0}],
        [{t:'infantry',n:8,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0}],
    ]},
    { name:'百团大战', mapIdx:4,
      enemies:['infantry','cavalry','engineer','truck','armored','lightTank'],
      mines:['trip','dirt','iron','antitank','chain','sky'],
      waves:[
        [{t:'infantry',n:7,p:0},{t:'cavalry',n:3,p:0},{t:'engineer',n:2,p:0},{t:'truck',n:2,p:0},{t:'armored',n:1,p:0},{t:'lightTank',n:1,p:0}],
        [{t:'infantry',n:8,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:1,p:0}],
        [{t:'infantry',n:9,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:2,p:0}],
    ]},
    { name:'铁壁合围', mapIdx:5,
      enemies:['infantry','cavalry','engineer','truck','armored','lightTank','heavyTank'],
      mines:['trip','dirt','iron','antitank','chain','sky','ap'],
      waves:[
        [{t:'infantry',n:8,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:2,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:1,p:0},{t:'heavyTank',n:1,p:0}],
        [{t:'infantry',n:9,p:0},{t:'cavalry',n:4,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:3,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:1,p:0}],
        [{t:'infantry',n:10,p:0},{t:'cavalry',n:5,p:0},{t:'engineer',n:4,p:0},{t:'truck',n:3,p:0},{t:'armored',n:3,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:1,p:0}],
    ]},
    { name:'最终决战', mapIdx:6,
      enemies:['infantry','cavalry','engineer','truck','armored','lightTank','heavyTank','sweeper'],
      mines:['trip','dirt','iron','antitank','chain','sky','ap','magnetic'],
      waves:[
        [{t:'infantry',n:9,p:0},{t:'cavalry',n:5,p:0},{t:'engineer',n:3,p:0},{t:'truck',n:3,p:0},{t:'armored',n:2,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:1,p:0},{t:'sweeper',n:1,p:0}],
        [{t:'infantry',n:10,p:0},{t:'cavalry',n:5,p:0},{t:'engineer',n:4,p:0},{t:'truck',n:3,p:0},{t:'armored',n:3,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:1,p:0},{t:'sweeper',n:2,p:0}],
        [{t:'infantry',n:12,p:0},{t:'cavalry',n:6,p:0},{t:'engineer',n:5,p:0},{t:'truck',n:3,p:0},{t:'armored',n:3,p:0},{t:'lightTank',n:2,p:0},{t:'heavyTank',n:2,p:0},{t:'sweeper',n:2,p:0}],
    ]},
];

// ====== 地图 ======
const VILLAGE_TILES = [[15,5],[16,5],[17,5],[15,6],[16,6],[17,6]];
const HOUSE_POSITIONS = [[15,5],[16.5,5],[17,5.8],[15.5,6.2],[17,6.3]];

const MAPS = [
    {// 0 黄土岭 — 2路
        paths:[
            [[0,3],[1,3],[2,3],[3,3],[4,4],[5,4],[6,4],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,7],[1,7],[2,7],[3,7],[4,6],[5,6],[6,6],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
        ],
        trees:[[0,0],[4,0],[6,0],[15,0],[0,1],[11,1],[7,2],[12,3],[1,5],[4,5],[11,8],[0,9],[4,9],[8,9],[14,9],[0,10],[6,10],[9,10],[12,10],[17,10]],
    },
    {// 1 狼牙山 — 3路
        paths:[
            [[0,5],[1,5],[2,5],[3,5],[4,5],[5,6],[6,6],[7,6],[8,6],[9,6],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,9],[1,9],[2,9],[3,8],[4,8],[5,8],[6,7],[7,7],[8,7],[9,6],[10,6],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,1],[1,1],[2,1],[3,1],[4,2],[5,2],[6,3],[7,3],[8,3],[9,4],[10,4],[11,4],[12,5],[13,5],[14,5],[15,5]],
        ],
        trees:[[0,0],[4,0],[11,0],[16,0],[9,2],[13,3],[1,7],[11,8],[3,10],[6,10],[9,10],[12,10],[15,9],[17,10]],
    },
    {// 2 太行山 — 3路蜿蜒
        paths:[
            [[0,1],[1,1],[2,2],[3,2],[4,3],[5,3],[6,2],[7,2],[8,3],[9,4],[10,4],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,5],[1,5],[2,5],[3,6],[4,6],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,9],[1,9],[2,8],[3,8],[4,7],[5,7],[6,8],[7,8],[8,7],[9,6],[10,6],[11,5],[12,5],[13,5],[14,5],[15,5]],
        ],
        trees:[[4,0],[8,0],[14,0],[17,0],[10,1],[0,3],[7,4],[13,3],[0,7],[3,10],[7,10],[11,10],[16,10],[14,8]],
    },
    {// 3 平型关 — 3路开阔
        paths:[
            [[0,1],[1,1],[2,1],[3,2],[4,2],[5,2],[6,3],[7,3],[8,4],[9,4],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,9],[1,9],[2,9],[3,8],[4,8],[5,8],[6,7],[7,7],[8,6],[9,6],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
        ],
        trees:[[5,0],[10,0],[16,0],[0,3],[8,2],[13,2],[1,7],[5,10],[9,10],[14,10],[17,10],[12,8],[15,7]],
    },
    {// 4 百团大战 — 4路
        paths:[
            [[0,0],[1,0],[2,1],[3,1],[4,2],[5,2],[6,3],[7,3],[8,4],[9,4],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,3],[1,3],[2,4],[3,4],[4,4],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,7],[1,7],[2,6],[3,6],[4,6],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,10],[1,10],[2,9],[3,9],[4,8],[5,8],[6,7],[7,7],[8,6],[9,6],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
        ],
        trees:[[4,0],[8,1],[14,0],[17,1],[6,4],[13,3],[0,5],[8,8],[3,10],[7,10],[12,10],[16,10]],
    },
    {// 5 铁壁合围 — 4路密集
        paths:[
            [[0,1],[1,1],[2,1],[3,2],[4,2],[5,3],[6,3],[7,4],[8,4],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,4],[1,4],[2,3],[3,3],[4,4],[5,4],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,6],[1,6],[2,7],[3,7],[4,6],[5,6],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,9],[1,9],[2,9],[3,8],[4,8],[5,7],[6,7],[7,6],[8,6],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
        ],
        trees:[[3,0],[7,0],[12,0],[17,0],[0,2],[10,2],[14,3],[0,7],[3,10],[8,10],[13,10],[17,10]],
    },
    {// 6 最终决战 — 4路复杂
        paths:[
            [[0,0],[1,0],[2,1],[3,1],[4,1],[5,2],[6,2],[7,3],[8,4],[9,4],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,3],[1,3],[2,3],[3,4],[4,5],[5,5],[6,4],[7,4],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,7],[1,7],[2,7],[3,6],[4,5],[5,6],[6,6],[7,6],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
            [[0,10],[1,10],[2,9],[3,9],[4,9],[5,8],[6,8],[7,7],[8,6],[9,6],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5]],
        ],
        trees:[[5,0],[9,0],[15,0],[0,2],[8,2],[12,1],[0,5],[3,5],[11,7],[0,8],[6,10],[10,10],[15,10],[17,10]],
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
