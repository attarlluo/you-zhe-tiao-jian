import {t, locale, countLabel, minutesLabel, initLanguage} from './i18n.js';
import {topics, stages, units, sources} from './content.js';
import {esc, answerDetails, assistedBefore, verified, unitState, dueDate, planSession, reservedForLater} from './learning.js';
import {coverageFor} from './coverage.js';
import {mountMap, weeklyActivity} from './workspace-view.js';
import {icon, initMotion, reveal} from './ux.js';
import {budgets, canSave, mergeBackup, newId, readState, updateState} from './store.js';

initLanguage();

const $ = (selector, root = document) => root.querySelector(selector);
const content = $('#content');
const questions = new Map(units.map(unit => [unit.id, unit]));
const byTopic = new Map(topics.map(topic => [topic.id, topic]));
const emptyDraft = () => ({text:'', hint:false, read:false});
let state;
const isVerified=attempt=>verified(attempt,state.attempts,questions.get(attempt?.question_id));
let selectedTopic;
let toastTimer;
const themeKey = 'ml-self-study-theme';
const heading = (title, note) => `<div class="page-heading"><h1 tabindex="-1">${esc(title)}</h1>${note?`<p class="muted">${esc(note)}</p>`:''}</div>`;
const taskLink = (unit, text = t('开始练习', 'Start exercise'), emphasis = false) =>
  `<a class="study-button${emphasis?' primary':''}" href="#practice/${unit.id}">${text}${icon('arrow-right')}</a>`;
