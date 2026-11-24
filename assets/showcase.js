import {t, countLabel, localizedLink, initLanguage} from './i18n.js';
import { samples, target, linear, hidden } from './xor.mjs';
import { icon, initMotion, reveal } from './ux.js';
import { mountConvolution } from './convolution.js';
import { mountThreshold } from './threshold.js';
import { topics, stages, units, sources } from './content.js';

initLanguage();

const $ = selector => document.querySelector(selector);
const canvas = $('#plot');
const ctx = canvas.getContext('2d');
const controls = ['w1', 'w2', 'bias'];
const modelButtons = [...document.querySelectorAll('[data-model]')];
let model = 'linear';
let selected = 3;
let sampleLocations = [];
let sequenceTimer;

document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
initMotion($('#motion'));
mountConvolution();
mountThreshold();

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const weights = () => controls.map(id => Number($('#' + id).value));
const predict = (x, y, params) => model === 'linear' ? linear(x, y, ...params) : hidden(x, y).output;
const sampleButtons = samples.map(([x, y], i) => {
  const button = element('button', `(${x}, ${y})`);
  button.type = 'button';
  button.addEventListener('click', () => selectSample(i));
  $('#samples').append(button);
  return button;
});

function draw(params) {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const left = 40, right = width - 24, top = 47, bottom = height - 34;
  const axisMin = -.27, axisMax = 1.27, extent = axisMax - axisMin;
  const px = x => left + (x - axisMin) * (right - left) / extent;
  const py = y => bottom - (y - axisMin) * (bottom - top) / extent;
  const toX = p => axisMin + (p - left) * extent / (right - left);
  const toY = p => axisMin + (bottom - p) * extent / (bottom - top);
  sampleLocations = samples.map(([x,y]) => [px(x),py(y)]);
  ctx.fillStyle = '#f5f2e7';
  ctx.fillRect(0, 0, width, height);

  const tile = 5;
  for (let x = left; x < right; x += tile) {
    for (let y = top; y < bottom; y += tile) {
      ctx.fillStyle = predict(toX(x + tile / 2), toY(y + tile / 2), params) ? '#d8e8d9' : '#eadbd4';
      ctx.fillRect(x, y, Math.min(tile, right - x), Math.min(tile, bottom - y));
    }
  }
  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  for (let i = -.25; i <= 1.25; i += .25) {
    line(px(i), top, px(i), bottom, '#8495843d');
    line(left, py(i), right, py(i), '#8495843d');
  }
  ctx.save();
  ctx.beginPath(); ctx.rect(left, top, right - left, bottom - top); ctx.clip();
  ctx.setLineDash([6, 5]);
  function boundary(w1, w2, b) {
    if (Math.abs(w2) > 1e-9) {
      line(px(axisMin), py((-b - w1 * axisMin) / w2), px(axisMax), py((-b - w1 * axisMax) / w2), '#54695b', 1.8);
    } else if (Math.abs(w1) > 1e-9) {
      line(px(-b / w1), top, px(-b / w1), bottom, '#54695b', 1.8);
    }
  }
  if (model === 'linear') boundary(...params);
  else { boundary(1, 1, -.5); boundary(1, 1, -1.5); }
  ctx.restore();
  ctx.fillStyle = '#495649';
  ctx.font = '13px ui-monospace, monospace';
  for (const tick of [0, 1]) {
    ctx.fillText(String(tick), px(tick) - 4, bottom + 17);
    ctx.fillText(String(tick), left - 18, py(tick) + 4);
  }
  ctx.fillText('x₁', right - 11, bottom + 17);
  ctx.fillText('x₂', left - 19, top - 14);
  for (const [i, [x, y]] of samples.entries()) {
    const wrong = predict(x, y, params) !== target(x, y);
    ctx.beginPath(); ctx.arc(px(x), py(y), 9, 0, 2 * Math.PI);
    ctx.fillStyle = target(x, y) ? '#38765a' : '#927168'; ctx.fill();
    if (i === selected || wrong) {
      ctx.beginPath(); ctx.arc(px(x), py(y), wrong ? 15 : 14, 0, 2 * Math.PI);
      ctx.strokeStyle = wrong ? '#9b3e41' : '#2d2534'; ctx.lineWidth = 2; ctx.stroke();
      if (wrong && i === selected) {
        ctx.beginPath(); ctx.arc(px(x), py(y), 19, 0, 2 * Math.PI);
        ctx.strokeStyle = '#2d2534'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    if (wrong) {
      ctx.fillStyle = '#7d3546';
      ctx.fillText('×', px(x) + 17, py(y) - 10);
    }
  }
}

function renderLab(animate = false) {
  const params = weights();
  controls.forEach((id, i) => { $('#' + id + '-value').value = params[i].toFixed(1); });
  modelButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.model === model));
  sampleButtons.forEach((button, i) => button.setAttribute('aria-pressed', i === selected));
  $('#sliders').hidden = model !== 'linear';
  $('#gates').hidden = model !== 'hidden';
  const correct = samples.filter(([x, y]) => predict(x, y, params) === target(x, y)).length;
  const scoreDisplay = $('#score strong');
  const scoreChanged = scoreDisplay.textContent !== `${correct} / 4`;
  if (scoreChanged) scoreDisplay.textContent = `${correct} / 4`;
  const [x, y] = samples[selected];
  const expected = target(x, y);
  const result = predict(x, y, params);
  const match = result === expected ? t('正确', 'Correct') : t('错分', 'Misclassified');
  let trace;
  let gates;
  if (model === 'linear') {
    const score = params[0] * x + params[1] * y + params[2];
    trace = t(`加权和 ${score.toFixed(2)}`, `weighted sum ${score.toFixed(2)}`);
    gates = `<div class="flow-stage"><span>${t('加权和 z', 'Weighted sum z')}</span><strong>${score.toFixed(2)}</strong></div>`;
  } else {
    const { any, both } = hidden(x, y);
    trace = t(`至少一个为 1：${any}，两个都为 1：${both}`, `at least one 1: ${any}, both 1: ${both}`);
    gates = `<div class="flow-stage"><span>${t('隐藏层', 'Hidden layer')}</span><strong>OR ${any} <i>·</i> AND ${both}</strong></div>`;
  }
  const flow = $('#signal-flow');
  flow.innerHTML = `<div class="flow-stage"><span>${t('输入', 'Input')}</span><strong>(${x}, ${y})</strong></div>${icon('arrow-right')}${gates}${icon('arrow-right')}<div class="flow-stage ${result===expected?'match':'mismatch'}"><span>${t('预测 / 目标', 'Prediction / target')}</span><strong>${result} / ${expected}</strong></div>`;
  if (animate) reveal(flow.querySelectorAll('.flow-stage'), {distance:5, duration:220, stagger:82});
  if (animate && scoreChanged) reveal([scoreDisplay]);
  $('#sample-result').textContent = t(`(${x}, ${y}) · ${trace} · 预测 ${result} / 目标 ${expected} · ${match}`, `(${x}, ${y}) · ${trace} · prediction ${result} / target ${expected} · ${match}`);
  canvas.setAttribute('aria-label', t(`XOR 决策区域。${correct} 个样本分类正确，共 4 个。${$('#sample-result').textContent}`, `XOR decision regions. ${correct} of 4 correct. ${$('#sample-result').textContent}`));
  draw(params);
}

