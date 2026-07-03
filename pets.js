// ============ FitBuddy 精灵宠物系统 ============
// 包含 PET_SPECIES 数据 / SVG渲染 / 野外遭遇 / 战斗系统
// 依赖 planner-core.js

// ============ 🐉 健身精灵宠物系统（5物种 + 1隐藏） ============
var PET_MOODS = ['😊 元气满满','🙂 状态不错','😐 有点无聊','😢 好想训练','😭 快要饿死了…'];

var PET_SPECIES = {
  fireDragon: {
    id:'fireDragon', name:'🔥 火焰龙', rarity:'普通', rarityWeight:40,
    speciesEmoji:'🐉', element:'fire',
    theme: { bg:'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)', border:'#FED7AA', nameColor:'#C2410C',
      stageBg:'rgba(251,191,36,0.25)', stageColor:'#A16207', evoBarBg:'#FED7AA', evoFill:'linear-gradient(90deg, #F97316, #EF4444)',
      darkBg:'linear-gradient(135deg, #2D1A0C 0%, #3D2010 50%, #2D1A0C 100%)', darkBorder:'#5C3A1A', darkNameColor:'#FB923C',
      darkStageBg:'rgba(251,191,36,0.15)', darkStageColor:'#FBBF24', darkEvoBarBg:'#5C3A1A', rarityBadgeBg:'#FED7AA', rarityBadgeColor:'#92400E',
      darkRarityBadgeBg:'#78350F', darkRarityBadgeColor:'#FBBF24' },
    stages:[
      {emoji:'🥚', name:'龙蛋', need:0,  glow:'', desc:'一枚温热的龙蛋，等待你的汗水孵化…'},
      {emoji:'🦎', name:'小火龙', need:3,  glow:'drop-shadow(0 0 12px #FCD34D)', desc:'破壳了！一只小火蜥蜴，尾巴闪着微弱火光~'},
      {emoji:'🦎', name:'炎蜥', need:10, glow:'drop-shadow(0 0 14px #FB923C)', desc:'火焰蔓延全身！炎蜥越来越强了！'},
      {emoji:'🐲', name:'火翼龙', need:25, glow:'drop-shadow(0 0 18px #F97316)', desc:'翅膀展开！炽热的火翼龙翱翔天际！'},
      {emoji:'🐉', name:'焔龙王', need:50, glow:'drop-shadow(0 0 22px #EF4444)', desc:'传说级！双角烈焰，焔龙王降临！'}
    ],
    msgs:{ fresh:['吼~今天火力全开！🔥','再练一组我就能喷火了！','烈焰般的训练激情！','燃起来了！💪'], rested:['火焰需要燃料…明天继续？','记得补充蛋白质！🍗','休息是为了更旺的火'], lazy:['火要灭了…快训练！😢','再不动我就要变成煤渣了！'], starving:['火焰熄灭了！救火！😭','我的龙息呢！快动起来！🔥'] }
  },
  frostWolf: {
    id:'frostWolf', name:'❄️ 冰霜狼', rarity:'普通', rarityWeight:30,
    speciesEmoji:'🐺', element:'ice',
    theme: { bg:'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)', border:'#BAE6FD', nameColor:'#0369A1',
      stageBg:'rgba(14,165,233,0.2)', stageColor:'#0369A1', evoBarBg:'#BAE6FD', evoFill:'linear-gradient(90deg, #0EA5E9, #0284C7)',
      darkBg:'linear-gradient(135deg, #0C2233 0%, #0F2B40 50%, #0C2233 100%)', darkBorder:'#1A4A6B', darkNameColor:'#38BDF8',
      darkStageBg:'rgba(14,165,233,0.12)', darkStageColor:'#7DD3FC', darkEvoBarBg:'#1A4A6B', rarityBadgeBg:'#BAE6FD', rarityBadgeColor:'#0369A1',
      darkRarityBadgeBg:'#1A4A6B', darkRarityBadgeColor:'#7DD3FC' },
    stages:[
      {emoji:'🥚', name:'冰卵', need:0,  glow:'', desc:'一颗散发寒气的冰卵…'},
      {emoji:'🐾', name:'雪崽', need:3,  glow:'drop-shadow(0 0 12px #7DD3FC)', desc:'小爪子踏上冰原！冰晶耳尖闪烁~'},
      {emoji:'🦊', name:'霜狐', need:10, glow:'drop-shadow(0 0 14px #38BDF8)', desc:'敏捷如冰上之狐！霜尾划过雪地！'},
      {emoji:'🐺', name:'寒狼', need:25, glow:'drop-shadow(0 0 18px #0EA5E9)', desc:'狼群之首！冰霜獠牙，极地霸主！'},
      {emoji:'🐺', name:'极冰狼王', need:50, glow:'drop-shadow(0 0 22px #0284C7)', desc:'传说级！冰晶铠甲，极冰狼王统御寒原！'}
    ],
    msgs:{ fresh:['嗷呜~今天帅呆了！❄️','冰原上最靓的仔！','冷酷又强大~','狼群之王就是我！🐺'], rested:['休息一天恢复能量~','别让冰融化…'], lazy:['冰在融化…快回来！😢','狼群在等你'], starving:['我要变回冰渣了！😭','极寒之力在消散！'] }
  },
  thunderTiger: {
    id:'thunderTiger', name:'⚡ 雷霆虎', rarity:'稀有', rarityWeight:20,
    speciesEmoji:'🐯', element:'thunder',
    theme: { bg:'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)', border:'#FDE68A', nameColor:'#A16207',
      stageBg:'rgba(250,204,21,0.25)', stageColor:'#A16207', evoBarBg:'#FDE68A', evoFill:'linear-gradient(90deg, #EAB308, #CA8A04)',
      darkBg:'linear-gradient(135deg, #2D2000 0%, #3D2A00 50%, #2D2000 100%)', darkBorder:'#5C4200', darkNameColor:'#FACC15',
      darkStageBg:'rgba(250,204,21,0.12)', darkStageColor:'#FDE68A', darkEvoBarBg:'#5C4200', rarityBadgeBg:'#FDE68A', rarityBadgeColor:'#854D0E',
      darkRarityBadgeBg:'#713F12', darkRarityBadgeColor:'#FACC15' },
    stages:[
      {emoji:'🥚', name:'雷卵', need:0,  glow:'', desc:'蛋壳上有微弱电光…'},
      {emoji:'🐱', name:'电崽', need:3,  glow:'drop-shadow(0 0 12px #FDE68A)', desc:'小电猫！脸颊闪着电火花~'},
      {emoji:'🐈', name:'霆猫', need:10, glow:'drop-shadow(0 0 14px #EAB308)', desc:'闪电纹路浮现！霆猫速度如雷！'},
      {emoji:'🐯', name:'霆虎', need:25, glow:'drop-shadow(0 0 18px #CA8A04)', desc:'雷霆虎啸！电光条纹，百兽之王！'},
      {emoji:'🐯', name:'雷神虎', need:50, glow:'drop-shadow(0 0 22px #A16207)', desc:'传说级！雷电鬃毛，雷神虎降世！'}
    ],
    msgs:{ fresh:['炸裂！⚡','电力全开的一天！','我的雷电能劈开杠铃！','霹雳无敌！🐯'], rested:['电量恢复中…⚡','蓄力中…'], lazy:['电压过低…快充电！😢','电能快耗尽了'], starving:['完全没电了！😭','雷霆之力消失了！'] }
  },
  jadeDeer: {
    id:'jadeDeer', name:'🌿 翡翠鹿', rarity:'史诗', rarityWeight:10,
    speciesEmoji:'🦌', element:'nature',
    theme: { bg:'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)', border:'#BBF7D0', nameColor:'#15803D',
      stageBg:'rgba(34,197,94,0.2)', stageColor:'#15803D', evoBarBg:'#BBF7D0', evoFill:'linear-gradient(90deg, #22C55E, #16A34A)',
      darkBg:'linear-gradient(135deg, #0C2A14 0%, #0F3319 50%, #0C2A14 100%)', darkBorder:'#1A5C2F', darkNameColor:'#4ADE80',
      darkStageBg:'rgba(34,197,94,0.12)', darkStageColor:'#86EFAC', darkEvoBarBg:'#1A5C2F', rarityBadgeBg:'#BBF7D0', rarityBadgeColor:'#15803D',
      darkRarityBadgeBg:'#1A5C2F', darkRarityBadgeColor:'#86EFAC' },
    stages:[
      {emoji:'🥚', name:'翠卵', need:0,  glow:'', desc:'一颗散发草木清香的蛋…'},
      {emoji:'🌱', name:'苗鹿', need:3,  glow:'drop-shadow(0 0 12px #86EFAC)', desc:'嫩芽角初生！小苗鹿在林间奔跑~'},
      {emoji:'🦌', name:'翠鹿', need:10, glow:'drop-shadow(0 0 14px #4ADE80)', desc:'藤蔓角伸展！翠鹿在森林中矫健穿行！'},
      {emoji:'🦌', name:'翡鹿', need:25, glow:'drop-shadow(0 0 18px #22C55E)', desc:'花冠角盛开！翡鹿身姿优雅而强大！'},
      {emoji:'🦌', name:'古鹿王', need:50, glow:'drop-shadow(0 0 22px #15803D)', desc:'传说级！古木之角，生命之力无穷！'}
    ],
    msgs:{ fresh:['生机勃勃的一天！🌿','森林之力在流淌~','优雅地变强！','这就是自然的力量！🦌'], rested:['静待花开…🌱','大地在为我蓄能'], lazy:['森林在枯萎…😢','我的叶子要黄了！'], starving:['要变成枯木了！😭','救救这片森林！'] }
  },
  phantomUnicorn: {
    id:'phantomUnicorn', name:'🌈 幻光独角兽', rarity:'隐藏', rarityWeight:0,
    speciesEmoji:'🦄', unlockChance:2, element:'light',
    theme: { bg:'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 50%, #FBCFE8 100%)', border:'#F9A8D4', nameColor:'#9D174D',
      stageBg:'rgba(244,114,182,0.2)', stageColor:'#9D174D', evoBarBg:'#FBCFE8', evoFill:'linear-gradient(90deg, #EC4899, #DB2777, #7C3AED)',
      darkBg:'linear-gradient(135deg, #2D0A24 0%, #3D0E32 50%, #2D0A24 100%)', darkBorder:'#5C1A4A', darkNameColor:'#F472B6',
      darkStageBg:'rgba(244,114,182,0.12)', darkStageColor:'#F9A8D4', darkEvoBarBg:'#5C1A4A', rarityBadgeBg:'#FBCFE8', rarityBadgeColor:'#9D174D',
      darkRarityBadgeBg:'#831843', darkRarityBadgeColor:'#F9A8D4' },
    stages:[
      {emoji:'🥚', name:'光之卵', need:0,  glow:'', desc:'一颗散发七彩微光的蛋…'},
      {emoji:'⭐', name:'星驹', need:3,  glow:'drop-shadow(0 0 14px #F9A8D4)', desc:'星辰坠落，化作一只闪亮小精灵！'},
      {emoji:'🦄', name:'幻驹', need:10, glow:'drop-shadow(0 0 16px #F472B6)', desc:'彩虹鬃毛初现！幻驹翩翩而行~'},
      {emoji:'🦄', name:'彩角兽', need:25, glow:'drop-shadow(0 0 20px #EC4899)', desc:'圣角闪耀！彩虹环绕的彩角兽！'},
      {emoji:'🦄', name:'圣角兽', need:50, glow:'drop-shadow(0 0 26px #DB2777)', desc:'传说终极！圣光之角，万物之灵！'}
    ],
    msgs:{ fresh:['圣光与你同在 ✨','梦幻般的一天！','你是被选中的那个人！🦄','传说正在书写中~'], rested:['星光在恢复…✨','等待下一场奇迹'], lazy:['光芒在变暗…快回来！😢','彩虹要褪色了…'], starving:['圣光即将熄灭！😭','独角兽之角在哭泣…'] }
  },
  // ============ 野外专属精灵（仅能通过野外捕捉，不可训练/进化） ============
  abyssalJellyfish: {
    id:'abyssalJellyfish', name:'🌊 深渊水母', rarity:'稀有', rarityWeight:0, wildOnly:true,
    speciesEmoji:'🪼', element:'water',
    theme: { bg:'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 50%, #A5F3FC 100%)', border:'#67E8F9', nameColor:'#0E7490',
      stageBg:'rgba(6,182,212,0.2)', stageColor:'#0E7490', evoBarBg:'#A5F3FC', evoFill:'linear-gradient(90deg, #06B6D4, #0891B2)',
      darkBg:'linear-gradient(135deg, #0A1A24 0%, #0D2430 50%, #0A1A24 100%)', darkBorder:'#164E63', darkNameColor:'#22D3EE',
      darkStageBg:'rgba(6,182,212,0.12)', darkStageColor:'#67E8F9', darkEvoBarBg:'#164E63', rarityBadgeBg:'#A5F3FC', rarityBadgeColor:'#0E7490',
      darkRarityBadgeBg:'#164E63', darkRarityBadgeColor:'#67E8F9' },
    stages:[
      {emoji:'🥚', name:'水卵', need:0,  glow:'', desc:'一颗散发幽蓝光泽的卵，悬浮在深海中…'},
      {emoji:'💧', name:'水泡', need:3,  glow:'drop-shadow(0 0 12px #67E8F9)', desc:'水泡破开，小小生命诞生！'},
      {emoji:'🪼', name:'幼体', need:10, glow:'drop-shadow(0 0 14px #22D3EE)', desc:'在深海中自由漂流…'},
      {emoji:'🪼', name:'潮汐使', need:25, glow:'drop-shadow(0 0 18px #06B6D4)', desc:'掌控潮汐之力！'},
      {emoji:'🪼', name:'深渊之主', need:50, glow:'drop-shadow(0 0 22px #0891B2)', desc:'深海传说！亿万年的深渊霸主！'}
    ],
    msgs:{ fresh:['深海之力在涌动！🌊','今天状态如潮汐般澎湃！','水流是我的力量！','深不可测！🪼'], rested:['潮汐退去…等待下一波','静水深流…'], lazy:['水流快干涸了！😢','深渊在呼唤…'], starving:['搁浅了！快救我！😭','水分在蒸发了…'] }
  },
  rockTurtle: {
    id:'rockTurtle', name:'⛰️ 岩甲龟', rarity:'史诗', rarityWeight:0, wildOnly:true,
    speciesEmoji:'🐢', element:'rock',
    theme: { bg:'linear-gradient(135deg, #FEF7ED 0%, #FEF3C7 50%, #FDE68A 100%)', border:'#D6D3D1', nameColor:'#57534E',
      stageBg:'rgba(168,162,158,0.2)', stageColor:'#57534E', evoBarBg:'#D6D3D1', evoFill:'linear-gradient(90deg, #A8A29E, #78716C)',
      darkBg:'linear-gradient(135deg, #1C1917 0%, #292524 50%, #1C1917 100%)', darkBorder:'#57534E', darkNameColor:'#D6D3D1',
      darkStageBg:'rgba(168,162,158,0.12)', darkStageColor:'#D6D3D1', darkEvoBarBg:'#57534E', rarityBadgeBg:'#E7E5E4', rarityBadgeColor:'#57534E',
      darkRarityBadgeBg:'#44403C', darkRarityBadgeColor:'#D6D3D1' },
    stages:[
      {emoji:'🥚', name:'石卵', need:0,  glow:'', desc:'一枚坚如磐石的古蛋，表面布满岩纹…'},
      {emoji:'🪨', name:'小石', need:3,  glow:'drop-shadow(0 0 12px #A8A29E)', desc:'石头裂开，探出一个小脑袋！'},
      {emoji:'🐚', name:'岩仔', need:10, glow:'drop-shadow(0 0 14px #78716C)', desc:'背着岩石壳四处探险！'},
      {emoji:'🐢', name:'巨岩龟', need:25, glow:'drop-shadow(0 0 18px #57534E)', desc:'如山岳般不可撼动！'},
      {emoji:'🐢', name:'山脉古龟', need:50, glow:'drop-shadow(0 0 22px #44403C)', desc:'行走的山脉！地壳都得为它让路！'}
    ],
    msgs:{ fresh:['坚如磐石的一天！⛰️','山崩地裂的力量！','比我硬的不多~','不动如山！🐢'], rested:['岩石需要时间沉淀…','蓄势待发…'], lazy:['岩石在风化…😢','再不动就要变成沙了！'], starving:['山要塌了！😭','我的岩甲在碎裂…'] }
  },
  shadowBat: {
    id:'shadowBat', name:'🦇 暗影蝠', rarity:'稀有', rarityWeight:0, wildOnly:true,
    speciesEmoji:'🦇', element:'dark',
    theme: { bg:'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #E9D5FF 100%)', border:'#C4B5FD', nameColor:'#6D28D9',
      stageBg:'rgba(139,92,246,0.2)', stageColor:'#6D28D9', evoBarBg:'#E9D5FF', evoFill:'linear-gradient(90deg, #8B5CF6, #7C3AED)',
      darkBg:'linear-gradient(135deg, #1A0A2E 0%, #220F3D 50%, #1A0A2E 100%)', darkBorder:'#4C1D95', darkNameColor:'#A78BFA',
      darkStageBg:'rgba(139,92,246,0.12)', darkStageColor:'#C4B5FD', darkEvoBarBg:'#4C1D95', rarityBadgeBg:'#E9D5FF', rarityBadgeColor:'#6D28D9',
      darkRarityBadgeBg:'#4C1D95', darkRarityBadgeColor:'#C4B5FD' },
    stages:[
      {emoji:'🥚', name:'暗卵', need:0,  glow:'', desc:'一颗被黑暗包裹的卵，散发着神秘气息…'},
      {emoji:'🌑', name:'暗影', need:3,  glow:'drop-shadow(0 0 12px #A78BFA)', desc:'一缕暗影从卵中飘出！'},
      {emoji:'🦇', name:'暗蝠', need:10, glow:'drop-shadow(0 0 14px #8B5CF6)', desc:'在夜色中无声穿行…'},
      {emoji:'👻', name:'夜魔', need:25, glow:'drop-shadow(0 0 18px #7C3AED)', desc:'暗夜中的猎手，无人能察觉！'},
      {emoji:'🦇', name:'暗夜之王', need:50, glow:'drop-shadow(0 0 22px #5B21B6)', desc:'黑暗王座的主人！连光明都畏惧三分！'}
    ],
    msgs:{ fresh:['暗夜中我最闪耀！🦇','黑暗是我的力量源泉！','谁说我不能变强？','暗影的力量！👻'], rested:['在黑暗中蓄力…','月光下休憩…'], lazy:['黑暗在消散…😢','影子越来越淡了…'], starving:['快要消失了！😭','暗影在哭泣…'] }
  }
};

