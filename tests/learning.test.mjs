import test from 'node:test';
import assert from 'node:assert/strict';

const storage=new Map();
globalThis.location={href:'http://example.test/study.html?lang=zh'};
globalThis.document={documentElement:{}};
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
const {units,thresholdSamples}=await import('../assets/content.js');
const {answerDetails,checkAnswer,legacyCheckAnswer,verified,assistedBefore,planSession,reservedForLater}=await import('../assets/learning.js');
const {mergeBackup,readState,updateState}=await import('../assets/store.js');
const {coverageFor}=await import('../assets/coverage.js');
const byId=new Map(units.map(unit=>[unit.id,unit]));
const at='2030-01-01T12:00:00.000Z',due='2030-01-02T12:00:00.000Z';
const attempt=(id='a'.repeat(32),question_id='scale-forward',extra={})=>({id,question_id,at,due,study_day:'2030-01-01',answer:'2.5,9',independent:true,check_result:true,outcome:'correct',assessment_type:'automatic_result',error_note:'',...extra});
const empty=()=>({version:1,minutes:30,drafts:{},attempts:[]});

const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
const squaredLoss=(values,center)=>values.reduce((sum,x)=>sum+(x-center)**2,0);
const residual=[4,7,9].map((p,i)=>p-[5,5,10][i]);
const groups=[[1,2],[6,9]];
const threshold=thresholdSamples.map(([score,label])=>({pred:score>=.8,label}));
const fp=threshold.filter(x=>x.pred&&!x.label).length,fn=threshold.filter(x=>!x.pred&&x.label).length,tp=threshold.filter(x=>x.pred&&x.label).length;
const oracle={
 'split-count':[.6,.2,.2].map(r=>240*r),
 'scale-forward':[(17-12)/2,12-1.5*2],
 'scale-variant':[(15-20)/5,(30-20)/5,(30-15)/5],
 'gradient-step':[1-.25*2*(1-4),(1-.25*2*(1-4)-4)**2],
 'gradient-overshoot':[2-1.25*2*(2+2),(2-1.25*2*(2+2)+2)**2],
 mse:[mean(residual),mean(residual.map(x=>x*x))],
 'mean-baseline':[mean([2,5,11]),squaredLoss([2,5,11],mean([2,5,11]))/3],
 'logit-threshold':[1/(1+Math.exp(-Math.log(3))),Number(1/(1+Math.exp(-Math.log(3)))>=.8)],
 'log-loss':[-Math.log(.25),-Math.log(1-.25)],
 'gini-split':[1-(.5**2+.5**2),(1-(.5**2+.5**2))-4/6*(1-(1/4)**2-(3/4)**2)],
 'tree-vote':[Number(mean([1,0,1,1,0])>.5),mean([1,0,1,1,0])],
 confusion:[15/(15+5),15/(15+10),(15+70)/(15+5+10+70)],
 'threshold-tradeoff':[fp,fn,tp/(tp+fn)],
 'train-val-gap':[.19-.02,.12-.11],
 'kmeans-step':[[0,3],[8,10]].map(mean),
 'kmeans-loss':[groups.reduce((sum,g,i)=>sum+squaredLoss(g,[0,8][i]),0),groups.reduce((sum,g)=>sum+squaredLoss(g,mean(g)),0)],
 'pca-variance':[9/(9+4+2),(9+4)/(9+4+2)],
 'pca-project':[2/Math.hypot(1,1),2/Math.hypot(1,1)**2,2/Math.hypot(1,1)**2],
 'xor-forward':[Number(1||1),Number(1&&1),1^1,1^0],
 'conv-shape':[Math.floor((7+2-3)/2)+1,Math.floor((9+2-3)/2)+1,4,4*(2*3*3+1)],
 'conv-window':[2*2-1,1*2-1,2*2-1+3-1,1*2-1+3-1]
};

for(const [id,expected] of Object.entries(oracle))test('independent numeric calculation: '+id,()=>{
 const unit=byId.get(id);assert.equal(expected.length,unit.check.values.length);
 expected.forEach((value,i)=>assert.ok(Math.abs(value-unit.check.values[i])<1e-10));
 assert.equal(checkAnswer(unit,expected.join(',')),true);
});

test('every numeric exercise is audited and every topic has an explicit scope',()=>{
 assert.equal(units.length,24);
 assert.deepEqual(units.filter(u=>u.check.type==='numeric').map(u=>u.id).sort(),Object.keys(oracle).sort());
 for(const unit of units){assert.equal(unit.kind,'generated');const c=coverageFor(unit.topic_id);assert.ok(c.goal&&c.prepared&&c.remaining);}
});