function selectSample(index, fromSequence = false) {
  if (!fromSequence) stopSequence();
  selected = index;
  renderLab(true);
}

function stopSequence() {
  clearTimeout(sequenceTimer);
  sequenceTimer = undefined;
  $('#sequence').setAttribute('aria-pressed', 'false');
  $('#sequence').innerHTML = icon('play') + t('依次播放', 'Play all');
}

$('#sequence').addEventListener('click', () => {
  if (sequenceTimer) return stopSequence();
  const button = $('#sequence');
  button.setAttribute('aria-pressed', 'true');
  function next(i) {
    selectSample(i, true);
    button.innerHTML = icon('pause') + t(`暂停 ${i+1}/${samples.length}`, `Pause ${i+1}/${samples.length}`);
    sequenceTimer = setTimeout(() => i+1 < samples.length ? next(i+1) : stopSequence(), 1050);
  }
  next(0);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSequence(); });
canvas.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();
  const hit = sampleLocations.findIndex(([x,y]) => Math.hypot(event.clientX - rect.left - x, event.clientY - rect.top - y) <= 23);
  if (hit >= 0) selectSample(hit);
});

function setModel(value) { stopSequence(); model = value; renderLab(true); }
modelButtons.forEach(button => button.addEventListener('click', () => setModel(button.dataset.model)));
controls.forEach(id => $('#' + id).addEventListener('input', () => { if (sequenceTimer) stopSequence(); renderLab(); }));
new ResizeObserver(() => draw(weights())).observe(canvas);
stopSequence();
renderLab();
reveal(document.querySelectorAll('.hero-copy > *, .lab'), {distance:10, duration:300, stagger:47});

