import {t, countLabel, initLanguage} from './i18n.js';
import {resources, topics, formats} from './resources.js';
import {layoutFor, migrate, scatter} from './atlas.js';
import {esc} from './learning.js';
import {icon, initMotion, reducedMotion, reveal} from './ux.js';

initLanguage();

const $ = selector => document.querySelector(selector);
const pools = $('#resource-pools');
const list = $('#resource-list');
const dialog = $('#resource-dialog');
const art = id => new URL(`./art/${id}.webp`,import.meta.url).href;
const entries = Object.entries(resources);
const topicName = new Map(topics.map(topic=>[topic.id,topic.title]));
let view;
let scope='all';
let lastDrawn;
let frame;
let lastTime;
let layout;
let scale;
let visibleBalls=[];

document.querySelectorAll('[data-icon]').forEach(node=>{node.innerHTML=icon(node.dataset.icon);});
$('#topic-controls').innerHTML = [{id:'all',title:t('全部主题', 'All topics')},...topics].map(({id,title}) =>
  `<button type="button" data-topic-filter="${id}"><i></i>${title}</button>`).join('');

pools.innerHTML = `<div class="atlas" aria-label="${t('可交互的资源主题图', 'Interactive resource map')}">
  ${topics.map(({id,title,mapTitle})=>`<div class="territory territory-${id}" data-territory="${id}" aria-hidden="true"></div>
    <span class="region-title" data-region-title="${id}" aria-hidden="true">${mapTitle??title}</span>`).join('')}
  ${entries.map(([id,item])=>`<button type="button" class="ball" data-resource="${id}" data-tone="${item.zones[0]}"
    aria-label="${esc(item.name)}"><img src="${art(id)}" alt="" width="300" height="300" draggable="false">
    <span class="ball-label">${esc(item.short)}</span></button>`).join('')}</div>`;

list.innerHTML = formats.map(({id,title}) => `<section class="listing" aria-labelledby="list-${id}-title" data-format="${id}">
  <h2 id="list-${id}-title">${title}</h2><ul>${entries.filter(([,item])=>item.format===id).map(([key,item])=>
    `<li data-list-item="${key}"><button type="button" class="list-link" data-resource="${key}">
      <img src="${art(key)}" alt="" width="300" height="300" loading="lazy">
      <span><strong>${esc(item.name)}</strong><span class="list-desc">${esc(item.preview)}</span></span>
      ${icon('arrow-right')}</button></li>`).join('')}</ul></section>`).join('');

const stage = $('.atlas');
const balls = [...pools.querySelectorAll('.ball')].map(node=>({
  node, id:node.dataset.resource, zones:resources[node.dataset.resource].zones
}));
const highlights = new Set(['playground','neural-video','flower-book','seeing-theory','diffusion-explainer','alphago']);

function included(item,id) {
  return id==='all' || item.zones.includes(id) ||
    topics.some(topic=>topic.parent===id&&item.zones.includes(topic.id));
}

function updateView() {
  visibleBalls=balls.filter(ball=>included(resources[ball.id],scope));
  for (const ball of balls) ball.node.hidden=!included(resources[ball.id],scope);
  for (const row of list.querySelectorAll('[data-list-item]')) row.hidden=!included(resources[row.dataset.listItem],scope);
  for (const section of list.querySelectorAll('.listing')) {
    section.hidden=!section.querySelector('li:not([hidden])');
  }
  for (const button of document.querySelectorAll('[data-topic-filter]')) {
    button.setAttribute('aria-pressed',String(button.dataset.topicFilter===scope));
  }
  stage.dataset.scope=scope;
  $('#resource-count').textContent=countLabel(visibleBalls.length, '个资源', 'resource');
}

function paint(ball) {
  ball.node.style.transform=`translate(${(ball.x*scale).toFixed(2)}px,${(ball.y*scale).toFixed(2)}px) translate(-50%, -50%)`;
}

