/* Sample-call player: two recorded demo calls with a seekable waveform and a synced transcript. */
(function(){
var root=document.getElementById('voice-samples');
if(!root)return;

// Loudness per slice of each recording (0–100), measured from the mp3s so the bars match the audio.
var PEAKS={
  outbound:[99,100,87,0,0,88,53,45,42,65,10,61,55,29,56,51,38,52,47,68,31,55,39,46,51,36,50,71,59,22,46,72,59,63,52,33,48,68,67,58,56,45,46,30,56,42,25,1,54,65,44,64,60,57,43,65,55,42,42,56,51,48,65,27,64,34,67,53,55,47,53,59,43,55,60,29,74,69,39,22,55,33,36,42,46,24,48,58,63,52,46,49,58,60,26,58,57,56,45,32,57,65,58,69,55,25,40,1,66,25,60,54,11,30,51,66,85,70,58,54,57,70,54,40,57,45,14,64,46,42,43,36,24,53,74,57,53,38,53,55,63,32,44,42,54,51,48,50,50,56,52,55,60,47,64,51,59,62,50,0],
  inbound:[100,100,84,0,27,89,49,73,54,70,62,67,50,37,76,53,57,57,70,63,39,60,67,62,70,66,61,26,60,83,78,42,56,36,46,86,62,59,0,0,87,36,70,66,57,46,39,53,18,86,67,79,69,72,80,97,81,74,73,79,37,43,76,50,52,60,88,68,38,69,42,76,65,61,41,98,72,74,19,38,40,61,57,64,6,73,71,30,0,78,79,66,68,66,28,63,59,61,59,43,67,32,79,81,69,52,57,72,51,65,52,42,78,61,40,39,62,65,28,57,73,57,82,56,75,54,57,51,61,82,68,81,48,57,38,39,55,73,76,43,85,84,92,84,67,78,90,60,57,50,59,62,24,63,96,93,82,85,76,0]
};

var tabs=[].slice.call(root.querySelectorAll('[role=tab]'));
var panel=root.querySelector('.vs-panel');
var playBtn=root.querySelector('.vs-play');
var wave=root.querySelector('.vs-wave');
var canvas=wave.querySelector('canvas');
var timeEl=root.querySelector('.vs-time');
var cap=root.querySelector('.vs-cap');
var whoEl=root.querySelector('.vs-who');
var lineEl=root.querySelector('.vs-line');
var footEl=root.querySelector('.vs-foot-text');
var txtLink=root.querySelector('.vs-txt');
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var samples={};
tabs.forEach(function(tab){
  var id=tab.dataset.sample,src=tab.dataset.src;
  var a=new Audio();a.preload='metadata';a.src=src+'.mp3';
  samples[id]={id:id,tab:tab,src:src,audio:a,duration:+tab.dataset.duration,cues:null,title:tab.querySelector('.vs-t').textContent,foot:tab.dataset.foot,idle:tab.dataset.idle};
  a.addEventListener('loadedmetadata',function(){if(isFinite(a.duration))samples[id].duration=a.duration;if(cur&&cur.id===id)update();});
  a.addEventListener('play',function(){if(cur&&cur.id===id){setPlaying(true);loop();}});
  a.addEventListener('pause',function(){if(cur&&cur.id===id)setPlaying(false);});
  a.addEventListener('ended',function(){if(cur&&cur.id===id){setPlaying(false);update();}});
  a.addEventListener('seeked',function(){if(cur&&cur.id===id)update();});
});

var cur=null,raf=0,hoverX=-1,lastCue=-2;

function fmt(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}

function parseVtt(text){
  var cues=[];
  text.replace(/\r/g,'').split(/\n\n+/).forEach(function(block){
    var m=block.match(/(\d+):(\d+):(\d+\.\d+)\s+-->\s+(\d+):(\d+):(\d+\.\d+)\s*\n([\s\S]+)/);
    if(!m)return;
    var body=m[7].trim(),who='',v=body.match(/^<v ([^>]+)>/);
    if(v){who=v[1];body=body.slice(v[0].length);}
    cues.push({start:+m[1]*3600+ +m[2]*60+ +m[3],end:+m[4]*3600+ +m[5]*60+ +m[6],who:who,ai:/\bAI\b/.test(who),words:body.replace(/<[^>]+>/g,'').trim().split(/\s+/)});
  });
  return cues;
}

function loadCues(s){
  if(s.cues||s.loading)return;
  s.loading=true;
  fetch(s.src+'.vtt').then(function(r){if(!r.ok)throw new Error(r.status);return r.text();})
  .then(function(t){s.cues=parseVtt(t);if(cur===s){lastCue=-2;update();}})
  .catch(function(){s.loading=false;});
}

function select(id,play){
  var s=samples[id];
  if(cur&&cur!==s){cur.audio.pause();try{cur.audio.currentTime=0;}catch(e){}}
  cur=s;lastCue=-2;
  tabs.forEach(function(t){var on=t===s.tab;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;});
  panel.setAttribute('aria-labelledby',s.tab.id);
  playBtn.setAttribute('aria-label','Play '+s.title+' sample call');
  wave.setAttribute('aria-label','Seek within '+s.title+' sample call');
  footEl.textContent=s.foot;
  txtLink.href=s.src+'.txt';
  root.classList.toggle('vs-open',false);
  setPlaying(false);
  loadCues(s);
  update();
  if(play)s.audio.play().catch(function(){});
}

function setPlaying(on){
  root.classList.toggle('vs-playing',on);
  if(on)root.classList.add('vs-open');
  playBtn.setAttribute('aria-label',(on?'Pause ':'Play ')+cur.title+' sample call');
  if(!on)cancelAnimationFrame(raf);
}

function loop(){update();if(!cur.audio.paused)raf=requestAnimationFrame(loop);}

function update(){
  var a=cur.audio,d=cur.duration||1,t=a.currentTime||0;
  timeEl.textContent='-'+fmt(d-t);
  wave.setAttribute('aria-valuemax',Math.round(d));
  wave.setAttribute('aria-valuenow',Math.round(t));
  wave.setAttribute('aria-valuetext',fmt(t)+' of '+fmt(d));
  draw(t/d);
  caption(t);
}

function caption(t){
  var cues=cur.cues;
  if(!cues){whoEl.textContent='';lineEl.textContent='';return;}
  var i=-1;
  for(var k=0;k<cues.length;k++){if(cues[k].start<=t)i=k;else break;}
  if(i<0){
    if(lastCue!==-1){lastCue=-1;whoEl.textContent='';whoEl.className='vs-who';lineEl.textContent=cur.idle;lineEl.className='vs-line vs-idle';}
    return;
  }
  var c=cues[i];
  if(lastCue!==i){
    lastCue=i;
    whoEl.textContent=c.who.replace(/\s*\((.+)\)$/,' · $1');
    whoEl.className='vs-who '+(c.ai?'vs-ai':'vs-caller');
    lineEl.className='vs-line';lineEl.textContent='';
    c.spans=c.words.map(function(w,n){var sp=document.createElement('span');sp.textContent=(n?' ':'')+w;lineEl.appendChild(sp);return sp;});
  }
  // Light up words in proportion to how far through the cue we are.
  var f=reduce?1:Math.min(1,Math.max(0,(t-c.start)/Math.max(.1,c.end-c.start)));
  var lit=Math.ceil(f*c.spans.length);
  c.spans.forEach(function(sp,n){sp.classList.toggle('on',n<lit);});
}

function css(name){return getComputedStyle(root).getPropertyValue(name).trim();}

function draw(frac){
  var w=canvas.clientWidth,h=canvas.clientHeight,dpr=window.devicePixelRatio||1;
  if(!w)return;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  var ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var peaks=PEAKS[cur.id],bw=3,gap=2,n=Math.max(8,Math.floor((w+gap)/(bw+gap)));
  var started=root.classList.contains('vs-open')||frac>0;
  var cOn=css('--vs-on'),cOff=css('--vs-off'),cHover=css('--vs-hover');
  for(var i=0;i<n;i++){
    var p=peaks[Math.min(peaks.length-1,Math.floor(i/n*peaks.length))]/100;
    var bh=started?Math.max(3,p*h*.92):3;
    var x=i*(bw+gap),pos=(i+.5)/n;
    ctx.fillStyle=pos<=frac?cOn:(hoverX>=0&&pos<=hoverX?cHover:cOff);
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x,(h-bh)/2,bw,bh,1.5);else ctx.rect(x,(h-bh)/2,bw,bh);
    ctx.fill();
  }
}

function seekTo(frac){
  var a=cur.audio,d=cur.duration;if(!d)return;
  a.currentTime=Math.min(d,Math.max(0,frac*d));
  root.classList.add('vs-open');
  update();
}

function fracAt(e){var r=wave.getBoundingClientRect();return Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));}

