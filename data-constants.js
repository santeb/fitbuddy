// ============ FitBuddy 数据常量 ============
// 本文件包含所有静态数据（动作库/配置/映射表/饮食指南）
// 由 index.html 自动拆分生成，勿手动编辑

// ============ 动作数据库 ============
var EXES = [
  // 腿部 - 初级
  {n:"徒手深蹲", m:"腿", eq:"bodyweight", diff:"初级", desc:"最基础的腿部训练，激活股四头肌和臀部", tips:"脚跟贴地，膝盖跟脚尖方向一致，蹲至大腿平行地面", vid:"aclHkVaku9U"},
  {n:"腿举（低重量）", m:"腿", eq:"gym", diff:"初级", desc:"腿举机入门使用，安全高效", tips:"不锁死膝盖，控制下放速度，脚距与肩同宽", vid:"V6UPhsV3mXM"},
  {n:"箭步蹲", m:"腿", eq:"bodyweight", diff:"初级", desc:"单腿功能训练，提升平衡协调", tips:"前膝不超过脚尖，后膝接近但不触地", vid:"QOVaHwm-Q6s"},
  {n:"臀桥", m:"腿", eq:"bodyweight", diff:"初级", desc:"激活臀大肌和后链，保护腰椎", tips:"仰卧屈膝，臀部顶起至身体一条线，顶端挤压臀肌", vid:""},
  {n:"哑铃深蹲", m:"腿", eq:"dumbbell", diff:"初级", desc:"持哑铃增加阻力的深蹲变式", tips:"哑铃放两侧或前抱，动作同徒手深蹲", vid:""},
  // 腿部 - 中级
  {n:"深蹲跳", m:"腿", eq:"bodyweight", diff:"中级", desc:"爆发力深蹲，增加腿部力量和心率", tips:"蹲下后爆发跳起，落地时膝盖缓冲，前脚掌着地", vid:""},
  {n:"保加利亚分腿蹲（徒手）", m:"腿", eq:"bodyweight", diff:"中级", desc:"后脚抬高单腿蹲，强化臀腿", tips:"后脚搭在椅子上，前脚踩实，保持躯干直立下蹲", vid:""},
  {n:"单腿臀桥", m:"腿", eq:"bodyweight", diff:"中级", desc:"单腿臀桥进阶，强化臀大肌和后链", tips:"仰卧单腿支撑，臀部顶起至身体一条线，顶端挤压臀肌", vid:""},
  {n:"杠铃深蹲", m:"腿", eq:"gym", diff:"中级", desc:"力量训练王牌动作，激活全身肌肉链", tips:"杠铃放在斜方肌上方，下蹲时膝盖不内扣，保持腰背中立", vid:"YaX7Hger24g"},
  {n:"罗马尼亚硬拉", m:"腿", eq:"gym", diff:"中级", desc:"针对腘绳肌和臀大肌的后链训练", tips:"保持背部平直，杆贴腿向下推移，感受腘绳肌拉伸", vid:""},
  {n:"保加利亚深蹲", m:"腿", eq:"dumbbell", diff:"中级", desc:"后脚抬高的单腿深蹲，强化臀腿", tips:"后脚搭在椅子上，前脚踩实，保持躯干直立", vid:"2C-uNgKwPLE"},
  {n:"腿弯举", m:"腿", eq:"gym", diff:"中级", desc:"孤立训练腘绳肌", tips:"避免用腰部代偿，控制下放速度", vid:""},
  // 腿部 - 高级
  {n:"前蹲", m:"腿", eq:"gym", diff:"高级", desc:"杠铃置于锁骨前方的深蹲，激活更多股四头肌", tips:"手肘高抬，保持上身直立，需要良好的踝关节灵活性", vid:""},
  {n:"单腿深蹲（枪式）", m:"腿", eq:"bodyweight", diff:"高级", desc:"极高难度的单腿全深蹲", tips:"悬空腿前伸，重心缓慢下降，需要强大的力量与平衡", vid:"vq5-vdgJc0Y"},
  {n:"哈克深蹲", m:"腿", eq:"gym", diff:"高级", desc:"哈克机深蹲，强调股四头肌", tips:"脚位靠前，膝盖跟随脚尖，感受大腿前侧受力", vid:""},

  // 胸部 - 初级
  {n:"俯卧撑", m:"胸", eq:"bodyweight", diff:"初级", desc:"经典自重胸部训练，同时锻炼肩三头", tips:"身体保持一条线，肘部向外45°，胸部接近地面", vid:"IODxDxX7oi4"},
  {n:"宽距俯卧撑", m:"胸", eq:"bodyweight", diff:"初级", desc:"宽距更侧重胸肌外侧，拉伸幅度更大", tips:"双手间距1.5倍肩宽，下落时感受胸肌拉伸", vid:""},
  {n:"上斜俯卧撑", m:"胸", eq:"bodyweight", diff:"初级", desc:"手撑高处（桌/椅），适合新手降低难度", tips:"身体保持一条线，越高越容易，循序渐进降低高度", vid:""},
  {n:"坐姿推胸（低重量）", m:"胸", eq:"gym", diff:"初级", desc:"坐姿推胸机入门，轨迹固定安全", tips:"调整座椅高度，把手与乳头齐平，推出时不完全锁死", vid:"0DfYA5gBxKk"},
  {n:"哑铃平板卧推", m:"胸", eq:"dumbbell", diff:"初级", desc:"哑铃卧推适合初学者找到胸肌发力感", tips:"哑铃下落到胸侧，肘部略低于肩，顶端不完全锁死", vid:"0fREWByVI_U"},
  {n:"哑铃飞鸟", m:"胸", eq:"dumbbell", diff:"初级", desc:"孤立胸肌的拉伸训练", tips:"臂微弯保护肘关节，控制下放不过低，顶端不要碰触", vid:"eozkVa0S0WQ"},
  // 胸部 - 中级
  {n:"下斜俯卧撑", m:"胸", eq:"bodyweight", diff:"中级", desc:"脚垫高处，侧重上胸，增加难度", tips:"脚放在椅子上，身体下倾，手距与肩同宽", vid:""},
  {n:"钻石俯卧撑", m:"胸", eq:"bodyweight", diff:"中级", desc:"双手成菱形，同时刺激胸肌内侧和三头", tips:"食指拇指相触成菱形，肘部贴近身体下落", vid:""},
  {n:"杠铃卧推", m:"胸", eq:"gym", diff:"中级", desc:"胸部训练王牌，三大力量举动作之一", tips:"肩胛骨收紧下沉，杆下落到乳头位置，脚踩地用力", vid:"rT7Orr3yK6c"},
  {n:"上斜杠铃卧推", m:"胸", eq:"gym", diff:"中级", desc:"上斜卧推重点训练上胸", tips:"椅背角度30-45°，杆落于锁骨，控制下放速度", vid:""},
  {n:"绳索飞鸟", m:"胸", eq:"gym", diff:"中级", desc:"绳索提供持续张力，提升胸肌泵感", tips:"保持肘部轻微弯曲，从两侧向中间聚合，感受胸部收缩", vid:""},
  {n:"哑铃上斜卧推", m:"胸", eq:"dumbbell", diff:"中级", desc:"上斜哑铃卧推，重点刺激上胸", tips:"椅背30-45°，哑铃下落到锁骨两侧，推起时不完全锁死", vid:"cZPt1iM5bU8"},
  // 胸部 - 高级
  {n:"单臂俯卧撑", m:"胸", eq:"bodyweight", diff:"高级", desc:"极高难度的单臂推力训练，需要强大核心", tips:"双腿分开增加稳定性，保持身体不旋转", vid:""},
  {n:"双杠臂屈伸（胸）", m:"胸", eq:"gym", diff:"高级", desc:"身体前倾的双杠臂屈伸，重点训练下胸", tips:"身体前倾约30°，感受胸肌拉伸，避免过度下沉损伤肩关节", vid:""},
  {n:"史密斯机卧推", m:"胸", eq:"gym", diff:"高级", desc:"史密斯机提供稳定轨迹，适合大重量突破", tips:"轨迹固定，注意调整位置使路径垂直于胸口", vid:""},
  {n:"哑铃下斜卧推", m:"胸", eq:"dumbbell", diff:"高级", desc:"下斜哑铃卧推，重点刺激下胸", tips:"固定双腿，哑铃下落到下胸两侧，控制下放速度", vid:""},

  // 背部 - 初级
  {n:"反向划船", m:"背", eq:"bodyweight", diff:"初级", desc:"躺在桌下或用单杠，自重划船练背", tips:"身体保持一条线，拉起时肩胛骨夹紧，感受背部发力", vid:""},
  {n:"超人式", m:"背", eq:"bodyweight", diff:"初级", desc:"俯卧抬手脚，激活下背和竖脊肌", tips:"俯卧同时抬起手臂和腿，顶端停留1秒，缓慢下放", vid:""},
  {n:"高位下拉（宽握）", m:"背", eq:"gym", diff:"初级", desc:"引体向上的替代动作，训练背部宽度", tips:"背部带动肘部下压，想象把肘往口袋里放，不要用手臂拉", vid:"D4HKVVnitkY"},
  {n:"哑铃单臂划船", m:"背", eq:"dumbbell", diff:"初级", desc:"单侧背部训练，便于控制动作", tips:"对侧手/膝撑台，背部保持平直，将哑铃向腰侧拉起", vid:"DMo3HJoycS8"},
  {n:"坐姿绳索划船", m:"背", eq:"gym", diff:"初级", desc:"绳索提供稳定阻力，适合初学者", tips:"挺胸坐直，把手柄拉向腹部，肩胛骨在顶点夹紧", vid:""},
  // 背部 - 中级
  {n:"引体向上（门框/公园杠）", m:"背", eq:"bodyweight", diff:"中级", desc:"最有效的自重背部训练，随时可练", tips:"肩胛先下压，背部带动肘部，尽量避免身体晃动借力", vid:"eGo4Iy7QOh8"},
  {n:"引体向上", m:"背", eq:"gym", diff:"中级", desc:"最有效的背部宽度训练之一", tips:"肩胛先下压，背部带动肘部，尽量避免身体晃动借力", vid:"eGo4Iy7QOh8"},
  {n:"杠铃俯身划船", m:"背", eq:"gym", diff:"中级", desc:"背部厚度训练利器，激活中背肌群", tips:"腰背挺直前倾约45°，将杠铃向腹部方向拉起", vid:"kBWAon7FjuU"},
  {n:"T杠划船", m:"背", eq:"gym", diff:"中级", desc:"T形杠铃划船，对中背刺激强", tips:"胸部贴于靠垫，双手握T杠向胸口方向拉", vid:""},
  {n:"哑铃俯身划船（双手）", m:"背", eq:"dumbbell", diff:"中级", desc:"双手哑铃划船，替代杠铃版本", tips:"腰背挺直前倾45°，哑铃向腹部方向拉，肘部贴近身体", vid:"lui0ovDfU4g"},
  // 背部 - 高级
  {n:"硬拉", m:"背", eq:"gym", diff:"高级", desc:"全身力量综合动作，背部与腿部共同发力", tips:"保持腰背中立，深呼吸憋气下蹲，蹬地同时拉杆起身", vid:""},
  {n:"宽握引体（加重）", m:"背", eq:"gym", diff:"高级", desc:"配合负重腰带的引体向上", tips:"动作同普通引体，注意控制身体，顶部完全伸展背阔肌", vid:""},
  {n:"哑铃单臂划船（重重量）", m:"背", eq:"dumbbell", diff:"高级", desc:"大重量单臂划船，突破背部力量", tips:"哑铃向腰侧拉起，顶部停留1秒挤压背阔肌，控制下放", vid:"DMo3HJoycS8"},
  {n:"前水平拉背", m:"背", eq:"bodyweight", diff:"高级", desc:"极难自重背部动作，需要强大核心和背力", tips:"身体悬空成水平，背部和核心共同发力维持", vid:""},

  // 肩部 - 初级
  {n:"派克俯卧撑", m:"肩", eq:"bodyweight", diff:"初级", desc:"倒V形俯卧撑，侧重三角肌前束", tips:"臀部抬高成倒V，头部朝下推起，比标准俯卧撑更练肩", vid:""},
  {n:"侧平举（水瓶/弹力带）", m:"肩", eq:"bodyweight", diff:"初级", desc:"居家用水瓶或弹力带替代哑铃练中束", tips:"轻阻力起步，拇指略低于小指，不要借腰部甩", vid:""},
  {n:"哑铃肩推", m:"肩", eq:"dumbbell", diff:"初级", desc:"哑铃肩推活动度更大，适合入门", tips:"肘部推到与头齐或略高，不要过度后仰腰部", vid:"qEw16sOSXU"},
  {n:"哑铃侧平举", m:"肩", eq:"dumbbell", diff:"初级", desc:"针对三角肌中束，打造宽肩", tips:"轻重量起步，拇指略低于小指，不要借助腰部甩", vid:"3VcLxVrs9s"},
  {n:"绳索面拉", m:"肩", eq:"gym", diff:"初级", desc:"训练肩袖和中/后三角，必做辅助动作", tips:"保持双手高于肘，绳索拉向脸部，肩胛收紧", vid:"rep-qJOlrkQ"},
  // 肩部 - 中级
  {n:"靠墙倒立撑", m:"肩", eq:"bodyweight", diff:"中级", desc:"靠墙倒立推起，自重肩推进阶", tips:"脚靠墙保持平衡，头不要碰墙，控制下放速度", vid:""},
  {n:"折刀俯卧撑", m:"肩", eq:"bodyweight", diff:"中级", desc:"双脚抬高加大肩部负荷", tips:"脚放高处，臀部高抬，下落时头部在双手前方触地", vid:""},
  {n:"杠铃肩推", m:"肩", eq:"gym", diff:"中级", desc:"站姿/坐姿杠铃肩推，力量进阶", tips:"不要把杆推到头后，推过头顶略微前倾，避免腰椎压迫", vid:"2yq1m98GOM"},
  {n:"哑铃前平举", m:"肩", eq:"dumbbell", diff:"中级", desc:"针对三角肌前束", tips:"手臂不超过肩高，控制下放，配合侧平举使用", vid:""},
  {n:"哑铃俯身飞鸟", m:"肩", eq:"dumbbell", diff:"中级", desc:"针对三角肌后束，改善圆肩", tips:"上身前倾约60°，手肘微弯，双臂向后外侧展开", vid:""},
  // 肩部 - 高级
  {n:"阿诺德推举", m:"肩", eq:"dumbbell", diff:"高级", desc:"旋转动作涵盖三角肌三个头", tips:"起始手掌朝内，推举过程中旋转手腕到手掌朝外，推高后旋回", vid:""},
  {n:"宽握上拉（上斜）", m:"肩", eq:"gym", diff:"高级", desc:"宽握上拉专项训练三角肌中束", tips:"握距稍宽于肩，以肘部带动上拉，拉至下颌位置", vid:""},
  {n:"倒立撑（离墙）", m:"肩", eq:"bodyweight", diff:"高级", desc:"无辅助倒立推起，自重肩推极限", tips:"核心绷紧保持一条线，控制下放速度，头部不触地", vid:""},

  // 手臂 - 初级
  {n:"凳上反屈伸（三头）", m:"臂", eq:"bodyweight", diff:"初级", desc:"用椅子/床沿做臂屈伸，练三头", tips:"手撑椅子边缘，身体下沉至肘90°，不要过度下沉伤肩", vid:""},
  {n:"毛巾弯举（二头）", m:"臂", eq:"bodyweight", diff:"初级", desc:"脚踩毛巾/弹力带做弯举，居家练二头", tips:"脚踩中间，双手抓两端弯举，感受二头收缩", vid:""},
  {n:"哑铃二头弯举", m:"臂", eq:"dumbbell", diff:"初级", desc:"二头肌基础训练", tips:"肘部固定在身体两侧，只靠二头收缩发力", vid:"Q-Z7Nzp9tI"},
  {n:"绳索三头下压", m:"臂", eq:"gym", diff:"初级", desc:"三头肌基础孤立训练", tips:"肘部紧贴体侧，手臂完全打直再回放，感受三头收缩", vid:"VnFWB5f6TU"},
  {n:"锤式弯举", m:"臂", eq:"dumbbell", diff:"初级", desc:"中立握姿，同时训练肱桡肌", tips:"拇指朝上的中立握，动作同哑铃弯举", vid:""},
  // 手臂 - 中级
  {n:"窄距俯卧撑（三头）", m:"臂", eq:"bodyweight", diff:"中级", desc:"窄距推起，三头为主力源", tips:"双手与肩同宽或更窄，肘部贴身下落，三头发力推起", vid:""},
  {n:"杠铃弯举", m:"臂", eq:"gym", diff:"中级", desc:"可以使用更大重量的二头训练", tips:"直杆可能导致手腕不适，可换EZ杆，不要借惯性摆动", vid:""},
  {n:"双杠臂屈伸（三头）", m:"臂", eq:"gym", diff:"中级", desc:"身体竖直的双杠，重点训练三头", tips:"身体竖直，肘部向后夹，而非向外展开", vid:""},
  {n:"哑铃三头臂屈伸（颈后）", m:"臂", eq:"dumbbell", diff:"中级", desc:"双手持哑铃颈后臂屈伸，练三头长头", tips:"双手握一个哑铃，从颈后向上推，肘部指向天花板", vid:"XQ5RZ5fJZJo"},
  // 手臂 - 高级
  {n:"牧师弯举", m:"臂", eq:"gym", diff:"高级", desc:"在牧师台上的弯举，完全孤立二头", tips:"上臂贴紧斜板，顶端有意识收缩二头峰值", vid:""},
  {n:"俯身三头臂屈伸", m:"臂", eq:"dumbbell", diff:"高级", desc:"哑铃俯身三头臂屈伸，强效收缩", tips:"上臂与地面平行，只靠三头伸直手臂", vid:""},
  {n:"单臂反屈伸（椅子）", m:"臂", eq:"bodyweight", diff:"高级", desc:"单臂椅子臂屈伸，极高难度三头训练", tips:"单手撑椅子，身体下沉至肘90°，三头发力推起", vid:""},

  // 核心 - 初级
  {n:"平板支撑", m:"核心", eq:"bodyweight", diff:"初级", desc:"核心稳定训练基础，激活腹横肌", tips:"身体保持一条直线，不要塌腰或撅臀，自然呼吸", vid:"pSHjPAE1pDo"},
  {n:"卷腹", m:"核心", eq:"bodyweight", diff:"初级", desc:"训练腹直肌上部", tips:"下背部贴地，手放头后不要拉颈，以腹肌收缩带动起身", vid:"Xyd_fgl5k8"},
  {n:"死虫式", m:"核心", eq:"bodyweight", diff:"初级", desc:"对脊柱友好的核心激活动作", tips:"下背部始终贴地，对侧手腿同时缓慢伸展", vid:""},
  // 核心 - 中级
  {n:"俄罗斯转体", m:"核心", eq:"bodyweight", diff:"中级", desc:"训练腹斜肌和旋转力量", tips:"上身后倾约45°，双脚离地增加难度，以腹斜肌带动旋转", vid:""},
  {n:"悬挂举腿", m:"核心", eq:"gym", diff:"中级", desc:"悬挂于单杠上举腿，训练下腹", tips:"抓杠，膝盖弯曲举腿，不要借助惯性甩腿", vid:"l4S1E3q0XM"},
  {n:"健腹轮", m:"核心", eq:"gym", diff:"中级", desc:"全方位核心训练，效果极好", tips:"从膝盖跪地开始，向前滚出时保持核心收紧，不要让腰下塌", vid:""},
  // 核心 - 高级
  {n:"悬挂直腿举", m:"核心", eq:"gym", diff:"高级", desc:"直腿举起难度更大，训练全腹", tips:"控制下放速度，不借惯性，感受腹肌全程张力", vid:""},
  {n:"龙旗", m:"核心", eq:"gym", diff:"高级", desc:"顶级核心动作，全腹激活", tips:"抓住训练椅背，身体保持一条线缓慢下放，需要强大核心力量", vid:""},

  // 有氧 — LISS 低强度持续有氧（初级）
  {n:"慢跑/快走", m:"有氧", eq:"bodyweight", diff:"初级", desc:"最易坚持的低强度有氧(LISS)", tips:"保持能正常说话的配速，建议30-45分钟", vid:""},
  {n:"跳绳", m:"有氧", eq:"bodyweight", diff:"初级", desc:"高效燃脂有氧，随时随地", tips:"前脚掌轻落地，手腕发力，保持节奏", vid:""},
  {n:"开合跳", m:"有氧", eq:"bodyweight", diff:"初级", desc:"全身协调有氧，适合热身或LISS", tips:"保持匀速，可作为低强度有氧进行", vid:""},
  {n:"骑行（户外/动感单车）", m:"有氧", eq:"bodyweight", diff:"初级", desc:"对膝盖友好的低冲击有氧", tips:"保持60-70%心率，能正常说话的阻力", vid:""},
  {n:"快走爬坡", m:"有氧", eq:"bodyweight", diff:"初级", desc:"坡度步行，燃脂效率高", tips:"坡度5-10%，速度4-5km/h，保持心率 Zone2", vid:""},
  // 有氧 — HIIT 高强度间歇（中级）
  {n:"波比跳", m:"有氧", eq:"bodyweight", diff:"中级", desc:"全身爆发力训练，有氧无氧结合", tips:"循序渐进增加组数，注意落地时膝盖缓冲", vid:"dZ1Z2x7C8qk"},
  {n:"高抬腿跑", m:"有氧", eq:"bodyweight", diff:"中级", desc:"原地高抬腿，强化心肺与腿部", tips:"膝盖抬至腰部高度，保持核心紧绷，节奏由慢到快", vid:""},
  {n:"登山跑", m:"有氧", eq:"bodyweight", diff:"中级", desc:"俯卧撑姿势交替提膝，核心+心肺", tips:"保持臀部不高耸，快速交替提膝，30秒一组", vid:""},
  {n:"跳跃深蹲", m:"有氧", eq:"bodyweight", diff:"中级", desc:"深蹲+跳，爆发力+有氧", tips:"落地轻，膝盖微弯缓冲，连续进行", vid:""},
  {n:"原地冲刺跑", m:"有氧", eq:"bodyweight", diff:"中级", desc:"原地快速摆臂摆腿，模拟冲刺", tips:"前脚掌着地，手臂大幅摆动，全力20-30秒", vid:""},
  // 有氧 — 高级 HIIT
  {n:"战绳（双绳波浪）", m:"有氧", eq:"gym", diff:"高级", desc:"全身爆发，极高效HIIT", tips:"双脚站稳，双手交替甩绳，保持30-45秒", vid:""},
  {n:"箱子跳", m:"有氧", eq:"gym", diff:"高级", desc:"跳跃爆发力+有氧，高强度", tips:"落地稳，膝盖不过脚尖，逐步增加高度", vid:""},
  {n:"滑雪机", m:"有氧", eq:"gym", diff:"高级", desc:"全身参与的高强度有氧器械", tips:"保持节奏，手臂和核心发力，全力冲刺30秒", vid:""},

  // ============ 康复/恢复动作 ============
  // 膝盖康复
  {n:"直腿抬高", m:"康复", eq:"bodyweight", diff:"初级", desc:"强化股四头肌，保护膝盖", tips:"仰卧，一条腿伸直抬高至45°，保持5秒，慢放。膝盖不适时的安全训练", vid:""},
  {n:"靠墙静蹲（温和）", m:"康复", eq:"bodyweight", diff:"初级", desc:"温和激活腿部肌肉，低膝盖压力", tips:"背靠墙，屈膝不超过30°，保持10-30秒。比深蹲安全", vid:""},
  {n:"踝关节泵", m:"康复", eq:"bodyweight", diff:"初级", desc:"促进下肢血液循环，辅助膝盖恢复", tips:"坐或卧，反复勾脚尖+绷脚尖，每次10-15下，每天多次", vid:""},
  {n:"髋外展（侧卧）", m:"康复", eq:"bodyweight", diff:"初级", desc:"强化臀中肌，稳定膝盖", tips:"侧卧，上方腿伸直外展至45°，慢起慢放。膝盖不适常因臀部无力", vid:""},

  // 腰背康复
  {n:"猫牛式", m:"康复", eq:"bodyweight", diff:"初级", desc:"温和活动脊柱，缓解腰背紧张", tips:"四足撑地，吸气塌腰抬头（牛式），呼气弓背低头（猫式）。动作缓慢", vid:""},
  {n:"死虫式", m:"康复", eq:"bodyweight", diff:"初级", desc:"安全的核心训练，不增加腰部压力", tips:"仰卧，双臂伸直向上，双腿抬起呈90°。缓慢对侧放低手臂和腿，保持腰部贴地", vid:""},
  {n:"鸟狗式", m:"康复", eq:"bodyweight", diff:"初级", desc:"核心稳定性训练，护腰", tips:"四足撑地，同时伸直对侧手臂和腿，保持身体稳定2秒。慢起慢放", vid:""},
  {n:"骨盆倾斜", m:"康复", eq:"bodyweight", diff:"初级", desc:"温和激活深层核心，缓解腰痛", tips:"仰卧屈膝，轻微收紧腹部使腰部贴地，保持5秒后放松。重复10次", vid:""},

  // 肩部康复
  {n:"肩部环绕（温和）", m:"康复", eq:"bodyweight", diff:"初级", desc:"温和活动肩关节，改善灵活性", tips:"双臂自然下垂，小幅度画圈，逐渐增大。疼痛即停", vid:""},
  {n:"墙面滑行（Wall Slide）", m:"康复", eq:"bodyweight", diff:"初级", desc:"重建肩部稳定性，改善肩胛骨控制", tips:"背靠墙，双臂贴墙上滑至头顶，再缓慢下滑。保持腰背贴墙", vid:""},
  {n:"肩部外旋拉伸", m:"康复", eq:"bodyweight", diff:"初级", desc:"拉伸肩部前侧，改善圆肩", tips:"患侧手臂横过胸前，健康手轻压肘部。保持30秒", vid:""},
  {n:"门框拉伸（胸肌）", m:"康复", eq:"bodyweight", diff:"初级", desc:"拉伸胸肌，改善圆肩（圆肩常导致肩痛）", tips:"站在门框旁，手臂90°抵住门框，身体缓慢前倾。保持30秒", vid:""},

  // 手腕康复
  {n:"手腕屈伸（温和）", m:"康复", eq:"bodyweight", diff:"初级", desc:"温和活动腕关节，促进恢复", tips:"前臂放桌上，手腕悬空，缓慢上下摆动。不加重疼痛", vid:""},
  {n:"手指展开+握拳", m:"康复", eq:"bodyweight", diff:"初级", desc:"促进手部血液循环，缓解手腕紧张", tips:"用力展开手指→握拳，重复10-15次。动作轻柔", vid:""},
  {n:"前臂旋转", m:"康复", eq:"bodyweight", diff:"初级", desc:"改善前臂肌肉灵活性", tips:"坐或站，前臂水平伸直，反复旋转手掌朝上/下。动作缓慢", vid:""},

  // 脚踝康复
  {n:"脚踝字母练习", m:"康复", eq:"bodyweight", diff:"初级", desc:"温和活动踝关节，改善灵活性", tips:"坐姿，大脚趾在空中写字母A-Z。每个字母慢写", vid:""},
  {n:"提踵（温和）", m:"康复", eq:"bodyweight", diff:"初级", desc:"强化小腿肌肉，稳定脚踝", tips:"双手扶墙，缓慢提踵至最高点，保持2秒，慢放。疼痛即停", vid:""},
  {n:"脚踝环绕", m:"康复", eq:"bodyweight", diff:"初级", desc:"温和活动踝关节", tips:"坐姿或站姿，脚尖画圈，顺逆时针各10次。动作轻柔", vid:""},

  // 通用恢复
  {n:"泡沫轴放松（大腿）", m:"康复", eq:"bodyweight", diff:"初级", desc:"放松股四头肌和IT band，促进恢复", tips:"趴在泡沫轴上，从膝盖上方滚到大腿根部。痛点停留30秒", vid:""},
  {n:"泡沫轴放松（背部）", m:"康复", eq:"bodyweight", diff:"初级", desc:"放松上背部肌肉，缓解紧张", tips:"仰卧，泡沫轴垫在肩胛骨下方，双手抱头，缓慢上下滚动。避开腰椎", vid:""},
  {n:"深呼吸放松", m:"康复", eq:"bodyweight", diff:"初级", desc:"激活副交感神经，促进恢复", tips:"仰卧，一手放胸一手放腹，吸气时腹部鼓起，呼气时腹部收缩。5-10分钟", vid:""},

];