// ===== 宝可梦风格精灵SVG肖像渲染系统 =====

function getCreaturePalette(speciesId, isDark) {
  var palettes = {
    fireDragon:      { body:'#F97316', bodyLight:'#FCD34D', glow:'#FCD34D', pupil:'#1a1a2e', feature:'#EF4444', featureLight:'#FCD34D', accent:'#DC2626', cheek:'#FCD34D' },
    frostWolf:       { body:'#38BDF8', bodyLight:'#BAE6FD', glow:'#7DD3FC', pupil:'#0C4A6E', feature:'#0EA5E9', featureLight:'#E0F2FE', accent:'#0284C7', cheek:'#BAE6FD' },
    thunderTiger:    { body:'#FACC15', bodyLight:'#FEF3C7', glow:'#FDE68A', pupil:'#1a1a2e', feature:'#EAB308', featureLight:'#FDE68A', accent:'#CA8A04', cheek:'#EF4444' },
    jadeDeer:        { body:'#4ADE80', bodyLight:'#BBF7D0', glow:'#86EFAC', pupil:'#14532D', feature:'#22C55E', featureLight:'#DCFCE7', accent:'#16A34A', cheek:'#BBF7D0' },
    phantomUnicorn:  { body:'#F472B6', bodyLight:'#FBCFE8', glow:'#F9A8D4', pupil:'#4A044E', feature:'#EC4899', featureLight:'#FBCFE8', accent:'#DB2777', cheek:'#FBCFE8' },
    abyssalJellyfish:{ body:'#22D3EE', bodyLight:'#A5F3FC', glow:'#67E8F9', pupil:'#0E7490', feature:'#06B6D4', featureLight:'#CFFAFE', accent:'#0891B2', cheek:'#A5F3FC' },
    rockTurtle:      { body:'#A8A29E', bodyLight:'#E7E5E4', glow:'#D6D3D1', pupil:'#1C1917', feature:'#78716C', featureLight:'#F5F5F4', accent:'#57534E', cheek:'#D6D3D1' },
    shadowBat:       { body:'#8B5CF6', bodyLight:'#DDD6FE', glow:'#C4B5FD', pupil:'#1a1a2e', feature:'#7C3AED', featureLight:'#E9D5FF', accent:'#6D28D9', cheek:'#DDD6FE' }
  };
  var p = palettes[speciesId] || palettes.fireDragon;
  if (isDark) return { body:p.body, bodyLight:p.bodyLight, glow:p.glow, pupil:'#E5E7EB', feature:p.feature, featureLight:p.featureLight, accent:p.accent, cheek:p.cheek };
  return p;
}

function renderCreatureSVG(speciesId, stage, displaySize) {
  if (stage === 0) {
    var sz = Math.min(displaySize, 72);
    return '<span class="pet-creature" style="font-size:'+sz+'px;display:block;line-height:1;text-align:center;animation:petFloat 3s ease-in-out infinite;">🥚</span>';
  }
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var s = stage;
  var palette = getCreaturePalette(speciesId, isDark);
  var sc = 0.6 + s * 0.15;
  var cx = 100, cy, baseRx, baseRy;
  switch(speciesId) {
    case 'fireDragon':       baseRx=38; baseRy=33; cy=108; break;
    case 'frostWolf':        baseRx=36; baseRy=28; cy=108; break;
    case 'thunderTiger':     baseRx=34; baseRy=30; cy=106; break;
    case 'jadeDeer':         baseRx=28; baseRy=36; cy=104; break;
    case 'phantomUnicorn':   baseRx=30; baseRy=38; cy=100; break;
    case 'abyssalJellyfish': baseRx=34; baseRy=22; cy=85;  break;
    case 'rockTurtle':       baseRx=42; baseRy=26; cy=110; break;
    case 'shadowBat':        baseRx=38; baseRy=28; cy=102; break;
    default: baseRx=35; baseRy=30; cy=108;
  }
  var rx = Math.round(baseRx * sc);
  var ry = Math.round(baseRy * sc);
  var eyeR = Math.max(3, Math.round(8.5 - s * 1.2));
  var pupilR = Math.round(eyeR * 0.55);
  var eyeY = Math.round(cy - ry * 0.18);
  var eyeGap = Math.round(rx * 0.33);
  var svg = '<svg viewBox="0 0 200 200" class="pet-creature-svg" style="width:'+displaySize+'px;height:'+displaySize+'px;">';
  // 光晕（阶段2+）
  if (s >= 2) svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(rx+16+s*6)+'" fill="'+palette.glow+'" opacity="'+(0.06+s*0.03)+'"/>';
  if (s >= 3) svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(rx+28+s*10)+'" fill="'+palette.glow+'" opacity="'+(0.03+s*0.02)+'"/>';
  // 身体
  svg += '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+palette.body+'"/>';
  svg += '<ellipse cx="'+cx+'" cy="'+(cy-ry*0.22)+'" rx="'+Math.round(rx*0.82)+'" ry="'+Math.round(ry*0.38)+'" fill="'+palette.bodyLight+'" opacity="0.3"/>';
  // 眼睛（宝可梦风格：大白眼+瞳孔+高光）
  svg += '<circle cx="'+(cx-eyeGap)+'" cy="'+eyeY+'" r="'+eyeR+'" fill="white"/>';
  svg += '<circle cx="'+(cx-eyeGap)+'" cy="'+eyeY+'" r="'+pupilR+'" fill="'+palette.pupil+'"/>';
  svg += '<circle cx="'+(cx-eyeGap+1.5)+'" cy="'+(eyeY-1.5)+'" r="'+Math.round(pupilR*0.35)+'" fill="white" opacity="0.85"/>';
  svg += '<circle cx="'+(cx+eyeGap)+'" cy="'+eyeY+'" r="'+eyeR+'" fill="white"/>';
  svg += '<circle cx="'+(cx+eyeGap)+'" cy="'+eyeY+'" r="'+pupilR+'" fill="'+palette.pupil+'"/>';
  svg += '<circle cx="'+(cx+eyeGap+1.5)+'" cy="'+(eyeY-1.5)+'" r="'+Math.round(pupilR*0.35)+'" fill="white" opacity="0.85"/>';
  // 嘴巴
  var mouthY = Math.round(eyeY + ry * 0.4);
  if (s <= 2) {
    var smileW = Math.round(rx * 0.2);
    svg += '<path d="M '+((cx-smileW))+' '+mouthY+' Q '+cx+' '+((mouthY+5))+' '+((cx+smileW))+' '+mouthY+'" fill="none" stroke="'+palette.pupil+'" stroke-width="1.5" stroke-linecap="round"/>';
  } else {
    var mouthW = Math.round(rx * 0.25);
    svg += '<line x1="'+(cx-mouthW)+'" y1="'+mouthY+'" x2="'+(cx+mouthW)+'" y2="'+mouthY+'" stroke="'+palette.pupil+'" stroke-width="'+(1.5+s*0.3)+'"/>';
  }
  // 小腿（水母无腿）
  if (speciesId !== 'abyssalJellyfish') {
    var legW = Math.round(rx * 0.16), legH = Math.round(ry * 0.25 + s * 3);
    var legY = cy + ry - 2, legGap = Math.round(rx * 0.4);
    svg += '<rect x="'+(cx-legGap-legW/2)+'" y="'+legY+'" width="'+legW+'" height="'+legH+'" rx="'+Math.round(legW*0.4)+'" fill="'+palette.body+'"/>';
    svg += '<rect x="'+(cx+legGap-legW/2)+'" y="'+legY+'" width="'+legW+'" height="'+legH+'" rx="'+Math.round(legW*0.4)+'" fill="'+palette.body+'"/>';
  }
  // 物种专属特征
  svg += drawSpeciesFeaturesSVG(speciesId, s, cx, cy, rx, ry, palette, eyeY, eyeGap);
  svg += '</svg>';
  return svg;
}

