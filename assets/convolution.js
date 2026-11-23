const inputSize = 6;
const kernelSize = 3;
const $ = id => document.getElementById(id);

export function mountConvolution() {
  let row = 0;
  let col = 0;
  let stride = 1;
  let padding = 0;
  let outputSize = 0;
  let outputs = [];
  let windowOverlay;

  function select(nextRow, nextCol, focus = false) {
    row = nextRow;
    col = nextCol;
    const active = outputs[row * outputSize + col];
    for (const cell of outputs) {
      cell.tabIndex = cell === active ? 0 : -1;
      cell.setAttribute('aria-pressed', String(cell === active));
    }
    const top = row * stride;
    const left = col * stride;
    const ratio = 100 / (inputSize + 2 * padding);
    windowOverlay.style.transform = `translate(${left / kernelSize * 100}%, ${top / kernelSize * 100}%)`;
    function usedPadding(offset) {
      return offset < padding || offset + kernelSize > inputSize + padding;
    }
    windowOverlay.style.setProperty('--window-size', `${kernelSize * ratio}%`);
    $('conv-detail').textContent = `输出 (${row}, ${col}) ← 输入行 ${top - padding} 到 ${top - padding + kernelSize - 1}，列 ${left - padding} 到 ${left - padding + kernelSize - 1}。` +
      (usedPadding(top) || usedPadding(left) ? ' 窗口包含零填充。' : '');
    if (focus) active.focus({preventScroll:true});
  }

  function build() {
    stride = Number($('stride').value);
    padding = Number($('padding').value);
    outputSize = Math.floor((inputSize + 2 * padding - kernelSize) / stride) + 1;
    const padded = inputSize + 2 * padding;
    const input = $('conv-input');
    input.style.setProperty('--cells', padded);
    input.replaceChildren(...Array.from({length:padded * padded}, (_, i) => {
      const r = Math.floor(i / padded);
      const c = i % padded;
      const cell = document.createElement('span');
      const outside = Math.min(r, c) < padding || Math.max(r, c) >= inputSize + padding;
      cell.className = outside ? 'conv-cell padded' : 'conv-cell';
      if (outside) cell.textContent = '0';
      return cell;
    }));
    windowOverlay = document.createElement('span');
    windowOverlay.className = 'conv-window';
    input.append(windowOverlay);

    const output = $('conv-output');
    output.style.setProperty('--cells', outputSize);
    outputs = Array.from({length:outputSize * outputSize}, (_, i) => {
      const r = Math.floor(i / outputSize);
      const c = i % outputSize;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'conv-cell';
      cell.setAttribute('aria-label', `输出行 ${r}，列 ${c}`);
      cell.addEventListener('click', () => select(r, c));
      return cell;
    });
    output.replaceChildren(...outputs);
    $('conv-input-size').textContent = padding ? `${inputSize} × ${inputSize}，填充后 ${padded} × ${padded}` : `${inputSize} × ${inputSize}`;
    $('conv-output-size').textContent = `${outputSize} × ${outputSize}`;
    $('conv-formula').textContent = `⌊(${inputSize} + 2 × ${padding} − ${kernelSize}) / ${stride}⌋ + 1 = ${outputSize}`;
    select(Math.min(row, outputSize - 1), Math.min(col, outputSize - 1));
  }

  $('conv-output').addEventListener('keydown', event => {
    const offset = {ArrowDown:[1,0], ArrowUp:[-1,0], ArrowRight:[0,1], ArrowLeft:[0,-1]}[event.key];
    if (!offset) return;
    event.preventDefault();
    const clamp = value => Math.min(outputSize - 1, Math.max(0, value));
    select(clamp(row + offset[0]), clamp(col + offset[1]), true);
  });
  $('stride').addEventListener('change', build);
  $('padding').addEventListener('change', build);
  build();
}
