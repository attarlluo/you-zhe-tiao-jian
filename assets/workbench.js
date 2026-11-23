import {topics, stages, units, sources} from './content.js';
import {esc, checkAnswer, verified, unitState, dueDate} from './learning.js';
import {mountMap, weeklyActivity} from './workspace-view.js';
import {icon, initMotion, reveal} from './ux.js';
import {budgets, canSave, mergeBackup, newId, readState, updateState} from './store.js';

const $ = (selector, root = document) => root.querySelector(selector);
const content = $('#content');
const questions = new Map(units.map(unit => [unit.id, unit]));
const byTopic = new Map(topics.map(topic => [topic.id, topic]));
const emptyDraft = () => ({text:'', hint:false, read:false});
let state;
let selectedTopic;
let toastTimer;
const themeKey = 'ml-self-study-theme';
const heading = (title, note) => `<div class="page-heading"><h1 tabindex="-1">${esc(title)}</h1>${note?`<p class="muted">${esc(note)}</p>`:''}</div>`;
const taskLink = (unit, text = '开始练习', emphasis = false) =>
  `<a class="study-button${emphasis?' primary':''}" href="#practice/${unit.id}">${text}${icon('arrow-right')}</a>`;
const readingLink = key => {
  const [label, url] = sources[key];
  return `<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon('file-text')}<span>${esc(label)}</span>${icon('arrow-up-right')}</a>`;
};
const dateLabel = value => new Date(value).toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
const studyDay = date => [date.getFullYear(),date.getMonth()+1,date.getDate()].map(n=>String(n).padStart(2,'0')).join('-');

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {toast.hidden = true;}, 3800);
}

function showSaveState() {
  const status=$('#save-status');
  status.textContent=canSave()?'记录保存在当前浏览器':'浏览器存储不可用，当前记录可手动导出';
  status.classList.toggle('save-warning',!canSave());
}

function latestAttempts() {
  return new Map(state.attempts.map(attempt => [attempt.question_id, attempt]));
}

function plan(latest) {
  const due = units.filter(unit => latest.has(unit.id) && Date.parse(latest.get(unit.id).due) <= Date.now());
  due.sort((a,b) => Number(verified(latest.get(a.id))) - Number(verified(latest.get(b.id))) ||
    latest.get(a.id).due.localeCompare(latest.get(b.id).due));
  const fresh = units.filter(unit => !latest.has(unit.id));
  const practiced = new Set(units.filter(unit => verified(latest.get(unit.id))).map(unit => unit.skill_id));
  let remaining = state.minutes;
  const tasks = [];
  for (const unit of [...due,...fresh]) {
    if (unit.minutes > remaining) continue;
    const reason = latest.has(unit.id) ? '到期复测' : practiced.has(unit.skill_id) ? '换一道题检验理解' : '初次练习';
    tasks.push({unit,reason});
    remaining -= unit.minutes;
  }
  return {due, tasks, remaining};
}

function taskRows(tasks) {
  return tasks.map(({unit,reason}, index) => `<div class="task-row"><div class="grow">
    <span class="small muted">${esc(byTopic.get(unit.topic_id).title)} · ${esc(reason)}</span><h3>${esc(unit.title)}</h3>
    <span class="small muted">${unit.minutes} 分钟</span></div>${taskLink(unit,'开始',index===0)}</div>`).join('') ||
    '<p class="empty">当前没有安排。你可以提前练习任意主题。</p>';
}

