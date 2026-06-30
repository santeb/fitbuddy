/* FitBuddy - 主逻辑 v2.0 */

// ============ 动作数据库（含 YouTube 教学视频）============
const EXERCISES = [
  { name:'杠铃深蹲', muscle:'腿部', key:'leg', equip:'gym', diff:'中级',
    desc:'下肢王牌动作，刺激股四头肌、臀大肌、腘绳肌', tips:'膝盖不内扣，全程脚跟贴地',
    video:'YaX7Hger24g', sets:4, reps:'6-10' },
  { name:'罗马尼亚硬拉', muscle:'腿部', key:'leg', equip:'gym', diff:'中级',
    desc:'主打腘绳肌和臀大肌，髋部驱动', tips:'不要圆背，感受大腿后侧拉伸',
    video:'dQyAodp7L8', sets:4, reps:'8-10' },
  { name:'腿举', muscle:'腿部', key:'leg', equip:'gym', diff:'初级',
    desc:'相对安全的腿部复合动作', tips:'不完全锁死膝盖',
    video:'V6UPhsV3mXM', sets:3, reps:'12-15' },
  { name:'徒手深蹲', muscle:'腿部', key:'leg', equip:'bodyweight', diff:'初级',
    desc:'最适合新手的腿部训练', tips:'脚跟贴地，臀部向后推',
    video:'qENKm4xL0gs', sets:3, reps:'15-20' },
  { name:'保加利亚深蹲', muscle:'腿部', key:'leg', equip:'dumbbell', diff:'中级',
    desc:'单腿训练王牌，强化臀肌', tips:'前脚踩实，后脚辅助平衡',
    video:'2C-uNgKwPLE', sets:3, reps:'10-12/侧' },
  { name:'箭步蹲', muscle:'腿部', key:'leg', equip:'bodyweight', diff:'初级',
    desc:'单腿功能性训练', tips:'前膝不超过脚尖',
    video:'c 9BT7ys1Yg', sets:3, reps:'12-15/侧' },
  { name:'平板杠铃卧推', muscle:'胸部', key:'chest', equip:'gym', diff:'中级',
    desc:'胸部训练王牌，刺激胸大肌+三头+三角肌前束', tips:'脚踩实，背部微弓',
    video:'rT7Orr3yK6c', sets:4, reps:'6-10' },
  { name:'上斜哑铃卧推', muscle:'胸部', key:'chest', equip:'dumbbell', diff:'初级',
    desc:'针对上胸，30-45°角度最佳', tips:'角度不要过高',
    video:'0fREWByVI_U', sets:3, reps:'10-12' },
  { name:'俯卧撑', muscle:'胸部', key:'chest', equip:'bodyweight', diff:'初级',
    desc:'最便利的胸肌训练', tips:'身体一条线，不塌腰',
    video:'IODxDxX7oi4', sets:3, reps:'10-20' },
  { name:'哑铃飞鸟', muscle:'胸部', key:'chest', equip:'dumbbell', diff:'初级',
    desc:'胸肌孤立动作', tips:'臂微弯，控速',
    video:'eozkVa0S0WQ', sets:3, reps:'12-15' },
  { name:'引体向上', muscle:'背部', key:'back', equip:'gym', diff:'中级',
    desc:'背部宽度训练王牌', tips:'肩胛先下压后缩',
    video:'eGo4Iy7QOh8', sets:4, reps:'6-10' },
  { name:'高位下拉', muscle:'背部', key:'back', equip:'gym', diff:'初级',
    desc:'引体向上替代，适合新手', tips:'用背部带动肘部向下',
    video:'D4HKVVnitkY', sets:3, reps:'10-12' },
  { name:'杠铃划船', muscle:'背部', key:'back', equip:'gym', diff:'中级',
    desc:'背部厚度主训练', tips:'腰背挺直不圆背',
    video:'kBWAon7FjuU', sets:4, reps:'8-10' },
  { name:'坐姿绳索划船', muscle:'背部', key:'back', equip:'gym', diff:'初级',
    desc:'安全背部训练', tips:'不过度后仰借力',
    video:'GZQ7XlJG-BM', sets:3, reps:'10-12' },
  { name:'哑铃划船', muscle:'背部', key:'back', equip:'dumbbell', diff:'初级',
    desc:'简单易学的背部训练', tips:'对侧手撑住，背部挺直',
    video:'D 9ef 9c 0w 8', sets:3, reps:'10-12/侧' },
  { name:'门框引体', muscle:'背部', key:'back', equip:'bodyweight', diff:'中级',
    desc:'居家背部训练替代方案', tips:'确保门框足够坚固',
    video:'', sets:3, reps:'力竭' },
  { name:'哑铃肩推', muscle:'肩部', key:'shoulder', equip:'dumbbell', diff:'初级',
    desc:'肩部整体训练', tips:'不过度后仰',
    video:'qEw16sOSXU', sets:3, reps:'10-12' },
  { name:'杠铃肩推', muscle:'肩部', key:'shoulder', equip:'gym', diff:'中级',
    desc:'肩部力量训练王牌', tips:'不要过度后仰',
    video:'2yq 1m 98GOM', sets:4, reps:'6-8' },
  { name:'哑铃侧平举', muscle:'肩部', key:'shoulder', equip:'dumbbell', diff:'初级',
    desc:'针对三角肌中束', tips:'轻重量！小拇指高于拇指',
    video:'3VcLxVrs9s', sets:4, reps:'12-15' },
  { name:'绳索面拉', muscle:'肩部', key:'shoulder', equip:'gym', diff:'初级',
    desc:'肩袖和后束训练', tips:'每次推类训练后必做',
    video:'rep-qJOlrkQ', sets:3, reps:'15-20' },
  { name:'二头弯举', muscle:'手臂', key:'arm', equip:'dumbbell', diff:'初级',
    desc:'肱二头肌经典训练', tips:'肘部固定，不借力',
    video:'Q-Z7Nzp9tI', sets:3, reps:'10-12' },
  { name:'三头下压', muscle:'手臂', key:'arm', equip:'gym', diff:'初级',
    desc:'肱三头肌孤立训练', tips:'肘部贴体侧',
    video:'VnFWB5f6TU', sets:3, reps:'12-15' },
  { name:'平板支撑', muscle:'核心', key:'core', equip:'bodyweight', diff:'初级',
    desc:'核心稳定性训练', tips:'头到脚跟一条线',
    video:'pSHjPAE1pDo', sets:3, reps:'30-60s' },
  { name:'悬挂举腿', muscle:'核心', key:'core', equip:'gym', diff:'中级',
    desc:'下腹训练，进阶核心', tips:'不借惯性',
    video:'l4S1E3q0XM', sets:3, reps:'10-15' },
  { name:'卷腹', muscle:'核心', key:'core', equip:'bodyweight', diff:'初级',
    desc:'上腹基础训练', tips:'下背贴地，不拉脖子',
    video:'Xyd_fgl 5k 8', sets:3, reps:'15-20' },
  { name:'慢跑LISS', muscle:'有氧', key:'cardio', equip:'bodyweight', diff:'初级',
    desc:'低强度稳态有氧', tips:'每次20-45分钟，保持能说话的配速',
    video:'9R_x3CD9R', sets:1, reps:'20-45min' },
  { name:'跳绳', muscle:'有氧', key:'cardio', equip:'bodyweight', diff:'初级',
    desc:'高效全身有氧', tips:'前脚掌着地，手腕转动不是手臂',
    video:'c9BT7ys1Yg', sets:4, reps:'30-60s' },
  { name:'波比跳', muscle:'有氧', key:'cardio', equip:'bodyweight', diff:'中级',
    desc:'全身高性能训练', tips:'初学者可不做俯卧撑部分',
    video:'dZ1Z2x7C8qk', sets:4, reps:'10-15' },
  { name:'登山者', muscle:'有氧', key:'cardio', equip:'bodyweight', diff:'初级',
    desc:'核心+有氧结合', tips:'保持臀部不下塌',
    video:'c 9BT 7ys 1Yg', sets:3, reps:'30-45s' },
];

