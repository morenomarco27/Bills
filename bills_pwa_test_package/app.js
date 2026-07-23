
const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
const STORAGE='bills-control-center-v1';
const sample={
 month:'2026-07',
 bills:[
  {id:'rooms-to-go',name:'Rooms To Go',category:'Financing',balance:3000,minimum:100,planned:100,actual:0,due:'2026-07-28',promo:true,promoEnd:'2029-06-30',status:'Planned',notes:'',active:true},
  {id:'care-credit',name:'Care Credit / Good Feet',category:'Financing',balance:783,minimum:261,planned:300,actual:0,due:'2026-07-25',promo:true,promoEnd:'2026-10-31',status:'Planned',notes:'Priority: promo ends soon',active:true},
  {id:'jcpenney',name:'JCPenney',category:'Financing',balance:260,minimum:260,planned:260,actual:0,due:'2026-07-24',promo:true,promoEnd:'2026-09-30',status:'Planned',notes:'Priority: promo ends soon',active:true},
  {id:'samsung',name:'Samsung Phone',category:'Financing',balance:431,minimum:25,planned:25,actual:0,due:'2026-07-30',promo:true,promoEnd:'2027-12-31',status:'Planned',notes:'',active:true}
 ],
 sources:[
  {id:'ally-checking',account:'Ally Checking',bucket:'',type:'Checking',balance:4982,reserved:500,use:0,priority:1},
  {id:'ally-savings-bills',account:'Ally Savings',bucket:'Bills',type:'Savings Bucket',balance:1600,reserved:0,use:0,priority:2},
  {id:'ally-savings-general',account:'Ally Savings',bucket:'General Savings',type:'Savings Bucket',balance:1000,reserved:0,use:0,priority:3},
  {id:'ally-savings-emergency',account:'Ally Savings',bucket:'Emergency Fund',type:'Savings Bucket',balance:5000,reserved:5000,use:0,priority:99},
  {id:'ally-savings-home',account:'Ally Savings',bucket:'Home Projects',type:'Savings Bucket',balance:1200,reserved:1200,use:0,priority:99},
  {id:'ally-savings-college',account:'Ally Savings',bucket:'Prepaid College',type:'Savings Bucket',balance:600,reserved:600,use:0,priority:99}
 ]
};
let state=load();
let editMode=null, editIndex=null, deferredPrompt=null;
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{return JSON.parse(localStorage.getItem(STORAGE))||clone(sample)}catch{return clone(sample)}}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state));$('#saveStatus').textContent='Saved locally';render()}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function isoDate(v){if(!v)return''; if(typeof v==='number'&&window.XLSX){const d=XLSX.SSF.parse_date_code(v);return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;} const d=new Date(v);return isNaN(d)?'':d.toISOString().slice(0,10)}
function monthsLeft(date){if(!date)return null;const now=new Date();const end=new Date(date+'T12:00:00');return Math.max(0,(end.getFullYear()-now.getFullYear())*12+end.getMonth()-now.getMonth())}
function totals(){
 const bills=state.bills.filter(b=>b.active);
 return {
  minimum:bills.reduce((s,b)=>s+num(b.minimum),0),
  planned:bills.reduce((s,b)=>s+num(b.planned),0),
  actual:bills.reduce((s,b)=>s+num(b.actual),0),
  funding:state.sources.reduce((s,x)=>s+num(x.use),0),
  available:state.sources.reduce((s,x)=>s+Math.max(0,num(x.balance)-num(x.reserved)),0)
 }
}
function render(){
 $('#billMonth').value=state.month||'';
 const t=totals(), diff=t.funding-t.planned, card=$('#coverageCard');
 card.classList.remove('good','bad');
 if(!t.planned){$('#coverageLabel').textContent='Update your planned payments';$('#coverageAmount').textContent=money.format(0);$('#coverageSub').textContent='Import Excel or add bills to begin.'}
 else if(diff>=0){card.classList.add('good');$('#coverageLabel').textContent='Everything is covered';$('#coverageAmount').textContent=money.format(diff);$('#coverageSub').textContent='Cushion remaining after planned bills.'}
 else{card.classList.add('bad');$('#coverageLabel').textContent='More funding needed';$('#coverageAmount').textContent=money.format(Math.abs(diff));$('#coverageSub').textContent='Choose another account or bucket.'}
 $('#kpiMinimum').textContent=money.format(t.minimum);$('#kpiPlanned').textContent=money.format(t.planned);$('#kpiActual').textContent=money.format(t.actual);$('#kpiFunding').textContent=money.format(t.funding);$('#availableTotal').textContent=money.format(t.available);
 renderBills();renderSources();renderExecute();renderMoves();
}
function renderMoves(){
 const active=state.bills.filter(b=>b.active), unpaid=active.filter(b=>num(b.actual)<num(b.planned));
 $('#dueCount').textContent=`${unpaid.length} remaining`;
 let items=[];
 const urgent=active.filter(b=>b.promo&&monthsLeft(b.promoEnd)!==null&&monthsLeft(b.promoEnd)<=3);
 urgent.forEach(b=>items.push(`<div class="list-row"><div><p><strong>${escapeHtml(b.name)}</strong></p><small>0% promo ends in ${monthsLeft(b.promoEnd)} month(s)</small></div><strong>${money.format(b.balance)}</strong></div>`));
 const diff=totals().funding-totals().planned;
 if(diff<0)items.push(`<div class="list-row"><div><p><strong>Choose more funding</strong></p><small>Planned bills are not fully covered.</small></div><strong>${money.format(Math.abs(diff))}</strong></div>`);
 if(!items.length)items.push('<div class="empty">No urgent moves. You are ready to execute.</div>');
 $('#nextMoves').innerHTML=items.join('');
}
function renderBills(){
 $('#billCards').innerHTML=state.bills.map((b,i)=>{
  const m=monthsLeft(b.promoEnd), urgent=b.promo&&m!==null&&m<=3;
  return `<article class="bill-card">
   <div class="card-head"><div><h3>${escapeHtml(b.name)}</h3><span class="subtle">${escapeHtml(b.category||'Bill')} • Due ${b.due||'not set'}</span></div><strong>${money.format(num(b.balance))}</strong></div>
   <div class="money-row">
    <div class="money-box"><span>Minimum</span><strong>${money.format(num(b.minimum))}</strong></div>
    <div class="money-box"><span>Planned</span><strong>${money.format(num(b.planned))}</strong></div>
    <div class="money-box"><span>Actual</span><strong>${money.format(num(b.actual))}</strong></div>
    <div class="money-box"><span>Status</span><strong>${escapeHtml(b.status||'Planned')}</strong></div>
   </div>
   ${b.promo?`<div class="promo ${urgent?'urgent':''}">0% promo ${m===null?'active':`• ${m} month(s) left`}</div>`:''}
   <div class="inline-actions"><button onclick="openBill(${i})">Edit</button><button class="danger" onclick="removeBill(${i})">Remove</button></div>
  </article>`
 }).join('')||'<div class="empty">No bills yet.</div>';
}
function renderSources(){
 $('#fundingCards').innerHTML=state.sources.map((s,i)=>{
  const avail=Math.max(0,num(s.balance)-num(s.reserved)), pct=avail?Math.min(100,num(s.use)/avail*100):0;
  return `<article class="source-card">
   <div class="card-head"><div><h3>${escapeHtml(s.bucket||s.account)}</h3><span class="subtle">${escapeHtml(s.account)} • ${escapeHtml(s.type||'Account')}</span></div><strong>${money.format(num(s.balance))}</strong></div>
   <div class="money-row">
    <div class="money-box"><span>Protected</span><strong>${money.format(num(s.reserved))}</strong></div>
    <div class="money-box"><span>Available</span><strong>${money.format(avail)}</strong></div>
    <div class="money-box"><span>Use this month</span><strong>${money.format(num(s.use))}</strong></div>
    <div class="money-box"><span>After funding</span><strong>${money.format(num(s.balance)-num(s.use))}</strong></div>
   </div>
   <div class="progress"><i style="width:${pct}%"></i></div>
   <div class="inline-actions"><button onclick="openSource(${i})">Edit</button><button class="danger" onclick="removeSource(${i})">Remove</button></div>
  </article>`
 }).join('')||'<div class="empty">No funding sources yet.</div>';
}
function renderExecute(){
 const transfers=state.sources.filter(s=>num(s.use)>0).map(s=>`<div class="list-row"><div><p><strong>${escapeHtml(s.bucket||s.account)}</strong></p><small>${escapeHtml(s.account)}</small></div><strong>${money.format(num(s.use))}</strong></div>`).join('');
 $('#transferList').innerHTML=transfers||'<div class="empty">Choose funding sources first.</div>';
 const payments=state.bills.filter(b=>b.active&&num(b.planned)>0).map((b,i)=>`<div class="list-row"><div><p><strong>${escapeHtml(b.name)}</strong></p><small>Planned ${money.format(num(b.planned))} • Actual ${money.format(num(b.actual))}</small></div><input class="check" type="checkbox" ${num(b.actual)>=num(b.planned)?'checked':''} onchange="togglePaid(${i},this.checked)"></div>`).join('');
 $('#paymentList').innerHTML=payments||'<div class="empty">No planned payments.</div>';
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function switchView(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id===view));$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===view));window.scrollTo({top:0,behavior:'smooth'})}
$$('.tab').forEach(t=>t.onclick=()=>switchView(t.dataset.view));
$('#billMonth').onchange=e=>{state.month=e.target.value;save()}
function field(label,name,type='text',value='',wide=false,options=[]){
 const control=type==='select'
  ? `<select name="${name}">${options.map(o=>`<option ${String(value)===String(o)?'selected':''}>${o}</option>`).join('')}</select>`
  : `<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${type==='number'?'step="0.01" min="0"':''}>`;
 return `<div class="field ${wide?'wide':''}"><label>${label}</label>${control}</div>`;
}
window.openBill=i=>{
 editMode='bill';editIndex=i;const b=state.bills[i]||{id:crypto.randomUUID(),name:'',category:'',balance:0,minimum:0,planned:0,actual:0,due:'',promo:false,promoEnd:'',status:'Planned',notes:'',active:true};
 $('#dialogTitle').textContent=i===null?'Add bill':'Edit bill';
 $('#dialogFields').innerHTML=`<div class="field-grid">${field('Bill name','name','text',b.name,true)}${field('Category','category','text',b.category)}${field('Current balance','balance','number',b.balance)}${field('Minimum due','minimum','number',b.minimum)}${field('Planned payment','planned','number',b.planned)}${field('Actual payment','actual','number',b.actual)}${field('Due date','due','date',b.due)}${field('0% promo?','promo','select',b.promo?'Yes':'No',false,['Yes','No'])}${field('Promo end','promoEnd','date',b.promoEnd)}${field('Status','status','select',b.status,false,['Planned','Paid','Skipped'])}${field('Notes','notes','text',b.notes,true)}</div>`;
 $('#editDialog').showModal()
}
window.openSource=i=>{
 editMode='source';editIndex=i;const s=state.sources[i]||{id:crypto.randomUUID(),account:'Ally Savings',bucket:'',type:'Savings Bucket',balance:0,reserved:0,use:0,priority:10};
 $('#dialogTitle').textContent=i===null?'Add funding source':'Edit funding source';
 $('#dialogFields').innerHTML=`<div class="field-grid">${field('Account','account','text',s.account,true)}${field('Bucket / nickname','bucket','text',s.bucket)}${field('Type','type','select',s.type,false,['Checking','Savings','Savings Bucket','Other'])}${field('Current balance','balance','number',s.balance)}${field('Protected / reserved','reserved','number',s.reserved)}${field('Use this month','use','number',s.use)}${field('Funding priority','priority','number',s.priority)}</div>`;
 $('#editDialog').showModal()
}
$('#addBill').onclick=()=>openBill(null);$('#addSource').onclick=()=>openSource(null);
$('#editForm').addEventListener('submit',e=>{
 if(e.submitter?.value==='cancel')return;
 e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));
 if(editMode==='bill'){
  const item={id:editIndex===null?crypto.randomUUID():state.bills[editIndex].id,name:data.name,category:data.category,balance:num(data.balance),minimum:num(data.minimum),planned:num(data.planned),actual:num(data.actual),due:data.due,promo:data.promo==='Yes',promoEnd:data.promoEnd,status:data.status,notes:data.notes,active:true};
  editIndex===null?state.bills.push(item):state.bills[editIndex]=item;
 } else {
  const item={id:editIndex===null?crypto.randomUUID():state.sources[editIndex].id,account:data.account,bucket:data.bucket,type:data.type,balance:num(data.balance),reserved:num(data.reserved),use:num(data.use),priority:num(data.priority)};
  editIndex===null?state.sources.push(item):state.sources[editIndex]=item;
 }
 $('#editDialog').close();save();
});
window.removeBill=i=>{if(confirm('Remove this bill?')){state.bills.splice(i,1);save()}}
window.removeSource=i=>{if(confirm('Remove this funding source?')){state.sources.splice(i,1);save()}}
window.togglePaid=(i,checked)=>{state.bills[i].actual=checked?num(state.bills[i].planned):0;state.bills[i].status=checked?'Paid':'Planned';save()}
$('#markAllPaid').onclick=()=>{state.bills.forEach(b=>{if(b.active&&num(b.planned)>0){b.actual=num(b.planned);b.status='Paid'}});save()}
$('#autoFund').onclick=()=>{
 let remaining=totals().planned;
 state.sources.forEach(s=>s.use=0);
 [...state.sources].sort((a,b)=>num(a.priority)-num(b.priority)).forEach(s=>{if(remaining<=0)return;const available=Math.max(0,num(s.balance)-num(s.reserved));s.use=Math.min(available,remaining);remaining-=s.use});
 save();
}
$('#demoReset').onclick=()=>{if(confirm('Reset all local data to the included sample?')){state=clone(sample);save()}}
$('#excelInput').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  const data=await file.arrayBuffer(), book=XLSX.read(data,{cellDates:true});
  const billsSheet=book.Sheets['Bills'], fundSheet=book.Sheets['Funding Accounts'];
  if(!billsSheet||!fundSheet)throw new Error('Workbook must contain Bills and Funding Accounts sheets.');
  const br=XLSX.utils.sheet_to_json(billsSheet,{range:1,defval:''});
  const fr=XLSX.utils.sheet_to_json(fundSheet,{range:1,defval:''});
  state.bills=br.filter(r=>r['Bill Name']).map(r=>({
   id:String(r['Bill ID']||crypto.randomUUID()),name:String(r['Bill Name']),category:String(r['Category']||''),balance:num(r['Current Balance ($)']),minimum:num(r['Minimum Due ($)']),planned:num(r['Planned Payment ($)']),actual:num(r['Actual Payment ($)']),due:isoDate(r['Due Date']),promo:String(r['0% Promo?']).toLowerCase()==='yes',promoEnd:isoDate(r['Promo End Date']),status:String(r['Status']||'Planned'),notes:String(r['Funding Notes']||''),active:String(r['Active?']||'Yes').toLowerCase()!=='no'
  }));
  state.sources=fr.filter(r=>r['Account']).map(r=>({
   id:String(r['Source ID']||crypto.randomUUID()),account:String(r['Account']),bucket:String(r['Bucket']||''),type:String(r['Type']||''),balance:num(r['Current Balance ($)']),reserved:num(r['Protected / Reserved ($)']),use:num(r['Use This Month ($)']),priority:num(r['Priority']||10)
  }));
  save();alert('Excel imported successfully.');
 }catch(err){alert('Import failed: '+err.message)}
 e.target.value='';
});
$('#exportBtn').onclick=()=>{
 const billRows=state.bills.map(b=>({'Bill ID':b.id,'Bill Name':b.name,'Category':b.category,'Current Balance ($)':b.balance,'Minimum Due ($)':b.minimum,'Planned Payment ($)':b.planned,'Actual Payment ($)':b.actual,'Due Date':b.due,'0% Promo?':b.promo?'Yes':'No','Promo End Date':b.promoEnd,'Months Remaining':monthsLeft(b.promoEnd),'Status':b.status,'Funding Notes':b.notes,'Active?':b.active?'Yes':'No'}));
 const sourceRows=state.sources.map(s=>({'Source ID':s.id,'Account':s.account,'Bucket':s.bucket,'Type':s.type,'Current Balance ($)':s.balance,'Protected / Reserved ($)':s.reserved,'Available for Bills ($)':Math.max(0,s.balance-s.reserved),'Use This Month ($)':s.use,'After Funding ($)':s.balance-s.use,'Priority':s.priority}));
 const wb=XLSX.utils.book_new();
 const ws1=XLSX.utils.json_to_sheet(billRows),ws2=XLSX.utils.json_to_sheet(sourceRows);
 XLSX.utils.book_append_sheet(wb,ws1,'Bills');XLSX.utils.book_append_sheet(wb,ws2,'Funding Accounts');
 const t=totals();const summary=[['Month',state.month],['Minimum Required',t.minimum],['Planned Payments',t.planned],['Actual Payments',t.actual],['Funding Selected',t.funding],['Shortage / Cushion',t.funding-t.planned],['Status',t.funding>=t.planned?'Fully Funded':'Need More Funds']];
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summary),'Monthly Plan');
 XLSX.writeFile(wb,`Bills_Master_${state.month||'export'}.xlsx`);
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});
$('#installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').classList.add('hidden')}};
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');
render();