function drawSpeciesFeaturesSVG(speciesId, s, cx, cy, rx, ry, palette, eyeY, eyeGap) {
  var svg = '';
  switch(speciesId) {
    case 'fireDragon':
      var fH=8+s*5, fW=5+s*2.5, fBase=cy-ry-2;
      svg += '<ellipse cx="'+cx+'" cy="'+(fBase-fH*0.3)+'" rx="'+(fW*0.65)+'" ry="'+(fH*0.45)+'" fill="'+palette.featureLight+'" opacity="0.9"/>';
      svg += '<ellipse cx="'+cx+'" cy="'+(fBase-fH*0.7)+'" rx="'+(fW*0.45)+'" ry="'+(fH*0.3)+'" fill="'+palette.feature+'" opacity="0.85"/>';
      svg += '<ellipse cx="'+cx+'" cy="'+(fBase-fH)+'" rx="'+(fW*0.25)+'" ry="'+(fH*0.18)+'" fill="'+palette.accent+'" opacity="0.7"/>';
      if (s>=2) {
        var tL=12+s*7, tY=Math.round(cy+ry*0.2);
        svg += '<path d="M '+((cx+rx))+' '+tY+' Q '+((cx+rx+tL*0.5))+' '+((tY+tL*0.25))+' '+((cx+rx+tL))+' '+((tY-4))+'" fill="none" stroke="'+palette.body+'" stroke-width="'+(3+s)+'" stroke-linecap="round"/>';
        svg += '<circle cx="'+((cx+rx+tL))+'" cy="'+((tY-7))+'" r="'+(2.5+s)+'" fill="'+palette.feature+'" opacity="0.85"/>';
        svg += '<circle cx="'+((cx+rx+tL))+'" cy="'+((tY-11))+'" r="'+(1.5+s*0.7)+'" fill="'+palette.featureLight+'" opacity="0.7"/>';
      }
      if (s>=3) {
        var wS=16+s*8, wH=16+s*6;
        svg += '<path d="M '+((cx-rx))+' '+((cy-ry*0.2))+' L '+((cx-rx-wS))+' '+((cy-wH))+' L '+((cx-rx-wS*0.5))+' '+((cy-wH*0.4))+' Z" fill="'+palette.body+'" opacity="0.8"/>';
        svg += '<path d="M '+((cx+rx))+' '+((cy-ry*0.2))+' L '+((cx+rx+wS))+' '+((cy-wH))+' L '+((cx+rx+wS*0.5))+' '+((cy-wH*0.4))+' Z" fill="'+palette.body+'" opacity="0.8"/>';
      }
      if (s>=4) {
        svg += '<polygon points="'+((cx-10))+','+((cy-ry))+' '+((cx-14))+','+((cy-ry-16))+' '+((cx-6))+','+((cy-ry-3))+'" fill="'+palette.accent+'"/>';
        svg += '<polygon points="'+((cx+10))+','+((cy-ry))+' '+((cx+14))+','+((cy-ry-16))+' '+((cx+6))+','+((cy-ry-3))+'" fill="'+palette.accent+'"/>';
        svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(rx+35)+'" fill="'+palette.featureLight+'" opacity="0.08"/>';
      }
      break;

    case 'frostWolf':
      var eH=10+s*5, eW=5+s*2, eBL=cx-eyeGap-3, eBR=cx+eyeGap+3, eTop=Math.round(eyeY-eyeR-eH);
      svg += '<polygon points="'+eBL+','+((eyeY-eyeR+2))+' '+((eBL-eW))+','+eTop+' '+((eBL+eW))+','+eTop+'" fill="'+palette.body+'" opacity="0.9"/>';
      svg += '<polygon points="'+eBR+','+((eyeY-eyeR+2))+' '+((eBR-eW))+','+eTop+' '+((eBR+eW))+','+eTop+'" fill="'+palette.body+'" opacity="0.9"/>';
      svg += '<circle cx="'+eBL+'" cy="'+eTop+'" r="'+(1.5+s)+'" fill="'+palette.featureLight+'" opacity="0.85"/>';
      svg += '<circle cx="'+eBR+'" cy="'+eTop+'" r="'+(1.5+s)+'" fill="'+palette.featureLight+'" opacity="0.85"/>';
      var tL2=10+s*6;
      svg += '<path d="M '+((cx+rx))+' '+((cy+2))+' Q '+((cx+rx+tL2*0.6))+' '+((cy-tL2*0.3))+' '+((cx+rx+tL2))+' '+((cy-tL2*0.5))+'" fill="none" stroke="'+palette.body+'" stroke-width="'+(3+s)+'" stroke-linecap="round"/>';
      svg += '<circle cx="'+((cx+rx+tL2))+'" cy="'+((cy-tL2*0.5))+'" r="'+(2+s)+'" fill="'+palette.featureLight+'" opacity="0.85"/>';
      if (s>=3) {
        svg += '<circle cx="'+((cx-rx-6))+'" cy="'+((eyeY+6))+'" r="'+(3+s)+'" fill="'+palette.featureLight+'" opacity="'+(0.12+s*0.04)+'"/>';
        svg += '<circle cx="'+((cx-rx-12))+'" cy="'+((eyeY+4))+'" r="'+(2+s)+'" fill="'+palette.featureLight+'" opacity="'+(0.08+s*0.03)+'"/>';
      }
      if (s>=4) {
        for (var i=0;i<3;i++) { var spY=cy-ry+i*8; svg += '<polygon points="'+((cx-4))+','+spY+' '+((cx-8))+','+((spY-6))+' '+cx+','+spY+'" fill="'+palette.feature+'" opacity="0.5"/>'; }
        svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(rx+30)+'" fill="'+palette.featureLight+'" opacity="0.06"/>';
      }
      break;

    case 'thunderTiger':
      svg += '<circle cx="'+((cx-rx*0.6))+'" cy="'+((eyeY+ry*0.15))+'" r="'+(3+s)+'" fill="'+palette.cheek+'" opacity="0.8"/>';
      svg += '<circle cx="'+((cx+rx*0.6))+'" cy="'+((eyeY+ry*0.15))+'" r="'+(3+s)+'" fill="'+palette.cheek+'" opacity="0.8"/>';
      var eH2=8+s*4, eW2=4+s*1.5, eBL2=cx-eyeGap-2, eBR2=cx+eyeGap+2, eTop2=Math.round(eyeY-eyeR-eH2);
      svg += '<polygon points="'+eBL2+','+((eyeY-eyeR+1))+' '+((eBL2-eW2))+','+eTop2+' '+((eBL2+eW2))+','+(eTop2+3)+'" fill="'+palette.body+'" opacity="0.9"/>';
      svg += '<polygon points="'+eBR2+','+((eyeY-eyeR+1))+' '+((eBR2-eW2))+','+eTop2+' '+((eBR2+eW2))+','+(eTop2+3)+'" fill="'+palette.body+'" opacity="0.9"/>';
      if (s>=2) {
        svg += '<path d="M '+((cx+rx+2))+' '+((cy+ry*0.1))+' L '+((cx+rx+10+s*4))+' '+((cy-5-s*3))+' L '+((cx+rx+8+s*3))+' '+((cy+2))+' L '+((cx+rx+16+s*6))+' '+((cy-8-s*4))+'" fill="none" stroke="'+palette.feature+'" stroke-width="'+(2+s)+'" stroke-linecap="round" stroke-linejoin="round"/>';
      }
      if (s>=3) {
        svg += '<path d="M '+((cx-rx*0.3))+' '+((cy-ry*0.5))+' L '+((cx-rx*0.1))+' '+((cy-ry*0.2))+' L '+((cx+rx*0.1))+' '+((cy-ry*0.5))+'" fill="none" stroke="'+palette.feature+'" stroke-width="1.5" opacity="0.6"/>';
      }
      if (s>=4) {
        for (var j=0;j<4;j++) { var lx=cx-12+j*8; svg += '<line x1="'+lx+'" y1="'+((cy-ry-2))+'" x2="'+(lx-3+j*1.5)+'" y2="'+((cy-ry-14-j*2))+'" stroke="'+palette.featureLight+'" stroke-width="2" opacity="0.7"/>'; }
      }
      break;

    case 'jadeDeer':
      var antH=8+s*6, antW=3+s*2, antBaseY=cy-ry-2;
      svg += '<line x1="'+((cx-10))+'" y1="'+antBaseY+'" x2="'+((cx-14))+'" y2="'+(antBaseY-antH)+'" stroke="'+palette.feature+'" stroke-width="'+(2+s*0.5)+'" stroke-linecap="round"/>';
      svg += '<ellipse cx="'+((cx-14))+'" cy="'+(antBaseY-antH-3)+'" rx="'+antW+'" ry="'+(antW*0.6)+'" fill="'+palette.featureLight+'" opacity="0.85"/>';
      svg += '<line x1="'+((cx+10))+'" y1="'+antBaseY+'" x2="'+((cx+14))+'" y2="'+(antBaseY-antH)+'" stroke="'+palette.feature+'" stroke-width="'+(2+s*0.5)+'" stroke-linecap="round"/>';
      svg += '<ellipse cx="'+((cx+14))+'" cy="'+(antBaseY-antH-3)+'" rx="'+antW+'" ry="'+(antW*0.6)+'" fill="'+palette.featureLight+'" opacity="0.85"/>';
      if (s>=3) {
        svg += '<circle cx="'+((cx-14))+'" cy="'+(antBaseY-antH-6)+'" r="'+(2+s)+'" fill="'+palette.accent+'" opacity="0.7"/>';
        svg += '<circle cx="'+((cx+14))+'" cy="'+(antBaseY-antH-6)+'" r="'+(2+s)+'" fill="'+palette.accent+'" opacity="0.7"/>';
        svg += '<circle cx="'+cx+'" cy="'+(antBaseY-antH-8)+'" r="'+(2.5+s)+'" fill="'+palette.accent+'" opacity="0.6"/>';
      }
      if (s>=2) {
        svg += '<ellipse cx="'+((cx-rx*0.5))+'" cy="'+((cy-ry*0.1))+'" rx="3" ry="5" fill="'+palette.featureLight+'" opacity="0.4"/>';
        svg += '<ellipse cx="'+((cx+rx*0.5))+'" cy="'+((cy-ry*0.1))+'" rx="3" ry="5" fill="'+palette.featureLight+'" opacity="0.4"/>';
      }
      break;

    case 'phantomUnicorn':
      if (s>=2) {
        var hornH=6+s*5, hornW=3+s*1, hornBase=cy-ry-2;
        svg += '<polygon points="'+((cx-hornW))+','+hornBase+' '+cx+','+((hornBase-hornH))+' '+((cx+hornW))+','+hornBase+'" fill="'+palette.feature+'" opacity="0.9"/>';
        if (s>=3) svg += '<circle cx="'+cx+'" cy="'+(hornBase-hornH)+'" r="'+(2+s)+'" fill="'+palette.featureLight+'" opacity="0.7"/>';
      }
      var sparkCount = 2+s;
      for (var k=0;k<sparkCount;k++) {
        var sx2=Math.round(cx-15+k*10+Math.sin(k*2)*5), sy2=Math.round(cy-ry-10-k*4);
        svg += '<circle cx="'+sx2+'" cy="'+sy2+'" r="1.5" fill="'+palette.featureLight+'" opacity="'+(0.5+k*0.1)+'"/>';
      }
      if (s>=2) {
        var maneColors = ['#F472B6','#A78BFA','#67E8F9','#FCD34D','#4ADE80'];
        for (var m=0;m<Math.min(s+1,5);m++) {
          svg += '<ellipse cx="'+((cx-rx*0.3+m*6))+'" cy="'+((cy-ry*0.4-m*2))+'" rx="3" ry="6" fill="'+maneColors[m]+'" opacity="0.5"/>';
        }
      }
      break;

    case 'abyssalJellyfish':
      for (var t=0;t<3+s;t++) {
        var tx=cx-10+t*(8+s*2), tStart=cy+ry, tEnd=tStart+10+s*4;
        svg += '<path d="M '+tx+' '+tStart+' Q '+((tx+Math.sin(t)*4))+' '+((tStart+5))+' '+((tx+Math.sin(t)*6))+' '+tEnd+'" fill="none" stroke="'+palette.body+'" stroke-width="2" opacity="0.6"/>';
      }
      if (s>=2) svg += '<circle cx="'+cx+'" cy="'+(cy-ry*0.1)+'" r="'+(4+s*2)+'" fill="'+palette.featureLight+'" opacity="'+(0.3+s*0.1)+'"/>';
      break;

    case 'rockTurtle':
      for (var r=0;r<2+s;r++) {
        var rpx=cx-8+r*(8+s*2), rpy=cy-ry+2;
        svg += '<polygon points="'+rpx+','+rpy+' '+((rpx-3))+','+((rpy-6-s*2))+' '+((rpx+3))+','+((rpy-5-s*1.5))+'" fill="'+palette.feature+'" opacity="0.7"/>';
      }
      if (s>=2) svg += '<ellipse cx="'+cx+'" cy="'+(cy-ry*0.2)+'" rx="'+(rx*0.6)+'" ry="'+(ry*0.35)+'" fill="'+palette.feature+'" opacity="0.3"/>';
      break;

    case 'shadowBat':
      var wingW=18+s*10, wingH=12+s*6;
      svg += '<path d="M '+((cx-rx))+' '+((cy-ry*0.1))+' L '+((cx-rx-wingW))+' '+((cy-wingH*0.5))+' L '+((cx-rx-wingW*0.7))+' '+((cy+wingH*0.3))+' L '+((cx-rx-3))+' '+((cy+ry*0.3))+'" fill="'+palette.body+'" opacity="0.8"/>';
      svg += '<path d="M '+((cx+rx))+' '+((cy-ry*0.1))+' L '+((cx+rx+wingW))+' '+((cy-wingH*0.5))+' L '+((cx+rx+wingW*0.7))+' '+((cy+wingH*0.3))+' L '+((cx+rx+3))+' '+((cy+ry*0.3))+'" fill="'+palette.body+'" opacity="0.8"/>';
      svg += '<polygon points="'+((cx-eyeGap-2))+','+((eyeY-eyeR))+' '+((cx-eyeGap-5))+','+((eyeY-eyeR-8))+' '+((cx-eyeGap+2))+','+((eyeY-eyeR-2))+'" fill="'+palette.body+'" opacity="0.9"/>';
      svg += '<polygon points="'+((cx+eyeGap+2))+','+((eyeY-eyeR))+' '+((cx+eyeGap+5))+','+((eyeY-eyeR-8))+' '+((cx+eyeGap-2))+','+((eyeY-eyeR-2))+'" fill="'+palette.body+'" opacity="0.9"/>';
      if (s>=3) svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(rx+20)+'" fill="'+palette.feature+'" opacity="0.08"/>';
      break;
  }
  return svg;
}