playBtn.addEventListener('click',function(){
  var a=cur.audio;
  if(a.paused){
    Object.keys(samples).forEach(function(k){if(samples[k]!==cur)samples[k].audio.pause();});
    a.play().catch(function(){});
  }else a.pause();
});

var dragging=false;
wave.addEventListener('pointerdown',function(e){dragging=true;try{wave.setPointerCapture(e.pointerId);}catch(x){}seekTo(fracAt(e));});
wave.addEventListener('pointermove',function(e){
  if(dragging){seekTo(fracAt(e));return;}
  if(e.pointerType==='mouse'){hoverX=fracAt(e);update();}
});
wave.addEventListener('pointerup',function(){dragging=false;});
wave.addEventListener('pointercancel',function(){dragging=false;});
wave.addEventListener('pointerleave',function(){hoverX=-1;update();});
wave.addEventListener('keydown',function(e){
  var a=cur.audio,d=cur.duration,step={ArrowRight:5,ArrowUp:5,ArrowLeft:-5,ArrowDown:-5,PageUp:15,PageDown:-15}[e.key];
  if(step!==undefined)seekTo(((a.currentTime||0)+step)/d);
  else if(e.key==='Home')seekTo(0);
  else if(e.key==='End')seekTo(1);
  else if(e.key===' '||e.key==='Enter')playBtn.click();
  else return;
  e.preventDefault();
});

tabs.forEach(function(tab,i){
  tab.addEventListener('click',function(){
    if(cur===samples[tab.dataset.sample]){playBtn.click();return;}
    select(tab.dataset.sample,true);
  });
  tab.addEventListener('keydown',function(e){
    var j={ArrowRight:i+1,ArrowDown:i+1,ArrowLeft:i-1,ArrowUp:i-1,Home:0,End:tabs.length-1}[e.key];
    if(j===undefined)return;
    e.preventDefault();
    var next=tabs[(j+tabs.length)%tabs.length];
    select(next.dataset.sample,false);next.focus();
  });
});

if(window.ResizeObserver)new ResizeObserver(function(){if(cur)update();}).observe(wave);
select(tabs[0].dataset.sample,false);
})();
