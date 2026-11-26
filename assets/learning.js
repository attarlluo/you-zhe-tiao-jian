import {english, t} from './i18n.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[character]);

const decimal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
function numberValue(text) {
  const parts=text.replaceAll('−','-').split('/');
  if(parts.length>2||parts.some(part=>!decimal.test(part)))return NaN;
  const [a,b=1]=parts.map(Number);
  return Number.isFinite(a)&&Number.isFinite(b)&&b!==0?a/b:NaN;
}

export function answerDetails(unit,answer) {
  if(unit.check.type==='self')return {result:null};
  const parts=answer.trim().split(/[,，\s]+/).filter(Boolean);
  if(parts.length&&parts.length!==unit.check.values.length)return {result:false,countMismatch:{expected:unit.check.values.length,received:parts.length}};
  const fields=unit.check.values.map((target,index)=>{
    const input=parts[index]??'',value=numberValue(input);
    const status=!input||/^[?？]$/.test(input)?'blank':!Number.isFinite(value)?'invalid':Math.abs(value-target)<=(unit.check.tolerances?.[index]??unit.check.tolerance??.005)?'correct':'wrong';
    return {label:unit.check.fields?.[index]??t(`第 ${index+1} 空`,`Field ${index+1}`),input,status};
  });
  return {result:fields.every(field=>field.status==='correct'),fields};
}
export const checkAnswer=(unit,answer)=>answerDetails(unit,answer).result;
// Original backups retain their original grading interpretation and raw records.
export function legacyCheckAnswer(unit,answer) {
  if(unit.check.type==='self')return null;
  const parts=answer.trim().replaceAll('−','-').split(/[,，\s]+/).filter(Boolean);
  return parts.length===unit.check.values.length&&parts.every((part,i)=>Number.isFinite(Number(part))&&Math.abs(Number(part)-unit.check.values[i])<=unit.check.tolerance);
}
export function assistedBefore(progress,id) {
  const draft=progress.drafts?.[id];
  return Boolean(draft?.hint||draft?.read||progress.attempts.some(a=>a.question_id===id&&(a.independent===false||a.hint_used||a.answer_seen)));
}
export function verified(attempt,history=[],unit) {
  return attempt?.outcome==='correct'&&attempt.independent===true&&attempt.check_result===true&&!attempt.hint_used&&!attempt.answer_seen
    &&!history.some(a=>a.question_id===attempt.question_id&&Date.parse(a.at)<=Date.parse(attempt.at)&&(a.independent===false||a.hint_used||a.answer_seen))
    &&(!unit||checkAnswer(unit,attempt.answer)===true);
}
export function reservedForLater(unit,progress,now=new Date()) {
  return Boolean(unit.review_variant&&!progress.attempts.some(a=>a.question_id===unit.id)
    &&!progress.attempts.some(a=>(a.skill_id===unit.skill_id||unit.variant_after?.includes(a.question_id))&&+now-Date.parse(a.at)>=20*3600000));
}
export function planSession(units,progress,now=new Date()) {
  const latest=new Map(progress.attempts.map(a=>[a.question_id,a]));
  // Legacy attempts do not store skill_id; resolve it from the unchanged question ID.
  const enriched={...progress,attempts:progress.attempts.map(a=>({...a,skill_id:units.find(u=>u.id===a.question_id)?.skill_id}))};
  const available=u=>!reservedForLater(u,enriched,now);
  const due=units.filter(u=>latest.has(u.id)&&Date.parse(latest.get(u.id).due)<=+now)
    .sort((a,b)=>Number(verified(latest.get(a.id),progress.attempts,a))-Number(verified(latest.get(b.id),progress.attempts,b))||latest.get(a.id).due.localeCompare(latest.get(b.id).due));
  const candidates=due.map(unit=>({unit:units.find(u=>u.id!==unit.id&&u.skill_id===unit.skill_id&&!latest.has(u.id)&&available(u))??unit,reason:'due'}));
  candidates.push(...units.filter(u=>!latest.has(u.id)&&available(u)).map(unit=>({unit,reason:'new'})));
  let remaining=progress.minutes;const tasks=[],selected=new Set();
  for(const candidate of candidates){
    const {unit}=candidate;
    if(unit.minutes>remaining||selected.has(unit.skill_id))continue;
    tasks.push({...candidate,reason:unit.review_variant?'variant':candidate.reason});selected.add(unit.skill_id);remaining-=unit.minutes;
  }
  return {due,tasks,remaining};
}
export const stateLabels = {
  unseen:t('未诊断', 'Not attempted'), attempted:t('已尝试', 'Attempted'), passed:t('独立结果通过', 'Passed independently'), due:t('到期复测', 'Review due'), retest:t('变式延迟通过', 'Follow-up passed')
};