// ============ 按物种独立进度存储 ============
// 数据结构: fitbuddy_pet_data = { fireDragon:{days:5,lastDate:"2026-06-28"}, ... }
function petGetAllData() {
  try { return JSON.parse(localStorage.getItem('fitbuddy_pet_data') || '{}'); } catch(e) { return {}; }
}
function petSaveAllData(data) {
  localStorage.setItem('fitbuddy_pet_data', JSON.stringify(data));
}

// 获取某物种的训练天数
function petGetDays(speciesId) {
  var data = petGetAllData();
  return (data[speciesId] && data[speciesId].days) || 0;
}

// 获取某物种的 lastDate
function petGetLastDate(speciesId) {
  var data = petGetAllData();
  return (data[speciesId] && data[speciesId].lastDate) || null;
}

// 训练完成后给当前精灵+1天（每天每物种至多一次）
function petAddDay() {
  var speciesId = localStorage.getItem('fitbuddy_pet_species');
  if (!speciesId) return;
  var today = getLocalDate();
  var data = petGetAllData();
  if (!data[speciesId]) data[speciesId] = { days: 0, lastDate: null };
  // 今天已经加过了？（使用本地日期，凌晨0-8点也能正常算新的一天）
  if (data[speciesId].lastDate === today) return;
  data[speciesId].days = (data[speciesId].days || 0) + 1;
  data[speciesId].lastDate = today;
  petSaveAllData(data);
}

// 道具加速：给当前精灵+1天（不受每日一次限制）
function petAddBonusDay() {
  var speciesId = localStorage.getItem('fitbuddy_pet_species');
  if (!speciesId) return;
  var data = petGetAllData();
  if (!data[speciesId]) data[speciesId] = { days: 0, lastDate: null };
  var oldDays = data[speciesId].days || 0;
  data[speciesId].days = oldDays + 1;
  petSaveAllData(data);
  return { speciesId: speciesId, oldDays: oldDays, newDays: oldDays + 1 };
}

// 全局训练统计（用于连签、热力图等，仍从共享 history 读取）
function petGetStats() {
  var hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]');
  var totalDays = new Set(hist.map(function(h){ return h.date; })).size;
  var dates = Object.keys(hist.reduce(function(acc,h){ acc[h.date]=true; return acc; },{}));
  dates.sort();
  var streak = 0;
  if (dates.length) {
    var today = new Date(); today.setHours(0,0,0,0);
    var yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    var lastDate = new Date(dates[dates.length-1]+'T00:00:00');
    if (lastDate.getTime() >= yesterday.getTime()) {
      streak = 1;
      for (var i = dates.length-2; i >= 0; i--) {
        var prev = new Date(dates[i]+'T00:00:00');
        var next = new Date(dates[i+1]+'T00:00:00');
        var diff = (next - prev) / 86400000;
        if (diff <= 2) { streak++; } else { break; }
      }
    }
  }
  return { totalDays:totalDays, streak:streak, dates:dates };
}

// 获取/初始化当前精灵物种
function petGetSpecies() {
  var speciesId = localStorage.getItem('fitbuddy_pet_species');
  var unlocked = JSON.parse(localStorage.getItem('fitbuddy_pet_unlocked') || '[]');

  // 全部物种 ID（按稀有度分层）
  var allIds = [];
  for (var k in PET_SPECIES) allIds.push(k);
  // 普通物种（开局解锁）
  var starterIds = ['fireDragon', 'frostWolf'];
  // 需要训练天数解锁的物种
  var rarityUnlockIds = ['thunderTiger', 'jadeDeer'];

  // 初始化：首次使用时只解锁普通物种
  if (unlocked.length === 0) {
    unlocked = starterIds.slice();
    localStorage.setItem('fitbuddy_pet_unlocked', JSON.stringify(unlocked));
  } else {
    // 兼容旧数据：之前可能解锁了全部4个普通物种，保持不变
    var changed = false;
    for (var i = 0; i < starterIds.length; i++) {
      if (unlocked.indexOf(starterIds[i]) < 0) { unlocked.push(starterIds[i]); changed = true; }
    }
    if (changed) localStorage.setItem('fitbuddy_pet_unlocked', JSON.stringify(unlocked));
  }

  // 迁移旧用户：有共享历史但没有独立精灵数据 → 把历史天数转给火焰龙
  var petData = petGetAllData();
  var hasPetData = Object.keys(petData).length > 0;
  if (!hasPetData) {
    var hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]');
    var oldTotalDays = new Set(hist.map(function(h){ return h.date; })).size;
    if (oldTotalDays > 0) {
      var lastDate = hist.reduce(function(a,b){ return a.date>b.date?a:b; }).date;
      petData.fireDragon = { days: oldTotalDays, lastDate: lastDate };
      petSaveAllData(petData);
      if (!speciesId) speciesId = 'fireDragon';
    }
  }

  // 全新用户：首次生成计划时从初始物种随机分配
  if (!speciesId) {
    var pool = [];
    for (var j = 0; j < starterIds.length; j++) {
      var id = starterIds[j];
      var sp = PET_SPECIES[id];
      for (var w = 0; w < sp.rarityWeight; w++) pool.push(id);
    }
    speciesId = pool[Math.floor(Math.random() * pool.length)];
    localStorage.setItem('fitbuddy_pet_species', speciesId);
  }

  return { speciesId:speciesId, unlocked:unlocked };
}

// 隐藏款随机触发检查（每天至多一次，2%概率）
function checkHiddenUnlock() {
  var unlocked = JSON.parse(localStorage.getItem('fitbuddy_pet_unlocked') || '[]');
  if (unlocked.indexOf('phantomUnicorn') >= 0) return false; // 已解锁
  var today = getLocalDate();
  var lastCheck = localStorage.getItem('fitbuddy_hidden_check');
  if (lastCheck === today) return false; // 今天已经检查过
  localStorage.setItem('fitbuddy_hidden_check', today);
  // 2% 概率触发
  if (Math.random() < 0.02) {
    unlocked.push('phantomUnicorn');
    localStorage.setItem('fitbuddy_pet_unlocked', JSON.stringify(unlocked));
    return true;
  }
  return false;
}

// 切换精灵
function petSwitch(speciesId) {
  var info = petGetSpecies();
  if (info.unlocked.indexOf(speciesId) < 0) return;
  localStorage.setItem('fitbuddy_pet_species', speciesId);
  refreshPet();
}