// GIF动图映射（中文动作名 → GIF文件名）
var GIF_MAP = {"腿举（低重量）":"7zdxRTl.gif","箭步蹲":"t8iSghb.gif","臀桥":"qKBpF7I.gif","哑铃深蹲":"HsvHqgf.gif","深蹲跳":"1gFNTZV.gif","保加利亚分腿蹲（徒手）":"arsYEd3.gif","单腿臀桥":"rmEukuS.gif","罗马尼亚硬拉":"wQ2c4XD.gif","保加利亚深蹲":"arsYEd3.gif","腿弯举":"C5jncD2.gif","前蹲":"zG0zs85.gif","单腿深蹲（枪式）":"H6ybluc.gif","哈克深蹲":"Qa55kX1.gif","俯卧撑":"I4hDWkc.gif","宽距俯卧撑":"JmMVpR3.gif","哑铃平板卧推":"SpYC0Kp.gif","哑铃飞鸟":"yz9nUhF.gif","下斜俯卧撑":"i5cEhka.gif","钻石俯卧撑":"soIB2rj.gif","杠铃卧推":"EIeI8Vf.gif","上斜杠铃卧推":"3TZduzM.gif","双杠臂屈伸（胸）":"9WTm7dq.gif","史密斯机卧推":"yB9SvIF.gif","反向划船":"3xK09Sk.gif","高位下拉（宽握）":"ecpY0rH.gif","哑铃单臂划船":"BJ0Hz5L.gif","坐姿绳索划船":"fUBheHs.gif","引体向上（门框/公园杠）":"lBDjFxJ.gif","引体向上":"lBDjFxJ.gif","T杠划船":"aaXr7ld.gif","宽握引体（加重）":"HMzLjXx.gif","派克俯卧撑":"sVvXT5J.gif","侧平举（水瓶/弹力带）":"goJ6ezq.gif","哑铃肩推":"84RyJf8.gif","哑铃侧平举":"DsgkuIt.gif","折刀俯卧撑":"sVvXT5J.gif","哑铃前平举":"3eGE2JC.gif","哑铃俯身飞鸟":"sTfvVsG.gif","阿诺德推举":"Xy4jlWA.gif","宽握上拉（上斜）":"cALKspW.gif","凳上反屈伸（三头）":"DQ0cqkT.gif","毛巾弯举（二头）":"otqIxU4.gif","哑铃二头弯举":"uSkDMYl.gif","绳索三头下压":"qRZ5S1N.gif","锤式弯举":"slDvUAU.gif","窄距俯卧撑（三头）":"ufaxB52.gif","杠铃弯举":"25GPyDY.gif","双杠臂屈伸（三头）":"bZq4bwK.gif","牧师弯举":"P2lNrGL.gif","俯身三头臂屈伸":"vvNjDJS.gif","平板支撑":"hCjGsRQ.gif","卷腹":"BMMolZ3.gif","死虫式":"iny3m5y.gif","俄罗斯转体":"XVDdcoj.gif","悬挂举腿":"QOA0FD0.gif","健腹轮":"xnInPfE.gif","骑行（户外/动感单车）":"H1PESYI.gif","波比跳":"dK9394r.gif","高抬腿跑":"J9zIWig.gif","登山跑":"RJgzwny.gif","跳跃深蹲":"1gFNTZV.gif","原地冲刺跑":"Qoujh3Q.gif","箱子跳":"iPm26QU.gif","滑雪机":"vpQaQkH.gif","靠墙静蹲（温和）":"sVQCCeG.gif","踝关节泵":"uL9CsKm.gif","髋外展（侧卧）":"WL4EmxJ.gif","骨盆倾斜":"NKJ8o6x.gif","肩部外旋拉伸":"FWdVhcW.gif","门框拉伸（胸肌）":"QoHIhPl.gif","手腕屈伸（温和）":"vUTfFHw.gif","手指展开+握拳":"mtXengz.gif","提踵（温和）":"u5ESqzH.gif","脚踝环绕":"uL9CsKm.gif","硬拉":"ila4NZS.gif","慢跑/快走":"oLrKqDH.gif","开合跳":"HtfCpfi.gif","快走爬坡":"rjiM4L3.gif","战绳（双绳波浪）":"RJa4tCo.gif","泡沫轴放松（背部）":"isofgzg.gif"};