test('blank, invalid and wrong fields remain in their stated positions',()=>{
 const unit=byId.get('split-count');
 assert.deepEqual(answerDetails(unit,'144,?,48').fields.map(f=>f.status),['correct','blank','correct']);
 assert.deepEqual(answerDetails(unit,'144,1/0,47').fields.map(f=>f.status),['correct','invalid','wrong']);
 assert.deepEqual(answerDetails(unit,'144,,48').countMismatch,{expected:3,received:2});
 assert.equal(checkAnswer(unit,'144,48,48,0'),false);
});

test('fractions and decimal rounding are accepted while exact counts stay exact',()=>{
 assert.equal(checkAnswer(byId.get('logit-threshold'),'3/4，0'),true);
 assert.equal(checkAnswer(byId.get('split-count'),'144.004,48,48'),false);
 assert.equal(checkAnswer(byId.get('log-loss'),'1.386,.288'),true);
 for(const text of ['0x90,48,48','NaN,48,48','Infinity,48,48','1e999,48,48'])assert.equal(checkAnswer(byId.get('split-count'),text),false);
 assert.equal(checkAnswer(byId.get('xor-proof'),'one valid argument'),null);
});

test('prior assistance survives a cleared draft and cannot become independent evidence',()=>{
 const guided=attempt('b'.repeat(32),'scale-forward',{independent:false,hint_used:true});
 const progress={...empty(),drafts:{'scale-forward':{hint:false,read:false,text:''}},attempts:[guided]};
 assert.equal(assistedBefore(progress,'scale-forward'),true);
 const later=attempt('c'.repeat(32),'scale-forward',{at:'2030-01-03T12:00:00.000Z'});
 assert.equal(verified(later,[guided,later],byId.get('scale-forward')),false);
 const first=attempt();const laterHelp=attempt('d'.repeat(32),'scale-forward',{at:'2030-01-03T12:00:00.000Z',independent:false,answer_seen:true});
 assert.equal(verified(first,[first,laterHelp],byId.get('scale-forward')),true);
});

test('reserved follow-ups stay out of the first plan and replace a due original later',()=>{
 const now=new Date(at),progress=empty();
 assert.equal(units.filter(u=>reservedForLater(u,progress,now)).length,3);
 assert.ok(planSession(units,progress,now).tasks.every(t=>!t.unit.review_variant));
 progress.attempts=[attempt()];
 assert.equal(reservedForLater(byId.get('scale-variant'),progress,new Date('2030-01-02T07:59:00Z')),true);
 const later=planSession(units,progress,new Date('2030-01-02T12:01:00Z'));
 assert.equal(later.tasks[0].unit.id,'scale-variant');
 assert.ok(later.tasks.reduce((sum,t)=>sum+t.unit.minutes,0)<=progress.minutes);
 assert.equal(new Set(later.tasks.map(t=>t.unit.skill_id)).size,later.tasks.length);
});

test('legacy backup imports preserve original records, and guidance merges monotonically',()=>{
 storage.clear();
 const legacy=attempt('e'.repeat(32),'split-count',{answer:'144.004,48,48'});
 assert.equal(legacyCheckAnswer(byId.get('split-count'),legacy.answer),true);
 const backup={...empty(),drafts:{'split-count':{text:'unfinished',hint:true,read:false}},attempts:[legacy]};
 mergeBackup(JSON.stringify(backup));
 assert.deepEqual(readState().attempts[0],legacy);
 assert.equal(verified(legacy,[legacy],byId.get('split-count')),false);
 updateState(data=>{data.drafts['split-count']={text:'local draft',hint:false,read:true};});
 mergeBackup(JSON.stringify(backup));
 assert.deepEqual(readState().drafts['split-count'],{text:'local draft',hint:true,read:true});
 assert.equal(readState().attempts.length,1);
});

test('new backups round trip with evidence and reject historical conflicts atomically',()=>{
 storage.clear();const a=attempt('f'.repeat(32),'scale-forward',{assessment_version:2,hint_used:false,answer_seen:false,skill_id:'standardize'});
 mergeBackup(JSON.stringify({...empty(),attempts:[a]}));
 const exported=JSON.stringify(readState());mergeBackup(exported);assert.equal(JSON.stringify(readState()),exported);
 assert.throws(()=>mergeBackup(JSON.stringify({...empty(),attempts:[{...a,error_note:'conflict'}]})));
 assert.equal(JSON.stringify(readState()),exported);
 assert.throws(()=>mergeBackup(JSON.stringify({...empty(),attempts:[{...a,question_id:'another-subject'}]})));
 assert.equal(JSON.stringify(readState()),exported);
});