// 获取当前精灵完整数据
function getPetData() {
  var info = petGetSpecies();
  var sp = PET_SPECIES[info.speciesId];
  var totalDays = petGetDays(info.speciesId);

  // 当前精灵的心情（基于该精灵上次训练日期）
  var lastDateStr = petGetLastDate(info.speciesId);
  var daysSince = lastDateStr ? Math.floor((new Date() - new Date(lastDateStr+'T00:00:00')) / 86400000) : 999;

  // 确定进化阶段
  var stage = 0;
  for (var i = sp.stages.length-1; i >= 0; i--) {
    if (totalDays >= sp.stages[i].need) { stage = i; break; }
  }
  var cur = sp.stages[stage];
  var nxt = sp.stages[stage+1] || sp.stages[stage];
  var evoProgress = (nxt.need - cur.need) > 0 ? Math.min(100, Math.round((totalDays - cur.need) / (nxt.need - cur.need) * 100)) : 100;

  var moodIdx = Math.min(4, Math.max(0, daysSince));
  var mood = PET_MOODS[moodIdx];
  var hungry = daysSince >= 3 && totalDays > 0;

  return {
    speciesId: info.speciesId, unlocked: info.unlocked,
    stage:stage, totalDays:totalDays, streak:0,
    emoji:cur.emoji, name:cur.name, desc:cur.desc, glow:cur.glow,
    evoProgress:evoProgress, nxtName:nxt.name, nxtNeed:nxt.need,
    mood:mood, hungry:hungry, daysSince:daysSince, justEvolved:false,
    sp:sp
  };
}

function renderPetCard() {
  var p = getPetData();
  var sp = p.sp;
  // 进化检测
  var petKey = 'fitbuddy_pet_laststage_'+p.speciesId;
  var lastStage = parseInt(localStorage.getItem(petKey) || '0');
  if (p.stage > lastStage) {
    p.justEvolved = true;
    localStorage.setItem(petKey, p.stage);
  }
  // 当前主题（支持深色模式）
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var t = sp.theme;
  var cardBg = isDark ? t.darkBg : t.bg;
  var cardBorder = isDark ? t.darkBorder : t.border;
  var nameColor = isDark ? t.darkNameColor : t.nameColor;
  var stageBg = isDark ? t.darkStageBg : t.stageBg;
  var stageColor = isDark ? t.darkStageColor : t.stageColor;
  var evoBarBg = isDark ? t.darkEvoBarBg : t.evoBarBg;
  var evoFill = t.evoFill;
  var rarityBadgeBg = isDark ? t.darkRarityBadgeBg : t.rarityBadgeBg;
  var rarityBadgeColor = isDark ? t.darkRarityBadgeColor : t.rarityBadgeColor;

  var msg = p.daysSince === 0 ? '今天练过了，' + p.mood : p.daysSince >= 3 ? '我饿了 ' + p.daysSince + ' 天了🥺 快训练吧！' : p.mood;
  var hungryClass = p.hungry ? ' hungry' : '';
  var evoClass = p.justEvolved ? ' evolving' : '';

  // 标题
  var html = '<div style="font-size:13px;font-weight:700;color:var(--primary);margin-top:4px;text-align:center;">🐉 你的健身精灵</div>';

  html += '<div class="pet-card'+hungryClass+evoClass+'" onclick="petInteract(event)" id="petCard"';
  html += ' style="background:'+cardBg+';border-color:'+cardBorder+';">';
  html += renderCreatureSVG(p.speciesId, p.stage, 120);
  html += '<div class="pet-name" style="color:'+nameColor+'">'+p.name;
  html += '<span class="pet-rarity-badge" style="background:'+rarityBadgeBg+';color:'+rarityBadgeColor+'">'+sp.rarity+'</span>';
  html += '</div>';
  html += '<div class="pet-stage" style="background:'+stageBg+';color:'+stageColor+'">Lv.'+(p.stage+1)+' · '+p.totalDays+'天训练</div>';
  html += '<div class="pet-mood" style="color:'+(isDark?'#A8A29E':'#78716C')+'">'+msg+'</div>';
  html += '<div class="pet-evo-bar" style="background:'+evoBarBg+'"><div class="pet-evo-fill" style="width:'+p.evoProgress+'%;background:'+evoFill+'"></div></div>';
  html += '<div style="font-size:10px;color:#A8A29E;margin-top:3px;">→ 下一形态：'+p.nxtName+' ('+p.evoProgress+'%)</div>';
  html += '<div class="pet-tap-hint">👆 点我互动</div>';
  html += '</div>';

  // 精灵切换栏
  html += '<div class="pet-switch-bar">';
  // 所有5个物种（按顺序：普通→稀有→史诗→隐藏）
  var allSpeciesOrder = ['fireDragon', 'frostWolf', 'thunderTiger', 'jadeDeer', 'phantomUnicorn'];
  var hasAnyLocked = false;
  var lockedHints = [];
  for (var si = 0; si < allSpeciesOrder.length; si++) {
    var sid = allSpeciesOrder[si];
    var ssp = PET_SPECIES[sid];
    if (p.unlocked.indexOf(sid) >= 0) {
      var active = sid === p.speciesId ? ' active' : '';
      html += '<div class="pet-switch-dot'+active+'" onclick="petSwitch(\''+sid+'\')" title="'+ssp.name+' ('+ssp.rarity+')">'+ssp.speciesEmoji+'</div>';
    } else {
      hasAnyLocked = true;
      var unlockHint = '';
      if (sid === 'thunderTiger') unlockHint = '累计训练7天解锁';
      else if (sid === 'jadeDeer') unlockHint = '累计训练14天解锁';
      else if (sid === 'phantomUnicorn') unlockHint = '每次训练2%概率·或野外捕捉';
      html += '<div class="pet-switch-dot locked" title="'+ssp.name+' ('+ssp.rarity+') — '+unlockHint+'">🔒</div>';
      lockedHints.push(ssp.speciesEmoji + ' ' + ssp.name + '：' + unlockHint);
    }
  }
  html += '</div>';
  // 未解锁提示
  if (hasAnyLocked) {
    var totalDays = getTotalTrainingDays();
    html += '<div style="text-align:center;font-size:11px;color:#A8A29E;margin-top:6px;opacity:0.8;">';
    html += '🔒 还有精灵在沉睡…累计训练 <b>' + totalDays + '</b> 天';
    html += '<div style="font-size:10px;margin-top:2px;line-height:1.6;">';
    for (var hi = 0; hi < lockedHints.length; hi++) {
      html += lockedHints[hi] + '<br>';
    }
    html += '</div>';
    html += '</div>';
  }
  // ⚔️ 切磋按钮（已孵化才显示，即 stage≥1）
  if (p.stage >= 1) {
    html += '<div style="text-align:center;margin-top:10px;"><button onclick="petShowBattleModal(event)" style="padding:8px 20px;border-radius:20px;background:linear-gradient(90deg,#F97316,#DC2626);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;">⚔️ 精灵切磋</button></div>';
  }
  // 🏟️ 去社区
  html += '<div style="text-align:center;margin-top:8px;"><button onclick="switchTab(document.querySelector(\'[data-tab=page-community]\'))" style="padding:6px 18px;border-radius:16px;background:transparent;color:var(--primary);border:1.5px solid var(--primary);font-size:12px;font-weight:600;cursor:pointer;">🏟️ 去社区大厅</button></div>';

  return html;
}

function petInteract(e) {
  e.stopPropagation();
  var p = getPetData();
  var sp = p.sp;
  var msgs;
  if (p.daysSince === 0) {
    msgs = sp.msgs.fresh;
  } else if (p.daysSince === 1) {
    msgs = sp.msgs.rested;
  } else if (p.daysSince === 2) {
    msgs = sp.msgs.lazy;
  } else {
    msgs = sp.msgs.starving;
  }
  var msg = msgs[Math.floor(Math.random() * msgs.length)];

  // 弹出气泡
  var card = document.getElementById('petCard');
  var bubble = document.createElement('div');
  bubble.style.cssText = 'position:absolute;top:-36px;left:50%;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:6px 14px;border-radius:14px;font-size:13px;white-space:nowrap;z-index:99;animation:petFloat 0.3s ease-out,sparkleUp 2s ease-out 1.2s forwards;pointer-events:none;';
  bubble.textContent = msg;
  card.style.position = 'relative';
  card.appendChild(bubble);
  // 撒星星
  var stars = ['✨','💫','⭐','🌟','💪','🔥'];
  if (p.speciesId === 'frostWolf') stars = ['✨','❄️','💎','🌟','💪','🐺'];
  if (p.speciesId === 'thunderTiger') stars = ['✨','⚡','💛','🌟','💪','🐯'];
  if (p.speciesId === 'jadeDeer') stars = ['✨','🌿','💚','🌟','💪','🦌'];
  if (p.speciesId === 'phantomUnicorn') stars = ['✨','🌈','💖','🦋','💪','🦄'];
  for (var i=0; i<6; i++) {
    var s = document.createElement('span');
    s.className = 'pet-sparkle';
    s.textContent = stars[i];
    s.style.left = (20 + Math.random()*60) + '%';
    s.style.top = (10 + Math.random()*40) + '%';
    s.style.animationDelay = Math.random()*0.3 + 's';
    card.appendChild(s);
    setTimeout(function(){ s.remove(); }, 1600);
  }
  setTimeout(function(){ bubble.remove(); }, 2000);
}

// ============ ⚔️ 精灵切磋战系统 ============
var TYPE_CHART = {
  fire:    { strong:'nature', weak:'ice',      emoji:'🔥', color:'#F97316', label:'火' },
  ice:     { strong:'fire',    weak:'thunder',  emoji:'❄️', color:'#0EA5E9', label:'冰' },
  thunder: { strong:'ice',     weak:'nature',   emoji:'⚡', color:'#EAB308', label:'雷' },
  nature:  { strong:'thunder', weak:'fire',     emoji:'🌿', color:'#22C55E', label:'草' },
  light:   { strong:null,      weak:null,       emoji:'🌈', color:'#EC4899', label:'光' },
  water:   { strong:'fire',    weak:'thunder',  emoji:'🌊', color:'#06B6D4', label:'水' },
  rock:    { strong:'thunder', weak:'nature',   emoji:'⛰️', color:'#A8A29E', label:'岩' },
  dark:    { strong:'nature',  weak:'fire',     emoji:'🦇', color:'#7C3AED', label:'暗' }
};

// 计算精灵战斗力
function petCalcPower(speciesId) {
  var days = petGetDays(speciesId);
  var sp = PET_SPECIES[speciesId];
  var stage = 0;
  for (var i = sp.stages.length-1; i >= 0; i--) { if (days >= sp.stages[i].need) { stage = i; break; } }
  var stageMul = [0.4, 1.0, 1.8, 3.0, 5.0][stage];
  var atk = Math.round((8 + days * 4) * stageMul);
  var hp = Math.round((25 + days * 6) * (1 + stage * 0.5));
  return { atk:atk, hp:hp, stage:stage, days:days, element:sp.element, emoji:sp.stages[stage].emoji, name:sp.name, speciesId:speciesId };
}

