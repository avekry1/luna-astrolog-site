import {CONFIG,TOPICS,validCode,topicForCode,linkFor} from './state.mjs';
const params=new URLSearchParams(location.search);
const code=validCode(params.get('start'));
const topic=topicForCode(code);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const root=document.documentElement;
const scene=document.querySelector('.scene'),portrait=scene.querySelector('.portrait');
// CTA card: Telegram | ВКонтакте | MAX, the same three buttons as in the sticky bar and «Продолжить в:».
const card=document.getElementById('cta-card');
const primary=document.getElementById('hero-primary');
const finalRow=document.getElementById('final-row');
const sticky=document.getElementById('sticky');
const help=document.getElementById('telegram-help');
let helpTimer,attemptedAt=0,raf;
// The shine sweeps the three card buttons four times and stops for good.
let swept=0;
card.addEventListener('animationend',event=>{if(event.animationName==='cta-shine'&&++swept>=3)card.classList.add('shine-done');});
// The three steps of the first screen («Польза»), beside the portrait.
const hs=document.getElementById('hsteps'),hero=document.getElementById('hero'),heroWrap=document.querySelector('.hero-wrap'),copy=document.querySelector('.hero-copy');
// The 🎁 in the card (Noto Emoji Animation, CC BY 4.0): static at first, plays from about 1.4 s,
// still again while the first screen is away, the tab is hidden or motion is reduced.
const gift=card.querySelector('.cta-gift'),giftStill=gift.getAttribute('src'),giftAnim=gift.dataset.anim||giftStill;let giftOn=false;
function syncGift(){gift.classList.toggle('gift-live',giftOn&&heroLive&&!document.hidden&&!reduceMotion.matches);}
setTimeout(()=>{giftOn=true;syncGift();},1400);
function render(){
 const content=TOPICS[topic];root.dataset.topic=topic;
 document.getElementById('headline-main').textContent=content.main;
 document.getElementById('headline-accent').textContent=content.accent;
 // Every messenger link carries the current code; the HTML already holds working links with lp_site.
 document.querySelectorAll('a[data-platform]').forEach(a=>{const url=linkFor(a.dataset.platform,code);if(url)a.href=url;});
 fitHero();
}
// The headline («Крупно») grows until its first line fills about 95% of the column;
// each half stays on one line: shrink in 2 px steps, not below 26 px.
function fitTitle(){
 const h1=document.getElementById('hero-title');h1.style.fontSize='';
 let base=parseFloat(getComputedStyle(h1).fontSize);const min=26;
 const range=document.createRange();range.selectNodeContents(h1.firstElementChild);base=Math.floor(base*.95*h1.clientWidth/range.getBoundingClientRect().width);
 for(let size=base;size>=min;size-=2){h1.style.fontSize=size+'px';if([...h1.children].every(line=>line.offsetHeight<size*1.8))return;}
}
const stepList=hs.querySelector('.side-steps'),stepRows=[...stepList.children];
// A step row slides up 8 px as it appears (mid-in), and fitHero runs while it does (on load, when the fonts are ready).
// rowRect measures an element of a row where it will stand: its box without the row's current slide.
function rowRect(el){
 const r=el.getBoundingClientRect(),li=el.closest('.side-steps>li');let ty=0;
 if(li){const m=getComputedStyle(li).transform.match(/^matrix\(([^)]+)\)$/);if(m)ty=+m[1].split(',')[5]||0;}
 return {left:r.left,right:r.right,width:r.width,height:r.height,top:r.top-ty,bottom:r.bottom-ty};
}
// Her orbits o0, o1, o2: on phones redrawn as three arcs from one centre (o0 through the nodes), on desktop as drawn in the HTML;
// one small pearl moves along each arc on phones.
const ORBITS=['o0','o1','o2'].map(id=>document.getElementById(id)),ORBIT_D=ORBITS.map(p=>p.getAttribute('d'));
const arcPearls=[...document.querySelectorAll('.lp-mpearl')];
// Phones: the first screen is at most one screen tall: brand, headline (its top at about 9% of the screen),
// subtitle, the middle (portrait + the steps), the coupon; on a tall screen the middle ends under the steps and the next block shows.
// Too short a screen gives up, in this order: gaps above and between, headline size, card padding; then the steps get short or hide.
const STEP_CLASSES=['is-hidden','is-short'];
function resetMiddle(){
 for(const name of ['--ph','--pt','--pl','--fade','display'])portrait.style.removeProperty(name);
 hs.classList.remove(...STEP_CLASSES);hs.removeAttribute('style');delete hs.dataset.slack;
 root.classList.remove('hero-cut','no-arcs');scene.style.removeProperty('height');
 for(const name of ['--hpb','--bpt'])root.style.removeProperty(name);
 [stepList,...stepRows].forEach(el=>el.removeAttribute('style'));
}
function fitHero(){
 for(const name of ['--gap','--htop'])root.style.removeProperty(name);card.classList.remove('cta-tight');
 resetMiddle();
 fitTitle();
 if(innerWidth<900){
  const h1=document.getElementById('hero-title'),header=document.querySelector('.header');
  // the accent line between headline and subtitle adds height; take it out of the space above the headline, so the middle stays where v25 put it
  const extra=extraHeadline();
  let htop=Math.max(8,Math.round(.09*innerHeight-header.offsetHeight))-extra,gap=parseFloat(getComputedStyle(root).getPropertyValue('--gap')),size=parseFloat(getComputedStyle(h1).fontSize);
  const apply=()=>{root.style.setProperty('--htop',htop+'px');root.style.setProperty('--gap',gap+'px');h1.style.fontSize=size+'px';};apply();
  // From 600 px tall the whole card must show; below that its row of three buttons.
  const tall=innerHeight>=600,target=tall?card:card.querySelector('.cta-row'),limit=innerHeight-(tall?12:4);
  const over=()=>target.getBoundingClientRect().bottom+scrollY>limit+.5;
  const tighten=floor=>{if(htop>8){htop=Math.max(8,htop-4);}else if(gap>4){gap-=2;}else if(size>floor){size-=2;}else return false;apply();return true;};
  while(over()&&tighten(26));
  if(over())card.classList.add('cta-tight');
  placeSteps();
  // Keep the steps on a short screen: pull the headline up and close the gaps before giving them up.
  while(hs.classList.contains('is-hidden')&&tighten(30)){resetMiddle();placeSteps();}
  // A tall screen with height to spare: the headline moves a little lower (at most to 52 px under the brand) instead of leaving a gap in the middle.
  const spare=Math.min(52-extra-htop,Math.round((parseFloat(hs.dataset.slack||0)-24)/2)),hidden=hs.classList.contains('is-hidden'),short=hs.classList.contains('is-short');
  if(spare>0&&!over()){
   htop+=spare;apply();resetMiddle();placeSteps();
   // never at the price of the card or of the steps
   if(over()||hs.classList.contains('is-hidden')>hidden||hs.classList.contains('is-short')>short){htop-=spare;apply();resetMiddle();placeSteps();}
  }
  // the centred headline: the space above it equals the space below the subtitle; the middle does not move
  {const d=balanceHeadline(h1,gap);if(d){htop-=d;gap+=d;apply();resetMiddle();placeSteps();}}
  cutMiddle();rhythm();
 }else{setOrbits(ORBIT_D);setPearlRun(null);drawSideArc();}
 placeGlow();drawFrame();updateSticky();
}
// The headline on phones, centred («По центру»). extraHeadline: the height the accent line adds (the subtitle's top padding).
// balanceHeadline: how far to move the block up (negative: down) so that
// above (the brand's bottom to the top of the capital letters) equals below (the subtitle's bottom to the middle's top: the higher
// on screen of the middle's top + 24 px, half its top fade, and her hair top); the letters stay at least 12 px under the brand, the gap at least 4 px.
function extraHeadline(){return parseFloat(getComputedStyle(document.getElementById('hero-subtitle')).paddingTop)||0;}
function balanceHeadline(h1,gap){
 const R=el=>el.getBoundingClientRect(),cs=getComputedStyle(h1),fs=parseFloat(cs.fontSize),lh=parseFloat(cs.lineHeight)||1.13*fs;
 const brand=R(document.querySelector('.brand')).bottom,letters=R(h1).top+(lh-fs)/2+.2*fs,sub=R(document.getElementById('hero-subtitle')).bottom;
 const sr=R(scene),ph=parseFloat(portrait.style.getPropertyValue('--ph')),pt=parseFloat(portrait.style.getPropertyValue('--pt'));
 const middle=Math.min(sr.top+24,ph?sr.top+pt+HAIR*ph:Infinity),above=letters-brand,below=middle-sub;
 let d=(above-below)/2;
 d=Math.min(d,above-12);d=Math.max(d,4-gap);
 return Math.abs(d)<.5?0:Math.round(d*10)/10;
}
// The glow's centre in the middle of headline and subtitle (the glow is a background layer of .hero-wrap).
function placeGlow(){
 const w=heroWrap.getBoundingClientRect(),c=copy.getBoundingClientRect(),h1=document.getElementById('hero-title').getBoundingClientRect();
 heroWrap.style.setProperty('--gy',Math.round(c.top+c.height/2-w.top)+'px');
 if(innerWidth>=900)heroWrap.style.setProperty('--gx',Math.round(h1.left+.42*h1.width-w.left)+'px');else heroWrap.style.removeProperty('--gx');
}
// Her photo, as shares of its height H and width W = .8 H: hair from y .077, hairline .14, chin .42, shoulder .55, the shawl fades out by .68;
// eyes to chin x .50 to .70, the centre of her face .59, her right eye .67. The page mirrors her on phones: a share x is 1 - x from the box's left edge,
// so that eye becomes her left one and stays 12 px inside the screen.
// SIL: the left edge of her silhouette (hair, then shoulder and shawl) at each height; mirrored, her right edge.
const HAIR=.077,SHAWL=.68,EYE=.67,MID=.59,HAIRLINE=.14,SHOULDER=.55;
const SIL=[[.09,.599],[.11,.544],[.13,.508],[.15,.483],[.17,.465],[.19,.452],[.21,.445],[.23,.436],[.25,.414],[.27,.421],[.29,.431],[.31,.441],[.33,.449],[.35,.453],[.37,.436],[.39,.409],[.41,.409],[.43,.411],[.45,.422],[.47,.426],[.49,.405],[.51,.383],[.53,.359],[.55,.33],[.57,.31],[.59,.305],[.61,.30],[.63,.293],[.65,.29],[.67,.292],[.69,.299]];
const silLeft=(a,b)=>Math.min(1,...SIL.filter(([y])=>y>=a-.02&&y<=b+.02).map(([,x])=>x));
// The portrait in scene coordinates: H tall, its box at (left, top); the photo and its orbits fade out by `fade`.
function setPortrait(H,left,top,fade){
 const set=(name,value)=>portrait.style.setProperty(name,Math.round(value*10)/10+'px');
 set('--ph',H);set('--pt',top);set('--pl',left);set('--fade',fade);
}
// Lines of text an element takes (0 when it is not shown).
function lineCount(el){
 if(!el.offsetHeight)return 0;
 const range=document.createRange();range.selectNodeContents(el);
 return new Set([...range.getClientRects()].map(q=>Math.round(q.top))).size;
}
// The portrait is at most 34% of the screen tall (hair to shawl), the steps keep 16 px to the card;
// nothing covers her face, from the hairline to the chin; captions never lie on the photo.
function placeSteps(){
 const zone=scene.clientHeight-17,sr=scene.getBoundingClientRect(),vw=innerWidth;
 const cap=Math.min(1.3*vw,.34*innerHeight/(SHAWL-HAIR));
 hs.classList.toggle('is-short',innerHeight<700);
 if(placeSide(zone,sr,cap))return;
 if(!hs.classList.contains('is-short')){hs.classList.add('is-short');if(placeSide(zone,sr,cap))return;}
 // nothing fits: the plain portrait, her face in the middle, or nothing on the shortest screens; no arcs, no pearls
 hs.classList.add('is-hidden');root.classList.add('no-arcs');setPearlRun(null);
 const H=Math.min(cap,zone/(SHAWL-HAIR));
 if(.28*H<56){portrait.style.display='none';return;}
 const hair=(zone-(SHAWL-HAIR)*H)/2;hs.dataset.slack=hair*2;
 setPortrait(H,.5*vw-sr.left-(1-MID)*.8*H,hair-HAIR*H,SHAWL*H);
}
// The steps («Столбик справа»): she sits as far left as her eyes allow; one group, rows 18 px apart (12 px under 700 px tall),
// centred halfway between her hairline and her shoulder, then raised until the gaps above and below are equal. The nodes sit on the outer of three arcs from one centre (see arcsFor),
// each node at least 10 px clear of her silhouette; captions at least 60 px wide, not cut, no title or line over two lines.
function placeSide(zone,sr,cap){
 setTop(0);
 for(let H=Math.floor(Math.min(cap,zone/(SHAWL-HAIR)));H>=190;H-=3){const W=.8*H,V=(SHAWL-HAIR)*H;
  const left=12-sr.left-(1-EYE)*W,hair=Math.max(0,Math.min(36,(zone-V)/2)),pt=hair-HAIR*H;
  // the group's top: its centre in her gaze, kept inside the middle
  const group=()=>{const G=stepList.offsetHeight;stepList.style.marginTop=Math.max(0,Math.min(zone-G,pt+(HAIRLINE+SHOULDER)/2*H-G/2))+'px';};
  // her right edge (the mirrored silhouette) between two heights, in scene coordinates
  const edge=(t,b)=>left+(1-silLeft((t-pt)/H,(b-pt)/H))*W;
  const nodes=()=>stepRows.map(li=>{const r=rowRect(li.querySelector('.step-node'));return {x:r.left+r.width/2-sr.left,y:r.top+r.height/2-sr.top,r:r.width/2,t:r.top-sr.top,b:r.bottom-sr.top};});
  // node 3 at most this far right, so its caption keeps 150 px (12 px from the screen's edge)
  const xmax=innerWidth-12-150-12-sr.left;
  // the rows at a group top (null: v23's place, centred in her gaze): passes until nothing moves, because a row's height
  // (and so its node's height, and the middle's bottom) depends on how its caption wraps; null when the arcs do not fit
  const settle=top=>{let arc=null,stable=false;
   for(let pass=0;pass<6&&!stable;pass++){
    if(top===null)group();else stepList.style.marginTop=top+'px';
    const n=nodes();arc=arcsFor(n,left,W,H,pt,edge,middleBottom(lowestRow(sr),H,pt),xmax-n[2].r);if(!arc)break;
    const M=n.map(p=>Math.round(arcX(arc,p.y)-p.r));
    stable=pass>0&&stepRows.every((li,i)=>parseFloat(li.style.marginLeft)===M[i]);
    stepRows.forEach((li,i)=>li.style.marginLeft=M[i]+'px');
   }
   return stable?arc:null;};
  let arc=settle(null);
  if(!arc)continue;
  // The group between the subtitle and the card with equal gaps: above, the subtitle's bottom to the first row's top;
  // below, the lowest row to the card's top (cutMiddle's height). Only up from v23's place, 1 px at a time, never above her
  // hair top, and only when the middle is cut (else the card stays at the bottom and v23's place stays); the closest it allows.
  const sub=document.getElementById('hero-subtitle').getBoundingClientRect().bottom-sr.top,below0=card.getBoundingClientRect().top-sr.bottom;
  const gaps=()=>{const low=lowestRow(sr),mb=middleBottom(low,H,pt);return {cut:mb!==scene.clientHeight,above:parseFloat(stepList.style.marginTop)-sub,below:mb+below0-low};};
  let g=gaps();
  if(g.cut&&g.above>g.below+2){
   const top0=parseFloat(stepList.style.marginTop),floor=Math.max(0,pt+HAIR*H);let best={d:g.above-g.below,top:top0};
   for(let top=top0-1;top>=floor;top--){
    if(!settle(top))break;g=gaps();if(!g.cut)break;
    const d=Math.abs(g.above-g.below);if(d<best.d)best={d,top};
    if(g.above<=g.below+2)break;
   }
   arc=best.top===top0?settle(null):settle(best.top)||settle(null);
   if(!arc)continue;
  }
  const n=nodes();
  const ok=n.every(p=>p.x-p.r>=edge(p.t,p.b)+10-.5&&Math.abs(arcX(arc,p.y)-p.x)<=1)
   &&stepRows.every(li=>{const t=li.querySelector('.hs-text');return t.clientWidth>=60&&[...t.children].every(c=>c.scrollWidth<=c.clientWidth+.5&&c.scrollWidth<=t.clientWidth+.5&&lineCount(c)<=2);});
  const box=stepList.getBoundingClientRect(),gTop=box.top-sr.top,gBottom=box.bottom-sr.top;
  if(!ok||gTop<-.5||gBottom>zone+.5)continue;
  // spare height for the headline: the space her photo leaves
  hs.dataset.slack=Math.min(zone-V,zone-(gBottom-gTop));
  // her shawl goes on down to the card (the photo has it to the bottom); cutMiddle() may end it higher
  setPortrait(H,left,pt,Math.max(SHAWL*H,Math.min(H,scene.clientHeight-pt)));
  drawArcs(arc,left,W,H,pt,edge);
  return true;
 }
 return false;
}
// The lowest row's bottom (node or caption), and the middle's bottom as cutMiddle() will set it: 24 px under that row,
// never above her shoulder, and only when it frees at least 48 px (else the middle keeps its height).
function lowestRow(sr){let low=0;hs.querySelectorAll('.step-node,.hs-text').forEach(el=>{const r=rowRect(el);if(r.height)low=Math.max(low,r.bottom-sr.top);});return low;}
function middleBottom(low,H,pt){const h=Math.ceil(Math.max(low+24,pt+SHOULDER*H+8));return scene.clientHeight-h>=48?h:scene.clientHeight;}
// Three arcs from one centre at the middle's bottom (cy), so they go into the card from above.
// «Fan»: the outer arc passes through T, 14 px above her hair over the middle of her face, and through node 1 at its minimum
// m = 10 px right of her silhouette (over the node's own height) + its radius. When that puts node 3 past xmax, the arc is turned
// instead of flattened: the same R, node 3 at max(m3, xmax), the centre the left of the two points R from node 1 and node 3.
// The inner arcs: radii R - d and R - 2d, d = .066 H.
function arcsFor(n,left,W,H,pt,edge,cy,xmax){
 const Tx=left+(1-MID)*W,Ty=pt+HAIR*H-14,m=n.map(p=>edge(p.t,p.b)+10+p.r);
 if(Math.abs(Tx-m[0])<1)return null;
 const cx=(Tx*Tx-m[0]*m[0]-((n[0].y-cy)**2-(Ty-cy)**2))/(2*(Tx-m[0]));
 let arc={cx,cy,R:Math.hypot(Tx-cx,Ty-cy),turned:false};
 const x3=arcX(arc,n[2].y);
 if(x3>xmax+.5||x3<m[2]-.5){
  const X3=x3>xmax?Math.max(m[2],xmax):m[2],ax=m[0],ay=n[0].y,bx=X3,by=n[2].y,D=Math.hypot(bx-ax,by-ay),half=D/2;
  const R=Math.max(arc.R,half+1),h=Math.sqrt(R*R-half*half),mx=(ax+bx)/2,my=(ay+by)/2,ux=-(by-ay)/D,uy=(bx-ax)/D;
  const c=[[mx+h*ux,my+h*uy],[mx-h*ux,my-h*uy]].sort((p,q)=>p[0]-q[0])[0];
  arc={cx:c[0],cy:c[1],R,turned:true};
 }
 arc.d=.066*H;
 if(n.some((p,i)=>Math.abs(p.y-arc.cy)>arc.R||arcX(arc,p.y)<m[i]-.5))return null;
 return arc;
}
// x of the outer arc at height y, on its right (visible) side
const arcX=(arc,y)=>arc.cx+Math.sqrt(Math.max(0,arc.R**2-(y-arc.cy)**2));
// The three circles into o0, o1, o2, in the photo's own coordinates (the box is mirrored): X = (left + W - x) / s, Y = (y - pt) / s,
// s = W / 1122. Each path starts at the top and runs right and down, so the pearls move from over her head towards the card.
// They stay in the back layer behind her photo: her hair and face hide the parts that pass behind her.
function drawArcs(arc,left,W,H,pt,edge){
 const s=W/1122,radii=[0,1,2].map(k=>arc.R-k*arc.d);
 setOrbits(radii.map(r=>{const pts=[];for(let k=0;k<120;k++){const a=-Math.PI/2+2*Math.PI*k/120;pts.push(((left+W-(arc.cx+r*Math.cos(a)))/s).toFixed(1)+' '+((arc.cy+r*Math.sin(a)-pt)/s).toFixed(1));}return 'M'+pts.join('L')+'Z';}));
 // the pearls: about 7 px with an 18 px glow. Each runs only along the part of its arc that shows (pearlFrame moves them);
 // without motion only the inner two, standing halfway along the part of their arc that shows (right of her, inside the middle)
 const still=reduceMotion.matches,sr=scene.getBoundingClientRect(),mb=middleBottom(lowestRow(sr),H,pt);
 arcPearls.forEach((g,k)=>{
  // the outer pearl a little bigger: core 9 px, glow 26 px across; the inner two 7 px and 18 px
  g.querySelector('.lp-mcore').setAttribute('r',((k?3.5:4.5)/s).toFixed(1));g.querySelector('.lp-mglow').setAttribute('r',((k?9:13)/s).toFixed(1));
  g.querySelector('animateMotion')?.remove();g.removeAttribute('transform');g.classList.toggle('is-off',still&&k===0);g.style.removeProperty('display');
  const r=radii[k];
  if(still){
   const seen=[];for(let j=0;j<360;j++){const a=-Math.PI+Math.PI*2*j/360,x=arc.cx+r*Math.cos(a),y=arc.cy+r*Math.sin(a);
    const yy=(y-pt)/H,right=yy<HAIR||yy>SHAWL?x>=0:x>edge(y-1,y+1)+4;if(y>=0&&y<=arc.cy-4&&x>=0&&right)seen.push([x,y]);}
   const p=seen[Math.floor(seen.length/2)];if(!p){g.classList.add('is-off');return;}
   g.setAttribute('transform',`translate(${((left+W-p[0])/s).toFixed(1)} ${((p[1]-pt)/s).toFixed(1)})`);
  }
 });
 if(still){setPearlRun(null);return;}
 // each path: the whole arc on its right side inside the middle, from where it enters (24 px under the middle's top, or the screen's
 // left edge) to the middle's bottom (the card's top). The pearls lie behind her photo, so they vanish behind her head, face or
 // shoulder and come out again, like planets going round her.
 const inside=(x,y)=>x>=-sr.left&&y>=24;
 const paths=radii.map(r=>{
  const dy=mb-arc.cy,a1=Math.abs(dy)<=r?Math.asin(dy/r):Math.sign(dy)*Math.PI/2,step=1/r;
  let a=a1;while(a>a1-1.5*Math.PI&&inside(arc.cx+r*Math.cos(a-step),arc.cy+r*Math.sin(a-step)))a-=step;
  return {r,a0:a,a1,len:r*(a1-a)};
 });
 // the caption lines (where they will stand), so the outer pearl's glow can keep off them
 const caps=[...hs.querySelectorAll('.s-full,.s-line,.s-short')].filter(e=>e.offsetHeight).flatMap(e=>{const ty=e.getBoundingClientRect().top-rowRect(e).top,g=document.createRange();g.selectNodeContents(e);
  return [...g.getClientRects()].map(q=>({l:q.left-sr.left,r:q.right-sr.left,t:q.top-ty-sr.top,b:q.bottom-ty-sr.top}));});
 setPearlRun({arc,left,W,pt,s,paths,caps});
}
// The phone pearls, one clock for all three, at different speeds on screen: outer 30 px a second all the way, middle 26, inner 22.
// In each cycle the outer pearl starts; the middle one when the outer has done 65% of its way (near step 3); the inner one when the
// middle has done half; the next cycle when the inner has done 55% (at half, the new outer pearl came within 75 px of the
// inner one on narrow phones). So they never move side by side.
// The loop runs only while syncLight lets the orbit light run (tab visible, first screen in view, motion allowed) and keeps its time.
let pearlRun=null,pearlClock=0,pearlLast=0,pearlRaf=0;
const PEARL_SPEED=[30,26,22];
function setPearlRun(run){
 if(run){const T=run.paths.map((p,k)=>p.len/PEARL_SPEED[k]),s1=.65*T[0],s2=s1+.5*T[1];
  run.starts=[0,s1,s2];run.T=T;run.cycle=s2+.55*T[2];}
 pearlRun=run;
 if(!run){arcPearls.forEach(g=>{if(!g.getAttribute('transform'))g.style.display='none';});}
 else pearlFrame(pearlClock);
 syncPearls();
}
function pearlFrame(t){
 const run=pearlRun;if(!run)return;
 const {arc,left,W,pt,s,paths,starts,T,cycle}=run,tc=t%cycle;
  paths.forEach((p,k)=>{
  const g=arcPearls[k],u=((tc-starts[k])%cycle+cycle)%cycle;
  if(u>=T[k]){g.style.display='none';return;}
  const a=p.a0+(p.a1-p.a0)*u/T[k],x=arc.cx+p.r*Math.cos(a),y=arc.cy+p.r*Math.sin(a);
  g.style.display='';g.setAttribute('transform',`translate(${((left+W-x)/s).toFixed(1)} ${((y-pt)/s).toFixed(1)})`);
  // the outer pearl's glow (13 px) never lies over a caption: right next to one (as it comes out from behind step 1 on wide
  // phones) it shrinks for a moment to the distance left
  if(!k){const d=Math.min(13,...run.caps.map(q=>Math.hypot(Math.max(q.l-x,0,x-q.r),Math.max(q.t-y,0,y-q.b))));
   g.querySelector('.lp-mglow').setAttribute('r',(Math.max(4.5,d-.5)/s).toFixed(1));}
 });
}
const pearlsOn=()=>!!pearlRun&&!document.hidden&&heroLive&&!reduceMotion.matches;
function pearlTick(now){
 pearlRaf=0;if(!pearlsOn())return;
 if(pearlLast)pearlClock+=Math.min(.1,(now-pearlLast)/1000);
 pearlLast=now;pearlFrame(pearlClock);pearlRaf=requestAnimationFrame(pearlTick);
}
function syncPearls(){
 if(pearlsOn()){if(!pearlRaf){pearlLast=0;pearlRaf=requestAnimationFrame(pearlTick);}}
 else if(pearlRaf){cancelAnimationFrame(pearlRaf);pearlRaf=0;}
}
// New paths for her orbits; every animateMotion on a changed path is put in anew, so every browser moves along the new path.
function setOrbits(ds){
 const changed=ORBITS.filter((p,i)=>{if(p.getAttribute('d')===ds[i])return false;p.setAttribute('d',ds[i]);return true;}).map(p=>'#'+p.id);
 if(changed.length)document.querySelectorAll('.lp-back animateMotion').forEach(m=>{if(changed.includes(m.querySelector('mpath')?.getAttribute('href')))m.replaceWith(m.cloneNode(true));});
}
// Tall phones: the middle ends 24 px under its lowest row (node or caption), never above her shoulder, so the card comes right under
// the steps and the next block shows; only when that frees at least 48 px. Her photo fades out by the new bottom.
function cutMiddle(){
 if(hs.classList.contains('is-hidden')||!portrait.style.getPropertyValue('--ph'))return;
 const sr=scene.getBoundingClientRect(),H=parseFloat(portrait.style.getPropertyValue('--ph')),pt=parseFloat(portrait.style.getPropertyValue('--pt'));
 const h=middleBottom(lowestRow(sr),H,pt);
 if(h===scene.clientHeight)return;
 root.classList.add('hero-cut');scene.style.height=h+'px';
 portrait.style.setProperty('--fade',Math.round((h-pt-2)*10)/10+'px');
}
// Phones with the cut: one rhythm down to the next block. The space from the card's bottom to the heading «Почему выбирают Луну»
// equals the gap above the steps (subtitle to the first row), at least 40 and at most 72 px; the horizon line (the top of
// .content-wrap) halfway in it. Set through the hero's bottom padding (--hpb) and the block's top padding (--bpt).
function rhythm(){
 if(!root.classList.contains('hero-cut'))return;
 const R=el=>el.getBoundingClientRect(),gap=Math.min(72,Math.max(40,rowRect(stepRows[0]).top-R(document.getElementById('hero-subtitle')).bottom));
 const wrap=document.querySelector('.content-wrap'),brief=document.querySelector('.brief'),head=document.querySelector('#trust .brief-title');
 const pb=parseFloat(getComputedStyle(hero).paddingBottom),bt=parseFloat(getComputedStyle(brief).paddingTop);
 root.style.setProperty('--hpb',Math.round((pb+gap/2-(R(wrap).top-R(card).bottom))*10)/10+'px');
 root.style.setProperty('--bpt',Math.round((bt+gap/2-(R(head).top-R(wrap).top))*10)/10+'px');
}
// the steps' top in the hero (phones), y in scene coordinates
const setTop=y=>hs.style.setProperty('--st',Math.round(scene.offsetTop+y)+'px');
// Desktop: the thin «)» through the three node centres, 34 px beyond the first and last node and fading out there
// (the parabola x(y) through the centres).
function drawSideArc(){
 const svg=hs.querySelector('.side-arc'),b=hs.getBoundingClientRect();
 const c=stepRows.map(li=>{const r=rowRect(li.querySelector('.step-node'));return {x:r.left+r.width/2-b.left,y:r.top+r.height/2-b.top,h:r.height};});
 const f=y=>c.reduce((sum,p,i)=>sum+c.reduce((w,q,j)=>j===i?w:w*(y-q.y)/(p.y-q.y),p.x),0);
 const y0=c[0].y-c[0].h/2-34,y1=c[2].y+c[2].h/2+34,pts=[];
 for(let k=0;k<=48;k++){const y=y0+(y1-y0)*k/48;pts.push([f(y),y]);}
 const x0=Math.min(...pts.map(p=>p[0]))-2,w=Math.max(...pts.map(p=>p[0]))+2-x0,h=y1-y0;
 svg.setAttribute('viewBox',`0 0 ${w.toFixed(1)} ${h.toFixed(1)}`);svg.style.cssText=`left:${x0}px;top:${y0}px;width:${w}px;height:${h}px`;
 svg.querySelector('path').setAttribute('d','M'+pts.map(([x,y])=>(x-x0).toFixed(1)+' '+(y-y0).toFixed(1)).join('L'));
}
// The coupon's dashed cut-out line, notches included, drawn to size in the card's border box (the box of ::before and of the SVG).
function drawFrame(){
 const ny=card.querySelector('.cta-cut').offsetTop+1;card.style.setProperty('--ny',ny+'px');
 const r=21,n=13,a=1,b=card.offsetWidth-1,c=card.offsetHeight-1;
 card.querySelector('.cta-deco path').setAttribute('d',`M${a+r} ${a}H${b-r}A${r} ${r} 0 0 1 ${b} ${a+r}V${ny-n}A${n} ${n} 0 0 0 ${b} ${ny+n}V${c-r}A${r} ${r} 0 0 1 ${b-r} ${c}H${a+r}A${r} ${r} 0 0 1 ${a} ${c-r}V${ny+n}A${n} ${n} 0 0 0 ${a} ${ny-n}V${a+r}A${r} ${r} 0 0 1 ${a+r} ${a}Z`);
}
document.querySelectorAll('a[data-platform]').forEach(a=>a.addEventListener('click',event=>{
 if(a.dataset.platform==='telegram'){
  clearTimeout(helpTimer);help.hidden=true;attemptedAt=Date.now();
  helpTimer=setTimeout(()=>{if(document.visibilityState==='visible')help.hidden=false;},1800);
 }
}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){help.hidden=true;clearTimeout(helpTimer);}else if(attemptedAt&&Date.now()-attemptedAt>1800&&Date.now()-attemptedAt<30000){help.hidden=false;}});
document.getElementById('close-help').addEventListener('click',()=>{help.hidden=true;attemptedAt=0;clearTimeout(helpTimer);});
document.getElementById('copy-handle').addEventListener('click',async()=>{
 const status=document.getElementById('copy-status');
 try{await navigator.clipboard.writeText('@AstroLunaai_bot');status.textContent='Скопировано';}catch{status.textContent='Выдели и скопируй: @AstroLunaai_bot';}
});
function updateSticky(){
 // Hidden while the open «Продолжить в:» row is on screen, so the same three buttons never show twice.
 const row=finalRow.getBoundingClientRect(),rowShown=!finalRow.hidden&&row.top<innerHeight&&row.bottom>0;
 const shouldShow=innerWidth<900&&primary.getBoundingClientRect().bottom<0&&!rowShown;
 sticky.hidden=!shouldShow;
}
addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(updateSticky);},{passive:true});
addEventListener('resize',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(fitHero);},{passive:true});
const observer=new IntersectionObserver(updateSticky);observer.observe(primary);observer.observe(finalRow);
document.querySelectorAll('[data-placeholder]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();document.getElementById('legal-status').textContent='Скоро здесь';}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){help.hidden=true;attemptedAt=0;clearTimeout(helpTimer);}});
// Endless animations (stars, orbit, wheel) run only while their block is on screen.
// The orbit light around the portrait also stops while the first screen is away or the tab is hidden.
const light=document.querySelector('.lp-back');let heroLive=true;
const syncLight=()=>{(!document.hidden&&heroLive&&!reduceMotion.matches)?light.unpauseAnimations():light.pauseAnimations();syncGift();syncPearls();};
document.addEventListener('visibilitychange',()=>{root.classList.toggle('tab-hidden',document.hidden);syncLight();});
const loops=new IntersectionObserver(entries=>entries.forEach(entry=>{
 entry.target.classList.toggle('is-live',entry.isIntersecting);
 if(entry.target.classList.contains('hero-wrap')){heroLive=entry.isIntersecting;syncLight();}
}));
document.querySelectorAll('[data-loop]').forEach(el=>loops.observe(el));
// The sample conversation plays once when 40% of the window is visible; without motion it is shown whole.
const talk=document.querySelector('.mc-talk');
if(!reduceMotion.matches){
 const steps=[...talk.querySelectorAll('.mc-step')],dots=talk.querySelector('.mc-dots'),typed=talk.querySelector('.mc-typed'),full=typed.textContent;
 const wait=ms=>new Promise(done=>setTimeout(done,ms));
 talk.classList.add('armed');typed.textContent='';
 const play=new IntersectionObserver(async([entry])=>{
  if(!entry.isIntersecting)return;
  play.disconnect();steps[0].classList.add('on');
  for(let i=1;i<=full.length;i++){typed.textContent=full.slice(0,i);await wait(45);}
  for(const step of steps.slice(1)){
   await wait(250);dots.style.transform=`translateY(${step.offsetTop}px)`;dots.classList.add('on');
   await wait(step.classList.contains('mc-card')?900:650);dots.classList.remove('on');step.classList.add('on');
  }
 },{threshold:.4});
 play.observe(talk);
}
// A fake input is a button: it opens the row of messengers under it.
document.querySelectorAll('.mc-input').forEach(button=>button.addEventListener('click',()=>{
 const row=document.getElementById(button.getAttribute('aria-controls'));
 row.hidden=false;button.setAttribute('aria-expanded','true');updateSticky();
 row.scrollIntoView({block:'nearest',behavior:reduceMotion.matches?'auto':'smooth'});
}));
// A real count appears only when the owner sets CONFIG.chartsCount; no invented numbers by default.
if(typeof CONFIG.chartsCount==='number'&&CONFIG.chartsCount>0){
 const count=document.getElementById('tv-count');
 count.textContent='Уже '+CONFIG.chartsCount.toLocaleString('ru-RU')+'+ человек построили карту с Луной';count.hidden=false;
}
// Luna's ticks light up top to bottom, once, when the table is 15% visible.
const trust=document.getElementById('trust');
trust.querySelectorAll('.tv2-row .luna.yes').forEach((el,i)=>el.style.setProperty('--i',i));
if(!reduceMotion.matches){
 trust.classList.add('armed');
 const seen=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;seen.disconnect();trust.classList.add('shown');},{threshold:.15});
 seen.observe(trust.querySelector('.tv2-table'));
}
render();syncLight();document.fonts.ready.then(fitHero);
// Reserved integration point for analytics, enabled only in a later task.
export {CONFIG};
