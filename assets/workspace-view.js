import {t, locale, minutesLabel} from './i18n.js';
import {esc, knowledgeGraph, stateLabels, unitState} from './learning.js';
import {icon, reveal} from './ux.js';
import {coverageFor} from './coverage.js';

export function weeklyActivity(attempts) {
  const days = Array.from({length: 7}, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const key = [date.getFullYear(), date.getMonth()+1, date.getDate()].map(v=>String(v).padStart(2,'0')).join('-');
    return {label: date.toLocaleDateString(locale, {month:'numeric', day:'numeric'}), count: attempts.filter(a => (a.study_day ?? a.at.slice(0, 10)) === key).length};
  });
  const max = Math.max(1, ...days.map(day => day.count));
  return `<div class="weekly-bars" role="img" aria-label="${days.map(d => t(`${d.label} 提交 ${d.count} 次`, `${d.label}: ${d.count}`)).join(t('，', ', '))}">${days.map((d,i) =>
    `<div class="${i===days.length-1?'chart-today':''}"><span class="bar-value">${d.count}</span><div class="bar-track"><i style="height:${d.count/max*100}%"></i></div><span>${d.label}</span></div>`).join('')}</div>`;
}

let mapMode;
export function mountMap(container, {topics, units, attempts, stages, initial, onSelect, sourceLink}) {
  if (!topics.length) {
    container.innerHTML = `<p class="empty">${t('主题索引待准备。', 'The topic index is being prepared.')}</p>`;
    return;
  }
  const topicById = new Map(topics.map(topic => [topic.id, topic]));
  const mode = mapMode ?? (matchMedia('(max-width: 690px)').matches ? 'list' : 'graph');
  container.innerHTML = `<div class="map-tools">
    <div class="map-switch" role="group" aria-label="${t('知识路径视图', 'Learning path view')}"><button data-map-mode="graph">${icon('network')}${t('图谱', 'Graph')}</button><button data-map-mode="list">${icon('list')}${t('列表', 'List')}</button></div>
    <label class="map-search">${icon('search')}<input type="search" aria-label="${t('查找主题', 'Find a topic')}" placeholder="${t('查找主题', 'Find a topic')}"></label>
    <button class="plain map-clear" hidden>${t('清除选中', 'Clear selection')}</button>
    </div>
    <div class="map-layout"><div class="map-visual">
      ${knowledgeGraph(topics, initial, stages)}
      <div class="map-list">${topics.map(topic => `<button data-list-topic="${esc(topic.id)}"><strong>${esc(topic.title)}</strong><span>${stateLabels[topic.state] ?? t('未诊断', 'Not attempted')}</span></button>`).join('')}</div>
      <p class="small muted map-count" role="status"></p></div>
      <div class="topic-detail"></div></div>`;

  const graph = container.querySelector('.graph-scroll');
  const list = container.querySelector('.map-list');
  const detail = container.querySelector('.topic-detail');
  const search = container.querySelector('input');
  const clear = container.querySelector('.map-clear');
  const buttons = [...container.querySelectorAll('[data-topic], [data-list-topic]')];
  const topicId = button => button.dataset.topic ?? button.dataset.listTopic;
  const paths = [...graph.querySelectorAll('path[data-from]')];
  let activeMode = mode;
  let selected = initial;

  function changeMode(next) {
    activeMode = next;
    graph.hidden = next !== 'graph';
    list.hidden = next !== 'list';
    container.querySelectorAll('[data-map-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mapMode === next));
    });
  }

  function updateGraph() {
    const query = search.value.trim().toLowerCase();
    const matches = new Set(topics.filter(t => t.title.toLowerCase().includes(query)).map(t => t.id));
    const relevant = new Set(selected ? [selected] : []);
    for (const path of paths) {
      const {from, to} = path.dataset;
      const connected = Boolean(selected && (from === selected || to === selected));
      if (connected) {
        relevant.add(from);
        relevant.add(to);
      }
      path.classList.toggle('edge-active', connected);
      path.classList.toggle('edge-muted', (selected && !connected) || !matches.has(from) || !matches.has(to));
    }
    for (const button of buttons) {
      const id = topicId(button);
      const match = matches.has(id);
      button.setAttribute('aria-pressed', String(id === selected));
      button.classList.toggle('node-related', !!selected && relevant.has(id));
      button.classList.toggle('node-muted', !!selected && !relevant.has(id));
      button.hidden = !match;
    }
    container.querySelector('.map-count').textContent = query
      ? t(`找到 ${matches.size} / ${topics.length} 个主题`, `${matches.size} of ${topics.length} topics found`)
      : t('箭头指向后续主题。选择节点可查看直接先修、练习和公开参考。', 'Arrows point to follow-on topics. Select a topic to see prerequisites, exercises, and references.');
  }

  function detailLinks(items, label) {
    if (!items.length) return '';
    return `<div class="topic-links"><h4>${label}</h4>${items.map(topic =>
      `<button class="plain" data-related="${esc(topic.id)}">${esc(topic.title)}</button>`).join('')}</div>`;
  }

  function select(id, animate = true) {
    selected = id;
    onSelect(id);
    clear.hidden = !id;
    const topic = topicById.get(id);
    if (!topic) {
      detail.innerHTML = t('<h3>选择一个学习主题</h3><p class="muted">查看它的先修、关联练习和公开参考。</p>', '<h3>Choose a topic</h3><p class="muted">See its prerequisites, related exercises, and references.</p>');
    } else {
      const parents = (topic.depends_on ?? []).map(id => topicById.get(id)).filter(Boolean);
      const children = topics.filter(t => t.depends_on?.includes(topic.id));
      const practice = units.filter(u => u.topic_id === id);
      detail.innerHTML = `<div class="topic-head"><span class="eyebrow">${stateLabels[topic.state] ?? t('未诊断', 'Not attempted')}</span><h3 tabindex="-1">${esc(topic.title)}</h3></div>
        ${topic.summary?`<p>${esc(topic.summary)}</p>`:''}
        <details class="topic-coverage"><summary>${t('练习范围与后续缺口','Practice scope and remaining gaps')}</summary><p>${esc(coverageFor(topic.id).prepared)}</p><p class="muted">${t('还可以继续学：','Continue with: ')}${esc(coverageFor(topic.id).remaining)}</p></details>
        ${topic.pitfall?`<p class="notice"><strong>${t('常见误区', 'Pitfall')}</strong> ${esc(topic.pitfall)}</p>`:''}
        ${detailLinks(parents, t('建议先学', 'Start with'))}${detailLinks(children, t('可以接着学', 'Learn next'))}
        <h4>${t('关联练习', 'Related exercises')}</h4>${practice.map(u => `<button class="topic-practice" data-open="${esc(u.id)}"><span>${esc(u.title)}<small>${minutesLabel(u.minutes)} · ${unitState(u, attempts).label}</small></span>${icon('arrow-right')}</button>`).join('') || `<p class="small muted">${t('练习待准备。', 'No exercises yet.')}</p>`}
        ${(topic.sources??[]).length?`<h4>${t('公开参考', 'Public references')}</h4>${topic.sources.map(ref => sourceLink(ref)).join('')}`:''}
        ${topic.dependency_provenance?`<p class="small muted">${esc(topic.dependency_provenance)}</p>`:''}`;
      detail.querySelectorAll('[data-related]').forEach(button => button.onclick = () => {
        select(button.dataset.related);
        detail.querySelector('h3').focus({preventScroll:true});
        if (activeMode === 'graph') buttons.find(node => node.dataset.topic === selected && !node.hidden)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      });
    }
    updateGraph();
    if (animate) reveal(detail.children.length ? [detail.querySelector('h3')] : []);
  }

  search.oninput = updateGraph;
  clear.onclick = () => { search.focus({preventScroll:true}); select(null); };
  buttons.forEach(button => button.onclick = () => {
    select(topicId(button));
    if (matchMedia('(max-width: 690px)').matches) detail.querySelector('h3').focus();
  });
  container.querySelectorAll('[data-map-mode]').forEach(button => button.onclick = () => {
    mapMode = button.dataset.mapMode;
    changeMode(mapMode);
  });
  changeMode(mode);
  select(initial, false);
}