function drawHome() {
  const latest = latestAttempts();
  const {tasks, due} = plan(latest);
  const first = tasks[0];
  const learned = [...latest.values()].filter(verified).length;
  content.innerHTML = heading('今天学什么？') +
    `<section class="next-card"><div class="next-copy"><p class="eyebrow">${icon('play')}下一项</p>
      <h2>${first?esc(first.unit.title):'按自己的节奏复习'}</h2>
      <p>${first?`${esc(first.reason)} · ${first.unit.minutes} 分钟`:'可以选一道练习，或等到下次复测。'}</p></div>
      ${first?taskLink(first.unit,'开始这道题',true):'<a class="study-button primary" href="#practice">浏览练习</a>'}</section>
    <div class="metrics"><div><span>${icon('network')}可练主题</span><strong>${topics.length}</strong></div>
      <div><span>${icon('check')}独立结果通过</span><strong>${learned}<small> / ${units.length}</small></strong></div>
      <div><span>${icon('rotate-ccw')}到期复测</span><strong>${due.length}</strong></div>
      <div><span>${icon('calendar-days')}本次计划</span><strong>${tasks.reduce((n,t)=>n+t.unit.minutes,0)}<small> 分钟</small></strong></div></div>
    <div class="dashboard-grid section"><section class="panel"><div class="section-heading"><h2>接下来</h2><a href="#plan">时间预算</a></div>
      ${tasks.length>1?taskRows(tasks.slice(1,4)):'<p class="muted">暂无其它任务。</p>'}</section><section class="panel"><h2>近七天的作答</h2>${weeklyActivity(state.attempts)}</section></div>
    <section class="panel section"><div class="section-heading"><h2>从基础到模型</h2><a href="#map">打开学习路径</a></div>
      <ol class="stage-cards">${stages.map((stage,index)=>`<li><strong>${esc(stage)}</strong>
      <p>${topics.filter(t=>t.column===index).map(t=>esc(t.title)).join(' · ')}</p></li>`).join('')}</ol></section>`;
}

function drawPlan() {
  const {tasks,remaining} = plan(latestAttempts());
  content.innerHTML = heading('学习安排') +
    `<section class="panel plan-allocation"><div class="section-heading"><h2>这次学多久？</h2>
      <label>时间预算 <select id="minutes">${budgets.map(n=>`<option value="${n}" ${n===state.minutes?'selected':''}>${n} 分钟</option>`).join('')}</select></label></div>
      <div class="allocation-bar" role="img" aria-label="已安排 ${state.minutes-remaining} 分钟，剩余 ${remaining} 分钟">
      <span style="flex-grow:${state.minutes-remaining};--segment:var(--fern)"></span><span style="flex-grow:${remaining};--segment:var(--moss)"></span></div>
      <p class="muted small">${tasks.length} 项 · 已安排 ${state.minutes-remaining} 分钟 · 剩余 ${remaining} 分钟</p></section>
    <section class="panel section">${taskRows(tasks)}</section>`;
  $('#minutes').onchange = event => {
    state = updateState(data => {data.minutes = Number(event.target.value);});
    drawPlan();
    showSaveState();
    $('#minutes').focus({preventScroll:true});
  };
}

function drawMap() {
  const latest = latestAttempts();
  const mapped = topics.map(topic => {
    const linked = units.filter(unit => unit.topic_id===topic.id);
    const attempts = state.attempts.filter(attempt => linked.some(unit => unit.id===attempt.question_id) && verified(attempt));
    const transfer = attempts.some(a=>attempts.some(b=>a.question_id!==b.question_id &&
      questions.get(a.question_id).skill_id===questions.get(b.question_id).skill_id &&
      Math.abs(Date.parse(a.at)-Date.parse(b.at))>=20*3600000));
    const marks = linked.map(unit => unitState(unit, latest.has(unit.id)?[latest.get(unit.id)]:[]).key);
    const status = marks.includes('due')?'due':transfer?'retest':marks.includes('passed')?'passed':marks.includes('attempted')?'attempted':'unseen';
    return {...topic,state:status};
  });
  content.innerHTML = heading('学习路径') + '<section class="panel" id="knowledge"></section>';
  mountMap($('#knowledge'), {
    topics:mapped, units, attempts:state.attempts, stages, initial:selectedTopic,
    onSelect:id=>{selectedTopic=id;}, sourceLink:readingLink
  });
}