const readingLink = key => {
  const [label, url] = sources[key];
  return `<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon('file-text')}<span>${esc(label)}</span>${icon('arrow-up-right')}</a>`;
};
const dateLabel = value => new Date(value).toLocaleString(locale, {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
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
  status.textContent=canSave()?t('记录保存在当前浏览器', 'Progress is saved in this browser'):t('浏览器存储不可用，当前记录可手动导出', 'Browser storage is unavailable. You can export your progress manually.');
  status.classList.toggle('save-warning',!canSave());
}

function latestAttempts() {
  return new Map(state.attempts.map(attempt => [attempt.question_id, attempt]));
}

function plan(latest) {
  const result=planSession(units,state);
  return {...result,tasks:result.tasks.map(task=>({...task,reason:{due:t('到期复测','Review due'),variant:t('换一道预留变式检验理解','Try a reserved follow-up exercise'),new:t('初次练习','First attempt')}[task.reason]}))};
}

function coverageTable(){
  return `<details class="panel section" id="coverage"><summary>${t('这个演示练到了什么，还有哪些没练？','What does this demo cover, and what is still missing?')}</summary>
    <p class="muted">${t('12 个主题有入门练习，不代表完整课程覆盖。以下是本演示自编目标；数值题已逐项复算，开放题只提供自查。顺序是建议路线，没有作答时保持未诊断。','These 12 topics have introductory practice, not complete course coverage. The goals below belong to this original demo. Numeric targets were recalculated; open questions use self-assessment. The order is a suggested route, and untouched topics stay unassessed.')}</p>
    <div class="coverage-scroll" tabindex="0" role="region" aria-label="${t('练习覆盖表，可左右滚动','Practice coverage table. Scroll horizontally.')}" ><table><thead><tr><th>${t('练习目标','Practice goal')}</th><th>${t('已准备内容与核查','Prepared practice and checks')}</th><th>${t('继续学什么','What to learn next')}</th></tr></thead><tbody>${topics.map(topic=>{const row=coverageFor(topic.id),linked=units.filter(u=>u.topic_id===topic.id);return `<tr><th scope="row">${esc(topic.title)}<p class="small muted">${esc(row.goal)}</p></th><td>${esc(row.prepared)}<p class="small muted">${t('数值核对','Numeric checks')} ${linked.filter(u=>u.check.type==='numeric').length} / ${t('开放自查','Open self-checks')} ${linked.filter(u=>u.check.type==='self').length}</p><a href="#practice/${linked[0].id}">${t('做一道题','Try an exercise')}</a></td><td>${esc(row.remaining)}<div>${topic.sources.map(readingLink).join('')}</div></td></tr>`;}).join('')}</tbody></table></div></details>`;
}

function taskRows(tasks) {
  return tasks.map(({unit,reason}, index) => `<div class="task-row"><div class="grow">
    <span class="small muted">${esc(byTopic.get(unit.topic_id).title)} · ${esc(reason)}</span><h3>${esc(unit.title)}</h3>
    <span class="small muted">${minutesLabel(unit.minutes)}</span></div>${taskLink(unit,t('开始', 'Start'),index===0)}</div>`).join('') ||
    `<p class="empty">${t('当前没有安排。你可以提前练习任意主题。', 'Nothing scheduled. You can practice any topic now.')}</p>`;
}

function drawHome() {
  const latest = latestAttempts();
  const {tasks, due} = plan(latest);
  const first = tasks[0];
  const learned = [...latest.values()].filter(isVerified).length;
  content.innerHTML = heading(t('今天学什么？', 'What will you study today?')) +
    `<section class="next-card"><div class="next-copy"><p class="eyebrow">${icon('play')}${t('下一项', 'Next up')}</p>
      <h2>${first?esc(first.unit.title):t('按自己的节奏复习', 'Review at your own pace')}</h2>
      <p>${first?`${esc(first.reason)} · ${minutesLabel(first.unit.minutes)}`:t('可以选一道练习，或等到下次复测。', 'Pick an exercise or wait until your next review.')}</p></div>
      ${first?taskLink(first.unit,t('开始这道题', 'Start this exercise'),true):`<a class="study-button primary" href="#practice">${t('浏览练习', 'Browse exercises')}</a>`}</section>
    <p class="small muted section">${t('先独立作答，再核对并保存卡点。保存后看下次复测时间；已看提示或答案的题，用另一道变式检验理解。','Try it independently, check your answer, then save what tripped you up. After saving, follow the next review time. Use a different exercise after hints or solutions.')}</p>
    <div class="metrics"><div><span>${icon('network')}${t('有入门练习的主题', 'Topics with introductory practice')}</span><strong>${topics.length}</strong></div>
      <div><span>${icon('check')}${t('独立结果通过', 'Passed independently')}</span><strong>${learned}<small> / ${units.length}</small></strong></div>
      <div><span>${icon('rotate-ccw')}${t('到期复测', 'Reviews due')}</span><strong>${due.length}</strong></div>
      <div><span>${icon('calendar-days')}${t('本次计划', 'Planned time')}</span><strong>${tasks.reduce((n,t)=>n+t.unit.minutes,0)}<small>${t(' 分钟', ' min')}</small></strong></div></div>
    <div class="dashboard-grid section"><section class="panel"><div class="section-heading"><h2>${t('接下来', 'Up next')}</h2><a href="#plan">${t('时间预算', 'Time budget')}</a></div>
      ${tasks.length>1?taskRows(tasks.slice(1,4)):`<p class="muted">${t('暂无其它任务。', 'No other tasks yet.')}</p>`}</section><section class="panel"><h2>${t('近七天的作答', 'Attempts in the last seven days')}</h2>${weeklyActivity(state.attempts)}</section></div>
    <section class="panel section"><div class="section-heading"><h2>${t('从基础到模型', 'From foundations to models')}</h2><a href="#map">${t('打开学习路径', 'Open the learning path')}</a></div>
      <ol class="stage-cards">${stages.map((stage,index)=>`<li><strong>${esc(stage)}</strong>
      <p>${topics.filter(t=>t.column===index).map(t=>esc(t.title)).join(' · ')}</p></li>`).join('')}</ol></section>`+coverageTable();
}

const allocationLabel = (planned, remaining) => t(`已安排 ${minutesLabel(planned)}，剩余 ${minutesLabel(remaining)}`, `${minutesLabel(planned)} planned, ${minutesLabel(remaining)} remaining`);

function drawPlan() {
  const {tasks,remaining} = plan(latestAttempts());
  content.innerHTML = heading(t('学习安排', 'Study plan')) +
    `<section class="panel plan-allocation"><div class="section-heading"><h2>${t('这次学多久？', 'How long will you study?')}</h2>
      <label>${t('时间预算 ', 'Time budget ')}<select id="minutes">${budgets.map(n=>`<option value="${n}" ${n===state.minutes?'selected':''}>${minutesLabel(n)}</option>`).join('')}</select></label></div>
      <div class="allocation-bar" role="img" aria-label="${allocationLabel(state.minutes - remaining, remaining)}">
      <span style="flex-grow:${state.minutes-remaining};--segment:var(--fern)"></span><span style="flex-grow:${remaining};--segment:var(--moss)"></span></div>
      <p class="muted small">${countLabel(tasks.length, '项', 'task')} · ${allocationLabel(state.minutes - remaining, remaining)}</p></section>
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
    const attempts = state.attempts.filter(attempt => linked.some(unit => unit.id===attempt.question_id) && isVerified(attempt));
    const transfer = attempts.some(a=>attempts.some(b=>a.question_id!==b.question_id &&
      questions.get(a.question_id).skill_id===questions.get(b.question_id).skill_id &&
      Math.abs(Date.parse(a.at)-Date.parse(b.at))>=20*3600000));
    const marks = linked.map(unit => unitState(unit,state.attempts).key);
    const status = marks.includes('due')?'due':transfer?'retest':marks.includes('passed')?'passed':marks.includes('attempted')?'attempted':'unseen';
    return {...topic,state:status};
  });
  content.innerHTML = heading(t('学习路径', 'Learning path')) + '<section class="panel" id="knowledge"></section>';
  mountMap($('#knowledge'), {
    topics:mapped, units, attempts:state.attempts, stages, initial:selectedTopic,
    onSelect:id=>{selectedTopic=id;}, sourceLink:readingLink
  });
}

function drawPracticeList() {
  content.innerHTML = heading(t('练习', 'Practice')) +
    `<div class="filters practice-filters">
      <label class="filter-field">${t('搜索 ', 'Search ')}<input id="search" type="search" placeholder="${t('题目或主题', 'Exercise or topic')}"></label>
      <label class="filter-field">${t('学习主题 ', 'Topic ')}<select id="topic-filter"><option value="">${t('全部主题', 'All topics')}</option>
      ${topics.map(topic=>`<option value="${topic.id}">${esc(topic.title)}</option>`).join('')}</select></label>
      <label><input id="include-reserved" type="checkbox"> ${t('包括留给后续的变式','Include reserved follow-ups')}</label>
      <span class="muted small" id="practice-count" role="status"></span></div><div id="unit-list"></div>`;
  function drawResults() {
    const keyword = $('#search').value.trim().toLowerCase();
    const topic = $('#topic-filter').value;
    const found = units.filter(unit => ($('#include-reserved').checked||!reservedForLater(unit,state))&&(!topic || unit.topic_id===topic) &&
      `${unit.title} ${byTopic.get(unit.topic_id).title}`.toLowerCase().includes(keyword));
    $('#practice-count').textContent = countLabel(found.length, '道练习', 'exercise');
    $('#unit-list').innerHTML = found.map(unit => {
      const status = unitState(unit,state.attempts);
      return `<article class="unit-row"><div><span class="small muted">${esc(byTopic.get(unit.topic_id).title)}</span>
        <h3>${esc(unit.title)}</h3><div class="meta"><span class="badge ${status.key}">${status.label}</span>
        <span>${minutesLabel(unit.minutes)} · ${unit.check.type==='self'?t('开放题', 'Open-ended'):t('数值核对', 'Numerical check')}</span></div></div>${taskLink(unit)}</article>`;
    }).join('') || `<p class="empty">${t('没有符合条件的题目。', 'No matching exercises.')}</p>`;
  }
  $('#search').oninput = drawResults;
  $('#topic-filter').onchange = drawResults;
  $('#include-reserved').onchange = drawResults;
  drawResults();
}

function drawUnit(unit) {
  const topic = byTopic.get(unit.topic_id);
  const draft = state.drafts[unit.id] ?? emptyDraft();
  const numeric = unit.check.type !== 'self';
  const previous = unitState(unit,state.attempts);
  content.innerHTML = `<div class="practice-top"><a href="#practice">${t('← 返回练习', '← Back to practice')}</a><button type="button" id="focus-mode" aria-pressed="false">${t('专注作答', 'Focus mode')}</button></div>`+
    heading(unit.title,`${topic.title} · ${t('建议 ', 'About ')}${minutesLabel(unit.minutes)} · ${previous.label}`)+
    `<p class="small muted">${t('自编练习 · 数值相符不代替推导和理解。','Original practice · Matching numbers do not verify your reasoning.')}${unit.review_variant?' · '+t('后续变式','Follow-up exercise'):''}</p>
    <div class="practice-grid"><article class="panel answer-panel"><p class="question">${esc(unit.question)}</p>
      ${numeric?`<div class="answer-guide"><strong>${t('填答顺序','Answer order')}</strong><ol>${unit.check.fields.map(label=>`<li>${esc(label)}</li>`).join('')}</ol><p class="small muted">${t('用逗号或空格分隔，支持分数；跳过一空填 ?。','Separate values with commas or spaces. Fractions are supported; use ? for a blank field.')}</p></div>`:''}
      <label class="field" for="answer">${t('你的答案', 'Your answer')}</label><textarea id="answer" maxlength="8000" placeholder="${numeric?t('依次输入数字，用空格或逗号隔开', 'Enter numbers in order, separated by spaces or commas'):t('写下自己的推理过程', 'Write out your reasoning')}">${esc(draft.text)}</textarea>
      <div class="actions"><button type="button" class="primary" id="check">${numeric?t('核对结果', 'Check answer'):t('打开自查', 'Open self-check')}</button>
      <button type="button" id="hint" aria-expanded="false" aria-controls="hints">${t('查看提示', 'Show hint')}</button></div>
      <p class="hint" id="hints" hidden>${esc(unit.hints[0])}</p>
      <div id="feedback" role="status" hidden></div>
      <div id="assessment" hidden>${numeric?'':`<h3>${t('自查清单', 'Self-check checklist')}</h3><ul>${unit.rubric.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>
        <label class="field" for="outcome">${t('你的判断', 'Your assessment')}</label><select id="outcome"><option value="uncertain">${t('还不确定', 'Still unsure')}</option><option value="correct">${t('做到清单要求', 'Meets the checklist')}</option><option value="incorrect">${t('需要巩固', 'Needs practice')}</option></select>`}
        <label class="field" for="error-note">${t('记录卡点（可选）', 'What tripped you up? (optional)')}</label><textarea id="error-note" maxlength="1000"></textarea>
        <button class="primary" type="button" id="record">${t('保存并安排复测', 'Save and schedule review')}</button></div></article>
      <aside class="study-side"><section class="panel"><h2>${esc(topic.title)}</h2><p>${esc(topic.summary)}</p>
        <details id="solution"><summary>${t('查看答案与推导', 'Show the worked solution')}</summary><p class="solution">${esc(unit.answer)}</p></details>
        <p id="exposure" class="muted small" role="status"></p><h3>${t('公开参考', 'Public references')}</h3>${topic.sources.map(readingLink).join('')}</section></aside></div>`;
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
    $('#exposure').textContent = assistedBefore(state,unit.id) ? t('本题用过提示或看过答案；重做保留为辅助练习，换题检验独立作答。', 'You have used help on this question. Retries remain assisted practice; use another exercise to test yourself independently.') : t('先作答，再展开答案。', 'Try the exercise before opening the solution.');
  }
  exposureLabel();
  if (draft.hint) {
    hints.hidden = false;
    $('#hint').setAttribute('aria-expanded','true');
    $('#hint').textContent = t('收起提示', 'Hide hint');
  }
  $('#focus-mode').onclick = event => {
    const active = document.body.classList.toggle('focus-mode');
    event.target.setAttribute('aria-pressed',String(active));
    event.target.textContent = active?t('退出专注', 'Exit focus mode'):t('专注作答', 'Focus mode');
  };
  $('#hint').onclick = event => {
    hints.hidden = !hints.hidden;
    event.target.setAttribute('aria-expanded',String(!hints.hidden));
    event.target.textContent = hints.hidden?t('查看提示', 'Show hint'):t('收起提示', 'Hide hint');
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
    if (!answer.value.trim()) {notify(t('先写下你的作答。', 'Enter an answer first.'));answer.focus();return;}
    const detail=answerDetails(unit,answer.value);
    result = detail.result;
    checked = true;
    const output = $('#feedback');
    output.className = 'feedback ' + (result===true?'correct':result===false?'incorrect':'pending');
    output.innerHTML = `<p>${result===true?t('数值核对通过，再检查推导。', 'Your numbers match. Check your reasoning too.'):result===false?t('数值还不一致。检查计算、顺序或输入格式。', 'The numbers do not match yet. Check the calculation, order, or input format.'):t('按清单自查，再记录自己的判断。', 'Use the checklist to assess your answer, then record your result.')}</p>`;
    if(detail.countMismatch)output.innerHTML+=`<p>${t(`需要 ${detail.countMismatch.expected} 项，当前读到 ${detail.countMismatch.received} 项。跳空请填 ?。`,`Expected ${detail.countMismatch.expected} values; received ${detail.countMismatch.received}. Use ? for a blank.`)}</p>`;
    else if(detail.fields)output.innerHTML+=`<ol class="answer-breakdown">${detail.fields.map(field=>`<li class="answer-${field.status}"><span>${esc(field.label)}</span><strong>${esc(field.input||'—')}</strong><small>${{correct:t('相符','Matches'),wrong:t('待核对','Check again'),invalid:t('格式有误','Invalid format'),blank:t('未填','Blank')}[field.status]}</small></li>`).join('')}</ol>`;
    output.hidden = false;
    $('#assessment').hidden = false;
    $('#record').disabled = false;
    reveal([output]);
  };
  $('#record').onclick = () => {
    if (!checked) return;
    checked=false;
    $('#record').disabled=true;
    const text = answer.value;
    const note = $('#error-note').value;
    const outcome = result===null ? $('#outcome').value : result?'correct':'incorrect';
    state = updateState(data => {
      const exposure = data.drafts[unit.id] ?? emptyDraft();
      const independent = !assistedBefore(data,unit.id)&&!solution.open;
      const prior = data.attempts.some(attempt=>attempt.question_id===unit.id&&isVerified(attempt));
      const now = new Date();
      const due = dueDate(now,result===true,independent,prior);
      data.attempts.push({
        id:newId(), question_id:unit.id, at:now.toISOString(), study_day:studyDay(now), due:due.toISOString(),
        answer:text, independent, check_result:result, outcome,
        assessment_type:numeric?'automatic_result':'self', error_note:note,
        assessment_version:2,hint_used:exposure.hint,answer_seen:exposure.read||solution.open,skill_id:unit.skill_id
      });
      data.drafts[unit.id] = {text:'',hint:exposure.hint,read:exposure.read||solution.open};
    });
    location.hash = 'reviews';
    notify(canSave()?t('作答已保存，已安排复测。', 'Answer saved and review scheduled.'):t('作答记录在当前页面，记得导出备份。', 'Answer recorded for this session. Remember to export a backup.'));
  };
}

function drawReviews() {
  const latest = [...latestAttempts().values()];
  const rows = [...state.attempts].reverse();
  const scheduled = [...latest].sort((a,b)=>Date.parse(a.due)-Date.parse(b.due));
  const next = scheduled[0];
  const due = scheduled.filter(a => Date.parse(a.due)<=Date.now());
  const revisit = latest.filter(a => a.outcome==='incorrect'||a.outcome==='uncertain');
  const queue=planSession(units,state).tasks;
  const reviewUnit=queue.find(task=>task.reason==='due'||task.reason==='variant')?.unit;
  content.innerHTML = heading(t('错题与复测', 'Answers and reviews'),t('本题复测按最近一次作答计算。你也可以查看完整历史。', 'Each review is scheduled from your latest attempt. You can also browse your full history.'))+
    (next?`<section class="review-next" aria-labelledby="review-next-heading"><div>
      <p class="eyebrow">${icon('rotate-ccw')}${t('回来再练', 'Come back to practice')}</p>
      <h2 id="review-next-heading">${due.length?t(`${due.length} 道题到期了`, `${countLabel(due.length, '道题', 'review')} due`):t(`下次 ${dateLabel(next.due)}`, `Next review: ${dateLabel(next.due)}`)}</h2>
      <p class="muted">${esc(questions.get(next.question_id).title)}</p></div>
      ${due.length?taskLink(reviewUnit??questions.get(next.question_id),t('现在复测', 'Review now'),true):''}</section>`:'')+
    `<p class="small muted">${t('错因已保留。可以继续下一项，或按上面的时间回来复测；同题看过提示后仍记为辅助练习。','Your notes are saved. Continue with the next task or return at the review time above. A hinted question remains assisted practice on retry.')}</p>
    <div class="actions">${queue[0]?taskLink(queue[0].unit,t('继续下一项','Continue to next task')):''}<a href="#plan">${t('查看学习安排','View study plan')}</a></div>`+
    `<div class="filters"><label for="review-filter">${t('显示', 'Show')}</label><select id="review-filter"><option value="all">${t('全部作答 · ', 'All attempts · ')}${rows.length}</option>
      <option value="due">${t('到期 · ', 'Due · ')}${due.length}</option><option value="revisit">${t('需要巩固 · ', 'Needs practice · ')}${revisit.length}</option></select></div><div id="review-list"></div>`;
  function drawRows() {
    const shown = {all:rows, due, revisit}[$('#review-filter').value];
    $('#review-list').innerHTML = shown.map(attempt => {
      const unit = questions.get(attempt.question_id);
      const status = isVerified(attempt)?t('独立结果通过', 'Passed independently'):attempt.assessment_type==='self'?t('开放题 · 自评', 'Open-ended · self-assessed'):attempt.check_result?t('有辅助或旧规则结果', 'Assisted or legacy result'):t('需要巩固', 'Needs practice');
      return `<article class="review-entry"><div class="section-heading"><div><span class="small muted">${esc(byTopic.get(unit.topic_id).title)}</span>
        <h3>${esc(unit.title)}</h3></div><time class="small muted">${dateLabel(attempt.at)}</time></div>
        <span class="badge ${isVerified(attempt)?'passed':'attempted'}">${status}</span><details><summary>${t('查看这次作答', 'View this answer')}</summary>
        <pre>${esc(attempt.answer)}</pre>${attempt.error_note?`<p>${esc(attempt.error_note)}</p>`:''}</details>
        <div class="actions">${taskLink(unit,t('再练一次', 'Try again'))}<span class="small muted">${t('复测时间 ', 'Review on ')}${dateLabel(attempt.due)}</span></div></article>`;
    }).join('') || `<p class="empty">${t('这个筛选下还没有记录。', 'No records match this filter.')}</p>`;
  }
  $('#review-filter').onchange = drawRows;
  drawRows();
}

function drawSources() {
  content.innerHTML = heading(t('资料与记录', 'Resources and records'),t('参考资料在作者网站打开。学习记录由当前浏览器保管。', 'References open on the original websites. Study records stay in this browser.'))+
    `<section class="panel"><h2>${t('公开参考', 'Public references')}</h2><ul class="reading-list">
    ${Object.keys(sources).map(key=>`<li>${readingLink(key)}</li>`).join('')}</ul></section>
    <section class="panel section"><h2>${t('学习记录备份', 'Back up your progress')}</h2><p class="muted">${t('换浏览器或清理站点数据前，可以导出备份。导入会合并作答历史并保留已有草稿。', 'Export a backup before changing browsers or clearing site data. Importing merges attempt history and keeps existing drafts.')}</p>
    <p class="small muted">${t('旧作答原样保留。当前独立结果会排除已有辅助证据或不符合当前逐空规则的记录；这不会改写历史分数。2026-11-27 起，提示不会因保存后清空而消失。同题重做不证明迁移。','Old attempts stay unchanged. Current independent-result counts exclude recorded assistance or answers that fail today’s field rules, without rewriting historical scores. Since 2026-11-27, saving no longer clears hint evidence. Repeating the same question does not establish transfer.')}</p>
    <div class="actions"><button type="button" class="primary" id="export">${t('导出记录', 'Export progress')}</button>
    <label class="import-label">${t('导入备份 ', 'Import backup ')}<input id="import" type="file" accept=".json,application/json"></label></div></section>`;
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
      if (file.size>5_000_000) throw new Error(t('备份超过 5 MB。', 'The backup exceeds 5 MB.'));
      state = mergeBackup(await file.text());
      showSaveState();
      notify(canSave()?t('已合并学习记录。', 'Study records merged.'):t('已合并到当前页面，记得导出备份。', 'Records merged for this session. Remember to export a backup.'));
    } catch (error) {
      notify(error instanceof SyntaxError?t('这个文件不是有效的 JSON。', 'This file is not valid JSON.'):error.message);
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
  $('#theme').textContent = warm?t('雾青配色', 'Cool palette'):t('暖纸配色', 'Warm palette');
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