// 纯自重动作名集合（进度页不为其绘制重量趋势）
var BODYWEIGHT_EX_NAMES = new Set();
EXES.forEach(function(e){ if (e.eq === "bodyweight") BODYWEIGHT_EX_NAMES.add(e.n); });

// ============ 配置参数（含重量建议）============
var CONFIGS = {
  beginner: {
    sets: 3,
    muscle:   {reps:"12-15次", rest:"60秒", intensity:"50-65% 1RM", rpe:"RPE 5-7", note:"感受肌肉发力，以正确动作为首要目标"},
    strength: {reps:"8-10次",  rest:"90秒", intensity:"60-70% 1RM", rpe:"RPE 6-7", note:"注意动作规范，不追求大重量"},
    cut:      {reps:"15-20次", rest:"45秒", intensity:"40-55% 1RM", rpe:"RPE 5-6", note:"保持运动节奏，以轻重量高次数燃脂"},
    cardio:   {reps:"—", totalDuration:"20分钟", hiitPerSet:"20秒工作 + 40秒休息", lissPerSet:"持续进行", rest:"60秒", intensity:"心率 55-65%", rpe:"RPE 4-5", note:"轻松有氧为主，能正常说话的配速"},
    marathon: {weeklyKms:"30-45", longRunMax:30, easyPace:"6:30-7:00", tempoPace:"5:30-6:00", intervalPace:"5:00-5:30", longRunPace:"6:30-7:30", rpe:"轻松跑RPE4-5/LSD RPE5-6/节奏RPE7-8", note:"目标：安全完赛（4:30-5:30），享受比赛"}
  },
  intermediate: {
    sets: 4,
    muscle:   {reps:"8-12次",  rest:"75秒", intensity:"65-75% 1RM", rpe:"RPE 7-8", note:"力竭前留1-2个(RIR)，追求肌肉泵感"},
    strength: {reps:"5-8次",   rest:"2分钟",intensity:"75-85% 1RM", rpe:"RPE 8-9", note:"每组接近力竭，记录每次重量"},
    cut:      {reps:"12-15次", rest:"30秒", intensity:"55-65% 1RM", rpe:"RPE 7-8", note:"可使用超级组提升燃脂效率"},
    cardio:   {reps:"—", totalDuration:"30分钟", hiitPerSet:"30秒工作 + 30秒休息", lissPerSet:"持续进行", rest:"45秒", intensity:"心率 65-80%", rpe:"LISS RPE5-6 / HIIT RPE8-9", note:"HIIT与LISS交替进行"},
    marathon: {weeklyKms:"50-70", longRunMax:35, easyPace:"5:30-6:00", tempoPace:"4:45-5:15", intervalPace:"4:15-4:30", longRunPace:"6:00-6:30", rpe:"轻松跑RPE4-5/LSD RPE5-6/节奏RPE7-8", note:"目标：sub 4:00-4:30，有比赛经验"}
  },
  advanced: {
    sets: 5,
    muscle:   {reps:"6-10次",  rest:"90秒", intensity:"75-85% 1RM", rpe:"RPE 8-9", note:"力竭前留1个RIR，考虑降重组"},
    strength: {reps:"3-6次",   rest:"3分钟",intensity:"85%+ 1RM",   rpe:"RPE 8-10", note:"加入RPE评估，追求渐进超负荷"},
    cut:      {reps:"10-12次", rest:"20秒", intensity:"65-75% 1RM", rpe:"RPE 8-9", note:"超级组+递减组，最大化热量消耗"},
    cardio:   {reps:"—", totalDuration:"40分钟", hiitPerSet:"45秒工作 + 15秒休息", lissPerSet:"持续进行", rest:"20秒", intensity:"心率 70-85%", rpe:"LISS RPE6-7 / HIIT RPE9-10", note:"高强度间歇为主，最大化燃脂效果"},
    marathon: {weeklyKms:"70-100", longRunMax:38, easyPace:"4:45-5:15", tempoPace:"4:15-4:30", intervalPace:"3:45-4:00", longRunPace:"5:15-5:45", rpe:"轻松跑RPE4-5/LSD RPE5-6/节奏RPE7-8", note:"目标：sub 3:30，冲击PB"}
  }
};
// RPE 自感强度参考表
var RPE_SCALE = [
  {rpe:1, desc:"几乎不动", pct:"<10%"},{rpe:2, desc:"非常轻松", pct:"10-20%"},{rpe:3, desc:"轻松", pct:"20-30%"},
  {rpe:4, desc:"中等轻松", pct:"30-40%"},{rpe:5, desc:"中等", pct:"40-50%"},{rpe:6, desc:"中等偏难", pct:"50-65%"},
  {rpe:7, desc:"困难但不痛苦", pct:"65-75%"},{rpe:8, desc:"困难", pct:"75-85%"},{rpe:9, desc:"非常困难", pct:"85-95%"},
  {rpe:10, desc:"极限，无法再多做一次", pct:"100%"}
];