const choices = [2, 3, 4].map(value => {
  const button = element('button', String(value));
  button.type = 'button';
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    choices.forEach(other => other.setAttribute('aria-pressed', other === button));
    const feedback = $('#feedback');
    feedback.className = value === 3 ? 'feedback correct' : 'feedback incorrect';
    feedback.textContent = value === 3
      ? t('答对了。对角线上的同类样本无法用一条直线全部分开。初始的 OR 边界能答对三个。', 'Correct. A line cannot separate the two classes at opposite corners. The initial OR boundary gets three samples right.')
      : value === 4
        ? t('再想一想。连接两个正例、再连接两个负例，两条线段在中心相交。一条直线无法把它们放在完全不同的两侧。', 'Try again. Join the two positive points, and then the two negative points. Their segments cross in the center, so a line cannot put them on opposite sides.')
        : t('可以做得更好。回到单层模型，取 w₁=w₂=1、bias=−0.5，数一数只有哪个样本错分。', 'You can do better. Set w₁ = w₂ = 1 and bias = −0.5 in the single-layer model. Which one sample is wrong?');
    $('#retry').hidden = false;
    reveal([feedback], {distance:4});
  });
  $('#choices').append(button);
  return button;
});
$('#retry').addEventListener('click', () => {
  choices.forEach(button => button.setAttribute('aria-pressed', 'false'));
  $('#feedback').textContent = t('选择答案后查看解释。', 'Choose an answer to see the explanation.');
  $('#feedback').className = 'feedback';
  $('#retry').hidden = true;
  choices[0].focus();
});

const tour = [
  { title: t('先观察错分', 'Spot the error'), copy: t('拖动 bias 或权重，再点开一个样本。看错误怎样从一个点移动到另一个点。', 'Move the bias or a weight, then select a sample. Watch the error shift from one point to another.'), section: '#lab', model: 'linear' },
  { title: t('加一层隐藏单元', 'Add a hidden layer'), copy: t('比较 (1, 1) 和 (0, 1)，看看 OR 与 AND 的输出。正例落在两条边界中间。', 'Compare (1, 1) and (0, 1) and check the OR and AND outputs. The positive samples fall between the two boundaries.'), section: '#lab', model: 'hidden' },
  { title: t('把观察变成一道题', 'Try a quick check'), copy: t('先猜最多分对几个，再看解释。也可以继续玩阈值实验，看看何时更容易漏报。', 'Guess the most samples a line can classify, then read the explanation. Try the threshold lab to see when positives are missed.'), section: '#check' },
];
let tourStep = 0;
function showStep() {
  const step = tour[tourStep];
  $('#guide').hidden = false;
  document.documentElement.classList.add('tour-active');
  $('#guide-label').textContent = t(`现场导学 ${tourStep + 1} / ${tour.length}`, `Guided tour ${tourStep + 1} / ${tour.length}`);
  $('#guide-progress').value = tourStep + 1;
  $('#guide-title').textContent = step.title;
  $('#guide-copy').textContent = step.copy;
  $('#tour-back').disabled = tourStep === 0;
  $('#tour-next').textContent = tourStep === tour.length - 1 ? t('转到课程导图', 'Open learning path') : t('下一步', 'Next');
  if (step.model) setModel(step.model);
  reveal([$('.guide-content')], {distance:4});
  $(step.section).scrollIntoView({ block: 'nearest' });
}
$('#tour-start').addEventListener('click', () => {
  tourStep = 0;
  for (const [i, value] of [1, 1, -.5].entries()) $('#' + controls[i]).value = value;
  selected = 3;
  showStep();
  $('#tour-next').focus({ preventScroll: true });
});
$('#tour-back').addEventListener('click', () => { if (tourStep > 0) { tourStep--; showStep(); } });
$('#tour-next').addEventListener('click', () => {
  if (tourStep < tour.length - 1) { tourStep++; showStep(); }
  else { hideTour(); $('#map').scrollIntoView(); $('#topics button')?.focus({ preventScroll: true }); }
});
function hideTour() {
  stopSequence();
  $('#guide').hidden = true;
  document.documentElement.classList.remove('tour-active');
}
$('#tour-close').addEventListener('click', () => { hideTour(); $('#tour-start').focus(); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (sequenceTimer) stopSequence();
  else if (!$('#guide').hidden) $('#tour-close').click();
});