// 渲染对战选择弹窗（两种模式：同伴切磋 / 野怪挑战）
function petShowBattleModal(e) {
  if (e) e.stopPropagation();
  var info = petGetSpecies();
  var currentId = info.speciesId;
  var myPower = petCalcPower(currentId);

  // 蛋不能出战（入口已过滤，二次保险）
  if (myPower.stage < 1) return;

  var mySp = PET_SPECIES[currentId];

  // 已孵化的其他精灵（stage≥1）
  var hatchedAllies = info.unlocked.filter(function(id){ return id !== currentId && petGetDays(id) >= 3; });

  // 移除旧弹窗
  var old = document.getElementById('petBattleOverlay');
  if (old) old.remove();

  var overlay = document.createElement('div');
  overlay.id = 'petBattleOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:9998;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  var html = '<div style="background:var(--card);border-radius:20px;padding:24px;max-width:360px;width:90%;text-align:center;max-height:85vh;overflow-y:auto;animation:petEvo 0.3s ease-out;">';
  html += '<div style="font-size:22px;font-weight:900;color:var(--text);margin-bottom:2px;">⚔️ 精灵切磋</div>';
  html += '<div style="font-size:12px;color:var(--text3);margin-bottom:8px;">对手由电脑自动操控</div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:4px;">火🔥→草🌿→雷⚡→冰❄️→火🔥</div>';
  html += '<div style="font-size:13px;color:var(--text2);margin-bottom:14px;">你的出战：<b>'+mySp.stages[myPower.stage].emoji+' '+mySp.name+'</b> ATK:'+myPower.atk+' HP:'+myPower.hp+'</div>';

  // === 模式1：同伴切磋 ===
  if (hatchedAllies.length > 0) {
    html += '<div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:6px;">🏠 与同伴切磋</div>';
    html += '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">（你的其他精灵，电脑操控）</div>';
    for (var i = 0; i < hatchedAllies.length; i++) {
      var eid = hatchedAllies[i];
      var ep = petCalcPower(eid);
      var esp = PET_SPECIES[eid];
      var adv = getTypeAdvantage(currentId, eid);
      var advLabel = adv > 1 ? '✅克制' : adv < 1 ? '⚠️被克' : '➖持平';
      var advColor = adv > 1 ? '#22C55E' : adv < 1 ? '#EF4444' : '#A8A29E';
      html += '<div onclick="petStartBattle(\''+currentId+'\',\''+eid+'\')" style="cursor:pointer;background:var(--bg);border-radius:14px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;transition:all 0.2s;border:2px solid transparent;" onmouseover="this.style.borderColor=\'var(--primary)\'" onmouseout="this.style.borderColor=\'transparent\'">';
      html += '<span style="font-size:32px;">'+esp.stages[ep.stage].emoji+'</span>';
      html += '<div style="flex:1;text-align:left;">';
      html += '<div style="font-weight:700;color:var(--text);font-size:13px;">'+esp.name+'</div>';
      html += '<div style="font-size:10px;color:var(--text3);">Lv.'+(ep.stage+1)+' · '+ep.days+'天 · ATK:'+ep.atk+' HP:'+ep.hp+'</div>';
      html += '</div>';
      html += '<span style="font-size:11px;font-weight:600;color:'+advColor+';white-space:nowrap;">'+advLabel+'</span>';
      html += '</div>';
    }
  } else {
    html += '<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">暂无已孵化的同伴可切磋（需要训练3天以上）</div>';
  }

  // === 模式2：野怪挑战 ===
  html += '<div style="margin:10px 0 6px;border-top:1px solid var(--bg2);padding-top:12px;"></div>';
  html += '<div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:6px;">⚡ 野怪挑战</div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">（随机生成电脑对手，强度与你相当）</div>';
  html += '<button onclick="petStartWildBattle(\''+currentId+'\')" style="width:100%;padding:12px;border-radius:14px;background:linear-gradient(90deg,#7C3AED,#A855F7);color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;">🎲 随机挑战</button>';

  html += '<button onclick="document.getElementById(\'petBattleOverlay\').remove()" style="margin-top:10px;padding:8px 24px;border-radius:14px;background:var(--bg2);color:var(--text2);border:none;font-size:13px;cursor:pointer;">取消</button>';
  html += '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

// 生成随机野怪对手
var WILD_NAMES = ['疾风狼','铁甲犀','烈焰狮','暗影豹','冰晶蛇','雷鸣鹰','巨石像','森林鹿','电光鼠','毒蝎王','钢翼鸟','深渊鱼'];
var WILD_ELEMENTS = ['fire','ice','thunder','nature'];
function petGenerateWild(myPower) {
  var el = WILD_ELEMENTS[Math.floor(Math.random() * WILD_ELEMENTS.length)];
  var name = WILD_NAMES[Math.floor(Math.random() * WILD_NAMES.length)];
  var atk = Math.round(myPower.atk * (0.7 + Math.random() * 0.6));
  var hp = Math.round(myPower.hp * (0.7 + Math.random() * 0.6));
  var stageEmojis = {fire:'🦁', ice:'🐍', thunder:'🦅', nature:'🐗'};
  var emoji = stageEmojis[el] || '👾';
  return { name:name, element:el, atk:atk, hp:hp, emoji:emoji, isWild:true };
}

// 野怪挑战（重载 getTypeAdvantage 支持 element 字符串）
function petStartWildBattle(myId) {
  var myPower = petCalcPower(myId);
  var enemy = petGenerateWild(myPower);
  var mySp = PET_SPECIES[myId];
  var myEl = mySp.element;
  var enEl = enemy.element;

  // 元素克制（纯 element vs element）
  var adv = 1.0;
  if (myEl !== 'light' && enEl !== 'light') {
    var mt = TYPE_CHART[myEl];
    if (mt.strong === enEl) adv = 1.4;
    else if (mt.weak === enEl) adv = 0.6;
  }
  var advNote = adv > 1 ? '(克制对方！)' : adv < 1 ? '(被对方克制…)' : '';

  // 3 回合战斗
  var log = [];
  var myHP = myPower.hp;
  var enHP = enemy.hp;
  function rand() { return 0.85 + Math.random() * 0.3; }
  function dmg(atk, defMul) { return Math.round(atk * rand() * adv / defMul); }
  for (var r = 1; r <= 3; r++) {
    var myDmg = dmg(myPower.atk, 1 + (enemy.atk/myPower.atk > 1.2 ? 0.15 : 0));
    var enDmg = dmg(enemy.atk, 1 + (myPower.stage * 0.12));
    myHP = Math.max(0, myHP - enDmg);
    enHP = Math.max(0, enHP - myDmg);
    log.push({ round:r, myDmg:myDmg, enDmg:enDmg, myHP:myHP, enHP:enHP });
  }

  var myWin = myHP > enHP;
  var draw = myHP === enHP;

  // 保存战绩
  var records = JSON.parse(localStorage.getItem('fitbuddy_battle_records') || '[]');
  records.push({ date:new Date().toISOString().slice(0,10), myId:myId, enemyId:'wild', enemyName:enemy.name, myHP:myHP, enHP:enHP, winner:draw?'draw':(myWin?myId:'wild') });
  if (records.length > 20) records = records.slice(-20);
  localStorage.setItem('fitbuddy_battle_records', JSON.stringify(records));

  // 渲染战斗（复用好友战斗动画，适配野怪）
  renderWildBattleAnimation(myId, myPower, enemy, log, myWin, draw, advNote);
}

// 野怪战斗动画
function renderWildBattleAnimation(myId, myP, enemy, log, myWin, draw, advNote) {
  var overlay = document.getElementById('petBattleOverlay');
  if (!overlay) return;
  var mySp = PET_SPECIES[myId];
  var myEl = TYPE_CHART[myP.element];
  var enEl = TYPE_CHART[enemy.element];

  var html = '<div style="background:var(--card);border-radius:20px;padding:20px 16px;max-width:380px;width:95%;text-align:center;">';
  html += '<div style="font-size:20px;font-weight:900;color:var(--text);margin-bottom:2px;">⚡ '+mySp.name+' VS '+enemy.name+'</div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:4px;">'+advNote+'</div>';
  html += '<div style="font-size:10px;color:var(--text3);margin-bottom:8px;">（野怪 · 电脑操控）</div>';

  html += renderBattleArena(myP.emoji, mySp.name, myEl.color, myP.atk, myP.hp, myP.hp,
                             enemy.emoji, enemy.name, enEl.color, enemy.atk, enemy.hp, enemy.hp);

  html += '<div id="battleLog" style="background:var(--bg);border-radius:12px;padding:10px;margin:8px 0;min-height:36px;font-size:12px;color:var(--text2);text-align:center;line-height:1.6;"></div>';
  html += '<div id="battleResult" style="display:none;font-size:18px;font-weight:900;margin:8px 0;"></div>';
  html += '<button id="battleCloseBtn" style="display:none;margin-top:6px;padding:10px 28px;border-radius:16px;background:var(--primary);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;" onclick="document.getElementById(\'petBattleOverlay\').remove()">👌 知道了</button>';
  html += '</div>';
  overlay.innerHTML = html;

  playBattleRounds(myP.hp, enemy.hp, log, myWin, draw, mySp);
  ensureBattleShakeStyle();
}

// 提取战斗 arena HTML
function renderBattleArena(myEmoji, myName, myColor, myAtk, myHP, myMaxHP, enEmoji, enName, enColor, enAtk, enHP, enMaxHP) {
  var h = '';
  h += '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:6px;">';
  h += '<div style="text-align:center;flex:1;">';
  h += '<div id="battleMyEmoji" style="font-size:52px;transition:transform 0.3s;">'+myEmoji+'</div>';
  h += '<div style="font-size:11px;font-weight:700;color:'+myColor+';">'+myName+'</div>';
  h += '<div style="font-size:10px;color:var(--text3);">ATK:'+myAtk+'</div>';
  h += '<div style="margin-top:4px;background:var(--bg2);border-radius:8px;height:8px;overflow:hidden;"><div id="battleMyHP" style="height:100%;background:linear-gradient(90deg,#22C55E,#16A34A);width:100%;border-radius:8px;transition:width 0.6s;"></div></div>';
  h += '<div id="battleMyHPLabel" style="font-size:10px;color:var(--text3);">HP:'+myHP+'/'+myMaxHP+'</div>';
  h += '</div>';
  h += '<div style="font-size:24px;font-weight:900;color:var(--text2);">VS</div>';
  h += '<div style="text-align:center;flex:1;">';
  h += '<div id="battleEnEmoji" style="font-size:52px;transition:transform 0.3s;">'+enEmoji+'</div>';
  h += '<div style="font-size:11px;font-weight:700;color:'+enColor+';">'+enName+'</div>';
  h += '<div style="font-size:10px;color:var(--text3);">ATK:'+enAtk+'</div>';
  h += '<div style="margin-top:4px;background:var(--bg2);border-radius:8px;height:8px;overflow:hidden;"><div id="battleEnHP" style="height:100%;background:linear-gradient(90deg,#EF4444,#DC2626);width:100%;border-radius:8px;transition:width 0.6s;"></div></div>';
  h += '<div id="battleEnHPLabel" style="font-size:10px;color:var(--text3);">HP:'+enHP+'/'+enMaxHP+'</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

// 播放回合动画
function playBattleRounds(myMaxHP, enMaxHP, log, myWin, draw, mySp) {
  var delay = 0;
  function shake(id) { var el=document.getElementById(id); if(!el)return; el.style.transform='translateX(-8px)'; setTimeout(function(){el.style.transform='translateX(8px)'},80); setTimeout(function(){el.style.transform='translateX(0)'},160); }
  function showLog(text) { var el=document.getElementById('battleLog'); if(el)el.textContent=text; }
  function updateBars(rd) {
    var mb=document.getElementById('battleMyHP'), eb=document.getElementById('battleEnHP');
    var ml=document.getElementById('battleMyHPLabel'), el=document.getElementById('battleEnHPLabel');
    if(mb)mb.style.width=Math.max(2,(rd.myHP/myMaxHP*100))+'%';
    if(eb)eb.style.width=Math.max(2,(rd.enHP/enMaxHP*100))+'%';
    if(ml)ml.textContent='HP:'+rd.myHP+'/'+myMaxHP;
    if(el)el.textContent='HP:'+rd.enHP+'/'+enMaxHP;
  }
  for (var ri=0; ri<log.length; ri++) {(function(rd,idx){
    delay+=1200; setTimeout(function(){
      shake('battleMyEmoji'); shake('battleEnEmoji');
      showLog('⚡ 第'+(idx+1)+'回合 — 你造成 '+rd.myDmg+' 伤害 | 对方造成 '+rd.enDmg+' 伤害');
      updateBars(rd);
    }, delay);
  })(log[ri], ri);}
  delay+=1400; setTimeout(function(){
    var r=document.getElementById('battleResult'), b=document.getElementById('battleCloseBtn');
    var mb=document.getElementById('battleMyHP'), eb=document.getElementById('battleEnHP');
    if(draw){ if(r){r.style.display='block';r.innerHTML='🤝 平局！不相上下…';r.style.color='#A8A29E';}}
    else if(myWin){ if(r){r.style.display='block';r.innerHTML='🎉 胜利！'+mySp.name+' 赢了！';r.style.color='#22C55E';} if(mb)mb.style.background='linear-gradient(90deg,#22C55E,#FACC15)';}
    else { if(r){r.style.display='block';r.innerHTML='💔 败北…对手战胜了你';r.style.color='#EF4444';} if(eb)eb.style.background='linear-gradient(90deg,#EF4444,#FACC15)';}
    if(b)b.style.display='inline-block';
  }, delay);
}

function ensureBattleShakeStyle() {
  if (!document.getElementById('battleShakeStyle')) {
    var style = document.createElement('style');
    style.id = 'battleShakeStyle';
    style.textContent = '#battleMyEmoji.shake,#battleEnEmoji.shake{animation:battleShake 0.25s ease-in-out;}@keyframes battleShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-6px)}}';
    document.head.appendChild(style);
  }
}

// 元素克制计算（>1为自己有利）
function getTypeAdvantage(myId, enemyId) {
  var myEl = PET_SPECIES[myId].element;
  var enEl = PET_SPECIES[enemyId].element;
  if (myEl === 'light' || enEl === 'light') return 1.0;
  var myType = TYPE_CHART[myEl];
  var enType = TYPE_CHART[enEl];
  if (myType.strong === enEl) return 1.4;
  if (myType.weak === enEl) return 0.6;
  return 1.0;
}

// 开始战斗（同伴切磋）
function petStartBattle(myId, enemyId) {
  var mySp = PET_SPECIES[myId];
  var enSp = PET_SPECIES[enemyId];
  var myP = petCalcPower(myId);
  var enP = petCalcPower(enemyId);
  var adv = getTypeAdvantage(myId, enemyId);
  var advNote = adv > 1 ? '(克制对方！)' : adv < 1 ? '(被对方克制…)' : '';

  var log = [];
  var myHP = myP.hp;
  var enHP = enP.hp;
  function rand() { return 0.85 + Math.random() * 0.3; }
  function dmg(atk, defStage) { return Math.round(atk * rand() / (1 + defStage * 0.15) * (adv > 0 ? (adv > 1 ? 1.4 : 0.6) : 1)); }
  for (var r = 1; r <= 3; r++) {
    var myDmg = dmg(myP.atk, enP.stage);
    var enDmg = dmg(enP.atk, myP.stage);
    myHP = Math.max(0, myHP - enDmg);
    enHP = Math.max(0, enHP - myDmg);
    log.push({ round:r, myDmg:myDmg, enDmg:enDmg, myHP:myHP, enHP:enHP });
  }

  var myWin = myHP > enHP;
  var draw = myHP === enHP;

  var records = JSON.parse(localStorage.getItem('fitbuddy_battle_records') || '[]');
  records.push({ date:new Date().toISOString().slice(0,10), myId:myId, enemyId:enemyId, myHP:myHP, enHP:enHP, winner:draw?'draw':(myWin?myId:enemyId) });
  if (records.length > 20) records = records.slice(-20);
  localStorage.setItem('fitbuddy_battle_records', JSON.stringify(records));

  // 渲染战斗
  var overlay = document.getElementById('petBattleOverlay');
  if (!overlay) return;
  var myEl = TYPE_CHART[myP.element];
  var enEl = TYPE_CHART[enP.element];

  var html = '<div style="background:var(--card);border-radius:20px;padding:20px 16px;max-width:380px;width:95%;text-align:center;">';
  html += '<div style="font-size:20px;font-weight:900;color:var(--text);margin-bottom:2px;">⚔️ '+mySp.name+' VS '+enSp.name+'</div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:4px;">'+advNote+'</div>';
  html += '<div style="font-size:10px;color:var(--text3);margin-bottom:8px;">（电脑操控对方精灵）</div>';
  html += renderBattleArena(myP.emoji, mySp.name, myEl.color, myP.atk, myP.hp, myP.hp, enP.emoji, enSp.name, enEl.color, enP.atk, enP.hp, enP.hp);
  html += '<div id="battleLog" style="background:var(--bg);border-radius:12px;padding:10px;margin:8px 0;min-height:36px;font-size:12px;color:var(--text2);text-align:center;line-height:1.6;"></div>';
  html += '<div id="battleResult" style="display:none;font-size:18px;font-weight:900;margin:8px 0;"></div>';
  html += '<button id="battleCloseBtn" style="display:none;margin-top:6px;padding:10px 28px;border-radius:16px;background:var(--primary);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;" onclick="document.getElementById(\'petBattleOverlay\').remove()">👌 知道了</button>';
  html += '</div>';
  overlay.innerHTML = html;

  playBattleRounds(myP.hp, enP.hp, log, myWin, draw, mySp);
  ensureBattleShakeStyle();
}

// 训练完成后刷新宠物
function refreshPet() {
  var area = document.getElementById('petArea');
  if (!area) return;
  area.innerHTML = renderPetCard();
}


// --- 热力图渲染 ---
function renderHeatmapHTML(hist) {
  var dates = {};
  hist.forEach(function(h){ dates[h.date] = (dates[h.date]||0) + (h.count||0); });
  var today = new Date();
  var now = new Date(today);
  now.setDate(now.getDate() - 83); // 12 weeks back
  // 构建网格：每行 = 一周，每列 = 一周中的一天（周一=1...周日=0）
  // 网格：8列（第1列=星期标签，后7列=Mon-Sun），12行
  var cells = [];
  var weekDayLabels = {1:'一', 3:'三', 5:'五'}; // 只标周一/三/五
  for (var wk = 0; wk < 12; wk++) {
    // 星期标签（每行第一个格子）
    var label = weekDayLabels[(wk * 7 + 1) % 7] || weekDayLabels[wk % 7] || '';
    if (label) {
      cells.push('<div style="grid-column:1;grid-row:'+(wk+1)+';font-size:10px;color:var(--text3);display:flex;align-items:center;justify-content:flex-end;padding-right:5px;">'+label+'</div>');
    }
    for (var d = 0; d < 7; d++) {
      var idx = wk * 7 + d;
      var ds = new Date(today); ds.setDate(ds.getDate() - (83 - idx));
      var dsStr = ds.toISOString().slice(0,10);
      var count = dates[dsStr] || 0;
      var level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;
      cells.push('<div class="heatmap-cell'+(level>0?' l'+level:'')+'" title="'+dsStr+': '+(count||'无训练')+'"'+
        ' style="grid-column:'+(d+2)+';grid-row:'+(wk+1)+';"></div>');
    }
  }
  // 计算统计
  var allDates = Object.keys(dates).filter(function(d){ return dates[d] > 0; });
  var totalDays = allDates.length;
  // 最长连续
  var maxStreak = 0, curStreak = 0;
  var sortedDates = allDates.sort();
  for (var s = 0; s < sortedDates.length; s++) {
    if (s === 0) { curStreak = 1; continue; }
    var prev = new Date(sortedDates[s-1]); var cur = new Date(sortedDates[s]);
    var diff = (cur - prev) / 86400000;
    if (diff <= 2) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); } else { curStreak = 1; }
  }
  maxStreak = Math.max(maxStreak, curStreak, 1);
  // 当前连续（从今天往前数）
  var curStreak2 = 0;
  for (var c = 0; c <= 83; c++) {
    var d3 = new Date(today); d3.setDate(d3.getDate() - c);
    if (dates[d3.toISOString().slice(0,10)] > 0) curStreak2++; else break;
  }

  return '<div class="progress-card"><div class="card-title">📅 训练热力图（近12周）</div>'+
    '<div style="display:flex;gap:16px;margin-bottom:10px;font-size:12px;flex-wrap:wrap;">'+
      '<span style="color:var(--primary);font-weight:600;">总训练 '+totalDays+' 天</span>'+
      '<span style="color:#22C55E;font-weight:600;">最长连续 '+maxStreak+' 天</span>'+
      '<span style="color:#3B82F6;font-weight:600;">当前连续 '+curStreak2+' 天</span>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:28px repeat(7,15px);grid-template-rows:repeat(12,15px);gap:3px;width:max-content;">'+cells.join('')+'</div>'+
    '<div class="heatmap-legend" style="margin-top:10px;">少<span style="background:var(--border);display:inline-block;width:15px;height:15px;border-radius:3px;vertical-align:middle;"></span>'+
    '<span class="heatmap-cell l1" style="display:inline-block;"></span><span class="heatmap-cell l2" style="display:inline-block;"></span><span class="heatmap-cell l3" style="display:inline-block;"></span><span class="heatmap-cell l4" style="display:inline-block;"></span>多</div></div>';
}

