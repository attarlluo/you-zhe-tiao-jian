import {english, t} from './i18n.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[character]);

export function checkAnswer(unit, answer) {
  if (unit.check.type==='self') return null;
  const parts = answer.trim().replaceAll('−','-').split(/[,，\s]+/).filter(Boolean);
  return parts.length===unit.check.values.length && parts.every((part,index) => {
    const value = Number(part);
    return Number.isFinite(value) && Math.abs(value-unit.check.values[index]) <= unit.check.tolerance;
  });
}

export const verified = attempt => attempt?.outcome==='correct' && attempt.independent===true && attempt.check_result===true;
export const stateLabels = {
  unseen:t('未诊断', 'Not attempted'), attempted:t('已尝试', 'Attempted'), passed:t('独立结果通过', 'Passed independently'), due:t('到期复测', 'Review due'), retest:t('变式延迟通过', 'Follow-up passed')
};

export function unitState(unit, attempts) {
  const latest = attempts.findLast(attempt => attempt.question_id===unit.id);
  if (!latest) return {label:stateLabels.unseen,key:'unseen'};
  if (Date.parse(latest.due)<=Date.now()) return {label:stateLabels.due,key:'due'};
  if (verified(latest)) return {label:stateLabels.passed,key:'passed'};
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
