import { init, getHostNetwork } from '@nimiq/mini-app-sdk';
import { LUNA, units, total, reconcile, weekly, paydayPlan, validateGoals, validDate, planOverview, validateBackup } from './model.js';
import './style.css';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => new Intl.NumberFormat('en', { maximumFractionDigits: 5 }).format(n / LUNA);
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
const day = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
let provider, accounts = [], address = '', balance = null, updated = null, goals = [], demo = false, busy = false, stale = false, notice = '';
let network = '', session = 0, refreshTask = null, refreshing = false, damagedStorage = false;
const key = () => 'pocketplan:v2:' + (demo ? 'demo' : network + ':' + address);
const fmtShort = n => new Intl.NumberFormat('en', {maximumFractionDigits:2}).format(n / LUNA);
function resetSession() { session++; provider?.disconnect(); address=''; balance=null; goals=[]; demo=false; accounts=[]; network=''; updated=null; stale=false; refreshTask=null; refreshing=false; damagedStorage=false; }
function load() {
  try {
    const raw = localStorage.getItem(key());
    goals = validateGoals(JSON.parse(raw || '[]')); damagedStorage = false;
  } catch { goals = []; damagedStorage = true; notice = 'Saved goals could not be loaded. They have not been overwritten. Restore a valid backup to replace them.'; }
}
function persist() {
  if (damagedStorage) { notice = 'Saved data is unreadable and has not been overwritten. Export this session or restore a valid backup.'; return false; }
  try { localStorage.setItem(key(), JSON.stringify(validateGoals(goals))); return true; }
  catch { notice = 'Device storage is unavailable. Export a backup before closing this page.'; return false; }
}

