import {t} from './i18n.js';
import {units} from './content.js';
import {checkAnswer} from './learning.js';

const key = new URL('../', import.meta.url).pathname + 'ml-study-data-v1';
const known = new Map(units.map(unit => [unit.id, unit]));
export const budgets = [15,30,45,60,90];
const empty = () => ({version:1, minutes:30, drafts:{}, attempts:[]});
let memory;
let writable = true;

export function readState() {
  if (!writable) return memory ?? empty();
  try {
    return JSON.parse(localStorage.getItem(key)) ?? empty();
  } catch {
    writable = false;
    return memory ?? empty();
  }
}

export const canSave = () => writable;

export function updateState(change) {
  const current = readState();
  change(current);
  memory = current;
  if (writable) {
    try { localStorage.setItem(key, JSON.stringify(current)); }
    catch { writable = false; }
  }
  return current;
}

export function newId() {
  const buffer = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function mergeBackup(text) {
  const backup = JSON.parse(text);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const fail = () => { throw new Error(t('备份格式不匹配，请选择本工作台导出的 JSON。', 'Choose a JSON backup exported by this workbench.')); };
  if (!object(backup) || backup.version !== 1 || !Array.isArray(backup.attempts) ||
      !object(backup.drafts) || !budgets.includes(backup.minutes)) fail();
  const importedDrafts = {};
  for (const [id, draft] of Object.entries(backup.drafts)) {
    if (!known.has(id) || !object(draft) || typeof draft.text !== 'string' || draft.text.length > 8000 ||
        typeof draft.hint !== 'boolean' || typeof draft.read !== 'boolean') fail();
    importedDrafts[id] = {text:draft.text, hint:draft.hint, read:draft.read};
  }
  const importedHistory = new Map();
  for (const a of backup.attempts) {
    if (!object(a) || !known.has(a.question_id) || typeof a.id !== 'string' || !/^[a-f0-9]{32}$/.test(a.id) ||
        importedHistory.has(a.id) || typeof a.answer !== 'string' || !a.answer.trim() || a.answer.length > 8000 ||
        typeof a.independent !== 'boolean' || !['correct','incorrect','uncertain'].includes(a.outcome) ||
        typeof a.error_note !== 'string' || a.error_note.length > 1000 ||
        typeof a.at !== 'string' || typeof a.due !== 'string' || !Number.isFinite(Date.parse(a.at)) ||
        !Number.isFinite(Date.parse(a.due)) || Date.parse(a.due) <= Date.parse(a.at) ||
        typeof a.study_day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(a.study_day)) fail();
    const result = checkAnswer(known.get(a.question_id), a.answer);
    if (a.check_result !== result || (result !== null && a.outcome !== (result ? 'correct' : 'incorrect'))) fail();
    importedHistory.set(a.id, {
      id:a.id, question_id:a.question_id, at:a.at, study_day:a.study_day, due:a.due,
      answer:a.answer, independent:a.independent, check_result:result, outcome:a.outcome,
      assessment_type:result===null?'self':'automatic_result', error_note:a.error_note
    });
  }
  return updateState(current => {
    const existing = new Map(current.attempts.map(a => [a.id, a]));
    for (const [id, attempt] of importedHistory) {
      if (existing.has(id) && JSON.stringify(existing.get(id)) !== JSON.stringify(attempt)) {
        throw new Error(t('这份备份中的部分作答与现有记录冲突。', 'Some answers in this backup conflict with existing records.'));
      }
      existing.set(id, attempt);
    }
    current.attempts = [...existing.values()].sort((a,b) => a.at.localeCompare(b.at));
    for (const [id, draft] of Object.entries(importedDrafts)) {
      current.drafts[id] = current.drafts[id] ? {...current.drafts[id], read:current.drafts[id].read || draft.read} : draft;
    }
  });
}
