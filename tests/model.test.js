import { test } from 'node:test';
import assert from 'node:assert/strict';
import { units, reconcile, total, weekly, paydayPlan, validateGoals, validDate, planOverview, validateBackup } from '../src/model.js';
test('amounts preserve integer Luna and reject invalid or unsafe values',()=>{
  assert.equal(units('0.00001'),1);assert.equal(units('1.23456'),123456);
  for(const value of ['-1','NaN','0','1.000001','1e30','999999999999999999999']) assert.throws(()=>units(value));
});
test('falling balances reduce all goals without creating money or rounding losses',()=>{
  const goals=[{allocated:5},{allocated:3},{allocated:2}];
  assert.deepEqual(reconcile(goals,20),{goals,reduced:false});
  for(let balance=0;balance<10;balance++){
    const r=reconcile(goals,balance);assert.equal(total(r.goals),balance);
    r.goals.forEach((g,i)=>assert.ok(g.allocated>=0&&g.allocated<=goals[i].allocated));
  }
  assert.deepEqual(reconcile([],0),{goals:[],reduced:false});
});
test('no negative suggested savings for complete or overdue goals',()=>{
  assert.equal(weekly({date:'2026-11-07',target:100,allocated:0},new Date('2026-11-01T12:00:00')),100);
  assert.equal(weekly({date:'2020-01-01',target:100,allocated:100}),0);
});
const g = (id, target, allocated, date='2026-12-01') => ({id, name:id, target, allocated, date});
test('payday fills earliest deadlines first, never beyond wallet balance or goal target',()=>{
  const goals=[g('later',300,0,'2027-01-01'),g('soon',100,80,'2026-11-10')];
  const result=paydayPlan(goals,500,200,50,50);
  assert.equal(result.assigned,100);
  assert.deepEqual(result.goals.map(g=>g.allocated),[80,100]);
  assert.equal(total(goals),80,'original plan must remain unchanged');
  const limited=paydayPlan(goals,100,1000,100,10);
  assert.equal(limited.assigned,10);assert.equal(total(limited.goals),90);
});
test('payday protects spending buffer, caps at goals, and handles zero free funds',()=>{
  const goals=[g('one',30,10)];
  assert.equal(paydayPlan(goals,100,100,100,0).assigned,20);
  assert.equal(paydayPlan(goals,10,100,100,0).assigned,0);
  assert.equal(paydayPlan(goals,100,100,100,200).assigned,0);
  for(const bad of [NaN,-1,101,0.5]) assert.throws(()=>paydayPlan(goals,100,100,bad,0));
});
test('fractional Luna cannot appear at large balances',()=>{
  const max=Number.MAX_SAFE_INTEGER, goals=[g('a',max-100,max-100),g('b',100,100)];
  const result=reconcile(goals,max-99);
  assert.equal(total(result.goals),max-99);
  result.goals.forEach(g=>assert.ok(Number.isSafeInteger(g.allocated)));
  assert.equal(units('90071992547.40991'),max);
  assert.throws(()=>units('90071992547.40992'));
});
test('backups reject duplicate ids, malformed dates and unsafe aggregate allocations',()=>{
  const goal=g('one',100,10);
  assert.deepEqual(validateGoals([goal]),[goal]);
  assert.throws(()=>validateGoals([goal,{...goal}]));
  assert.throws(()=>validateGoals([{...goal,id:'<script>'}]));
  assert.throws(()=>validateGoals([{...goal,date:'2026-02-30'}]));
  assert.throws(()=>validateGoals([{...goal,allocated:101}]));
  assert.throws(()=>validateGoals([g('a',Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER),g('b',1,1)]));
  assert.ok(validDate('2028-02-29'));assert.equal(validDate('2026-02-29'),false);
});
test('overview prioritises the earliest unfinished goal and protects the unassigned calculation',()=>{
  const goals=[g('done',100,100,'2026-11-01'),g('later',800,100,'2026-12-01'),g('next',300,100,'2026-11-09')];
  const result=planOverview(goals,500,'2026-11-02');
  assert.equal(result.next.id,'next');assert.equal(result.days,7);assert.equal(result.perWeek,200);
  assert.equal(weekly(result.next,new Date('2026-11-02T23:59:59')),result.perWeek,'goal cards and overview must use the same calendar-day target');
  assert.equal(result.unassigned,200);assert.equal(result.complete,1);
  assert.deepEqual(goals.map(g=>g.id),['done','later','next'],'reviewing must not reorder the stored goals');
  assert.equal(planOverview(goals,100,'2026-11-02').unassigned,0);
  assert.equal(planOverview([],0,'2026-11-02').next,null);
  assert.equal(planOverview([g('done',100,100)],100,'2026-11-02').next,null);
});
test('overview handles today, overdue dates, leap days and precise small amounts',()=>{
  assert.equal(planOverview([g('now',3,0,'2026-11-02')],10,'2026-11-02').days,0);
  const overdue=planOverview([g('late',3,0,'2026-11-01')],10,'2026-11-02');
  assert.equal(overdue.days,-1);assert.equal(overdue.perWeek,3);
  const leap=planOverview([g('leap',3,0,'2028-03-01')],10,'2028-02-28');
  assert.equal(leap.days,2);
  assert.equal(planOverview([g('tiny',1,0,'2026-12-01')],10,'2026-11-02').perWeek,1);
  assert.throws(()=>planOverview([],NaN,'2026-11-02'));
  assert.throws(()=>planOverview([],0,'2026-02-30'));
});
test('backup restore refuses a different wallet, network or version and preserves the v2 format',()=>{
  const backup={version:2,network:'mainnet',address:'wallet-a',goals:[g('one',100,10)]};
  assert.deepEqual(validateBackup(backup,'mainnet','wallet-a'),backup.goals);
  assert.throws(()=>validateBackup(backup,'testnet','wallet-a'));
  assert.throws(()=>validateBackup(backup,'mainnet','wallet-b'));
  assert.throws(()=>validateBackup({...backup,version:1},'mainnet','wallet-a'));
  assert.throws(()=>validateBackup({...backup,goals:[...backup.goals,...backup.goals]},'mainnet','wallet-a'));
  assert.throws(()=>validateBackup(backup,'unknown','wallet-a'));
});
