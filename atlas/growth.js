/* M72 只切换已核验的组合；不在浏览器重新拟合或改变任务分母。 */
'use strict';

function growthSelection(){
 return {curve:$('#growth-curve').value,baseline:Number($('#growth-baseline').value),fraction:Number($('#growth-threshold').value)};
}
function growthRows(choice){
 return DATA.growth.filter(r=>r.curve===choice.curve&&r.baseline===choice.baseline&&r.fraction===choice.fraction);
}
function growthPresentation(choice){
 const success=choice.curve==='success',unit=success?'百分点 / 轮':'score / 轮',scale=success?100:1;
 const value=v=>v===null?'NA':(v*scale).toFixed(success?2:4)+(success?'%':'');
 const slope=v=>v===null?'NA':(v*scale).toFixed(4);
 const p=Math.round(choice.fraction*100);
 return {code:`M72_${choice.curve}_K${choice.baseline}_p${p}`,
  headers:['模型',`K${choice.baseline} 起点`, '观察最高值',`到 ${p}% 增益轮次 τ`,`高位前斜率，${unit}`,`K${choice.baseline}–K17 净斜率，${unit}`,`均匀性 U${p}`,'无正增长区间'],
  rows:growthRows(choice).map(r=>[r.model,value(r.start),value(r.peak),r.tau===null?'NA':'K'+r.tau,
   slope(r.slope),slope(r.full_slope),r.uniformity===null?'NA':r.uniformity.toFixed(4)+(r.interpretable?'':'（仅 1 个区间）'),
   r.intervals?`${r.nonpositive}/${r.intervals} (${pct(r.nonpositive_fraction)})`:'NA'])};
}
function growthTableCard(){return growthPresentation(growthSelection());}

function setupGrowth(){
 $('#chart-M72').innerHTML=`<div class="chart-controls">
 <label>观察曲线<select id="growth-curve"><option value="score">原生得分均值</option><option value="success">任务成功比例</option></select></label>
 <label>基线<select id="growth-baseline"><option value="0">K0（包含起点协议差异）</option><option value="1">K1（Harness 内）</option></select></label>
 <label>高位阈值 p<select id="growth-threshold"><option value="0.9">90% 已观察增益</option><option value="0.95">95% 已观察增益</option><option value="1">100% 已观察增益</option></select></label></div>
 <p class="growth-current" id="growth-current" aria-live="polite"></p>
 <p class="micro">阈值相对各模型自己的起点与最高观察值。大标记为首次达到阈值的轮次；增量图中的浅色表示统计窗口以外，负值保留。</p>
 <div class="scroll-chart" id="growth-curve-view"></div>
 <div class="scroll-chart" id="growth-increment-view"></div>
 <div class="scroll-chart" id="growth-summary-view"></div>
 <p class="micro">表格和“下载本表 CSV”随选择同步更新，始终列出四模型；静态主图固定为原生均分 / K0 / 90%。95% 与 100% 敏感性图见下方导出面板。</p>`;
 for(const id of ['growth-curve','growth-baseline','growth-threshold'])$('#'+id).addEventListener('change',drawGrowth);
}

function growthCurveSvg(choice,stats){
 const success=choice.curve==='success';
 let {s,X,Y}=plotBase({xmin:0,xmax:17,xticks:[0,1,3,5,7,9,11,13,15,17],
  xlabel:'轮次 K；沿用末次已观察结果，不对首胜后或尚未运行的回合补测',
  ylabel:success?'任务等权观察成功比例 x(K)':'任务等权原生观察均分 x(K)',percent:success});
 s+=`<line x1="${X(choice.baseline)}" x2="${X(choice.baseline)}" y1="22" y2="305" stroke="#86949e" stroke-dasharray="3 3"/>`;
 for(const [i,m] of MODELS.entries()){
  if(!selected.has(m))continue;
  const rr=DATA.growth_points.filter(r=>r.model===m&&r.curve===choice.curve),r=stats.find(x=>x.model===m);
  s+=`<path d="${path(rr,X,Y,'k','value')}" fill="none" stroke="${COLORS[i]}" stroke-width="2" ${i===3?'stroke-dasharray="6 3"':''}/>`;
  for(const point of rr)s+=dot(X(point.k),Y(point.value),COLORS[i],`${m} · K${point.k} · ${success?pct(point.value):fmt(point.value)}`,i);
  if(r.tau!==null){
   const point=rr.find(p=>p.k===r.tau);
   s+=`<circle cx="${X(r.tau)}" cy="${Y(point.value)}" r="8" fill="none" stroke="${COLORS[i]}" stroke-width="2"/>`;
   s+=text(X(r.tau),Y(point.value)-14,`K${r.tau}`,'text-anchor="middle" font-size="12" fill="'+COLORS[i]+'"');
  }
 }
 return s+'</svg>';
}