// --- 成就+等级渲染 ---
function renderGamificationHTML(hist) {
  var ach = getAchievements();
  var lv = getLevel();
  var lp = getLevelProgress();
  var html = '';

  // 等级条
  html += '<div class="progress-card"><div class="card-title">🏅 训练等级</div>'+
    '<div class="level-bar"><span class="level-icon">'+lp.cur.icon+'</span>'+
    '<div class="level-info"><div class="level-name">'+lp.cur.name+'</div>'+
    '<div class="level-progress-bar"><div class="level-progress-fill" style="width:'+lp.progress+'%"></div></div>'+
    '<div class="level-progress-text">训练 '+lp.total+' 天 · 距离下一级 '+(lp.nxt.need-lp.total)+(lp.nxt.need>lp.total?' 天':'')+'</div>'+
    '</div></div></div>';

  // 成就墙
  html += '<div class="progress-card"><div class="card-title">🏆 成就徽章</div>';
  var cats = {};
  ACHIEVEMENTS.forEach(function(a){ if (!cats[a.cat]) cats[a.cat]=[]; cats[a.cat].push(a); });
  Object.keys(cats).forEach(function(cat){
    html += '<div style="font-size:11px;font-weight:700;color:var(--text3);margin:8px 0 4px;">'+cat+'</div>';
    html += '<div class="ach-grid">';
    cats[cat].forEach(function(a){
      var unlocked = ach.indexOf(a.id)>=0;
      html += '<div class="ach-badge'+(unlocked?' unlocked':' locked')+'">'+
        '<span class="ach-icon">'+(unlocked?a.icon:'🔒')+'</span>'+
        '<span class="ach-name">'+a.name+'</span>'+
        '<span class="ach-date">'+a.desc+'</span></div>';
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

// --- 在 toggleDone 后触发 ---
function afterTrainingDone() {
  updateStreak();
  checkAchievements();
  updateHeaderStreak();
  petAddDay();          // 🐉 只给当前精灵+1天
  refreshPet();
  // 🌈 隐藏款随机触发检测
  if (checkHiddenUnlock()) {
    setTimeout(function(){
      showHiddenUnlockCelebration();
    }, 600);
  }
  // 🥚 稀有/史诗解锁检测（累计训练天数）
  checkRarityUnlock();
}

// 🌈 隐藏款解锁庆祝弹窗
function showHiddenUnlockCelebration() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:linear-gradient(135deg,#FDF2F8,#FCE7F3,#FBCFE8);border-radius:24px;padding:32px 24px;text-align:center;max-width:340px;animation:petEvo 0.5s ease-out;">'+renderCreatureSVG('phantomUnicorn',2,80)+'<div style="font-size:22px;font-weight:900;color:#9D174D;margin:12px 0 4px;">🌟 隐藏精灵出现了！</div><div style="font-size:14px;color:#BE185D;">幻光独角兽被你的汗水吸引而来…</div><div style="font-size:12px;color:#9D174D;margin-top:6px;opacity:0.7;">极低概率！你太幸运了！</div><button onclick="this.parentElement.parentElement.remove();refreshPet();" style="margin-top:16px;padding:10px 32px;border-radius:20px;background:linear-gradient(90deg,#EC4899,#7C3AED);color:#fff;border:none;font-size:16px;font-weight:700;cursor:pointer;">✨ 收下它！</button></div>';
  overlay.addEventListener('click', function(e){ if(e.target===overlay){ overlay.remove(); refreshPet(); } });
  document.body.appendChild(overlay);
}

// ============ 稀有度解锁系统 ============
// 累计总训练天数
function getTotalTrainingDays() {
  var data = petGetAllData();
  var total = 0;
  for (var k in data) { total += data[k].days || 0; }
  return total;
}

// 稀有度解锁条件
var RARITY_UNLOCK = {
  thunderTiger: { days: 7, name: '⚡ 雷霆虎', emoji: '🐯', rarity: '稀有', color: '#EAB308', bg: '#2D2000' },
  jadeDeer:    { days: 14, name: '🌿 翡翠鹿', emoji: '🦌', rarity: '史诗', color: '#22C55E', bg: '#0C2A14' }
};

// 检查并解锁稀有/史诗精灵
function checkRarityUnlock() {
  var unlocked = JSON.parse(localStorage.getItem('fitbuddy_pet_unlocked') || '[]');
  var totalDays = getTotalTrainingDays();
  var newlyUnlocked = [];

  for (var id in RARITY_UNLOCK) {
    if (unlocked.indexOf(id) >= 0) continue; // 已解锁
    if (totalDays >= RARITY_UNLOCK[id].days) {
      unlocked.push(id);
      newlyUnlocked.push(id);
    }
  }

  if (newlyUnlocked.length > 0) {
    localStorage.setItem('fitbuddy_pet_unlocked', JSON.stringify(unlocked));
    // 如果一次解锁多个（比如从7天跳到14天），显示最后一个
    for (var n = 0; n < newlyUnlocked.length; n++) {
      var delay = n * 2000;
      (function(speciesId, d) {
        setTimeout(function() { showRarityUnlockCelebration(speciesId); }, d);
      })(newlyUnlocked[n], delay);
    }
    return newlyUnlocked;
  }
  return null;
}

// 稀有/史诗解锁庆祝弹窗
function showRarityUnlockCelebration(speciesId) {
  var info = RARITY_UNLOCK[speciesId];
  if (!info) return;
  var sp = PET_SPECIES[speciesId];

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(e){ if(e.target===overlay){ overlay.remove(); refreshPet(); } });

  var stage0Emoji = sp.stages[0].emoji; // 蛋
  var rarityBadgeColor = info.rarity === '稀有' ? '#EAB308' : '#22C55E';

  overlay.innerHTML = '<div style="background:linear-gradient(135deg,' + info.bg + ',' +
    'rgba(0,0,0,0.3));border:3px solid ' + info.color + ';border-radius:24px;padding:32px 24px;' +
    'text-align:center;max-width:340px;color:#fff;animation:petEvo 0.5s ease-out;">' +
    '<div style="font-size:72px;margin-bottom:4px;">' + stage0Emoji + '</div>' +
    '<div style="display:inline-block;padding:4px 16px;border-radius:14px;background:' + rarityBadgeColor + '33;color:' + rarityBadgeColor + ';font-size:12px;font-weight:700;margin-bottom:8px;">' + info.rarity + ' 解锁</div>' +
    '<div style="font-size:22px;font-weight:900;">' + info.name + '</div>' +
    '<div style="font-size:14px;opacity:0.85;margin:6px 0;">累计训练 <b>' + info.days + '天</b>，它被你的汗水唤醒了！</div>' +
    '<div style="font-size:12px;opacity:0.65;">' + sp.stages[0].desc + '</div>' +
    '<button onclick="petSwitch(\'' + speciesId + '\');this.parentElement.parentElement.remove();" ' +
    'style="margin-top:16px;padding:10px 28px;border-radius:20px;background:linear-gradient(90deg,' + info.color + ',' + info.color + 'DD);color:#fff;border:none;font-size:16px;font-weight:700;cursor:pointer;">🐣 切换为它！</button>' +
    '<div style="margin-top:8px;font-size:11px;opacity:0.5;">以后也可以从精灵栏自由切换</div>' +
    '</div>';

  document.body.appendChild(overlay);
}

// ============ 🏟️ 社区大厅系统 ============

// AI 训练者名字池 + 个性+口头禅+训练建议
var TRAINER_NAMES = [
  '铁柱哥 💪','小美 🏃‍♀️','大力王 🦍','健身猫 🐱','举铁侠 🏋️',
  '钢铁姐 👩‍🔧','跑者阿飞 🏃','深蹲达人 🍑','瑜伽魂 🧘','体能怪兽 👹',
  '山本健太 🥋','LunaFit 🌙','筋肉博士 🧠','自律狂魔 ⏰','壶铃女神 🔔',
  '卷王小明 📚','硬拉战神 ⚡','晨跑骑士 🌅','街健阿杰 🏗️','蛋白粉狂魔 🥛'
];

// 训练者个性配置
var TRAINER_PERSONALITIES = {
  '铁柱哥 💪': { style:'硬汉', catchphrase:'男人就该对自己狠一点！', tips:['深蹲要蹲到底，半蹲不叫深蹲','蛋白质吃不够，铁举了也白举','休息日和训练日一样重要'], specialty:'力量举' },
  '小美 🏃‍♀️': { style:'元气少女', catchphrase:'今天流的汗是明天的星光✨', tips:['跑步前一定要热身，尤其是膝盖','有氧和力量搭配才最有效','别怕长肌肉，女生没那么容易变壮'], specialty:'有氧跑步' },
  '大力王 🦍': { style:'憨厚猛男', catchphrase:'大力出奇迹！', tips:['硬拉时背部要打直，宁轻勿假','组间休息90秒是最佳增肌窗口','睡够7小时比多练一组更有效'], specialty:'三大项' },
  '健身猫 🐱': { style:'高冷优雅', catchphrase:'喵~ 优雅永不过时', tips:['瑜伽垫不只是用来拉伸的','核心是一切动作的基础','空腹有氧效果更好但要适度'], specialty:'瑜伽/普拉提' },
  '举铁侠 🏋️': { style:'热血中二', catchphrase:'感受肌肉的轰鸣吧！⚡', tips:['做动作时想着目标肌肉，念动一致','渐进超负荷才是增肌的真谛','练前碳水练后蛋白，别搞反了'], specialty:'健美训练' },
  '钢铁姐 👩‍🔧': { style:'女强人', catchphrase:'没有练不出的身材，只有不努力的人', tips:['女生练臀要多做臀推和罗马尼亚硬拉','体脂不是越低越好，健康才是第一位','经期前三天别练腹部，对自己好一点'], specialty:'臀腿塑形' },
  '跑者阿飞 🏃': { style:'自由散漫', catchphrase:'跑起来，风就是你的方向🌬️', tips:['LSD是马拉松的基础，别跳过','跑鞋每500公里就该换了','跑步不拉伸，早晚膝盖疼'], specialty:'马拉松/长跑' },
  '深蹲达人 🍑': { style:'专注执着', catchphrase:'每天深蹲100个，你也能做翘臀之王！', tips:['先屈髋再屈膝，重心在脚跟','膝盖方向和脚尖方向一致','徒手深蹲没感觉了？试试保加利亚分腿蹲'], specialty:'下肢训练' },
  '瑜伽魂 🧘': { style:'禅意疗愈', catchphrase:'呼吸即力量 🌿', tips:['早晨10分钟瑜伽比咖啡还提神','拉伸不是热身！心率提上来才是','睡前阴瑜伽能改善睡眠质量'], specialty:'瑜伽/柔韧性' },
  '体能怪兽 👹': { style:'狂妄霸气', catchphrase:'极限？那只是起点！', tips:['HIIT每周2-3次就够了，多了反而掉肌肉','体能训练要多样化，别只做一种','Burpee+波比跳是最强燃脂组合'], specialty:'综合体能' },
  '山本健太 🥋': { style:'武士道', catchphrase:'押忍！一日一生！', tips:['自重训练也能练出惊人的力量','坚持比强度更重要','训练日记是最好的进步证明'], specialty:'自重训练' },
  'LunaFit 🌙': { style:'神秘文艺', catchphrase:'在月光下雕刻最美的自己', tips:['晚上训练不一定要喝氮泵，音乐就够了','保持记录，数据不会说谎','偶尔的放纵是为了更好地坚持'], specialty:'塑形/体态' },
  '筋肉博士 🧠': { style:'学院派', catchphrase:'肌肉生长遵循科学规律🔬', tips:['肌酸是目前研究最充分的补剂','每公斤体重1.6-2.2g蛋白质','训练后30分钟是补充营养的黄金窗口'], specialty:'运动营养' },
  '自律狂魔 ⏰': { style:'极端自律', catchphrase:'自律给我自由！', tips:['固定训练时间是坚持的最好方法','早起第一件事：喝500ml温水','手机放远点，专注训练45分钟'], specialty:'生活化健身' },
  '壶铃女神 🔔': { style:'飒爽自信', catchphrase:'摇摆吧！壶铃会告诉你答案', tips:['壶铃swing是最好的后链动作之一','学会用臀部发力，而不是手臂','一周2次壶铃训练就能看到变化'], specialty:'壶铃/功能性' },
  '卷王小明 📚': { style:'卷王学霸', catchphrase:'健身也要卷起来！📖', tips:['每4-6周换一次训练计划，避免平台期','RPE比绝对重量更重要','训练时注意力集中比赛前喝氮泵还管用'], specialty:'周期化训练' },
  '硬拉战神 ⚡': { style:'专注冷峻', catchphrase:'杠铃从不骗人', tips:['硬拉是检验力量的唯一标准','握力不够？用助力带不丢人','相扑拉和传统拉都试试，找到适合你的'], specialty:'力量举' },
  '晨跑骑士 🌅': { style:'阳光温暖', catchphrase:'每一个早晨都是新的开始☀️', tips:['晨跑前吃半根香蕉就够了','空腹有氧适合减脂但不适合增肌','跑步姿势比跑量更重要'], specialty:'晨跑/户外' },
  '街健阿杰 🏗️': { style:'街头酷炫', catchphrase:'街头就是我的健身房！', tips:['先练俯卧撑和引体向上打好基础','双力臂的第一步是掌握节奏','街健的核心是身体控制力'], specialty:'街头健身' },
  '蛋白粉狂魔 🥛': { style:'搞笑担当', catchphrase:'万物皆可蛋白粉！', tips:['蛋白粉只是补充，不是替代','天然食物中的微量元素蛋白粉没有','别拿蛋白粉当饭吃，肾会受不了'], specialty:'营养/补剂' }
};

// 生成确定性哈希（同一 session 中训练者不变）
function communityHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

// 获取/生成 AI 训练者列表（存储在 localStorage，每次刷新页面时重新随机）
function getTrainers() {
  var cached = localStorage.getItem('fitbuddy_trainers');
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }
  return generateTrainers();
}

function generateTrainers() {
  var normalIds = [];
  for (var k in PET_SPECIES) { if (PET_SPECIES[k].rarityWeight > 0) normalIds.push(k); }

  var trainers = [];
  var namesPool = TRAINER_NAMES.slice();

  // 打乱名字池
  for (var i = namesPool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = namesPool[i]; namesPool[i] = namesPool[j]; namesPool[j] = tmp;
  }

  for (var t = 0; t < 12; t++) {
    var name = namesPool[t];
    var personality = TRAINER_PERSONALITIES[name] || { catchphrase:'坚持就是胜利！', tips:['科学训练+合理饮食+充足睡眠','坚持比强度更重要','记录你的每一次进步'], specialty:'综合健身' };
    var speciesId = normalIds[Math.floor(Math.random() * normalIds.length)];
    var sp = PET_SPECIES[speciesId];
    // 训练天数：正态分布20-80天
    var days = Math.floor(20 + Math.random() * 60);
    // 决定阶段
    var stage = days >= 50 ? 4 : days >= 25 ? 3 : days >= 10 ? 2 : days >= 3 ? 1 : 0;
    var stageData = sp.stages[stage];
    // 战绩
    var wins = Math.floor(Math.random() * days * 0.3);
    var losses = Math.floor(Math.random() * days * 0.15);
    // 战斗力
    var stageMult = [0.4, 1.0, 1.8, 3.0, 5.0][stage];
    var atk = Math.floor((8 + days * 4) * stageMult);
    var hp = Math.floor((25 + days * 6) * (1 + stage * 0.5));
    // 随机挑一条训练建议
    var randomTip = personality.tips[Math.floor(Math.random() * personality.tips.length)];

    trainers.push({
      id: 'trainer_' + t,
      name: name,
      speciesId: speciesId,
      speciesName: sp.name,
      element: sp.element,
      days: days,
      stage: stage,
      stageEmoji: stageData.emoji,
      stageName: stageData.name,
      wins: wins,
      losses: losses,
      power: atk,
      hp: hp,
      // 个性数据
      style: personality.style,
      catchphrase: personality.catchphrase,
      tip: randomTip,
      tips: personality.tips,
      specialty: personality.specialty
    });
  }

  // 按战斗力降序排列
  trainers.sort(function(a, b) { return b.power - a.power; });

  localStorage.setItem('fitbuddy_trainers', JSON.stringify(trainers));
  return trainers;
}