// ============ 设备过滤：根据设备选择替换动作 ============
function filterByEquip(exercise, equip) {
  if (equip === 'gym') return true; // 健身房：全部可用
  if (equip === 'dumbbell') {
    // 哑铃+自重：排除需要大型器械的
    return ['gym', 'dumbbell', 'bodyweight'].includes(exercise.equip);
  }
  if (equip === 'bodyweight') {
    // 仅自重
    return exercise.equip === 'bodyweight';
  }
  return true;
}

// 获取某肌群/类型的推荐动作列表（按设备过滤）
function getExercises(muscleKey, equip, count) {
  let pool = EXERCISES.filter(e => e.key === muscleKey && filterByEquip(e, equip));
  if (pool.length === 0) {
    // 没有匹配设备动作时，退回自重
    pool = EXERCISES.filter(e => e.key === muscleKey && e.equip === 'bodyweight');
  }
  // 去重（按名字）
  const seen = new Set();
  pool = pool.filter(e => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
  return pool.slice(0, count);
}

// ============ 动态生成计划 ============
function buildPlan(goal, level, days, equip) {
  const isBeginner = level === 'beginner';
  const isIntermediate = level === 'intermediate';
  const isAdvanced = level === 'advanced';

  // 根据等级调整组数和次数
  function adjustSets(baseSets) {
    if (isBeginner) return Math.max(3, baseSets - 1);
    if (isAdvanced) return baseSets + 1;
    return baseSets;
  }
  function adjustReps(baseReps) {
    if (isBeginner) return baseReps; // 高次数
    if (isIntermediate) return baseReps; // 中等
    return baseReps; // 低次数（大重量）
  }

  // 计划名称
  const goalNames = { muscle:'增肌', cut:'减脂', strength:'力量', cardio:'心肺体能' };
  const levelNames = { beginner:'新手', intermediate:'中级', advanced:'进阶' };
  const equipNames = { gym:'健身房', dumbbell:'哑铃+自重', bodyweight:'自重' };

  const planName = `${goalNames[goal]}${levelNames[level]}方案（${days}天·${equipNames[equip]}）`;
  const planDesc = getPlanDesc(goal, level, days);

  // 根据天数和目标生成训练日
  const trainingDays = [];

  if (goal === 'muscle' || goal === 'strength') {
    // 增肌/力量：推拉腿或上下肢分化
    if (days <= 3) {
      // 全身分化
      for (let i = 0; i < days; i++) {
        const isPullDay = i % 2 === 1;
        trainingDays.push({
          name: i === 0 ? '全身训练A' : i === 1 ? '全身训练B' : '全身训练C',
          exercises: getFullBodyExercises(equip, isPullDay, isBeginner)
        });
      }
    } else if (days === 4) {
      // 上下肢分化
      trainingDays.push(
        { name:'上肢推日', exercises: getPushExercises(equip, adjustSets(4)) },
        { name:'下肢日', exercises: getLegExercises(equip, adjustSets(4)) },
        { name:'上肢拉日', exercises: getPullExercises(equip, adjustSets(4)) },
        { name:'下肢后链日', exercises: getPostChainExercises(equip, adjustSets(4)) }
      );
    } else {
      // 5-6天：推拉腿
      trainingDays.push(
        { name:'推日', exercises: getPushExercises(equip, adjustSets(4)) },
        { name:'拉日', exercises: getPullExercises(equip, adjustSets(4)) },
        { name:'腿日', exercises: getLegExercises(equip, adjustSets(4)) }
      );
      if (days >= 5) {
        trainingDays.push(
          { name:'推日2', exercises: getPushExercises(equip, adjustSets(4)) },
          { name:'拉日2', exercises: getPullExercises(equip, adjustSets(4)) }
        );
      }
      if (days >= 6) {
        trainingDays.push(
          { name:'腿日2', exercises: getLegExercises(equip, adjustSets(4)) }
        );
      }
    }
  } else if (goal === 'cut') {
    // 减脂：力量+有氧混合
    for (let i = 0; i < days; i++) {
      if (i % 2 === 0) {
        trainingDays.push({
          name:`力量训练${Math.ceil((i+1)/2)}`,
          exercises: [...getFullBodyExercises(equip, false, isBeginner).slice(0,4), { name:'跳绳', sets:4, reps:'30s', video:'' }]
        });
      } else {
        trainingDays.push({
          name:`有氧日${Math.ceil(i/2)}`,
          exercises: [
            { name:'慢跑LISS', sets:1, reps: isBeginner?'20min':'30min', video:'' },
            { name:'波比跳', sets:3, reps:'10-15', video:'' },
            { name:'登山者', sets:3, reps:'30s', video:'' }
          ]
        });
      }
    }
  } else if (goal === 'cardio') {
    // 心肺体能
    for (let i = 0; i < days; i++) {
      if (i % 3 === 0) {
        trainingDays.push({ name:'LISS有氧日', exercises: [
          { name:'慢跑LISS', sets:1, reps: isBeginner?'25min':'45min', video:'' },
          { name:'平板支撑', sets:3, reps:'30-60s', video:'' }
        ]});
      } else if (i % 3 === 1) {
        trainingDays.push({ name:'HIIT日', exercises: [
          { name:'波比跳', sets:4, reps:'30s', video:'' },
          { name:'跳绳', sets:4, reps:'30s', video:'' },
          { name:'登山者', sets:3, reps:'30s', video:'' }
        ]});
      } else {
        trainingDays.push({ name:'力量+有氧', exercises: [
          ...getFullBodyExercises(equip, false, true).slice(0,3),
          { name:'慢跑LISS', sets:1, reps:'15min', video:'' }
        ]});
      }
    }
  }

  return { name: planName, desc: planDesc, days: trainingDays };
}

function getPlanDesc(goal, level, days) {
  const descs = {
    muscle_beginner: '注重动作技术，轻重量高次数',
    muscle_intermediate: '增加容量，引入进阶动作',
    muscle_advanced: '高容量高强度，周期化训练',
    cut_beginner: '力量+有氧混合，建立运动习惯',
    cut_intermediate: 'HIIT+力量结合，最大化燃脂',
    cut_advanced: '高强度代谢训练',
    strength_beginner: '学习基础力量动作模式',
    strength_intermediate: '冲击大重量，提升1RM',
    strength_advanced: '专项力量周期化',
    cardio_beginner: '建立有氧基础，提升心肺功能',
    cardio_intermediate: 'HIIT+耐力并重',
    cardio_advanced: '接近运动员级别训练'
  };
  return descs[`${goal}_${level}`] || '科学训练，循序渐进';
}

// ============ 获取各类型动作 ============
function getPushExercises(equip, sets) {
  const chest = getExercises('chest', equip, 2);
  const shoulder = getExercises('shoulder', equip, 1);
  const arm = getExercises('arm', equip, 1).filter(e => e.name.includes('三头') || e.name.includes('三头'));
  if (arm.length === 0) arm.push({ name:'三头下压', sets, reps:'12-15', video:'' });
  return [...chest.map(e => ({ name:e.name, sets, reps:e.reps, video:e.video })),
          ...shoulder.map(e => ({ name:e.name, sets, reps:e.reps, video:e.video })),
          ...arm.map(e => ({ name:e.name, sets, reps:e.reps || '12-15', video:e.video }))];
}

function getPullExercises(equip, sets) {
  const back = getExercises('back', equip, 2);
  const arm = getExercises('arm', equip, 1).filter(e => e.name.includes('二头'));
  if (arm.length === 0) arm.push({ name:'二头弯举', sets, reps:'10-12', video:'' });
  const shoulderRear = getExercises('shoulder', equip, 1).filter(e => e.name.includes('面拉'));
  return [...back.map(e => ({ name:e.name, sets, reps:e.reps, video:e.video })),
          ...arm.map(e => ({ name:e.name, sets, reps:e.reps || '10-12', video:e.video })),
          ...shoulderRear.map(e => ({ name:e.name, sets, reps:'15-20', video:e.video }))];
}

function getLegExercises(equip, sets) {
  const legs = getExercises('leg', equip, 3);
  return legs.map(e => ({ name:e.name, sets, reps:e.reps, video:e.video }));
}

function getPostChainExercises(equip, sets) {
  const posterior = getExercises('leg', equip, 2).filter(e => e.name.includes('硬拉') || e.name.includes('臀'));
  const core = getExercises('core', equip, 1);
  if (posterior.length === 0) posterior.push({ name:'罗马尼亚硬拉', sets, reps:'8-10', video:'' });
  return [...posterior.map(e => ({ name:e.name, sets, reps:e.reps, video:e.video })),
          ...core.map(e => ({ name:e.name, sets:3, reps:'15-20', video:e.video }))];
}

function getFullBodyExercises(equip, isPullFocus, isBeginner) {
  const result = [];
  if (!isPullFocus) {
    const push = getExercises('chest', equip, 1);
    const leg = getExercises('leg', equip, 1);
    result.push(...push, ...leg);
  } else {
    const pull = getExercises('back', equip, 1);
    const shoulder = getExercises('shoulder', equip, 1);
    result.push(...pull, ...shoulder);
  }
  const core = getExercises('core', equip, 1);
  result.push(...core);
  // 去重
  const seen = new Set();
  return result.filter(e => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  }).map(e => ({ name:e.name, sets: isBeginner?3:4, reps:e.reps, video:e.video }));
}