// 热身组建议
function getWarmup(level, goal) {
  if (goal === "cardio" || goal === "marathon") {
    return {
      type:"run",
      warmup:[
        "关节激活：踝关节绕环、膝关节屈伸、髋关节画圈（各30秒）",
        "动态拉伸：高抬腿30秒 + 后踢腿30秒 + 弓步转体每侧5次",
        "轻松慢跑 5-8 分钟，逐步提升心率"
      ],
      cooldown:[
        "慢跑/快走 5 分钟让心率缓慢下降",
        "静态拉伸（每个动作保持20-30秒）：股四头肌、腘绳肌、小腿、臀肌、髂腰肌",
        "泡沫轴放松：大腿前后侧、小腿、臀部（每个部位30-60秒）"
      ]
    };
  }
  if (level === "beginner") return {type:"lift", sets:[{s:2, r:"10-15次", i:"空杆/极轻", n:"活动关节，熟悉动作轨迹"}]};
  if (level === "intermediate") return {type:"lift", sets:[
    {s:1, r:"10次", i:"40% 1RM", n:"热身激活"},
    {s:1, r:"6次",  i:"60% 1RM", n:"过渡组"}
  ]};
  return {type:"lift", sets:[
    {s:1, r:"10次", i:"40% 1RM", n:"热身"},
    {s:1, r:"5次",  i:"60% 1RM", n:"过渡"},
    {s:1, r:"3次",  i:"80% 1RM", n:"冲组准备"}
  ]};
}

