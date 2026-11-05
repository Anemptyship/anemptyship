(function(){
'use strict';
const PATH_SIMS=12000;
const makeSeed=(s)=>{let k=2166136261;for(const c of s)k=Math.imul(k^c.charCodeAt(0),16777619);return k>>>0;};
function rng(seed){let k=seed|0;return function(){k=(k+0x6D2B79F5)|0;let z=k;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return ((z^(z>>>14))>>>0)/4294967296;};}
function percentile(a,p){const u=(a.length-1)*p,i=Math.floor(u);return a[i]*(1-(u-i))+a[Math.min(a.length-1,i+1)]*(u-i);}
function ptxt(p){return Number.isFinite(p)?(100*p).toFixed(p<.01?2:1)+'%':'—';}
function money(v){if(!Number.isFinite(v))return '—';const isKR=/\.(KS|KQ)$/.test(state.ticker),isIdx=state.ticker.startsWith('^');return (isKR?'₩':isIdx?'':'$')+v.toLocaleString('en-US',{minimumFractionDigits:isKR||isIdx?0:2,maximumFractionDigits:isKR||isIdx?0:2});}
function paths(){
 const a=state.series,n=a.length,last=a[n-1],H=63,blockLen=5,spot=last?.p;
 if(!state.fresh||n<290||!last?.has)return null;
 const sigma=last.vol/100/Math.sqrt(252);
 if(!(sigma>0))return null;
 const cutoff=state.years==='all'?'0000-00-00':String(Number(last.d.slice(0,4))-Number(state.years))+'-'+last.d.slice(5);
 const old=[],ret=new Float64Array(n);
 for(let i=1;i<n;i++)ret[i]=Math.log(a[i].p/a[i-1].p);
 let total=0;
 for(let i=127;i+blockLen<n;i++){
   const t=a[i-1];if(!t.has||t.d<cutoff)continue;
   const vol=t.vol/100/Math.sqrt(252);
   if(!(vol>0))continue;
   const vd=Math.log(vol/sigma)/.72;
   const md=(t.x[1]-last.x[1])/Math.max(7,sigma*Math.sqrt(21)*125);
   const w=.18+2.2*Math.exp(-.5*(vd*vd+md*md));
   total+=w;old.push({i:i,c:total,scale:Math.max(.58,Math.min(1.8,.25+.75*sigma/vol))});
 }
 if(old.length<130)return null;
 let avg=0,count=0;for(let i=127;i<n;i++)if(a[i].d>=cutoff){avg+=ret[i];count++;}avg/=Math.max(1,count);
 const driftLong=n>253?Math.log(spot/a[n-253].p)/252:avg;
 const driftNear=Math.log(spot/a[n-22].p)/21;
 const target=Math.max(-.0015,Math.min(.0025,.85*driftLong+.15*driftNear));
 const drift=Math.max(-.0015,Math.min(.0015,.45*(target-avg)));
 const random=rng(makeSeed(state.ticker+'|'+last.d+'|'+state.years));
 function pick(){const p=random()*total;let l=0,r=old.length-1;while(l<r){let m=(l+r)>>1;if(old[m].c>=p)r=m;else l=m+1;}return old[l];}
 const dist=Array.from({length:H+1},()=>new Float64Array(PATH_SIMS));
 const acc={5:{down:0,t10:0,t20:0},21:{down:0,t10:0,t20:0},63:{down:0,t10:0,t20:0}};
 for(let j=0;j<PATH_SIMS;j++){
   let v=spot,min=spot,day=0;dist[0][j]=v;
   while(day<H){const o=pick();for(let k=0;k<blockLen&&day<H;k++){
     v*=Math.exp(Math.max(-.31,Math.min(.31,ret[o.i+k]*o.scale+drift)));min=Math.min(min,v);day++;
     dist[day][j]=v;const q=acc[day];if(q){if(v<spot)q.down++;if(min<=spot*.9)q.t10++;if(min<=spot*.8)q.t20++;}
   }}
 }
 const bands=dist.map((vals,day)=>{vals.sort();return {day:day,lo95:percentile(vals,.05),lo90:percentile(vals,.1),lo75:percentile(vals,.25),med:percentile(vals,.5),hi75:percentile(vals,.75),hi90:percentile(vals,.9),hi95:percentile(vals,.95)};});
 const byH={};
 for(const h of [5,21,63]){const x=acc[h],b=bands[h];byH[h]=Object.assign({},b,{down:x.down/PATH_SIMS,t10:x.t10/PATH_SIMS,t20:x.t20/PATH_SIMS});}
 return {spot:spot,date:last.d,bands:bands,byH:byH,numOld:old.length};
}
const uiStyle=document.createElement('style');uiStyle.textContent='.pro-head{margin:0 0 16px}.pro-head h2{font-size:22px;letter-spacing:-.5px;margin:0}.pro-head p{margin:5px 0;color:#9db3c9;font-size:12px}.pro-wrap{margin:0 0 25px;padding:20px;border:1px solid #345772;border-radius:17px;background:linear-gradient(150deg,#17263c,#0e1b2b)}.pro-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.pro-card{border-radius:12px;background:#102033;border:1px solid #334b61;padding:15px}.pro-card small{font-size:12px;color:#9fc8de}.pro-card strong{display:block;font-size:29px;color:#ffa8ae}.pro-card span{display:block;color:#afc0d5;font-size:12px;margin-top:5px}.pro-card b{color:#dcefff}.pro-chart{height:315px;margin:15px 0}.pro-chart svg{width:100%;height:100%;display:block}.pro-table{width:100%;min-width:670px;font-size:12px;border-collapse:collapse}.pro-table td,.pro-table th{padding:9px 8px;border-bottom:1px solid #34475d;text-align:right;white-space:nowrap}.pro-table th:first-child,.pro-table td:first-child{text-align:left}.pro-table th{color:#9cacc6}.pro-note{margin:12px 0 0;color:#aabdd1;font-size:12px;line-height:1.65}.pro-table-scroll{overflow-x:auto}@media(max-width:670px){.pro-wrap{padding:12px}.pro-cards{grid-template-columns:1fr}.pro-card{padding:11px}.pro-card strong{font-size:23px}.pro-chart{height:270px}}';
document.head.appendChild(uiStyle);
const add=document.createElement('section');add.id='prediction';add.className='pro-wrap';add.innerHTML='<div class="pro-head"><h2>현재 하락 확률 · 1주 / 1개월 / 3개월 예상 가격 범위</h2><p id="predictionStamp">최신 종가를 기준으로 계산 중입니다.</p></div><div id="predictionBody">가격 경로 분석을 준비 중입니다.</div><p class="pro-note">하락 확률: 각 기간 마지막 종가가 기준가 미만일 확률. -10%/-20% 도달: 해당 기간에 단 한 번이라도 종가가 기준가 대비 -10%/-20% 아래로 내려갈 확률. 범위: 기간 종료일 가격 분포의 중앙 80%/90%. 과거 5일 수익률 블록을 현재 변동성·모멘텀에 따라 가중 재표본화한 연구용 12,000경로 시뮬레이션입니다. 예측 정확도가 검증된 실전 신호가 아니며 장중 저가는 반영되지 않습니다.</p>';
const metricBox=document.getElementById('metrics');metricBox.parentNode.insertBefore(add,metricBox.nextSibling);
const options=document.getElementById('displaySelect');options.insertAdjacentHTML('afterbegin','<option value="path">경로 시뮬레이션 (가격 구간과 일치)</option>');state.mode='path';options.value='path';
const oldCompute=compute;
compute=function(){oldCompute();state.forecast=paths();for(const t of THRESHOLDS)for(const h of HORIZONS){const q=state.forecast?.byH[h.n];state.stats[sid(t,h.n)].path=q?(t===10?q.t10:q.t20):NaN;}};
selectedVal=function(s){return state.fresh?(state.mode==='path'?s.path:s[state.mode]):NaN;};
modelName=function(){return {path:'경로 시뮬레이션',logit:'로지스틱 모델',analog:'유사국면 빈도',base:'과거 발생률'}[state.mode]||state.mode;};
function renderPred(){
 const f=state.forecast,info=document.getElementById('predictionStamp'),root=document.getElementById('predictionBody');
 if(!state.fresh||!f){info.textContent='최근 가격 또는 충분한 가격 이력이 없습니다.';root.textContent='최신 거래일 종가가 확인되지 않아 현재 확률과 예상 범위를 숨깁니다.';return;}
 info.textContent=state.ticker+' · '+f.date+' 기준 종가 '+money(f.spot)+' · 과거 블록 '+f.numOld.toLocaleString()+'개 기반';
 let cards='',rows='';
 for(const h of HORIZONS){
   const v=f.byH[h.n],name=h.name;
   cards+='<div class="pro-card"><small>향후 '+name+' · '+h.n+'거래일</small><strong>'+ptxt(v.down)+'</strong><span>기간 말 <b>하락할 확률</b></span><span>가격 중앙값 <b>'+money(v.med)+'</b></span><span>80% 가격 구간<br><b>'+money(v.lo90)+' ~ '+money(v.hi90)+'</b></span></div>';
   rows+='<tr><td><b>'+name+'</b></td><td>'+ptxt(v.down)+'</td><td>'+money(v.med)+'</td><td>'+money(v.lo90)+' ~ '+money(v.hi90)+'</td><td>'+money(v.lo95)+' ~ '+money(v.hi95)+'</td><td>'+ptxt(v.t10)+'</td><td>'+ptxt(v.t20)+'</td></tr>';
 }
 root.innerHTML='<div class="pro-cards">'+cards+'</div><div class="pro-chart" id="predictionGraph"></div><div class="pro-table-scroll"><table class="pro-table"><thead><tr><th>기간</th><th>하락 확률</th><th>중앙값</th><th>80% 예상 가격</th><th>90% 예상 가격</th><th>-10% 도달</th><th>-20% 도달</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="pro-note">기준가: '+money(f.spot)+' · -10% 가격: '+money(f.spot*.9)+' · -20% 가격: '+money(f.spot*.8)+' · 위 확률은 관측된 사실이 아닌 시뮬레이션 추정치입니다.</p>';
 const all=f.bands,w=1050,ht=310,L=47,R=16,T=15,B=31,spot=f.spot;
 const lows=all.map(x=>x.lo95/spot*100),highs=all.map(x=>x.hi95/spot*100);
 const ymin=Math.max(30,Math.floor((Math.min(80,...lows)-4)/5)*5),ymax=Math.ceil((Math.max(100,...highs)+4)/5)*5;
 const X=d=>L+(w-L-R)*d/63,Y=v=>T+(ht-T-B)*(1-(v-ymin)/(ymax-ymin));
 const line=(key)=>all.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(v[key]/spot*100).toFixed(1)).join(' ');
 const shape=(hi,lo)=>line(hi)+' '+all.slice().reverse().map(v=>'L'+X(v.day).toFixed(1)+','+Y(v[lo]/spot*100).toFixed(1)).join(' ')+'Z';
 let svg='';
 for(let i=0;i<6;i++){const y=T+(ht-T-B)*i/5,val=ymax-(ymax-ymin)*i/5;svg+='<line x1="'+L+'" x2="'+(w-R)+'" y1="'+y+'" y2="'+y+'" stroke="#3d516c" stroke-dasharray="3,5"/><text x="'+(L-7)+'" y="'+(y+3)+'" font-size="11" text-anchor="end" fill="#8fa9c5">'+Math.round(val)+'%</text>';}
 svg+='<path d="'+shape('hi95','lo95')+'" fill="#26455d" opacity=".75"/><path d="'+shape('hi90','lo90')+'" fill="#28809b" opacity=".7"/><path d="'+shape('hi75','lo75')+'" fill="#489fb6" opacity=".45"/>';
 for(const t of [100,90,80]){svg+='<line x1="'+L+'" x2="'+(w-R)+'" y1="'+Y(t)+'" y2="'+Y(t)+'" stroke="'+(t===100?'#bcd4dc':'#ff8fa0')+'" stroke-dasharray="5,5"/><text x="'+(w-R-5)+'" y="'+(Y(t)-6)+'" fill="'+(t===100?'#bfcee1':'#ff98ac')+'" text-anchor="end" font-size="11">'+(t===100?'현재':t+'%')+'</text>';}
 svg+='<path d="'+line('med')+'" fill="none" stroke="#65e8b2" stroke-width="2.8"/>';
 for(const h of HORIZONS){let px=X(h.n);svg+='<line x1="'+px+'" x2="'+px+'" y1="'+T+'" y2="'+(ht-B)+'" stroke="#566b81" stroke-dasharray="3,5"/><text x="'+px+'" y="'+(ht-5)+'" fill="#bdcce2" text-anchor="'+(h.n===63?'end':'middle')+'" font-size="12">'+h.name+'</text>';}
 document.getElementById('predictionGraph').innerHTML='<svg role="img" aria-label="미래 63거래일 가격 분포의 80%와 90% 예상 구간" viewBox="0 0 '+w+' '+ht+'" preserveAspectRatio="none">'+svg+'</svg>';
}
const oldRenderAll=renderAll;
renderAll=function(){oldRenderAll();renderPred();};
})();