function growthIncrementSvg(choice,stats){
 const shown=MODELS.filter(m=>selected.has(m)),success=choice.curve==='success',scale=success?100:1;
 const points=DATA.growth_points.filter(r=>r.curve===choice.curve&&r.k>0);
 const lo=Math.min(-.04,...points.map(r=>r.delta))-.012,hi=Math.max(.05,...points.map(r=>r.delta))+.025;
 const width=960,height=shown.length*136+60,left=66,right=36,X=k=>left+(k-.5)/17*(width-left-right);
 let s=svgStart(width,height,'逐轮未平滑增量：深色为当前基线到阈值轮次，浅色为窗口外');
 shown.forEach((m,j)=>{
  const i=MODELS.indexOf(m),top=28+j*136,bottom=top+99,Y=v=>bottom-(v-lo)/(hi-lo)*99;
  const stat=stats.find(r=>r.model===m),rr=points.filter(r=>r.model===m);
  for(const v of [0,.1]){
   if(v<lo||v>hi)continue;
   s+=`<line x1="${left}" x2="${width-right}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v===0?'#82919b':'#e2e7e9'}" stroke-width="1"/>`;
   s+=text(left-10,Y(v)+4,(v*scale).toFixed(success?0:2),'text-anchor="end" font-size="11" fill="#62717b"');
  }
  for(const p of rr){
   const inWindow=p.k>choice.baseline&&p.k<=stat.tau,alpha=inWindow?1:.24;
   const label=`${m} · K${p.k-1}→K${p.k} · 增量 ${(p.delta*scale).toFixed(4)} ${success?'百分点':'score'}；${inWindow?'当前统计窗口':'统计窗口外'}`;
   if(Math.abs(p.delta)<1e-10){
    s+=`<path d="M${X(p.k)-15},${Y(0)}h30" fill="none" stroke="${COLORS[i]}" stroke-width="2" opacity="${alpha}" tabindex="0" data-tip="${esc(label)}" aria-label="${esc(label)}"/>`;
   }else{
    const y=Math.min(Y(0),Y(p.delta)),h=Math.abs(Y(p.delta)-Y(0));
    s+=`<rect x="${X(p.k)-16}" y="${y}" width="32" height="${h}" fill="${COLORS[i]}" opacity="${alpha}" tabindex="0" data-tip="${esc(label)}" aria-label="${esc(label)}"/>`;
   }
   if(j===shown.length-1)s+=text(X(p.k),bottom+20,p.k,'text-anchor="middle" font-size="11" fill="#62717b"');
  }
  if(stat.tau!==null)s+=`<line x1="${X(stat.tau+.5)}" x2="${X(stat.tau+.5)}" y1="${top}" y2="${bottom}" stroke="${COLORS[i]}" stroke-dasharray="3 3"/>`;
  s+=text(width-right-7,top+12,m,'text-anchor="end" font-size="12" fill="'+COLORS[i]+'"');
 });
 s+=text(width/2,height-5,`相邻轮次增量 d(K) = x(K) − x(K−1)；单位：${success?'百分点':'score'}`,'text-anchor="middle" font-size="12" fill="#495e6c"');
 return s+'</svg>';
}

function growthSummarySvg(choice,stats){
 const success=choice.curve==='success',scale=success?100:1;
 let s=svgStart(960,290,'到高位前的平均增长斜率和增量均匀性，分别比较速度与增量分散程度');
 for(const [j,key] of ['slope','uniformity'].entries()){
  const offset=j*480,top=40,bottom=230, factor=j===0?scale:1;
  const max=j===0?Math.max(.01,...stats.map(r=>r[key]===null?0:r[key]*factor))*1.25:1.12;
  const Y=v=>bottom-v/max*(bottom-top);
  s+=text(offset+58,20,j===0?`高位前平均斜率 v（${success?'百分点':'score'} / 轮）`:'增量均匀性 U（越接近 1 越均匀）','font-size="13" fill="#495e6c"');
  for(let n=0;n<=4;n++){
   const v=max*n/4,y=Y(v);
   s+=`<line x1="${offset+58}" x2="${offset+460}" y1="${y}" y2="${y}" stroke="#e2e7e9"/>`;
   s+=text(offset+48,y+4,v.toFixed(j===0&&!success?3:2),'text-anchor="end" font-size="10" fill="#62717b"');
  }
  for(const [i,m] of MODELS.entries()){
   const x=offset+101+i*101,r=stats.find(r=>r.model===m),value=r[key]===null?null:r[key]*factor;
   s+=text(x,254,m,'text-anchor="middle" font-size="11" fill="'+COLORS[i]+'"');
   if(!selected.has(m))continue;
   if(value===null){s+=text(x,218,'NA','text-anchor="middle" font-size="12"');continue;}
   const label=`${m} · ${j===0?'平均净斜率':'均匀性'} ${value.toFixed(4)}；${r.intervals} 个区间${r.interpretable?'':'，不能据此判断均匀性'}`;
   s+=`<rect x="${x-25}" y="${Y(value)}" width="50" height="${bottom-Y(value)}" fill="${COLORS[i]}" tabindex="0" data-tip="${esc(label)}" aria-label="${esc(label)}"/>`;
   s+=text(x,Y(value)-8,value.toFixed(3),'text-anchor="middle" font-size="12"');
  }
 }
 return s+'</svg>';
}

function drawGrowth(){
 const choice=growthSelection(),stats=growthRows(choice),c=growthPresentation(choice);
 $('#growth-current').textContent=`当前：${choice.curve==='score'?'原生观察均分':'观察成功比例'} · K${choice.baseline} 基线 · ${Math.round(choice.fraction*100)}% 相对增益阈值。斜率回答“每轮增加多少”，U 回答“增长是否集中在少数轮次”。`;
 $('#growth-curve-view').innerHTML=growthCurveSvg(choice,stats);
 $('#growth-increment-view').innerHTML=growthIncrementSvg(choice,stats);
 $('#growth-summary-view').innerHTML=growthSummarySvg(choice,stats);
 $('#table-M72').innerHTML=table(c.headers,c.rows);
}
