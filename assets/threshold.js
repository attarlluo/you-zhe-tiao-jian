import {thresholdSamples} from './content.js';

export function evaluateThreshold(samples, threshold) {
  const counts = {tp:0, fp:0, fn:0, tn:0};
  for (const [score, label] of samples) {
    const key = score >= threshold ? (label ? 'tp' : 'fp') : (label ? 'fn' : 'tn');
    counts[key]++;
  }
  return counts;
}

export function mountThreshold() {
  const slider = document.querySelector('#threshold');
  const output = document.querySelector('#threshold-value');
  const list = document.querySelector('#threshold-samples');
  const summary = document.querySelector('#threshold-summary');
  const items = thresholdSamples.map(([score, label]) => {
    const item = document.createElement('li');
    item.className = label ? 'actual-positive' : 'actual-negative';
    item.innerHTML = `<strong>${score.toFixed(2)}</strong><span>真实${label?'正':'负'}</span><small></small>`;
    list.append(item);
    return item;
  });
  const ratio = (numerator, denominator) => denominator ? (numerator / denominator).toFixed(2) : '—';
  function update() {
    const threshold = Number(slider.value) / 100;
    output.value = threshold.toFixed(2);
    slider.setAttribute('aria-valuetext', threshold.toFixed(2));
    thresholdSamples.forEach(([score, label], index) => {
      const predicted = Number(score >= threshold);
      items[index].classList.toggle('wrong', label !== predicted);
      items[index].querySelector('small').textContent = `判${predicted?'正':'负'}${predicted!==label?' ×':''}`;
    });
    const {tp,fp,fn,tn} = evaluateThreshold(thresholdSamples, threshold);
    const values = [['TP / FP', tp+' / '+fp], ['FN / TN', fn+' / '+tn],
      ['精确率',ratio(tp,tp+fp)], ['召回率',ratio(tp,tp+fn)]];
    summary.innerHTML = values.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  }
  slider.addEventListener('input', update);
  update();
}
