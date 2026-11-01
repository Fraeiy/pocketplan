export const LUNA = 100000;
export function units(value) {
  if (!/^\d+(\.\d{1,5})?$/.test(String(value))) throw new Error('Use a positive NIM amount with up to 5 decimal places.');
  const [whole, fraction = ''] = String(value).split('.');
  const exact = BigInt(whole) * 100000n + BigInt(fraction.padEnd(5, '0'));
  if (exact > BigInt(Number.MAX_SAFE_INTEGER) || exact <= 0n) throw new Error('Enter a valid amount greater than zero.');
  return Number(exact);
}
export function total(goals) { return goals.reduce((sum, g) => sum + g.allocated, 0); }
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
export function validateGoals(goals) {
  if (!Array.isArray(goals) || goals.length > 100) throw new Error('A plan can contain up to 100 goals.');
  const ids = new Set(); let sum = 0n;
  for (const g of goals) {
    if (!g || typeof g.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(g.id) || ids.has(g.id) || typeof g.name !== 'string' || !g.name.trim() || g.name.length > 60 || !Number.isSafeInteger(g.target) || g.target <= 0 || !Number.isSafeInteger(g.allocated) || g.allocated < 0 || g.allocated > g.target || !validDate(g.date)) throw new Error('The plan contains invalid goal data.');
    ids.add(g.id); sum += BigInt(g.allocated);
  }
  if (sum > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('The total allocation is too large.');
  return goals.map(({id, name, target, allocated, date}) => ({id, name, target, allocated, date}));
}
export function reconcile(goals, balance) {
  const sum = total(goals);
  if (sum <= balance || !sum) return { goals, reduced: false };
  const next = goals.map(g => ({ ...g, allocated: Number(BigInt(g.allocated) * BigInt(balance) / BigInt(sum)) }));
  let remainder = balance - total(next);
  for (let i = 0; remainder > 0; i = (i + 1) % next.length) {
    if (next[i].allocated < goals[i].allocated) { next[i].allocated++; remainder--; }
  }
  return { goals: next, reduced: true };
}
export function weekly(goal, today = new Date()) {
  const end = new Date(goal.date + 'T23:59:59');
  const weeks = Math.max(1, Math.ceil((end - today) / 604800000));
  return Math.ceil(Math.max(0, goal.target - goal.allocated) / weeks);
}
// Allocate only existing, unassigned funds. Earlier deadlines receive funds first.
export function paydayPlan(goals, balance, income, percent, buffer) {
  if (![balance, income, buffer].every(n => Number.isSafeInteger(n) && n >= 0) || !Number.isInteger(percent) || percent < 0 || percent > 100) throw new Error('Enter valid payday amounts and a percentage from 0 to 100.');
  const available = Math.max(0, balance - total(goals) - buffer);
  const requested = Number(BigInt(income) * BigInt(percent) / 100n);
  let remaining = Math.min(available, requested);
  const increments = new Map();
  const ordered = goals.map((g,i)=>({...g,index:i})).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
  for (const g of ordered) { const add = Math.min(g.target - g.allocated, remaining); increments.set(g.id, add); remaining -= add; }
  const next = goals.map(g => ({...g, allocated:g.allocated+(increments.get(g.id)||0)}));
  return { goals:next, additions:increments, assigned:total(next)-total(goals), requested, available };
}
