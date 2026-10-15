/* 六维共享同一份复算数据；情景开关不改变当前快照表或统计分母。 */
function setupRadar(){
 $('#chart-PROFILE').innerHTML='<div class="chart-controls"><label>不确定性<select id="radar-interval"><option value="yes">显示 95% 任务 bootstrap 区间</option><option value="no">仅显示点估计</option></select></label><label>未完成链<select id="radar-scenario"><option value="observed">Sonnet 当前观察快照</option><option value="next">叠加下一轮全部成功的情景</option></select></label></div><p class="micro">6 个固定 0–1 轴，边框和网格均为六边形。D3：12 个非二值任务；D6：固定 9 任务；其余：18 任务。区间是任务重采样的不确定性；虚线情景不是实测或置信上界。</p><div class="scroll-chart" id="radar-view"></div><div class="mini-readout" id="radar-readout"></div>';
 for(const id of ['radar-interval','radar-scenario'])$('#'+id).addEventListener('change',drawRadar);
}
function radarSvg(intervals=true,scenario=false){
 const axes=DATA.radar.axes;
 let s=svgStart(1000,800,'六维固定范围多边形轮廓与配对任务区间');
 for(const [i,m] of MODELS.entries()){
  const cx=i%2*500+250,cy=Math.floor(i/2)*395+192,R=112;
  const xy=(j,r)=>[cx+Math.cos(-Math.PI/2+j*Math.PI/3)*R*r,cy+Math.sin(-Math.PI/2+j*Math.PI/3)*R*r];
  s+=text(cx,Math.floor(i/2)*395+24,m+(i===3?' · 未完成快照':''),'text-anchor="middle" font-size="16" fill="'+COLORS[i]+'"');
  for(const v of [.25,.5,.75,1])s+=`<polygon points="${axes.map((_,j)=>xy(j,v).join(',')).join(' ')}" fill="none" stroke="#cbd5da" stroke-width="${v===1?1.2:.7}"/>`;
  axes.forEach((a,j)=>{const [x,y]=xy(j,1),[tx,ty]=xy(j,1.16);s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e0e6e9"/>`+text(tx,ty+4,a.code+' '+a.name,`text-anchor="${tx>cx+20?'start':tx<cx-20?'end':'middle'}" font-size="11" fill="#536975"`);});
  s+=text(cx+5,cy-R/2,'0.5','font-size="9" fill="#687783"')+text(cx+5,cy-R,'1.0','font-size="9" fill="#687783"');
  if(!selected.has(m))continue;
  const r=DATA.radar.results.find(r=>r.model===m),dims=axes.map(a=>DATA.radar.dimensions.find(r=>r.model===m&&r.axis===a.code));
  s+=`<polygon points="${axes.map((a,j)=>xy(j,r[a.code]).join(',')).join(' ')}" fill="${COLORS[i]}" fill-opacity=".1" stroke="${COLORS[i]}" stroke-width="1.8"/>`;
  dims.forEach((d,j)=>{
   if(intervals){const [x1,y1]=xy(j,d.low),[x2,y2]=xy(j,d.high);s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS[i]}" stroke-width="5" opacity=".3"/>`;}
   const [x,y]=xy(j,d.value);s+=dot(x,y,COLORS[i],`${m} · ${d.axis} ${d.name}：${fmt(d.value)}；95% 任务区间 [${fmt(d.low)}, ${fmt(d.high)}]；n=${d.n}`,i);
  });
  if(scenario&&i===3){const r=DATA.radar.completion_scenario[i];s+=`<polygon points="${axes.map((a,j)=>xy(j,r[a.code]).join(',')).join(' ')}" fill="none" stroke="${COLORS[i]}" stroke-dasharray="5 4" stroke-width="1.8"/>`;}
  s+=text(cx,Math.floor(i/2)*395+354,`顺序平均面积 ${fmt(r.area)} · 95% [${r.area_low.toFixed(3)}, ${r.area_high.toFixed(3)}]`,'text-anchor="middle" font-size="11" fill="#536975"');
 }
 return s+'</svg>';
}
function drawRadar(){
 const scenario=$('#radar-scenario').value==='next';
 $('#radar-view').innerHTML=radarSvg($('#radar-interval').value==='yes',scenario);
 $('#radar-readout').innerHTML=DATA.radar.results.filter(r=>selected.has(r.model)).map(r=>`<div style="--model-color:${COLORS[MODELS.indexOf(r.model)]}">${esc(r.model)}<strong>${fmt(r.area)}</strong>等权顺序平均面积<br>相关簇降权：${fmt(r.weighted_area)}${scenario&&r.model===MODELS[3]?'<br>完成情景：'+fmt(DATA.radar.completion_scenario[3].area):''}</div>`).join('');
}
function drawQuotaCost(){
 const b=Number($('#cost-budget').value);$('#cost-budget-out').textContent=b.toLocaleString();
 $('#cost-note').textContent='协议配额核算：正式实际步数 / 任务上限，加推理超时剩余额度补计，再加已记录额外尝试次数。每次额外尝试计 1 个配额；不表示其真实执行了满额步数。D7 是 0–17 配额覆盖曲线的归一化面积。';
 let {s,X,Y}=plotBase({xmin:0,xmax:17,xticks:[0,1,3,6,9,12,15,17],xlabel:'每任务协议预算 b（1 配额 = 该任务 step_limit）',ylabel:'配额内任务覆盖 C quota(b)'});
 s+=`<line x1="${X(b)}" y1="22" x2="${X(b)}" y2="305" stroke="#999" stroke-dasharray="3 4"/>`;
 for(const [i,m] of MODELS.entries()){if(!selected.has(m))continue;const rr=DATA.radar.cost_curves.filter(r=>r.model===m);s+=`<path d="${path(rr,X,Y,'budget','coverage',true)}" fill="none" stroke="${COLORS[i]}" stroke-width="2"/>`;for(const r of rr)s+=dot(X(r.budget),Y(r.coverage),COLORS[i],`${m} · ${r.budget.toFixed(3)} 配额 · ${Math.round(r.coverage*18)}/18`,i);}
 $('#cost-view').innerHTML=s+'</svg>';
 $('#cost-readout').innerHTML=MODELS.filter(m=>selected.has(m)).map(m=>{const r=DATA.radar.cost_curves.filter(r=>r.model===m&&r.budget<=b).at(-1);return `<div style="--model-color:${COLORS[MODELS.indexOf(m)]}">${m}<strong>${Math.round(r.coverage*18)}/18</strong>每任务 ${b} 个配额</div>`;}).join('');
}