// 周期化：第1周偏移0，第2周偏移1，第3周偏移2，第4周(减载)与第3周一致
function getWeekOffset(week) {
  if (week === 4) return 2; // 减载周保持与第3周相同动作，只降重量
  return week - 1;
}

// 周期化进度
var WEEK_INFO = [
  {note:"基础适应周 — 重点掌握动作模式，不追求重量", deload:false, weightAdjust:"+0%"},
  {note:"渐进超负荷 — 尝试增加重量 2.5-5kg，保持次数", deload:false, weightAdjust:"+5%"},
  {note:"挑战周 — 继续增加重量或次数，接近力竭", deload:false, weightAdjust:"+10%"},
  {note:"减载周（Deload）— 重量降至70%，让身体充分恢复", deload:true, weightAdjust:"-30%"}
];

// 心肺目标4周周期化配置（覆盖 WEEK_INFO 和 goalCfg 中的心肺参数）
// durationPct: 基础 totalDuration 的百分比（0.8 = 减20%）
// hiitRoundsAdjust: 在基础 sets 上的增减（控制 HIIT 组数）
// hiitPerSet: HIIT 每组的工作/休息比例
// intensity: 心率区间
// rpe: RPE 范围
var CARDIO_WEEK_CONFIG = [
  {note:"基础适应周 — 建立有氧基础，保持轻松节奏，感受身体反应", deload:false, weightAdjust:"总量 -20%",
   durationPct:0.8, hiitRoundsAdjust:0, hiitPerSet:"20秒工作 + 40秒休息", intensity:"心率 55-65%", rpe:"RPE 4-5"},
  {note:"渐进递增 — 延长LISS时长，HIIT增加1组，逐步提升心率", deload:false, weightAdjust:"总量 +10%",
   durationPct:1.0, hiitRoundsAdjust:1, hiitPerSet:"30秒工作 + 30秒休息", intensity:"心率 60-75%", rpe:"RPE 5-7"},
  {note:"挑战周 — 提升强度，HIIT工作时间延长，接近极限心率", deload:false, weightAdjust:"总量 +20%",
   durationPct:1.1, hiitRoundsAdjust:1, hiitPerSet:"40秒工作 + 20秒休息", intensity:"心率 70-85%", rpe:"RPE 7-9"},
  {note:"恢复周 — 降低总时长30%，减少HIIT组数，让心肺充分适应", deload:true, weightAdjust:"总量 -30%",
   durationPct:0.7, hiitRoundsAdjust:-1, hiitPerSet:"30秒工作 + 45秒休息", intensity:"心率 55-70%", rpe:"RPE 4-5"}
];