function drawPracticeList() {
  content.innerHTML = heading('练习') +
    `<div class="filters practice-filters">
      <label class="filter-field">搜索 <input id="search" type="search" placeholder="题目或主题"></label>
      <label class="filter-field">学习主题 <select id="topic-filter"><option value="">全部主题</option>
      ${topics.map(topic=>`<option value="${topic.id}">${esc(topic.title)}</option>`).join('')}</select></label>
      <span class="muted small" id="practice-count" role="status"></span></div><div id="unit-list"></div>`;
  function drawResults() {
    const keyword = $('#search').value.trim().toLowerCase();
    const topic = $('#topic-filter').value;
    const found = units.filter(unit => (!topic || unit.topic_id===topic) &&
      `${unit.title} ${byTopic.get(unit.topic_id).title}`.toLowerCase().includes(keyword));
    $('#practice-count').textContent = `${found.length} 道练习`;
    $('#unit-list').innerHTML = found.map(unit => {
      const status = unitState(unit,state.attempts);
      return `<article class="unit-row"><div><span class="small muted">${esc(byTopic.get(unit.topic_id).title)}</span>
        <h3>${esc(unit.title)}</h3><div class="meta"><span class="badge ${status.key}">${status.label}</span>
        <span>${unit.minutes} 分钟 · ${unit.check.type==='self'?'开放题':'数值核对'}</span></div></div>${taskLink(unit)}</article>`;
    }).join('') || '<p class="empty">没有符合条件的题目。</p>';
  }
  $('#search').oninput = drawResults;
  $('#topic-filter').onchange = drawResults;
  drawResults();
}

