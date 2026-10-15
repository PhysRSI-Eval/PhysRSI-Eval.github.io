/* 图表只读取已核验聚合结果；模型显隐不改变任务集合或分母。 */
'use strict';
const MODELS=['Astra','Sol 6.1','Opus 5.5','Sonnet 5.5'];
const COLORS=['#235789','#438B8D','#9A4D8E','#C38A48'];
const selected=new Set(MODELS);let DATA;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'NA').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v).toFixed(4),pct=v=>(v*100).toFixed(2)+'%';
const tip=$('#tooltip');
function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map(x=>`<td>${esc(x)}</td>`).join('')+'</tr>').join('')}</tbody></table></div>`;}
function math(formulas){return `<div class="equations">${formulas.map(f=>`<div class="math" data-tex="${esc(f)}"><code class="formula-fallback">${esc(f)}</code></div>`).join('')}</div>`;}
function renderMath(root=document){for(const n of root.querySelectorAll('.math')){if(window.katex)katex.render(n.dataset.tex,n,{displayMode:true,throwOnError:false,strict:false});}}
function staticFigure(name,title){return `<figure class="static-figure"><img loading="lazy" src="assets/${name}.svg" alt="${esc(title)}"><figcaption>${esc(title)} · 与下表使用同一数据</figcaption></figure>`;}
function card(c,{interactive=false,archive=false}={}){
 const plots=c.plots||[];
 return `<article class="metric-card" id="${archive?'archive-':'metric-'}${c.code.toLowerCase()}"><div class="metric-heading"><span class="metric-code">${esc(c.code)}</span><h3>${esc(c.name)}</h3></div><p class="origin">${esc(c.origin)}</p>
 ${interactive?`<div class="chart-shell" id="chart-${c.code}"></div>`:plots.map(n=>staticFigure(n,c.name)).join('')}
 ${interactive&&plots.length?`<details><summary>查看可导出的静态图与补充面板</summary>${plots.map(n=>staticFigure(n,c.name)).join('')}</details>`:''}
 <p class="caption"><b>图表说明　</b>${esc(c.note)}</p>
 <div id="table-${archive?'archive-':''}${c.code}">${table(c.headers,c.rows)}</div>${(c.extra||[]).map(x=>`<details><summary>${esc(x.title||'逐任务数据表')}</summary>${table(x.headers,x.rows)}</details>`).join('')}
 <p class="subcaption">计算公式 / FORMULATION</p>${math(c.formulas)}<p class="subcaption">变量说明 / VARIABLES</p>
 <dl class="variables">${c.variables.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
 <div class="figure-links">${plots.flatMap(n=>['SVG','PDF','PNG'].map(e=>`<a href="assets/${n}.${e.toLowerCase()}" download>${esc(n)} · ${e} ↓</a>`)).join('')}<button class="model-toggle card-csv" data-code="${c.code}" data-archive="${archive}">下载本表 CSV ↓</button></div></article>`;
}
const refs=codes=>`<div class="cross-ref">${codes.map(id=>`<a href="#metric-${id.toLowerCase()}">${esc(DATA.cards.find(c=>c.code===id).name)} · ${id} ↑</a>`).join('　 /　 ')}</div>`;
function initialize(){
 $('#model-controls').innerHTML=MODELS.map((m,i)=>`<button class="model-toggle" style="--model-color:${COLORS[i]}" aria-pressed="true" data-model="${m}">${m}</button>`).join('');
 const priorities=['PROFILE','STAGE','M05','M68','M72','M69','M70'];
 $('#priority-cards').innerHTML=priorities.map(id=>card(DATA.cards.find(c=>c.code===id),{interactive:true})).join('');
 const cat=[['第 1 类｜解决数与首次成功轮次',['M06','M10']],['第 2 类｜任务覆盖',['M05']],['第 3 类｜K0 零样本',['M04','M15']],['第 4 类｜逐轮原生分数与子目标阶段',['STAGE']],['第 5 类｜资源成本与使用记录',['RESOURCE','M27','M25']]];
 $('#existing-cards').innerHTML=cat.map(([title,ids])=>`<h3 class="category-label">${title}</h3>`+ids.map(id=>priorities.includes(id)?refs([id]):card(DATA.cards.find(c=>c.code===id))).join('')).join('');
 const sums=DATA.summaries;
 $('#computed-cards').innerHTML=refs(['M68','M72','M69','M70'])+'<h3>总结一：十类推荐指标与现有条目对应</h3>'+table(sums.headers,sums.summary1)+'<h3>总结二：现有数据最值得补充的八类结果</h3>'+table(sums.headers,sums.summary2)+'<h3>本轮新增：增长速度与均匀性</h3>'+table(sums.headers,[sums.growth])+['M08','M09','M18','M16'].map(id=>card(DATA.cards.find(c=>c.code===id))).join('')+'<h3 class="category-label">最新会话记录：资源与过程诊断</h3><p class="section-intro">新增数据未改变物理成绩。以下更新沿用已有指标编号；M71 是新增的往轮路径访问诊断。token 用量更新见已有结果第 5 类的 M27。</p>'+['M23','M12','M24','M26','M71'].map(id=>card(DATA.cards.find(c=>c.code===id))).join('');
 $('#ablation-key').innerHTML=table(['代号','实验条件'],DATA.ablation_key);
 $('#ablation-cards').innerHTML=DATA.cards.filter(c=>c.category==='消融实验').map(c=>card(c)).join('');
 $('#archive-cards').innerHTML=DATA.archive.map(c=>`<details class="archive-entry" data-search="${esc((c.code+' '+c.name+' '+c.note).toLowerCase())}"><summary>${esc(c.code+'　'+c.name)}<span>${esc(c.status||'历史记录')}</span></summary>${card(c,{archive:true})}</details>`).join('');
 $('#downloads').innerHTML=[['summary','主结果'],['tasks','逐任务结果'],['episodes','规范回合'],['stages','逐轮阶段'],['paired_success_steps','M70 配对步数'],['cost_curves','M69 原生成本'],['growth_results','M72 全部阈值结果'],['growth_points','M72 逐轮增量'],['session_resources','M27 会话用量'],['session_cost_curves','M69 记录成本'],['history_paired','M71 往轮访问']].map(([f,l])=>`<a href="data/${f}.csv" download>${l} CSV <span>↓</span></a>`).join('')+'<a href="assets/growth_metrics.pdf" download>M72 图册 PDF <span>↓</span></a><a href="assets/session_session_stats_audit.pdf" download>会话统计图册 PDF <span>↓</span></a><a href="data/validation.json" download>输入指纹与核验 <span>↓</span></a><a href="report.html">静态报告 <span>↗</span></a>';
 $('#downloads').insertAdjacentHTML('afterbegin',['scores_and_intervals','model_summary','task_details','score_curves'].map(n=>`<a href="data/a1a5_${n}.csv" download>历史五模型 A1–A5 ${n} CSV ↓</a>`).join('')+'<a href="assets/a1a5_radar_all_models.pdf" download>历史五轴总图 PDF ↓</a><a href="data/a1a5-definition.md" download>历史五轴完整定义 Markdown ↓</a><a href="data/benchmark-curve-feasibility.md" download>历史 Benchmark 曲线预测方案（旧版） ↓</a><a href="assets/radar-six-atlas.pdf" download>历史四模型六轴图册 PDF ↓</a>');
 document.addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(b){const m=b.dataset.model;if(selected.has(m)){if(selected.size===1)return;selected.delete(m);}else selected.add(m);b.setAttribute('aria-pressed',String(selected.has(m)));drawAll();}const dl=e.target.closest('.card-csv');if(dl){const source=dl.dataset.archive==='true'?DATA.archive:DATA.cards;downloadCard(source.find(c=>c.code===dl.dataset.code));}});
 $('#archive-search').addEventListener('input',e=>{let n=0;for(const d of document.querySelectorAll('.archive-entry')){d.hidden=!d.dataset.search.includes(e.target.value.toLowerCase());if(!d.hidden)n++;}$('#archive-empty').hidden=!!n;});
 renderMath();setupCharts();drawAll();bindTips();
}
function downloadCard(c){if(c.code==='M72')c=growthTableCard();const csv=[c.headers,...c.rows].map(r=>r.map(v=>'"'+String(v??'NA').replaceAll('"','""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download=c.code+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function setupCharts(){
 $('#chart-STAGE').innerHTML=`<div class="chart-controls"><label>查看任务<select id="stage-task">${DATA.task_names.map(t=>`<option ${t==='insert_key'?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>显示<select id="stage-mode"><option value="score">原生 score</option><option value="stage">阶段范围</option></select></label></div><div class="scroll-chart" id="stage-view"></div><div class="stage-detail" id="stage-detail" aria-live="polite">点击或聚焦格子查看真实回合与阶段解释。○ 表示成功；斜线为空缺。</div>`;
 $('#chart-M05').innerHTML='<div class="chart-controls"><label>轮次预算 K <input id="coverage-k" type="range" min="1" max="17" value="17"><output id="coverage-k-out">17</output></label></div><div class="scroll-chart" id="coverage-view"></div><div class="mini-readout" id="coverage-readout"></div>';
 $('#chart-M68').innerHTML='<div class="chart-controls"><label>读数<select id="gain-field"><option value="score_gain">原生得分变化 G obs</option><option value="success_change">成功比例变化 ΔS obs</option><option value="ng">剩余得分空间归一化 NG（D4）</option></select></label></div><p class="micro">G obs(K)：相对 K0 的原生均分变化。ΔS obs(K)：相对 K0 的成功比例变化。NG(K)：G obs 除以 K0 的平均剩余得分空间。增长斜率与均匀性见紧接其后的 <a href="#metric-m72">M72 ↓</a>。</p><div class="scroll-chart" id="gain-view"></div>';
 setupGrowth();
 $('#chart-M69').innerHTML='<div class="chart-controls"><label>成本单位<select id="cost-unit"><option value="recorded_span_hours">含已知额外尝试的记录时长，小时</option><option value="steps">已记录原生步数</option><option value="wall_minutes">已记录原生墙钟，分钟</option></select></label><label>每任务预算 b <input id="cost-budget" type="range" min="0" max="80" step="0.5" value="5"><output id="cost-budget-out">5</output></label></div><p id="cost-note" class="micro"></p><div class="scroll-chart" id="cost-view"></div><div class="mini-readout" id="cost-readout"></div>';
 $('#chart-M70').innerHTML='<p class="micro">固定 9 个共同成功任务。横轴使用对数刻度；小于 1 表示首次成功回合的步数少于 Astra。</p><div class="scroll-chart" id="paired-view"></div>';
 setupRadarA1A5();
 $('#cost-unit').insertAdjacentHTML('beforeend','<option value="quota">协议配额成本（D7，非实际消耗）</option>');
 for(const id of ['stage-task','stage-mode'])$('#'+id).addEventListener('change',drawStage);
 $('#coverage-k').addEventListener('input',drawCoverage);$('#gain-field').addEventListener('change',drawGain);
 $('#cost-unit').addEventListener('change',()=>{const b=$('#cost-budget'),u=$('#cost-unit').value,settings=u==='quota'?[17,.1,6]:u==='steps'?[22000,100,5000]:u==='wall_minutes'?[3000,10,600]:[80,.5,5];[b.max,b.step,b.value]=settings;drawCost();});
 $('#cost-budget').addEventListener('input',drawCost);
}
function drawAll(){drawStage();drawCoverage();drawGain();drawGrowth();drawCost();drawPaired();drawRadarA1A5();}
function drawStage(){
 const task=$('#stage-task').value,mode=$('#stage-mode').value;
 let html='<div class="heatmap"><span></span>'+Array.from({length:18},(_,k)=>`<span class="col-label">K${k}</span>`).join('');
 for(const [i,m] of MODELS.entries()){if(!selected.has(m))continue;html+=`<span class="row-label" style="color:${COLORS[i]}">${m}</span>`;const final=DATA.tasks.find(r=>r.model===m&&r.task===task);
  for(let k=0;k<18;k++){const r=DATA.stages.find(r=>r.model===m&&r.task===task&&r.k===k);const missing=final.first_success_k!==null&&k>final.first_success_k?'首胜后停止，未再测':'尚无评分回合';
   const label=r?`${m} · ${task} · K${k}；q=${r.score}；${r.success?'原生成功':'失败'}；${stageText(r)}`:`${m} · K${k}；${missing}`;
   const value=r?(mode==='score'?Number(r.score).toFixed(2):(r.mode==='binary'?(r.success?'成功':'失败'):`${r.mode==='by_count_trigger'?'计':''}${r.stage_min}${r.stage_min===r.stage_max?'':'–'+r.stage_max}`)):'—';
   html+=`<button class="heat-cell ${r?'':'empty'} ${r?.success?'success':''} ${k===0?'k0':''}" style="${r?`background:rgba(35,87,137,${.07+.85*r.score});color:${r.score>.5?'white':'#314651'}`:''}" data-stage-detail="${esc(label)}" aria-label="${esc(label)}">${value}</button>`;
  }
 }
 $('#stage-view').innerHTML=html+'</div>';
 for(const b of $('#stage-view').querySelectorAll('button'))for(const event of ['click','focus','pointerenter'])b.addEventListener(event,()=>{$('#stage-detail').textContent=b.dataset.stageDetail;});
}
function stageText(r){if(r.mode==='binary')return '二值任务，无中间阶段证据';return `${r.mode==='by_count_trigger'?'触发计数':'阶段'} ${r.stage_min}${r.stage_min===r.stage_max?'':'–'+r.stage_max} / ${r.n_stages}；${r.label||''}${r.fail_gate?'；+ 存在失败降档歧义':''}`;}
function svgStart(w,h,label){return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>`;}
function text(x,y,s,attrs=''){return `<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;}
function dot(x,y,color,label,i=0){const shape=i%4===1?`<rect x="${x-4}" y="${y-4}" width="8" height="8"/>`:i%4===2?`<path d="M ${x} ${y-5} L ${x+5} ${y+4} L ${x-5} ${y+4} Z"/>`:i%4===3?`<path d="M ${x} ${y-5} L ${x+5} ${y} L ${x} ${y+5} L ${x-5} ${y} Z"/>`:`<circle cx="${x}" cy="${y}" r="4"/>`;return `<g fill="${color}" tabindex="0" data-tip="${esc(label)}" aria-label="${esc(label)}">${shape}</g>`;}
function plotBase({w=960,h=360,xmax=17,ymin=0,ymax=1,xlabel,ylabel,xticks=[1,3,6,9,12,15,17],xmin=1,percent=true}){
 const left=66,right=36,top=22,bottom=55,X=v=>left+(v-xmin)/(xmax-xmin)*(w-left-right),Y=v=>h-bottom-(v-ymin)/(ymax-ymin)*(h-bottom-top);
 let s=svgStart(w,h,ylabel);for(let j=0;j<=4;j++){const v=ymin+j*(ymax-ymin)/4,yy=Y(v);s+=`<line x1="${left}" y1="${yy}" x2="${w-right}" y2="${yy}" stroke="#e2e7e9" stroke-width="1"/>`+text(left-10,yy+4,percent?(v*100).toFixed(0)+'%':v.toFixed(2),'text-anchor="end" font-size="11" fill="#62717b"');}
 for(const v of xticks)s+=text(X(v),h-bottom+20,v.toLocaleString(),'text-anchor="middle" font-size="11" fill="#62717b"');
 s+=text(w/2,h-9,xlabel,'text-anchor="middle" font-size="12" fill="#495e6c"')+text(left,13,ylabel,'font-size="12" fill="#495e6c"');
 return {s,X,Y,w,h};
}
function path(rows,X,Y,x,y,step=false){let p='';rows.forEach((r,i)=>{p+=i?(step?`H${X(r[x])}V${Y(r[y])}`:`L${X(r[x])},${Y(r[y])}`):`M${X(r[x])},${Y(r[y])}`;});return p;}
function drawCoverage(){
 const k=Number($('#coverage-k').value);$('#coverage-k-out').textContent=k;
 let {s,X,Y}=plotBase({xlabel:'轮次预算 K；C(6)=6 轮内覆盖，C(17)=17 轮内覆盖',ylabel:'截至 K 曾成功的任务比例 C(K)'});
 const sn=DATA.curves.filter(r=>r.model===MODELS[3]&&r.k>0);
 if(selected.has(MODELS[3])){let lower=path(sn,X,Y,'k','coverage',true);let upper=path([...sn].reverse(),X,Y,'k','coverage_upper',true).replace('M','L');s+=`<path d="${lower+upper}Z" fill="${COLORS[3]}" opacity=".14"/>`;}
 s+=`<line x1="${X(k)}" y1="22" x2="${X(k)}" y2="305" stroke="#a3acb3" stroke-dasharray="3 4"/>`;
 for(const [i,m] of MODELS.entries()){if(!selected.has(m))continue;const rr=DATA.curves.filter(r=>r.model===m&&r.k>0);s+=`<path d="${path(rr,X,Y,'k','coverage',true)}" fill="none" stroke="${COLORS[i]}" stroke-width="2.2" ${i===3?'stroke-dasharray="6 3"':''}/>`;for(const r of rr)s+=dot(X(r.k),Y(r.coverage),COLORS[i],`${m} · C(${r.k})=${Math.round(r.coverage*18)}/18 (${pct(r.coverage)})${r.pending?'；未完成任务导致上界 '+pct(r.coverage_upper):''}`,i);}
 $('#coverage-view').innerHTML=s+'</svg>';
 $('#coverage-readout').innerHTML=MODELS.filter(m=>selected.has(m)).map(m=>{const r=DATA.curves.find(r=>r.model===m&&r.k===k);return `<div style="--model-color:${COLORS[MODELS.indexOf(m)]}">${m}<strong>${Math.round(r.coverage*18)}/18${r.pending?' ≥观察值':''}</strong>C(${k}) = ${pct(r.coverage)}${r.pending?'；可能上界 '+pct(r.coverage_upper):''}</div>`;}).join('');
}
function drawGain(){const f=$('#gain-field').value;let {s,X,Y}=plotBase({xmin:0,xticks:[0,1,3,6,9,12,15,17],xlabel:'预算 K；末次观察回合 L(K) 可以早于 K',ylabel:f==='ng'?'归一化观察增长 NG(K)':f==='score_gain'?'原生得分变化 G obs(K)':'成功比例变化 ΔS obs(K)',ymax:f==='ng'?1:.75,ymin:0,percent:f==='success_change'});
 for(const [i,m] of MODELS.entries()){if(!selected.has(m))continue;const rr=DATA.curves.filter(r=>r.model===m).map(r=>({...r,ng:DATA.radar.curves.find(p=>p.model===m&&p.k===r.k).ng}));s+=`<path d="${path(rr,X,Y,'k',f)}" fill="none" stroke="${COLORS[i]}" stroke-width="2" ${i===3?'stroke-dasharray="6 3"':''}/>`;for(const r of rr)s+=dot(X(r.k),Y(r[f]),COLORS[i],`${m} · K${r.k} · ${f!=='success_change'?fmt(r[f]):(100*r[f]).toFixed(2)+' 个百分点'}；${r.pending} 个任务超过最后已测轮次`,i);}
 $('#gain-view').innerHTML=s+'</svg>';}
function drawCost(){if($('#cost-unit').value==='quota'){drawQuotaCost();return;}const unit=$('#cost-unit').value,b=Number($('#cost-budget').value),isSpan=unit==='recorded_span_hours',max=isSpan?80:unit==='steps'?22000:3000,unitLabel=isSpan?'小时':unit==='steps'?'步':'分钟';$('#cost-budget-out').textContent=b.toLocaleString();let {s,X,Y}=plotBase({xmin:0,xmax:max,xticks:isSpan?[0,5,10,20,40,60,80]:unit==='steps'?[0,5000,10000,15000,20000]:[0,600,1200,1800,2400,3000],xlabel:isSpan?'每任务累计记录时长预算 b（小时；含已知额外尝试）':unit==='steps'?'每任务累计已记录原生步数预算 b':'每任务累计已记录原生墙钟预算 b（分钟）',ylabel:'记录成本内的任务覆盖 C cost(b)'});
 $('#cost-note').textContent=isSpan?'本轮补齐已知额外尝试的记录时长。四模型计时边界不同；未知目录成本未填零，不能作纯推理速度排名。':'既有原生口径。Sol / Opus / Sonnet 的额外尝试仍缺实际步数或原生终局时长；未加入不等于成本为零。';
 s+=`<line x1="${X(b)}" y1="22" x2="${X(b)}" y2="305" stroke="#999" stroke-dasharray="3 4"/>`;
 for(const [i,m] of MODELS.entries()){if(!selected.has(m))continue;let rr=(isSpan?DATA.session_cost_curves:DATA.cost_curves).filter(r=>r.model===m&&r.resource===unit&&r.budget<=max);const last=rr.at(-1);rr=[...rr,{...last,budget:max}];s+=`<path d="${path(rr,X,Y,'budget','coverage',true)}" fill="none" stroke="${COLORS[i]}" stroke-width="2" ${i===3?'stroke-dasharray="6 3"':''}/>`;let prev=-1;for(const r of rr){if(r.coverage!==prev){s+=dot(X(r.budget),Y(r.coverage),COLORS[i],`${m} · b=${r.budget.toFixed(1)} ${unitLabel} · ${r.solved}/18；${isSpan?'仅含已记录时长':'仅含已记录原生成本'}`,i);prev=r.coverage;}}}
 $('#cost-view').innerHTML=s+'</svg>';$('#cost-readout').innerHTML=MODELS.filter(m=>selected.has(m)).map(m=>{const n=isSpan?DATA.session_cost_events.filter(r=>r.model===m&&r.solved&&!r.recorded_span_s_missing_n&&r.recorded_span_s/3600<=b).length:DATA.cost_events.filter(r=>r.model===m&&r.solved&&r[unit]<=b).length;return `<div style="--model-color:${COLORS[MODELS.indexOf(m)]}">${m}<strong>${n}/18</strong>预算 ${b.toLocaleString()} ${unitLabel} · ${pct(n/18)}</div>`;}).join('');}
function drawPaired(){const tasks=[...new Set(DATA.paired_success_steps.map(r=>r.task))].sort(),w=960,h=470,left=245,right=70,min=.25,max=4,X=v=>left+(Math.log(v)-Math.log(min))/(Math.log(max)-Math.log(min))*(w-left-right),Y=(j,i)=>45+j*40+(i-1.5)*6;let s=svgStart(w,h,'M70 固定 9 任务首次成功步数比');
 for(const v of [.25,.5,1,2,4])s+=`<line x1="${X(v)}" y1="20" x2="${X(v)}" y2="410" stroke="${v===1?'#8c9ba4':'#e0e5e7'}" stroke-dasharray="${v===1?'4 3':'1 0'}"/>`+text(X(v),435,v+'×','text-anchor="middle" font-size="12"');
 tasks.forEach((t,j)=>{s+=text(left-18,Y(j,1.5)+4,t.replaceAll('_',' '),'text-anchor="end" font-size="11"');for(const [i,m]of MODELS.entries()){if(!selected.has(m))continue;const r=DATA.paired_success_steps.find(r=>r.task===t&&r.model===m);s+=dot(X(r.ratio_to_astra),Y(j,i),COLORS[i],`${m} · ${t} · ${r.steps} 步 · 相对 Astra ${r.ratio_to_astra.toFixed(3)}×`,i);}});s+=text((left+w-right)/2,463,'首次成功回合步数 / Astra 同任务步数（对数刻度；固定 9 任务）','text-anchor="middle" font-size="12" fill="#495e6c"');$('#paired-view').innerHTML=s+'</svg>';}
function bindTips(){document.addEventListener('pointermove',e=>{const t=e.target.closest('[data-tip]');if(!t){tip.hidden=true;return;}tip.textContent=t.dataset.tip;tip.hidden=false;tip.style.left=Math.min(e.clientX+14,window.innerWidth-tip.offsetWidth-12)+'px';tip.style.top=Math.min(e.clientY+15,window.innerHeight-tip.offsetHeight-12)+'px';});document.addEventListener('focusin',e=>{const t=e.target.closest('[data-tip]');if(!t)return;const r=t.getBoundingClientRect();tip.textContent=t.dataset.tip;tip.hidden=false;tip.style.left=Math.max(10,Math.min(r.left,innerWidth-340))+'px';tip.style.top=Math.min(r.bottom+10,innerHeight-100)+'px';});document.addEventListener('focusout',()=>tip.hidden=true);document.addEventListener('keydown',e=>{if(e.key==='Escape')tip.hidden=true;});}
fetch('data/site.json').then(r=>{if(!r.ok)throw new Error('结果数据读取失败');return r.json();}).then(d=>{DATA=d;initialize();window.metricAtlasReady=true;}).catch(e=>{$('#priority-cards').innerHTML=`<p class="load-error">${esc(e.message)}。请读取 <a href="report.html">静态报告</a> 或下载 PDF。</p>`;console.error(e);});