// 马拉松16周训练周期
var MARATHON_PHASES = [
  {name:"基础期", weeks:[1,2,3,4], color:"#F59E0B", desc:"建立有氧基础，每周跑量渐进，以轻松跑+LSD为主"},
  {name:"强化期", weeks:[5,6,7,8], color:"#EF4444", desc:"加入节奏跑和间歇跑，提升乳酸阈值和速度耐力"},
  {name:"巅峰期", weeks:[9,10,11,12], color:"#8B5CF6", desc:"跑量峰值，LSD达到最长距离，模拟比赛配速"},
  {name:"减量期", weeks:[13,14,15,16], color:"#3B82F6", desc:"Taper！跑量降至60%→40%→30%，储备糖原，迎接比赛"}
];
var MARATHON_WEEK_NOTES = {
  1:"轻松跑适应，建立跑步习惯", 2:"增加LSD至初段距离", 3:"保持跑量，感受节奏", 4:"基础期收尾，准备进入强化",
  5:"首次加入节奏跑", 6:"间歇跑入门，提升速度", 7:"跑量继续递增", 8:"强化期峰值，LSD拉长",
  9:"巅峰期开始，跑量最大", 10:"LSD接近目标距离", 11:"模拟比赛配速节奏", 12:"巅峰期收尾，最后一次长距离",
  13:"减量第一周，跑量降至60%", 14:"继续减量，保持轻松跑", 15:"赛前最后一周，跑量30%", 16:"比赛周！放松跑+碳水加载"
};

