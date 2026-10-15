/* 五轴从同一复算数据读取；独立的五模型开关不向旧四模型指标补造数据。 */
let radarA1A5Selected;
const RADAR_COLORS=['#2563A6','#6C9DCC','#23584F','#AE4A46','#D38A68'];
function setupRadarA1A5(){
 const d=DATA.radar_a1a5;radarA1A5Selected=new Set(d.models);
 $('#chart-PROFILE').innerHTML=`<div class="model-controls" id="a1a5-controls">${d.models.map((m,i)=>`<button class="model-toggle" data-radar-model="${m}" aria-pressed="true" style="--model-color:${RADAR_COLORS[i]}">${esc(d.labels[m])}</button>`).join('')}</div><div class="chart-controls"><label>不确定性<select id="a1a5-interval"><option value="yes">显示 95% 任务区间</option><option value="no">仅点估计</option></select></label></div><p class="micro">历史快照 · 五模型 · 919 个规范回合 · 18 个共同任务。A4 分母为各模型已解任务，A5 分母为各模型 K1 失败任务；不使用模型 min–max 拉伸。</p><div class="scroll-chart" id="radar-view"></div><div class="mini-readout" id="radar-readout"></div><h4>历史五模型 K0–K17 末次观察得分曲线</h4><p class="micro">圈点标记自身观察增益的 90% 达标轮次 τ90，不是数学曲率拐点。曲线保留回退；沿用分数不表示重新测试。五模型开关同时控制这张曲线。</p><div class="scroll-chart" id="a1a5-growth-view"></div>`;
 $('#a1a5-interval').addEventListener('change',drawRadarA1A5);
 $('#a1a5-controls').addEventListener('click',e=>{const b=e.target.closest('[data-radar-model]');if(!b)return;const m=b.dataset.radarModel;if(radarA1A5Selected.has(m)){if(radarA1A5Selected.size===1)return;radarA1A5Selected.delete(m);}else radarA1A5Selected.add(m);b.setAttribute('aria-pressed',String(radarA1A5Selected.has(m)));drawRadarA1A5();});
}
function radarSvgA1A5(intervals=true){
 const d=DATA.radar_a1a5,axes=d.axes;let s=svgStart(1000,1180,'五模型 A1–A5 固定刻度五边形与任务区间');
 d.models.forEach((m,i)=>{
  const cx=i%2*500+250,offset=Math.floor(i/2)*390,cy=offset+190,R=106;
  const xy=(j,r)=>[cx+Math.cos(-Math.PI/2+j*2*Math.PI/5)*R*r,cy+Math.sin(-Math.PI/2+j*2*Math.PI/5)*R*r];
  s+=text(cx,offset+28,d.labels[m]+(m==='Sonnet 5.5'?' · 未完成快照':''),`text-anchor="middle" font-size="17" fill="${RADAR_COLORS[i]}"`);
  for(const v of [.2,.4,.6,.8,1])s+=`<polygon points="${axes.map((_,j)=>xy(j,v).join(',')).join(' ')}" fill="none" stroke="#cbd5da"/>`;
  axes.forEach((a,j)=>{const [x,y]=xy(j,1),[tx,ty]=xy(j,1.2);s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e0e6e9"/>`+text(tx,ty+4,a.code+' '+a.name,`text-anchor="${tx>cx+20?'start':tx<cx-20?'end':'middle'}" font-size="11" fill="#536975"`);});
  s+=text(cx+6,cy-R,'1.0','font-size="10" fill="#687783"');
  if(!radarA1A5Selected.has(m))return;
  const r=d.results[m];s+=`<polygon points="${r.axes.map((v,j)=>xy(j,v).join(',')).join(' ')}" fill="${RADAR_COLORS[i]}" fill-opacity=".1" stroke="${RADAR_COLORS[i]}" stroke-width="2"/>`;
  r.axes.forEach((v,j)=>{if(intervals){const [x1,y1]=xy(j,r.axis_ci[j][0]),[x2,y2]=xy(j,r.axis_ci[j][1]);s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${RADAR_COLORS[i]}" stroke-width="5" opacity=".3"/>`;}const [x,y]=xy(j,v);s+=dot(x,y,RADAR_COLORS[i],`${d.labels[m]} · ${axes[j].code} ${axes[j].name}=${fmt(v)}；95% [${fmt(r.axis_ci[j][0])}, ${fmt(r.axis_ci[j][1])}]`,i);});
  s+=text(cx,offset+345,`Ā ${fmt(r.Abar)} · 95% [${r.Abar_ci.map(x=>x.toFixed(3)).join(', ')}]`,'text-anchor="middle" font-size="12" fill="#536975"');
  s+=text(cx,offset+367,`图示面积比 ${fmt(r.A_fixed)} · τ90 K${r.tau90}`,'text-anchor="middle" font-size="11" fill="#536975"');
 });return s+'</svg>';
}
function drawRadarA1A5(){
 const d=DATA.radar_a1a5;$('#radar-view').innerHTML=radarSvgA1A5($('#a1a5-interval').value==='yes');
 $('#radar-readout').innerHTML=d.models.filter(m=>radarA1A5Selected.has(m)).map(m=>{const r=d.results[m],i=d.models.indexOf(m);return `<div style="--model-color:${RADAR_COLORS[i]}">${esc(d.labels[m])}<strong>${fmt(r.Abar)}</strong>轴排列平均面积<br>A4：${r.solved} 个已解任务<br>A5：${r.recovered}/${r.k1_failures} 首败恢复<br>A3：K${r.tau90}–K17</div>`;}).join('');
 let {s,X,Y}=plotBase({xmin:0,xmax:17,xticks:[0,1,3,5,7,9,11,13,15,17],xlabel:'轮次 K · K0 为 Context，K1–K17 为 Harness',ylabel:'18 任务末次观察原生均分',percent:false});
 d.models.forEach((m,i)=>{if(!radarA1A5Selected.has(m))return;const rr=d.curves.filter(r=>r.model===m),r=d.results[m];s+=`<path d="${path(rr,X,Y,'k','value')}" fill="none" stroke="${RADAR_COLORS[i]}" stroke-width="2" ${i%2?'stroke-dasharray="6 3"':''}/>`;for(const p of rr)s+=dot(X(p.k),Y(p.value),RADAR_COLORS[i],`${d.labels[m]} · K${p.k} · ${fmt(p.value)}`,i);const point=rr.find(p=>p.k===r.tau90);s+=`<circle cx="${X(point.k)}" cy="${Y(point.value)}" r="8" fill="none" stroke="${RADAR_COLORS[i]}" stroke-width="2"/>`+text(X(point.k),Y(point.value)-12,`K${point.k}`,'text-anchor="middle" font-size="11"');});
 $('#a1a5-growth-view').innerHTML=s+'</svg>';
}