function fit({remix=false}={}) {
  if (pools.hidden || !stage.clientWidth) return;
  const compact=matchMedia('(max-width: 720px)').matches;
  const next=layoutFor(compact);
  const changed=next!==layout;
  layout=next;
  scale=stage.clientWidth/layout.width;
  if (changed || remix) {
    for (const {id} of topics) {
      const circle=layout.circles[id];
      const area=stage.querySelector(`[data-territory="${id}"]`);
      area.style.left=circle.x/layout.width*100+'%';
      area.style.top=circle.y/layout.height*100+'%';
      area.style.width=circle.r*2/layout.width*100+'%';
      const label=stage.querySelector(`[data-region-title="${id}"]`);
      label.style.left=circle.label[0]/layout.width*100+'%';
      label.style.top=circle.label[1]/layout.height*100+'%';
    }
    balls.forEach(ball=>{
      ball.size = compact ? 36+Math.random()*7 : 44+Math.random()*13;
      if (highlights.has(ball.id)) ball.size+=compact?7:13;
    });
    scatter(balls,layout);
  }
  for (const ball of balls) {
    ball.node.style.setProperty('--ball-size',Math.max(34,ball.size*scale).toFixed(2)+'px');
    paint(ball);
  }
}

function drift(now) {
  const seconds=lastTime ? Math.min((now-lastTime)/1000,.045) : 0;
  lastTime=now;
  for (const ball of visibleBalls) {
    if (ball.node.matches(':hover, :focus')) continue;
    migrate(ball,layout,seconds);
    paint(ball);
  }
  frame=requestAnimationFrame(drift);
}

function syncMotion() {
  const moving=view==='pool' && layout && !dialog.open && !document.hidden && !reducedMotion();
  if (!moving && frame) {cancelAnimationFrame(frame);frame=undefined;lastTime=undefined;}
  if (moving && !frame) frame=requestAnimationFrame(drift);
}

function showMode() {
  view=location.hash==='#list'?'list':'pool';
  for (const control of document.querySelectorAll('[data-mode]')) {
    if (control.dataset.mode===view) control.setAttribute('aria-current','true');
    else control.removeAttribute('aria-current');
  }
  pools.hidden=view!=='pool';
  list.hidden=view!=='list';
  $('.atlas-actions').hidden=view!=='pool';
  fit();
  syncMotion();
}

function showResource(id,opener) {
  const item=resources[id];
  lastDrawn=id;
  $('#resource-by').textContent=item.by;
  $('#resource-title').textContent=item.name;
  $('#resource-topics').textContent=item.zones.map(zone=>topicName.get(zone)).join(' · ');
  $('#resource-preview').textContent=item.preview;
  $('#resource-first').textContent=item.first;
  $('#resource-art').src=art(id);
  $('#resource-go').href=item.url;
  const credit=$('#resource-credit');
  credit.hidden=!item.credit;
  credit.textContent=item.credit??'';
  opener.focus({preventScroll:true});
  dialog.showModal();
  syncMotion();
  reveal([$('.resource-body')]);
}

document.addEventListener('click',event=>{
  const button=event.target.closest('button[data-resource]');
  if (button) showResource(button.dataset.resource,button);
});
$('#topic-controls').onclick=event=>{
  const button=event.target.closest('[data-topic-filter]');
  if (!button) return;
  scope=button.dataset.topicFilter;
  updateView();
};
$('#draw-resource').onclick=event=>{
  const matches=entries.filter(([,item])=>included(item,scope));
  const unused=matches.filter(([id])=>id!==lastDrawn);
  const options=unused.length?unused:matches;
  const [id]=options[Math.floor(Math.random()*options.length)];
  showResource(id,event.currentTarget);
};
$('#scatter-pool').onclick=()=>fit({remix:true});
$('#close-resource').onclick=()=>dialog.close();
dialog.addEventListener('close',syncMotion);
document.addEventListener('visibilitychange',syncMotion);
$('.skip').onclick=event=>{event.preventDefault();$('#main').focus();};
window.addEventListener('hashchange',showMode);
new ResizeObserver(()=>fit()).observe(stage);
initMotion($('#pause-pool'),{pause:t('暂停漂浮', 'Pause drift'),resume:t('继续漂浮', 'Resume drift'),onChange:syncMotion});
updateView();
showMode();