function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); setTimeout(() => $('#toast').classList.remove('visible'), 5000); }
function shell() {
  $('#app').innerHTML = `<aside class="sidebar"><a class="brand" href="#"><span class="brand-icon">▱</span>PocketPlan<span class="brand-dot">.</span></a><div class="side-caption">A LITTLE TODAY. MORE TOMORROW.</div><nav><button class="nav-current" id="overview"><span>◫</span> My savings <span class="nav-arrow">↗</span></button><button id="how"><span>ⓘ</span> How it works</button></nav><div class="side-bottom"><span class="small-label">BUILT FOR NIMIQ PAY</span><p>Your money stays<br>in your wallet.</p><span class="side-mark">↗</span></div></aside><div class="main"><header><span class="breadcrumb">YOUR PERSONAL SAVINGS SPACE</span><button class="wallet-button" id="wallet">Connect Nimiq Pay <span>↗</span></button></header><main><section class="intro"><div><div class="eyebrow"><span></span> SMALL STEPS, REAL PROGRESS</div><h1>Make room for<br>what matters<span>.</span></h1><p>Big plans. Uneven paydays. Give the money<br class="desktop"> you have a purpose, one goal at a time.</p></div><div class="paper-art" aria-hidden="true"><div class="art-shadow"></div><div class="art-card"><div class="art-line"></div><div class="art-circle">↗</div><div class="art-caption">FOR YOUR<br>NEXT CHAPTER.</div><div class="art-bottom">POCKET / PLAN <span>01</span></div></div><span class="art-seal">SLOW &<br>STEADY</span></div></section><div id="status" role="status"></div><section class="balance-panel"><div class="balance-primary"><div class="small-label" id="balance-label">CONNECTED BALANCE</div><div class="balance-value" id="balance">— <small>NIM</small></div><div class="balance-sub" id="balance-sub">Connect your wallet to see your balance.</div></div><div class="balance-secondary"><div><span class="small-label">ASSIGNED TO GOALS</span><strong id="assigned">—</strong></div><div><span class="small-label">UNASSIGNED</span><strong id="available">—</strong></div></div><button id="refresh" class="refresh" aria-label="Refresh wallet balance" title="Refresh balance">↻</button></section><section id="plan-overview" class="plan-overview" aria-label="Your next move" hidden></section><section class="payday-panel"><div><span class="small-label">FOR THE DAYS YOU GET PAID</span><h2>A little for today. A little for later.</h2><p>Plan a share of your payday, with room for everyday spending.</p></div><button id="payday" class="button outline">Plan this payday ↗</button></section><div class="section-heading"><div><h2>Your goals <span id="goal-count">0</span></h2><p>A purpose for every pocket.</p></div><button class="button dark" id="new-goal">＋ New goal</button></div><section id="goals" class="goals"></section><div class="bottom-note"><span>◈</span><p>Plans, not locked funds. Allocations stay in your wallet and can still be spent.<br>When your balance falls, we reduce allocations on your next successful refresh.</p></div><footer><span>PocketPlan / Save at your own pace.</span><div><button id="export">Export backup ↗</button><button id="import">Restore backup</button></div></footer><input type="file" accept="application/json" id="restore-file" hidden></main></div><dialog id="dialog"></dialog><div id="toast" role="status"></div>`;
  $('#wallet').onclick = connect;
  $('#refresh').onclick = refresh;
  $('#payday').onclick = () => { if (!address || !goals.length) return info('Start with a goal', 'Connect Nimiq Pay and create a goal first, or explore the example. Then plan how much of a payday you want to assign.', !address); paydayForm(); };
  $('#new-goal').onclick = () => { if (!address) { info('Start with your wallet', 'Open PocketPlan inside Nimiq Pay and connect to plan with your real NIM balance. Or explore a separate example first.', true); return; } goalForm(); };
  $('#how').onclick = () => info('Your money. A little more direction.', 'Connect Nimiq Pay, create a goal, then assign some of your balance. No transfer happens. Every goal is a label on money in your wallet, not a separate account. If your balance drops below your allocations, a successful refresh reduces them proportionally. Plans are saved on this device and browser only. Export a backup to keep a copy. NIM prices can change; targets here are in NIM, not a guaranteed cash value.');
  $('#overview').onclick = () => window.scrollTo({top:0,behavior:'smooth'});
  $('#export').onclick = exportBackup;
  $('#import').onclick = () => { if (!address) return toast('Connect a wallet or enter example mode first.'); $('#restore-file').click(); };
  $('#restore-file').onchange = restore;
  render();
}
function render() {
  const connected = Boolean(address), known = balance !== null;
  $('#wallet').textContent = busy ? 'Connecting…' : demo ? 'Example mode · Exit ↗' : connected ? `${address.slice(0,9)}…${address.slice(-4)} · Disconnect` : 'Connect Nimiq Pay ↗';
  $('#wallet').disabled = busy;
  $('#new-goal').disabled = busy;
  $('#balance-label').textContent = demo ? 'EXAMPLE BALANCE · NOT REAL FUNDS' : 'SELECTED ADDRESS BALANCE';
  $('#balance').innerHTML = `${known ? fmt(balance) : '—'} <small>NIM</small>`;
  $('#assigned').textContent = known ? `${fmt(total(goals))} NIM` : '—';
  $('#available').textContent = known ? `${fmt(Math.max(0, balance-total(goals)))} NIM` : '—';
  $('#balance-sub').textContent = demo ? 'Sample data, stored separately from wallet goals.' : connected ? stale ? 'Refresh failed. Last known balance shown; allocations paused.' : updated ? `Updated ${updated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${network === 'mainnet' ? 'Mainnet' : 'Testnet · development only'}` : 'Balance not available. Refresh to retry.' : 'Connect your wallet to see your balance.';
  $('#refresh').disabled = !connected || busy || refreshing;
  $('#refresh').textContent = refreshing ? '…' : '↻';
  $('#payday').disabled = busy || refreshing || stale;
  $('#goal-count').textContent = goals.length;
  $('#status').innerHTML = notice ? `<div class="notice">${esc(notice)}</div>` : '';
  renderOverview(connected, known);
  $('#goals').innerHTML = goals.length ? goals.map((g,i) => {
    const pct = Math.min(100, Math.round(g.allocated/g.target*100));
    const overdue = g.date < day() && g.allocated < g.target;
    return `<article class="goal-card"><div class="goal-top"><span class="goal-symbol">${['↗','◷','⌂','✳'][i%4]}</span><button class="icon-button edit" data-id="${esc(g.id)}" aria-label="Edit ${esc(g.name)}">···</button></div><span class="goal-type">${g.allocated >= g.target ? 'GOAL REACHED' : overdue ? 'TARGET DATE PASSED' : 'SAVINGS GOAL'}</span><h3>${esc(g.name)}</h3><div class="goal-amount">${fmt(g.allocated)} <span>/ ${fmt(g.target)} NIM</span></div><div class="progress" role="progressbar" aria-label="${esc(g.name)} progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div><div class="progress-meta"><span>${pct}% planned</span><span>${new Date(g.date+'T12:00:00').toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</span></div><div class="goal-hint">${g.allocated >= g.target ? 'Your current allocation covers this goal.' : overdue ? 'Choose a new date or keep building your goal.' : `${fmtShort(weekly(g))} NIM / week to reach your target`}</div><button class="button outline allocate" data-id="${esc(g.id)}" ${!known || stale ? 'disabled' : ''}>Adjust allocation <span>↗</span></button></article>`;
  }).join('') : `<div class="empty"><div class="empty-icon">▱</div><h3>Your next chapter starts here.</h3><p>A laptop. Next semester. A rainy day.<br>Choose something worth making room for.</p><button class="text-button" id="empty-create">Create your first goal ↗</button>${!connected ? '<button class="example-button" id="demo">Explore an example</button>' : ''}</div>`;
  document.querySelectorAll('.edit').forEach(b => b.onclick = () => goalForm(b.dataset.id));
  document.querySelectorAll('.allocate').forEach(b => b.onclick = () => allocationForm(b.dataset.id));
  if ($('#empty-create')) $('#empty-create').onclick = $('#new-goal').onclick;
  if ($('#demo')) { $('#demo').onclick = startDemo; $('#demo').disabled = busy; }
}
function renderOverview(connected, known) {
  const el = $('#plan-overview');
  el.hidden = !connected || !known || damagedStorage;
  if (el.hidden) return;
  if (stale || refreshing) {
    el.innerHTML = `<div><span class="small-label">YOUR NEXT MOVE</span><h2>${refreshing ? 'Checking your balance…' : 'Refresh before making a plan.'}</h2><p>${refreshing ? 'Your plan will be checked against the latest wallet balance.' : 'The last balance may have changed. New allocation guidance is paused until a refresh succeeds.'}</p></div>`;
    return;
  }
  const summary = planOverview(goals, balance, day()), next = summary.next;
  const spend = `<div class="spending-note"><strong>${fmt(summary.unassigned)} NIM unassigned</strong><p>${summary.unassigned ? 'Spending more would dip into your goal allocations.' : goals.length ? 'Every NIM in this balance is labelled for a goal. Spending will reduce your plan.' : 'Your wallet has no NIM to plan yet.'} Your wallet still controls all funds.</p></div>`;
  let title, copy, action;
  if (!goals.length) { title='Give your first goal a name.'; copy='Pick one thing you want to save for, then choose an amount and a date.'; action='Create a goal'; }
  else if (!next) { title='Your current goals are covered.'; copy='All targets are covered by the current allocations. Keep checking your wallet balance as you spend.'; action='Add another goal'; }
  else if (summary.days < 0) { title=`Review “${next.name}”.`; copy=`Its target date has passed, with ${fmt(summary.gap)} NIM still to plan. Choose a realistic new date or adjust the goal.`; action='Review this goal'; }
  else { title=`Next up: ${next.name}`; copy=`${fmt(summary.gap)} NIM still to plan ${summary.days===0 ? 'by today' : `over the next ${summary.days} day${summary.days===1 ? '' : 's'}`}. ${summary.days===0 ? 'Review what you can assign today.' : `That works out to ${summary.perWeek < 1000 ? fmt(summary.perWeek) : fmtShort(summary.perWeek)} NIM per week.`} Use this as a weekly planning target.`; action=summary.days===0 ? 'Review this goal' : 'Plan a payday'; }
  el.innerHTML = `<div class="next-goal"><span class="small-label">YOUR NEXT MOVE</span><h2>${esc(title)}</h2><p>${esc(copy)}</p><button class="text-button" id="next-action">${action} ↗</button></div>${spend}`;
  $('#next-action').onclick = () => { if (!next) goalForm(); else if (summary.days<=0) goalForm(next.id); else paydayForm(); };
}
function show(content) { const d = $('#dialog'); d.innerHTML = `<button class="close" aria-label="Close dialog">×</button>${content}`; d.querySelector('.close').onclick=()=>d.close(); d.showModal(); d.onclick = e => { if(e.target===d) d.close(); }; }
function info(title, body, sample = false) { show(`<div class="eyebrow">POCKETPLAN</div><h2>${esc(title)}</h2><p class="dialog-copy">${esc(body)}</p>${sample ? '<button class="button dark" id="sample-start">Explore example</button>' : ''}`); if (sample) $('#sample-start').onclick = () => { $('#dialog').close(); startDemo(); }; }
function startDemo() {
  if (busy) return;
  session++; demo = true; network='example'; address = 'example'; balance = 2400*LUNA; updated = new Date(); stale = false; notice = 'Example mode. No wallet connected and no money moved.'; load();
  if (!goals.length && !damagedStorage) { const date = new Date(); date.setDate(date.getDate()+60); goals=[{id:newId(),name:'My next laptop',target:8000*LUNA,allocated:1500*LUNA,date:date.toISOString().slice(0,10)}]; persist(); }
  render();
}
async function connect() {
  if (busy) return;
  if (address) { resetSession(); notice=''; render(); return; }
  busy=true; render();
  try {
    provider = await init({timeout:6000});
    network = getHostNetwork();
    if (!['mainnet','testnet'].includes(network)) throw new Error('Update Nimiq Pay so PocketPlan can identify your network safely.');
    accounts = await provider.listAccounts();
    if (!accounts.length) throw new Error('No address shared. Try connecting again.');
    if (accounts.length > 1) {
      show(`<h2>Choose an address</h2><p class="dialog-copy">PocketPlan reads one address, not your entire wallet. Choose a regular spending address; contract balances may have restrictions.</p><div class="account-list">${accounts.map((a,i)=>`<button class="button outline" data-account="${i}">${esc(a)}</button>`).join('')}</div>`);
      document.querySelectorAll('[data-account]').forEach(b=>b.onclick=async()=>{ $('#dialog').close(); address=accounts[Number(b.dataset.account)]; load(); await refresh(); });
    } else { address=accounts[0]; load(); await refresh(); }
  } catch(e) { notice = e.type==='PERMISSION_DENIED' ? 'Connection canceled. You can try again when you’re ready.' : `Could not connect: ${e.message} Open this app inside Nimiq Pay to use your wallet.`; }
  finally {busy=false; render();}
}
async function refresh() {
  if (!address) return;
  if (demo) { updated=new Date(); render(); return; }
  if (refreshTask) return refreshTask;
  const activeNetwork = getHostNetwork();
  if (activeNetwork !== network) { resetSession(); notice='Your wallet network changed. Reconnect to open the matching plan.'; render(); return; }
  const requestedAddress = address, activeSession = session;
  refreshing=true; render();
  const task = (async () => {
    await Promise.resolve();
    try {
      if (typeof provider?.getBalance !== 'function') throw new Error('Update Nimiq Pay to a version that supports balance lookup.');
      const value = await provider.getBalance(requestedAddress);
      if (session !== activeSession || address !== requestedAddress) return;
      if (getHostNetwork() !== network) { resetSession(); notice='Your wallet network changed during refresh. Reconnect before planning.'; return; }
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('The wallet returned an invalid balance.');
      balance=value; stale=false; updated=new Date();
      if (!damagedStorage) notice='';
      const result=reconcile(goals, balance); goals=result.goals;
      if(result.reduced) { notice='Your wallet balance is lower than your plan. Goal allocations were reduced proportionally to match it.'; persist(); }
    } catch(e) { if (session!==activeSession) return; stale=true; notice=`Balance unavailable: ${e.message} We have not treated this as a zero balance.`; }
    finally { if(session===activeSession) {refreshing=false;refreshTask=null;} render(); }
  })();
  refreshTask=task;
  return task;
}
function goalForm(id) {
  const g=goals.find(x=>x.id===id);
  show(`<div class="eyebrow">A PURPOSE FOR YOUR MONEY</div><h2>${g?'Edit your goal':'What are you saving for?'}</h2><form id="goal-form"><label>Goal name<input name="name" required maxlength="60" placeholder="e.g. A new laptop" value="${esc(g?.name||'')}"></label><label>Target amount <span>NIM</span><input name="target" type="number" min="0.00001" step="0.00001" required placeholder="8000" value="${g?g.target/LUNA:''}"></label><label>Target date<input name="date" type="date" min="${day()}" required value="${g?.date||''}"></label><p class="form-error" role="alert"></p><button class="button dark" type="submit">${g?'Save changes':'Create goal'} ↗</button>${g?'<button type="button" id="delete" class="delete">Delete this goal</button>':''}</form>`);
  $('#goal-form').onsubmit=e=>{e.preventDefault();try{
    const data=new FormData(e.target), target=units(data.get('target')), name=data.get('name').trim(), date=data.get('date');
    if(!name) throw new Error('Give your goal a name.');
    if(!g && goals.length>=100) throw new Error('You can keep up to 100 goals.');
    if(!validDate(date)) throw new Error('Choose a valid target date.');
    if(date<day()) throw new Error('Choose today or a future target date.');
    if(g && target<g.allocated) throw new Error('Release some of your allocation before lowering this target.');
    if(g) Object.assign(g,{name,target,date}); else goals.push({id:newId(),name,target,date,allocated:0});
    const saved=persist(); $('#dialog').close(); render(); toast(saved?'Goal saved on this device.':'Goal created for this session. Export a backup.');
  }catch(err){$('.form-error').textContent=err.message;}};
  if(g) $('#delete').onclick=()=>{ show(`<h2>Delete “${esc(g.name)}”?</h2><p class="dialog-copy">This removes the goal and releases its planning allocation. Your wallet funds are unchanged.</p><button class="button dark" id="confirm-delete">Delete goal</button>`); $('#confirm-delete').onclick=()=>{goals=goals.filter(x=>x.id!==id);persist();$('#dialog').close();render();}; };
}
function allocationForm(id) {
  const g=goals.find(x=>x.id===id); const limit=Math.min(g.target, balance-total(goals)+g.allocated);
  show(`<div class="eyebrow">GIVE IT A PURPOSE</div><h2>${esc(g.name)}</h2><p class="dialog-copy">Choose the total NIM to label for this goal. This is a plan, not a transfer or a lock.</p><form id="allocation-form"><label>Assigned amount <span>NIM</span><input name="amount" required type="number" step="0.00001" min="0" max="${limit/LUNA}" value="${g.allocated/LUNA}"></label><p class="allocation-limit">Up to ${fmt(limit)} NIM available for this goal.</p><p class="form-error" role="alert"></p><button class="button dark" type="submit">Update allocation ↗</button></form>`);
  $('#allocation-form').onsubmit=async e=>{ e.preventDefault();
    const form=e.target, activeSession=session;
    const raw=new FormData(form).get('amount'); const button=e.target.querySelector('[type=submit]'); button.disabled=true;
    try {
      const amount = Number(raw)===0 ? 0 : units(raw);
      if(!demo) await refresh();
      if(session!==activeSession || !address) throw new Error('Wallet session changed. Reconnect and retry.');
      if(stale || balance===null) throw new Error('Refresh your balance successfully before changing an allocation.');
      const current=goals.find(x=>x.id===id);
      const available=balance-total(goals)+current.allocated;
      if(amount>available || amount>current.target) throw new Error(`You can assign up to ${fmt(Math.min(available,current.target))} NIM.`);
      current.allocated=amount; const saved=persist(); $('#dialog').close(); render(); toast(saved?'Allocation updated. Your money stays in your wallet.':'Allocation updated for this session. Export a backup.');
    } catch(err) { form.querySelector('.form-error').textContent=err.message; } finally {button.disabled=false;}
  };
}
function exportBackup() {
  if(!address) return toast('Create a plan first, then export it.');
  const blob=new Blob([JSON.stringify({version:2,network,address:demo?'example':address,goals},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url;a.download=`pocketplan-${demo?'example':'backup'}-${day()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function restore(e) {
  try {
    const file=e.target.files[0]; if(!file)return; if(file.size>200000) throw new Error('This backup is too large.');
    const data=JSON.parse(await file.text());
    data.goals=validateBackup(data, network, demo?'example':address);
    const restoreSession=session;
    show(`<h2>Restore ${data.goals.length} goals?</h2><p class="dialog-copy">This replaces this address’s goals on this device. Export your current plan first if you want to keep it. Allocations will be checked against the next successful balance refresh.</p><button class="button dark" id="confirm-restore">Replace goals</button>`);
    $('#confirm-restore').onclick=()=>{if(session!==restoreSession)return toast('Wallet session changed. Reconnect and retry.'); damagedStorage=false; goals=data.goals.map(({id,name,target,allocated,date})=>({id,name,target,allocated,date}));if(balance!==null)goals=reconcile(goals,balance).goals;const saved=persist();$('#dialog').close();render();toast(saved?'Backup restored on this device.':'Backup loaded for this session. Storage is unavailable; keep your backup.');};
  } catch(err) {toast(err.message);} finally {e.target.value='';}
}
function paydayForm() {
  if (balance===null || stale) return toast('Refresh your wallet balance first.');
  const activeSession=session;
  show(`<div class="eyebrow">SAVE ON YOUR OWN TERMS</div><h2>Make this payday count.</h2><p class="dialog-copy">Tell us what came in. We’ll plan a share for your earliest goals using only your current unassigned balance. No funds move.</p><form id="payday-form"><label>Payment received <span>NIM</span><input name="income" required type="number" min="0.00001" step="0.00001" placeholder="e.g. 500"></label><label>Save this percentage <span>%</span><input name="percent" required type="number" min="1" max="100" step="1" value="20"></label><label>Leave unassigned for spending <span>NIM</span><input name="buffer" required type="number" min="0" step="0.00001" value="0"></label><p class="form-error" role="alert"></p><button class="button dark" type="submit">Preview my plan ↗</button></form>`);
  $('#payday-form').onsubmit=async e=>{e.preventDefault();const form=e.target,button=form.querySelector('button');button.disabled=true;
    try {
      const data=new FormData(form),income=units(data.get('income')),percent=Number(data.get('percent')),buffer=Number(data.get('buffer'))===0?0:units(data.get('buffer'));
      if(!demo) await refresh();
      if(session!==activeSession || !address || stale || balance===null) throw new Error('Reconnect and refresh your balance before planning.');
      const result=paydayPlan(goals,balance,income,percent,buffer);
      if(!result.assigned) throw new Error('There is nothing to assign. Lower your spending buffer, refresh your balance, or add an unfinished goal.');
      const baseline=JSON.stringify(goals);
      show(`<div class="eyebrow">YOUR PAYDAY PLAN</div><h2>${fmtShort(result.assigned)} NIM for later.</h2><p class="dialog-copy">${percent}% of your stated payment is ${fmtShort(result.requested)} NIM. This plan is limited by your actual unassigned balance, spending buffer and remaining goals.</p><div class="payday-breakdown">${result.goals.filter(g=>result.additions.get(g.id)>0).map(g=>`<div><span>${esc(g.name)}</span><strong>+${fmtShort(result.additions.get(g.id))} NIM</strong></div>`).join('')}</div><p class="dialog-copy">Earliest target dates come first. This only changes labels on this device. It does not reserve funds or prevent spending.</p><button id="apply-payday" class="button dark">Apply this plan ↗</button>`);
      $('#apply-payday').onclick=async e=>{const button=e.target;button.disabled=true;
        if(!demo) await refresh();
        if(session!==activeSession || !address || stale || balance===null || JSON.stringify(goals)!==baseline || total(result.goals)+buffer>balance) {button.disabled=false;return toast('Your wallet or goals changed. Close this preview and make a fresh plan.');}
        goals=result.goals;const saved=persist();$('#dialog').close();render();toast(saved?'Payday planned. Your funds stay in your wallet.':'Plan applied for this session. Export a backup.');
      };
    }catch(err){form.querySelector('.form-error').textContent=err.message;}finally{button.disabled=false;}
  };
}
shell();
setInterval(()=>{if(address&&!demo&&!busy&&!$('#dialog').open)refresh();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&address&&!demo&&!busy)refresh();});