function drawUnit(unit) {
  const topic = byTopic.get(unit.topic_id);
  const draft = state.drafts[unit.id] ?? emptyDraft();
  const numeric = unit.check.type !== 'self';
  const previous = unitState(unit,state.attempts);
  content.innerHTML = `<div class="practice-top"><a href="#practice">← 返回练习</a><button type="button" id="focus-mode" aria-pressed="false">专注作答</button></div>`+
    heading(unit.title,`${topic.title} · 建议 ${unit.minutes} 分钟 · ${previous.label}`)+
    `<div class="practice-grid"><article class="panel answer-panel"><p class="question">${esc(unit.question)}</p>
      <label class="field" for="answer">你的答案</label><textarea id="answer" maxlength="8000" placeholder="${numeric?'依次输入数字，用空格或逗号隔开':'写下自己的推理过程'}">${esc(draft.text)}</textarea>
      <div class="actions"><button type="button" class="primary" id="check">${numeric?'核对结果':'打开自查'}</button>
      <button type="button" id="hint" aria-expanded="false" aria-controls="hints">查看提示</button></div>
      <p class="hint" id="hints" hidden>${esc(unit.hints[0])}</p>
      <div id="feedback" role="status" hidden></div>
      <div id="assessment" hidden>${numeric?'':`<h3>自查清单</h3><ul>${unit.rubric.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>
        <label class="field" for="outcome">你的判断</label><select id="outcome"><option value="uncertain">还不确定</option><option value="correct">做到清单要求</option><option value="incorrect">需要巩固</option></select>`}
        <label class="field" for="error-note">记录卡点（可选）</label><textarea id="error-note" maxlength="1000"></textarea>
        <button class="primary" type="button" id="record">保存并安排复测</button></div></article>
      <aside class="study-side"><section class="panel"><h2>${esc(topic.title)}</h2><p>${esc(topic.summary)}</p>
        <details id="solution"><summary>查看答案与推导</summary><p class="solution">${esc(unit.answer)}</p></details>
        <p id="exposure" class="muted small" role="status"></p><h3>公开参考</h3>${topic.sources.map(readingLink).join('')}</section></aside></div>`;
  const answer = $('#answer');
  const hints = $('#hints');
  const solution = $('#solution');
  let result;
  let checked = false;
  function saveDraft(change) {
    state = updateState(data => {
      const current = data.drafts[unit.id] ?? emptyDraft();
      change(current);
      data.drafts[unit.id] = current;
    });
    showSaveState();
  }
  function exposureLabel() {
    const exposure = state.drafts[unit.id] ?? emptyDraft();
    $('#exposure').textContent = exposure.read ? '本题已经查看过答案，换一道题验证独立作答。' :
      exposure.hint ? '本次用了提示。' : '先作答，再展开答案。';
  }
  exposureLabel();
  if (draft.hint) {
    hints.hidden = false;
    $('#hint').setAttribute('aria-expanded','true');
    $('#hint').textContent = '收起提示';
  }
  $('#focus-mode').onclick = event => {
    const active = document.body.classList.toggle('focus-mode');
    event.target.setAttribute('aria-pressed',String(active));
    event.target.textContent = active?'退出专注':'专注作答';
  };
  $('#hint').onclick = event => {
    hints.hidden = !hints.hidden;
    event.target.setAttribute('aria-expanded',String(!hints.hidden));
    event.target.textContent = hints.hidden?'查看提示':'收起提示';
    if (hints.hidden) return;
    saveDraft(current => {current.hint=true;});
    exposureLabel();
    reveal([hints]);
  };
  solution.ontoggle = () => {
    if (!solution.isConnected || !solution.open) return;
    saveDraft(current => {current.read=true;});
    exposureLabel();
  };
  answer.oninput = () => {
    saveDraft(current => {current.text=answer.value;});
    checked = false;
    $('#feedback').hidden = true;
    $('#record').disabled = true;
  };
  answer.onkeydown = event => {
    if (event.key==='Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
      event.preventDefault();
      $('#check').click();
    }
  };
  $('#check').onclick = () => {
    if (!answer.value.trim()) {notify('先写下你的作答。');answer.focus();return;}
    result = checkAnswer(unit, answer.value);
    checked = true;
    const output = $('#feedback');
    output.className = 'feedback ' + (result===true?'correct':result===false?'incorrect':'pending');
    output.textContent = result===true?'数值核对通过。':result===false?'数值还不一致。检查计算、顺序或输入格式。':'按清单自查，再记录自己的判断。';
    output.hidden = false;
    $('#assessment').hidden = false;
    $('#record').disabled = false;
    reveal([output]);
  };
  $('#record').onclick = () => {
    if (!checked) return;
    const text = answer.value;
    const note = $('#error-note').value;
    const outcome = result===null ? $('#outcome').value : result?'correct':'incorrect';
    state = updateState(data => {
      const exposure = data.drafts[unit.id] ?? emptyDraft();
      const independent = !exposure.hint && !exposure.read && !solution.open;
      const prior = data.attempts.some(attempt=>attempt.question_id===unit.id&&verified(attempt));
      const now = new Date();
      const due = dueDate(now,result===true,independent,prior);
      data.attempts.push({
        id:newId(), question_id:unit.id, at:now.toISOString(), study_day:studyDay(now), due:due.toISOString(),
        answer:text, independent, check_result:result, outcome,
        assessment_type:numeric?'automatic_result':'self', error_note:note
      });
      data.drafts[unit.id] = {text:'',hint:false,read:exposure.read||solution.open};
    });
    location.hash = 'reviews';
    notify(canSave()?'作答已保存，已安排复测。':'作答记录在当前页面，记得导出备份。');
  };
}

function drawReviews() {
  const latest = [...latestAttempts().values()];
  const rows = [...state.attempts].reverse();
  const scheduled = [...latest].sort((a,b)=>Date.parse(a.due)-Date.parse(b.due));
  const next = scheduled[0];
  const due = scheduled.filter(a => Date.parse(a.due)<=Date.now());
  const revisit = latest.filter(a => a.outcome==='incorrect'||a.outcome==='uncertain');
  content.innerHTML = heading('错题与复测','本题复测按最近一次作答计算。你也可以查看完整历史。')+
    (next?`<section class="review-next" aria-labelledby="review-next-heading"><div>
      <p class="eyebrow">${icon('rotate-ccw')}回来再练</p>
      <h2 id="review-next-heading">${due.length?`${due.length} 道题到期了`:`下次 ${dateLabel(next.due)}`}</h2>
      <p class="muted">${esc(questions.get(next.question_id).title)}</p></div>
      ${due.length?taskLink(questions.get(next.question_id),'现在复测',true):''}</section>`:'')+
    `<div class="filters"><label for="review-filter">显示</label><select id="review-filter"><option value="all">全部作答 · ${rows.length}</option>
      <option value="due">到期 · ${due.length}</option><option value="revisit">需要巩固 · ${revisit.length}</option></select></div><div id="review-list"></div>`;
  function drawRows() {
    const shown = {all:rows, due, revisit}[$('#review-filter').value];
    $('#review-list').innerHTML = shown.map(attempt => {
      const unit = questions.get(attempt.question_id);
      const status = verified(attempt)?'独立结果通过':attempt.assessment_type==='self'?'开放题 · 自评':attempt.check_result?'辅助后核对通过':'需要巩固';
      return `<article class="review-entry"><div class="section-heading"><div><span class="small muted">${esc(byTopic.get(unit.topic_id).title)}</span>
        <h3>${esc(unit.title)}</h3></div><time class="small muted">${dateLabel(attempt.at)}</time></div>
        <span class="badge ${verified(attempt)?'passed':'attempted'}">${status}</span><details><summary>查看这次作答</summary>
        <pre>${esc(attempt.answer)}</pre>${attempt.error_note?`<p>${esc(attempt.error_note)}</p>`:''}</details>
        <div class="actions">${taskLink(unit,'再练一次')}<span class="small muted">复测时间 ${dateLabel(attempt.due)}</span></div></article>`;
    }).join('') || '<p class="empty">这个筛选下还没有记录。</p>';
  }
  $('#review-filter').onchange = drawRows;
  drawRows();
}

function drawSources() {
  content.innerHTML = heading('资料与记录','参考资料在作者网站打开。学习记录由当前浏览器保管。')+
    `<section class="panel"><h2>公开参考</h2><ul class="reading-list">
    ${Object.keys(sources).map(key=>`<li>${readingLink(key)}</li>`).join('')}</ul></section>
    <section class="panel section"><h2>学习记录备份</h2><p class="muted">换浏览器或清理站点数据前，可以导出备份。导入会合并作答历史并保留已有草稿。</p>
    <div class="actions"><button type="button" class="primary" id="export">导出记录</button>
    <label class="import-label">导入备份 <input id="import" type="file" accept=".json,application/json"></label></div></section>`;
  $('#export').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(readState(),null,2)],{type:'application/json'}));
    const download = document.createElement('a');
    download.href = url;
    download.download = 'ml-self-study-progress.json';
    download.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('#import').onchange = async event => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      if (file.size>5_000_000) throw new Error('备份超过 5 MB。');
      state = mergeBackup(await file.text());
      showSaveState();
      notify(canSave()?'已合并学习记录。':'已合并到当前页面，记得导出备份。');
    } catch (error) {
      notify(error instanceof SyntaxError?'这个文件不是有效的 JSON。':error.message);
    } finally {
      event.target.value = '';
    }
  };
}