// ============ 生成计划（主函数）============
function generatePlan() {
  try {
    const goal = document.querySelector('input[name="goal"]:checked')?.value || 'muscle';
    const level = document.querySelector('input[name="level"]:checked')?.value || 'beginner';
    const daysEl = document.querySelector('#daysGroup .chip.active');
    const days = daysEl ? parseInt(daysEl.dataset.days) : 4;
    const equip = document.querySelector('input[name="equip"]:checked')?.value || 'gym';

    const plan = buildPlan(goal, level, days, equip);

    const goalNames = { muscle:'增肌', cut:'减脂', strength:'力量', cardio:'心肺体能' };
    const levelNames = { beginner:'新手', intermediate:'中级', advanced:'进阶' };
    const equipNames = { gym:'健身房全器械', dumbbell:'哑铃+自重', bodyweight:'仅自重' };

    const schedule = getSchedule(days);

    let html = `
      <div style="background:linear-gradient(135deg,#FF6B35,#FF8C5A);color:#fff;border-radius:14px;padding:18px;margin-bottom:14px;">
        <div style="font-size:13px;opacity:0.9;">${levelNames[level]} · ${equipNames[equip]}</div>
        <div style="font-size:17px;font-weight:700;margin:4px 0;">${plan.name}</div>
        <div style="font-size:13px;opacity:0.9;">目标：${goalNames[goal]} · ${days}天/周 · ${plan.desc}</div>
      </div>
      <div style="font-size:12px;color:#999;margin-bottom:10px;">💡 每周训练 ${days} 天，休息 ${7-days} 天，保证恢复</div>
    `;

    plan.days.forEach((dp, i) => {
      const di = schedule[i] || { day: `第${i+1}天`, isTraining:true };
      html += `<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-weight:700;font-size:15px;color:#FF6B35;">${di.day} · ${dp.name}</span>
        </div>`;

      dp.exercises.forEach(ex => {
        const exInfo = EXERCISES.find(e => e.name === ex.name) || {};
        const tag = getTag(ex.name);
        const tagColors = { push:'#FFE8E8', pull:'#E8F4FF', leg:'#E8FFE8', arm:'#FFF3E8', core:'#F3E8FF', cardio:'#E8F7FF' };
        const tagNames = { push:'推', pull:'拉', leg:'腿', arm:'臂', core:'核心', cardio:'有氧' };
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;">
          <div>
            <span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:600;background:${tagColors[tag]};color:#333;">${tagNames[tag]}</span>
            <span style="margin-left:8px;font-size:14px;">${ex.name}</span>
            ${exInfo.tips ? `<div style="font-size:11px;color:#999;margin-top:2px;">💡 ${exInfo.tips}</div>` : ''}
          </div>
          <div style="text-align:right;font-size:12px;color:#555;">${ex.sets}组 × ${ex.reps}</div>
        </div>`;
      });
      html += `</div>`;
    });

    // 休息日
    const restDays = schedule.filter(s => !s.isTraining);
    if (restDays.length > 0) {
      html += `<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;border:1.5px dashed #E8E8E8;">
        <div style="color:#2EC4B6;font-weight:600;">${restDays.map(r => r.day).join('、')} · 休息日</div>
        <div style="font-size:13px;color:#555;margin-top:4px;">✅ 充分休息·保证睡眠7-9h·可散步/拉伸</div>
      </div>`;
    }

    // 等级提示
    const tips = {
      beginner: '• 组数3-4组，次数8-15次<br>• 动作偏简单，先掌握技术<br>• 组间休息2分钟<br>• 前2-3个月重点：建立动作模式',
      intermediate: '• 组数4-5组，次数5-10次<br>• 引入进阶变式动作<br>• 组间休息3分钟（复合动作）<br>• 重点：渐进超负荷驱动增长',
      advanced: '• 组数5-6组，高低次数搭配<br>• 高难度变式+超级组+递减组<br>• 建议周期化（4-6周减载1周）<br>• 重点：突破平台期和弱点'
    };
    html += `<div style="background:${level==='beginner'?'#E8FFE8':level==='intermediate'?'#FFF3E8':'#FFE8E8'};border:1.5px solid ${level==='beginner'?'#2D6A4F':level==='intermediate'?'#E76F51':'#E71D36'};border-radius:14px;padding:14px;margin-top:10px;">
      <div style="font-weight:700;margin-bottom:6px;">🔍 ${levelNames[level]}训练要点</div>
      <div style="font-size:12px;line-height:1.8;">${tips[level]}</div>
    </div>`;

    const resultEl = document.getElementById('planResult');
    if (resultEl) {
      resultEl.innerHTML = html;
      resultEl.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  } catch (e) {
    console.error('generatePlan error:', e);
    const resultEl = document.getElementById('planResult');
    if (resultEl) {
      resultEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;"><p>⚠️ 生成计划时出错，请重试</p></div>';
    }
  }
}

function getTag(exName) {
  const ex = EXERCISES.find(e => e.name === exName);
  if (!ex) return 'push';
  if (ex.key === 'chest' || ex.key === 'shoulder') return 'push';
  if (ex.key === 'back') return 'pull';
  if (ex.key === 'leg') return 'leg';
  if (ex.key === 'arm') return ex.name.includes('二头') ? 'pull' : 'push';
  if (ex.key === 'core') return 'core';
  return 'cardio';
}

function getSchedule(days) {
  const week = ['周一','周二','周三','周四','周五','周六','周日'];
  const map = { 2:['周一','周四'], 3:['周一','周三','周五'], 4:['周一','周二','周四','周五'], 5:['周一','周二','周三','周五','周六'], 6:['周一','周二','周三','周四','周五','周六'] };
  const training = map[days] || week.slice(0, days);
  return week.map(day => ({ day, isTraining: training.includes(day) }));
}

// ============ 动作库 ============
function renderExercises(filter, search) {
  let list = EXERCISES;
  if (filter && filter !== 'all') list = list.filter(e => e.key === filter);
  if (search) list = list.filter(e => e.name.includes(search) || e.desc.includes(search));

  const iconMap = { chest:'💪', back:'🔙', shoulder:'🤚', leg:'🦵', arm:'💪', core:'🎯', cardio:'🫀' };
  const diffColor = { '初级':'#2EC4B6', '中级':'#FF6B35', '进阶':'#E71D36' };

  const container = document.getElementById('exerciseListUI');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;"><p>没有匹配的动作</p></div>';
    return;
  }

  container.innerHTML = list.map(e => `
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 2px 12px rgba(0,0,0,0.08);cursor:pointer;" onclick="showExerciseDetail('${e.name}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <h4 style="font-size:15px;margin-bottom:4px;">${iconMap[e.key]||'🏋️'} ${e.name}</h4>
        <span style="font-size:11px;padding:2px 8px;border-radius:8px;background:${diffColor[e.diff]};color:#fff;">${e.diff}</span>
      </div>
      <div style="font-size:12px;color:#555;margin-bottom:6px;">${e.muscle}·${e.equip==='gym'?'健身房':e.equip==='dumbbell'?'哑铃':'自重'}</div>
      <div style="font-size:13px;color:#555;line-height:1.5;">${e.desc}</div>
    </div>
  `).join('');
}

function showExerciseDetail(name) {
  const e = EXERCISES.find(x => x.name === name);
  if (!e) return;

  const diffColor = { '初级':'#2EC4B6', '中级':'#FF6B35', '进阶':'#E71D36' };
  const modal = document.getElementById('modalContent');
  const overlay = document.getElementById('modal');

  modal.innerHTML = `
    <button style="position:absolute;top:14px;right:14px;background:none;font-size:22px;color:#999;padding:4px;" onclick="closeModal()">×</button>
    <h3 style="font-size:17px;margin-bottom:12px;padding-right:30px;">${e.name}</h3>
    <div style="margin-bottom:12px;">
      <span style="font-size:11px;padding:3px 10px;border-radius:8px;background:${diffColor[e.diff]};color:#fff;">${e.diff}</span>
      <span style="font-size:12px;color:#555;margin-left:6px;">${e.muscle}·${e.equip==='gym'?'健身房':e.equip==='dumbbell'?'哑铃/器械':'自重'}</span>
    </div>
    ${e.video ? `
    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin:10px 0;">
      <iframe src="https://www.youtube.com/embed/${e.video}" 
        style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:10px;"
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
      </iframe>
    </div>` : '<div style="padding:10px;background:#f0f0f0;border-radius:10px;margin:10px 0;font-size:13px;color:#555;">暂无视频演示</div>'}
    <div style="margin-top:12px;">
      <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:4px;">动作说明</div>
      <p style="font-size:14px;line-height:1.7;">${e.desc}</p>
    </div>
    <div style="margin-top:12px;">
      <div style="font-size:13px;font-weight:600;color:#E71D36;margin-bottom:4px;">⚠️ 关键技术点</div>
      <p style="font-size:14px;line-height:1.7;">${e.tips}</p>
    </div>
  `;
  overlay.classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

function filterExercises() {
  const filter = document.querySelector('#filterBar .chip.active')?.dataset.filter || 'all';
  const search = document.getElementById('searchExercise')?.value.trim() || '';
  renderExercises(filter, search);
}

// ============ 训练记录 ============
function logWorkout() {
  try {
    const ex = document.getElementById('logExercise').value.trim();
    const sets = parseInt(document.getElementById('logSets').value) || 4;
    const repsStr = document.getElementById('logReps').value.trim();
    const weightStr = document.getElementById('logWeight').value.trim();

    if (!ex) { alert('请输入动作名称'); return; }

    const repsArr = repsStr.split(',').map(r => parseInt(r.trim())).filter(n => !isNaN(n));
    const weightArr = weightStr.split(',').map(w => parseFloat(w.trim())).filter(n => !isNaN(n));

    const reps = repsArr.length === 1 ? Array(sets).fill(repsArr[0]) : repsArr;
    const weights = weightArr.length === 1 ? Array(sets).fill(weightArr[0]) : weightArr;

    if (reps.length === 0 || weights.length === 0) { alert('请输入有效的次数和重量'); return; }

    const maxW = Math.max(...weights);
    const maxR = reps[weights.indexOf(maxW)] || reps[0];
    const e1RM = maxR <= 1 ? maxW : Math.round(maxW * (1 + maxR / 30) * 10) / 10;
    const volume = weights.reduce((s, w, i) => s + (w || 0) * (reps[i] || 0), 0);

    const entry = {
      date: new Date().toISOString().split('T')[0],
      exercise: ex,
      sets,
      estimated1RM: e1RM,
      totalVolume: Math.round(volume * 10) / 10
    };

    const logs = JSON.parse(localStorage.getItem('fitbuddy_logs') || '[]');
    logs.push(entry);
    localStorage.setItem('fitbuddy_logs', JSON.stringify(logs));

    const prevLogs = logs.filter(l => l.exercise === ex && l.date !== entry.date);
    const best = prevLogs.length > 0 ? Math.max(...prevLogs.map(l => l.estimated1RM)) : 0;
    const isPR = e1RM > best && best > 0;

    document.getElementById('logResult').innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:2px solid ${isPR ? '#FFD700' : '#E8E8E8'};">
        <div style="font-weight:700;font-size:15px;">${isPR ? '🏆 新 PR！' : '✅ 已记录'}</div>
        <div style="margin-top:6px;"><b>${ex}</b> · ${sets}组 · 估测 1RM ${e1RM} kg ${isPR ? '🏆' : best > 0 ? '(最佳: ' + best + 'kg)' : ''}</div>
      </div>
    `;

    document.getElementById('logExercise').value = '';
    document.getElementById('logReps').value = '';
    document.getElementById('logWeight').value = '';

    loadLogs();
  } catch (e) {
    console.error('logWorkout error:', e);
    alert('保存记录时出错，请重试');
  }
}

function loadLogs() {
  const logs = JSON.parse(localStorage.getItem('fitbuddy_logs') || '[]');
  const recentContainer = document.getElementById('recentLogs');
  const prContainer = document.getElementById('prList');
  if (!recentContainer || !prContainer) return;

  if (logs.length === 0) {
    recentContainer.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;"><p>暂无训练记录</p></div>';
  } else {
    recentContainer.innerHTML = logs.slice(-10).reverse().map(l => `
      <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <div style="font-size:12px;color:#999;margin-bottom:6px;">${l.date}</div>
        <div style="font-weight:600;">${l.exercise}</div>
        <div style="font-size:12px;color:#555;">${l.sets}组·1RM ${l.estimated1RM}kg·${l.totalVolume}kg</div>
      </div>
    `).join('');
  }

  const pr = {};
  logs.forEach(l => {
    if (!pr[l.exercise] || l.estimated1RM > pr[l.exercise]) pr[l.exercise] = l.estimated1RM;
  });
  const pe = Object.entries(pr).sort((a, b) => b[1] - a[1]);

  if (pe.length === 0) {
    prContainer.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;"><p>暂无 PR</p></div>';
  } else {
    prContainer.innerHTML = pe.map(([ex, v]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <span style="font-weight:600;">${ex}</span>
        <span style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#fff;font-size:11px;padding:2px 8px;border-radius:8px;font-weight:700;">${v} kg 1RM</span>
      </div>
    `).join('');
  }
}

// ============ 营养计算 ============
function calcNutrition() {
  try {
    const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
    const age = parseInt(document.getElementById('nutAge').value) || 25;
    const height = parseInt(document.getElementById('nutHeight').value) || 170;
    const weight = parseInt(document.getElementById('nutWeight').value) || 70;
    const goal = document.querySelector('input[name="nutGoal"]:checked')?.value || 'muscle';
    const act = parseFloat(document.getElementById('nutActivity').value) || 1.55;

    const bmr = gender === 'male'
      ? (10 * weight + 6.25 * height - 5 * age + 5)
      : (10 * weight + 6.25 * height - 5 * age - 161);

    const tdee = bmr * act;

    let targetCals, pPerKg, cPerKg, fPerKg;
    if (goal === 'muscle') {
      targetCals = tdee + 300; pPerKg = 2.0; cPerKg = 5.0; fPerKg = 1.0;
    } else if (goal === 'cut') {
      targetCals = tdee - 400; pPerKg = 2.2; cPerKg = 3.0; fPerKg = 0.8;
    } else {
      targetCals = tdee; pPerKg = 1.6; cPerKg = 4.0; fPerKg = 1.0;
    }

    const pG = Math.round(weight * pPerKg);
    const cG = Math.round(weight * cPerKg);
    const fG = Math.round(weight * fPerKg);

    const pC = pG * 4, cC = cG * 4, fC = fG * 9;
    const tC = pC + cC + fC;
    const pPct = Math.round(pC / tC * 100);
    const cPct = Math.round(cC / tC * 100);
    const fPct = 100 - pPct - cPct;

    const goalNames = { muscle:'增肌', cut:'减脂', maintain:'维持' };

    const resultEl = document.getElementById('nutritionResult');
    if (resultEl) {
      resultEl.innerHTML = `
        <div style="background:linear-gradient(135deg,#FFF0E8,#fff);border-radius:14px;padding:18px;margin-top:14px;">
          <div style="font-weight:700;font-size:16px;">${goalNames[goal]}营养方案</div>
          <div style="font-size:13px;color:#555;margin-top:4px;">BMR ${Math.round(bmr)} · TDEE ${Math.round(tdee)} · 目标 ${Math.round(targetCals)} kcal</div>
          <div style="display:flex;gap:4px;height:10px;border-radius:5px;overflow:hidden;margin:14px 0;">
            <div style="background:#FF6B35;width:${pPct}%;"></div>
            <div style="background:#2EC4B6;width:${cPct}%;"></div>
            <div style="background:#E71D36;width:${fPct}%;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:14px;">
            <span>蛋白 ${pPct}%</span><span>碳水 ${cPct}%</span><span>脂肪 ${fPct}%</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            <div style="text-align:center;background:#fff;border-radius:10px;padding:12px 6px;">
              <div style="font-size:22px;font-weight:800;color:#FF6B35;">${pG}g</div>
              <div style="font-size:11px;color:#555;margin-top:2px;">蛋白质/天</div>
            </div>
            <div style="text-align:center;background:#fff;border-radius:10px;padding:12px 6px;">
              <div style="font-size:22px;font-weight:800;color:#2EC4B6;">${cG}g</div>
              <div style="font-size:11px;color:#555;margin-top:2px;">碳水/天</div>
            </div>
            <div style="text-align:center;background:#fff;border-radius:10px;padding:12px 6px;">
              <div style="font-size:22px;font-weight:800;color:#E71D36;">${fG}g</div>
              <div style="font-size:11px;color:#555;margin-top:2px;">脂肪/天</div>
            </div>
          </div>
        </div>
      `;
      resultEl.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  } catch (e) {
    console.error('calcNutrition error:', e);
    alert('计算营养方案时出错，请重试');
  }
}

// ============ 事件绑定 ============
document.addEventListener('DOMContentLoaded', function() {
  // Tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPage = document.getElementById(btn.dataset.tab);
      if (targetPage) targetPage.classList.add('active');
      if (btn.dataset.tab === 'page-log') loadLogs();
      if (btn.dataset.tab === 'page-library') renderExercises();
    });
  });

  // 天数选择
  document.querySelectorAll('#daysGroup .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#daysGroup .chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // 动作库筛选
  const filterBar = document.getElementById('filterBar');
  if (filterBar) {
    filterBar.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#filterBar .chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      filterExercises();
    });
  }

  // 搜索框
  const searchInput = document.getElementById('searchExercise');
  if (searchInput) {
    searchInput.addEventListener('input', filterExercises);
  }

  // Modal 点击关闭
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
  }

  // 初始化
  renderExercises();
  loadLogs();

  // 填充 datalist
  const datalist = document.getElementById('exerciseList');
  if (datalist) {
    datalist.innerHTML = EXERCISES.map(e => `<option value="${e.name}">`).join('');
  }
});
