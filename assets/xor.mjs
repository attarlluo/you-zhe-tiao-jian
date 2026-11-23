export const samples = [[0, 0], [0, 1], [1, 0], [1, 1]];
export const target = (x, y) => Number(x !== y);
export const step = value => Number(value >= 0);
export const linear = (x, y, w1, w2, bias) => step(w1 * x + w2 * y + bias);

export function hidden(x, y) {
  const any = step(x + y - .5);
  const both = step(x + y - 1.5);
  return { any, both, output: step(any - both - .5) };
}