// 配速计算器
function calcMarathonPaces(targetH, targetM) {
  var totalMin = targetH * 60 + targetM;
  var marathonPace = totalMin / 42.195; // min/km
  function fmt(min){ var m=Math.floor(min), s=Math.round((min-m)*60); return m+":"+(s<10?"0":"")+s; }
  return {
    marathon: fmt(marathonPace),
    easyMin: fmt(marathonPace + 0.75),
    easyMax: fmt(marathonPace + 1.5),
    tempoMin: fmt(marathonPace - 0.25),
    tempoMax: fmt(marathonPace - 0.5),
    interval: fmt(marathonPace - 0.75),
    lsdMin: fmt(marathonPace + 0.5),
    lsdMax: fmt(marathonPace + 1.0)
  };
}

function renderPaceResult() {
  var h = parseInt(document.getElementById('paceH').value) || 4;
  var m = parseInt(document.getElementById('paceM').value) || 30;
  var paces = calcMarathonPaces(h, m);
  // 存储自定义配速，供训练卡片使用
  window._marathonPaces = paces;
  try { localStorage.setItem("fitbuddy_marathon_paces", JSON.stringify(paces)); } catch(e) {}
  // 实时更新训练卡片上的配速显示
  updateMarathonPaceDisplay(paces);
  var rows = [
    {label:"🏁 比赛配速",    val:paces.marathon+"/km"},
    {label:"🟢 轻松跑",     val:paces.easyMin+"-"+paces.easyMax+"/km"},
    {label:"🟡 节奏跑",     val:paces.tempoMin+"-"+paces.tempoMax+"/km"},
    {label:"🔴 间歇跑",     val:paces.interval+"/km"},
    {label:"🔵 LSD长距离",  val:paces.lsdMin+"-"+paces.lsdMax+"/km"}
  ];
  var html = '<div style="background:var(--bg);border-radius:10px;padding:10px 12px;">'+
    '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px;">目标完赛 '+h+'小时'+m+'分 → 比赛配速 '+paces.marathon+'/km</div>';
  rows.forEach(function(r){
    html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid var(--border);">'+
      '<span style="color:var(--text2);">'+r.label+'</span>'+
      '<span style="font-weight:700;color:var(--text);">'+r.val+'</span></div>';
  });
  html += '</div>';
  document.getElementById('paceResult').innerHTML = html;
}

// 将自定义配速更新到训练卡片上
function updateMarathonPaceDisplay(paces) {
  if (!paces) return;
  var cards = document.querySelectorAll('.plan-day');
  cards.forEach(function(card) {
    // 获取训练日名称来判断跑步类型
    var nameEl = card.querySelector('.plan-day-name');
    var dayName = nameEl ? nameEl.textContent : '';
    var exSetEls = card.querySelectorAll('.ex-sets');
    exSetEls.forEach(function(el) {
      if (el.textContent.indexOf('配速') < 0) return;
      var pace;
      if (dayName.indexOf('间歇') >= 0) pace = paces.interval + '/km';
      else if (dayName.indexOf('LSD') >= 0 || dayName.indexOf('长距离') >= 0) pace = paces.lsdMin + '-' + paces.lsdMax + '/km';
      else if (dayName.indexOf('节奏') >= 0) pace = paces.tempoMin + '-' + paces.tempoMax + '/km';
      else if (dayName.indexOf('配速') >= 0) pace = paces.marathon + '/km';
      else pace = paces.easyMin + '-' + paces.easyMax + '/km';
      el.textContent = '\u{1F3C3} 配速 ' + pace;
    });
  });
}