export function unitState(unit, attempts) {
  const latest = attempts.findLast(attempt => attempt.question_id===unit.id);
  if (!latest) return {label:stateLabels.unseen,key:'unseen'};
  if (Date.parse(latest.due)<=Date.now()) return {label:stateLabels.due,key:'due'};
  if (verified(latest,attempts,unit)) return {label:stateLabels.passed,key:'passed'};
  if(latest.check_result===true&&checkAnswer(unit,latest.answer)===false)return {label:t('旧规则结果 · 待复核','Legacy result · review needed'),key:'attempted'};
  const label = latest.assessment_type==='self' ? t('开放题 · 自评', 'Open-ended · self-assessed') :
    latest.check_result ? t('辅助后核对通过', 'Passed with help') : t('需要巩固', 'Needs practice');
  return {label,key:'attempted'};
}

export function dueDate(now,correct,independent,prior) {
  const due = new Date(now);
  due.setDate(due.getDate() + (correct && independent && prior ? 3 : 1));
  return due;
}

export function knowledgeGraph(topics, selected, stageLabels) {
  if (!topics.length) return `<p class="empty">${t('还没有学习主题。', 'No learning topics yet.')}</p>`;
  const gap = english ? 244 : 198;
  const nodeWidth = gap - 31;
  const rowGap = english ? 112 : 88;
  const width = stageLabels.length * gap;
  const counts = Array(stageLabels.length).fill(0);
  const positions = new Map();
  for (const topic of topics) {
    positions.set(topic.id,{x:19+topic.column*gap,y:47+counts[topic.column]++*rowGap});
  }
  const height = Math.max(...counts)*rowGap+42;
  const paths = topics.flatMap(topic => topic.depends_on.map(parent => {
    const a = positions.get(parent), b = positions.get(topic.id);
    const path = a.x===b.x ?
      `M${a.x+12},${a.y+64} C${a.x-12},${a.y+69} ${b.x-12},${b.y-8} ${b.x+12},${b.y}` :
      `M${a.x+nodeWidth},${a.y+29} C${a.x+nodeWidth+18},${a.y+29} ${b.x-18},${b.y+29} ${b.x},${b.y+29}`;
    return `<path data-from="${esc(parent)}" data-to="${esc(topic.id)}" d="${path}" marker-end="url(#graph-arrow)"/>`;
  })).join('');
  const marker = '<defs><marker id="graph-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><polygon points="0 0, 7 3.5, 0 7"></polygon></marker></defs>';
  const columns = stageLabels.map((label,index)=>
    `<span class="graph-column" style="left:${19+index*gap}px">${esc(label)}</span>`).join('');
  const nodes = topics.map(topic => {
    const p = positions.get(topic.id);
    return `<button class="map-node ${esc(topic.state)}" data-topic="${esc(topic.id)}" aria-pressed="${topic.id===selected}"
      style="left:${p.x}px;top:${p.y}px;width:${nodeWidth}px"><strong>${esc(topic.title)}</strong><span>${stateLabels[topic.state]}</span></button>`;
  }).join('');
  return `<div class="graph-scroll" tabindex="0" aria-label="${t('知识路径，可横向滚动', 'Learning path. Scroll horizontally.')}"><div class="graph-canvas" style="width:${width}px;height:${height}px">
    <svg width="${width}" height="${height}" aria-hidden="true">${marker}${paths}</svg>${columns}${nodes}</div></div>`;
}