const buttons = new Map();
let selection;

function showTopic(topic, animate = true) {
  selection = topic;
  for (const [id, button] of buttons) button.setAttribute('aria-pressed', String(topic.id === id));
  const detail = $('#topic-detail');
  const title = element('h2', topic.title);
  title.tabIndex = -1;
  detail.replaceChildren(title, element('p', topic.summary), element('p', t('常见误区 · ', 'Pitfall · ') + topic.pitfall, 'pitfall'));
  const parents = topics.filter(other => topic.depends_on.includes(other.id));
  if (parents.length) {
    const group = element('div', '', 'path-links');
    detail.append(element('h3', t('建议先学', 'Start with')), group);
    for (const item of parents) {
      const chip = element('button', item.title, 'button outline');
      chip.type = 'button';
      chip.addEventListener('click', () => showTopic(item).focus({preventScroll:true}));
      group.append(chip);
    }
  }
  const list = element('ul');
  for (const unit of units.filter(unit => unit.topic_id === topic.id)) {
    const item = element('li');
    const link = element('a', unit.title);
    link.href = localizedLink('./study.html#practice/' + encodeURIComponent(unit.id));
    item.append(link);
    list.append(item);
  }
  detail.append(element('h3', t('自编练习', 'Exercises')), list, element('h3', t('公开参考', 'Public references')));
  for (const key of topic.sources) {
    const [label, href] = sources[key];
    const link = element('a', label, 'button outline');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    detail.append(link);
  }
  if (animate) reveal([title]);
  return title;
}

$('#topic-count').textContent = topics.length;
$('#unit-count').textContent = units.length;
for (const [column, name] of stages.entries()) {
  const option = element('option', name);
  option.value = column;
  $('#topic-stage').append(option);
}
for (const topic of topics) {
  const button = element('button', topic.title);
  button.type = 'button';
  button.addEventListener('click', () => {
    const title = showTopic(topic);
    if (matchMedia('(max-width: 730px)').matches) title.focus();
  });
  buttons.set(topic.id, button);
  $('#topics').append(button);
}
function filterTopics() {
  const query = $('#topic-search').value.trim().toLowerCase();
  const stage = $('#topic-stage').value;
  const matches = topics.filter(topic => (!stage || String(topic.column) === stage) &&
    `${topic.title} ${topic.summary}`.toLowerCase().includes(query));
  const active = new Set(matches.map(topic => topic.id));
  for (const [id, button] of buttons) button.hidden = !active.has(id);
  $('#topic-count-summary').textContent = matches.length ? countLabel(matches.length, '个主题', 'topic') : t('没有符合条件的主题', 'No matching topics');
  const next = matches.includes(selection) ? selection : matches[0];
  if (next) showTopic(next, false);
  else $('#topic-detail').replaceChildren(element('p', t('试试其他关键词或学习阶段。', 'Try a different search or learning stage.')));
}
$('#topic-search').addEventListener('input', filterTopics);
$('#topic-stage').addEventListener('change', filterTopics);
filterTopics();