// 休息日建议
var REST_TIPS = {
  muscle: ["全身拉伸 10-15 分钟，重点拉伸训练过的肌群", "泡沫轴放松紧张部位，每个部位 2-3 分钟", "保证蛋白质摄入，每餐 25-30g"],
  strength: ["轻度散步 20-30 分钟促进血液循环", "进行关节灵活性训练", "充足睡眠是力量恢复的关键"],
  cut: ["低强度散步 30-45 分钟（可选）", "多喝水，保持饱腹感", "控制热量摄入但不要过度节食"],
  cardio: ["拉伸腿部和髋部肌群", "泡热水澡或热敷帮助恢复", "补充电解质和水分"],
  marathon: ["完全休息或交叉训练（游泳/骑行/瑜伽 30min）", "泡沫轴放松小腿、大腿前后侧、臀部", "碳水补充（每kg体重 5-7g），修复糖原储备", "检查跑鞋磨损，周跑量>50km需半年换鞋"],
};

// 训练建议文案
var GOAL_TIPS = {
  muscle: ["训练前补充碳水+蛋白质，提升表现", "每组做到接近力竭（留1-2个RIR）", "每隔4-6周进行超量恢复周", "睡眠充足是增肌的关键，保证7-9小时"],
  strength: ["每个动作做充分热身组（从40%逐步升重）", "记录每次重量，目标每周微小进步", "力量训练核心不亚于技术动作，优先保证姿势", "学会使用腰带，但不要依赖"],
  cut: ["制造热量缺口是减脂核心，约-300~-500大卡", "训练日保持蛋白质摄入 >= 体重(kg)x1.6g", "有氧推荐在餐后或早晨空腹进行", "减脂期保留力量训练，防止肌肉流失"],
  cardio: ["有氧训练心率目标区间: 最大心率的65-80%", "交替进行LISS（低强度稳态）和HIIT（高强度间歇）", "保持充足水分，每小时至少600ml", "拉伸与恢复和训练本身同等重要"],
  marathon: ["80%跑量应在Zone 2（能完整对话的心率）", "LSD是每周最重要的训练，不要跳过", "赛前3周开始减量(Taper)，跑量降至60%→40%→30%", "比赛日：不要穿新鞋！赛前吃碳水，每5km补水"],
};

// 饮食建议（按目标区分）
var FOOD_GUIDE = {
  muscle: {
    protein: ["鸡胸肉","鸡蛋（全蛋）","瘦牛肉","三文鱼/虾","老豆腐/豆干","希腊酸奶","乳清蛋白粉"],
    carb:    ["糙米饭","红薯/紫薯","燕麦片","全麦面包","藜麦","香蕉"],
    fat:     ["杏仁/核桃","牛油果","橄榄油","花生酱"],
    snack:   ["全麦面包+花生酱","希腊酸奶+蓝莓","水煮蛋 2个","蛋白棒"],
    timing:  ["训前 1-2h：碳水+少量蛋白（如 香蕉+1个蛋）","训后 30min：快碳+蛋白质（如 脱脂奶+燕麦+蛋白粉）","睡前：酪蛋白来源（如 牛奶/酸奶）"]
  },
  strength: {
    protein: ["鸡胸肉","鸡蛋","瘦牛肉","鱼虾类","乳清蛋白","豆腐"],
    carb:    ["糙米饭","燕麦","红薯","全麦面包","藜麦","土豆"],
    fat:     ["坚果","橄榄油","牛油果","亚麻籽"],
    snack:   ["香蕉+花生酱","牛奶+燕麦","牛肉干","水煮蛋"],
    timing:  ["训前 1.5h：碳水为主（如 燕麦+香蕉）","训后 30min：蛋白+碳水（如 鸡胸+红薯）","保证训练日热量充足，大重量日适当加碳"]
  },
  cut: {
    protein: ["鸡胸肉（去皮）","鸡蛋清","虾仁","龙利鱼","脱脂希腊酸奶","豆腐"],
    carb:    ["燕麦","红薯","糙米（少量）","荞麦面","玉米"],
    fat:     ["少量坚果（每天10-15g）","橄榄油（烹饪用）"],
    snack:   ["黄瓜条+低脂蘸酱","蛋白粉+水","零糖气泡水","无糖酸奶（少量）"],
    timing:  ["早餐丰盛、午餐适中、晚餐从简","碳水集中在训前训后，其余餐少吃主食","晚上8点后不再进食","每天喝足 2-3L 水抑制饥饿感"]
  },
  cardio: {
    protein: ["鸡蛋","鸡胸肉","鱼肉","虾","牛奶","豆腐"],
    carb:    ["全麦面包","燕麦","红薯","香蕉","糙米饭"],
    fat:     ["坚果","橄榄油","花生酱"],
    snack:   ["香蕉（训前）","电解质饮料","能量胶（长距离）","椰子水"],
    timing:  ["训前 1h：碳水（如 全麦面包+香蕉）","训前 15min：快碳（如 香蕉/能量胶）","训后：碳水+蛋白恢复（如 巧克力奶）","长时间训练途中每小时补充 30-60g 碳水"]
  },
  marathon: {
    protein: ["鸡蛋","鱼肉","鸡胸肉","虾仁","牛奶","豆腐"],
    carb:    ["米饭/面条","红薯/土豆","面包/馒头","燕麦","香蕉","能量胶"],
    fat:     ["坚果","花生酱","橄榄油"],
    snack:   ["香蕉（跑前）","能量胶+水","电解质泡腾片","全麦面包+果酱"],
    timingMorning:  ["赛前 3 天碳水加载（每kg体重 8-10g）","赛前早餐：碳水为主，赛前 2-3h 吃完","LSD 训练中每 45-60min 补充能量胶+水","赛后 30min 黄金窗口：碳水+蛋白=4:1（如 巧克力奶）","比赛日：不要尝试没吃过的食物！"],
    timingEvening:  ["赛前 3 天碳水加载（每kg体重 8-10g）","赛前午餐：碳水为主，跑前 3-4h 吃完（如 12:00 前结束）","跑前 1h 加餐：香蕉/全麦面包+花生酱","下午 14:00 后避免咖啡因（心率叠加风险）","LSD 训练中每 45-60min 补充能量胶+水","赛后 30min 黄金窗口：碳水+蛋白=4:1（如 巧克力奶）","跑完 2h 内不要立刻躺下，影响消化和睡眠","比赛日：不要尝试没吃过的食物！"]
  }
};