function render(focus = false) {
  let [view, unitId] = location.hash.slice(1).split('/');
  if (view==='content' && content.childElementCount) {content.focus();return;}
  document.body.classList.remove('focus-mode');
  state = readState();
  if (view==='next') {
    unitId=plan(latestAttempts()).tasks[0]?.unit.id;
    view=unitId?'practice':'reviews';
    history.replaceState(null,'',unitId?`#practice/${unitId}`:'#reviews');
  }
  const views = {home:drawHome, plan:drawPlan, practice:drawPracticeList, map:drawMap, reviews:drawReviews, sources:drawSources};
  const active = Object.hasOwn(views,view)?view:'home';
  document.querySelectorAll('nav a').forEach(link => {
    if (link.dataset.view===active) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  if (active==='practice' && questions.has(unitId)) drawUnit(questions.get(unitId));
  else views[active]();
  showSaveState();
  reveal([...content.children].slice(0,3));
  if (focus) {
    window.scrollTo(0,0);
    $('h1',content)?.focus({preventScroll:true});
  }
}

document.querySelectorAll('[data-icon]').forEach(node=>{node.innerHTML=icon(node.dataset.icon);});
initMotion($('#motion'));
function setTheme(warm) {
  document.documentElement.dataset.theme = warm?'warm':'light';
  $('#theme').setAttribute('aria-pressed',String(warm));
  $('#theme').textContent = warm?'雾青配色':'暖纸配色';
}
try {setTheme(localStorage.getItem(themeKey)==='warm');} catch {setTheme(false);}
$('#theme').onclick = () => {
  const warm = document.documentElement.dataset.theme!=='warm';
  try {localStorage.setItem(themeKey,warm?'warm':'light');} catch {}
  setTheme(warm);
};
document.addEventListener('click',event=>{
  const button = event.target.closest('button[data-open]');
  if (button) location.hash = 'practice/' + button.dataset.open;
});
window.addEventListener('hashchange',()=>render(true));
render(Boolean(location.hash));
