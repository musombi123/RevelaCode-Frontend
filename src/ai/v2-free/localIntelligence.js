// RevelaAI v2.0 FREE - Zero Cost - No Paid API
// Local pixel math only. No fetch(), API keys, telemetry, or remote model calls.
export function analyzePixels(imageData) {
  const d=imageData.data,w=imageData.width,h=imageData.height;
  if(!d||!w||!h) throw new Error("Image pixels unavailable");
  const step=Math.max(1,Math.floor(Math.sqrt(w*h/10000)));
  let r=0,g=0,b=0,l=0,n=0,bright=0,dark=0,edges=0,prev=[];
  const gw=Math.ceil(w/step),gh=Math.ceil(h/step),gray=new Uint8Array(gw*gh);
  for(let y=0,gy=0;y<h;y+=step,gy++) for(let x=0,gx=0;x<w;x+=step,gx++){
    const i=(y*w+x)*4,rr=d[i],gg=d[i+1],bb=d[i+2],lum=.299*rr+.587*gg+.114*bb;
    r+=rr;g+=gg;b+=bb;l+=lum;n++;if(lum>220)bright++;if(lum<35)dark++;gray[gy*gw+gx]=lum;
  }
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const i=y*gw+x;edges+=Math.abs(gray[i+1]-gray[i-1])+Math.abs(gray[i+gw]-gray[i-gw]);}
  const avg=v=>Math.round(v/n),brightness=avg(l),edge=Math.round(edges/Math.max(1,(gw-2)*(gh-2)));
  const rgb={red:avg(r),green:avg(g),blue:avg(b)},dominant=Object.keys(rgb).sort((a,b)=>rgb[b]-rgb[a])[0];
  const light=brightness<65?"very dark":brightness>190?"bright":"moderately lit";
  const detail=edge>90?"high":edge<24?"low":"moderate";
  return {width:w,height:h,sampledPixels:n,averageBrightness:brightness,averageRGB:rgb,dominantChannel:dominant,brightPercent:Math.round(bright/n*100),darkPercent:Math.round(dark/n*100),edgeActivity:edge,summary:"Image "+w+"x"+h+". Average luminance "+brightness+"/255; average RGB "+rgb.red+","+rgb.green+","+rgb.blue+". "+light+" with "+detail+" edge activity. Pixel statistics only: no object recognition or OCR."};
}
export async function analyzeImageFile(file){
 if(!file||!file.type.startsWith("image/"))throw new Error("Choose an image file.");
 const bitmap=await createImageBitmap(file);
 try{const scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(bitmap.width*scale));c.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(bitmap,0,0,c.width,c.height);return Object.assign({fileName:file.name},analyzePixels(ctx.getImageData(0,0,c.width,c.height)));}finally{bitmap.close&&bitmap.close();}
}
export async function analyzeVideoFile(file,onProgress){
 if(!file||!file.type.startsWith("video/"))throw new Error("Choose a video.");
 const url=URL.createObjectURL(file),v=document.createElement("video");v.muted=true;v.playsInline=true;v.preload="metadata";v.src=url;
 try{
  await new Promise((ok,no)=>{v.onloadedmetadata=ok;v.onerror=()=>no(new Error("Browser cannot decode this video."));});
  if(!v.duration||!v.videoWidth)throw new Error("Video metadata unavailable.");
  const c=document.createElement("canvas"),scale=Math.min(1,512/Math.max(v.videoWidth,v.videoHeight));c.width=Math.round(v.videoWidth*scale);c.height=Math.round(v.videoHeight*scale);const ctx=c.getContext("2d",{willReadFrequently:true}),count=Math.min(8,Math.max(2,Math.ceil(v.duration/2))),frames=[];let previous=null,totalMotion=0;
  for(let i=0;i<count;i++){
   const t=v.duration*i/(count-1);v.currentTime=t;await new Promise((ok,no)=>{const timer=setTimeout(()=>no(new Error("Video frame decode timed out.")),8000);v.onseeked=()=>{clearTimeout(timer);ok();};});
   ctx.drawImage(v,0,0,c.width,c.height);const p=ctx.getImageData(0,0,c.width,c.height),math=analyzePixels(p);let motion=null;
   if(previous){let diff=0,n=0,step=Math.max(4,Math.floor(p.data.length/5000/4)*4);for(let j=0;j<p.data.length;j+=step){diff+=Math.abs(p.data[j]-previous.data[j])+Math.abs(p.data[j+1]-previous.data[j+1])+Math.abs(p.data[j+2]-previous.data[j+2]);n++;}motion=Math.round(diff/Math.max(1,n*3));totalMotion+=motion;}
   frames.push({time:+t.toFixed(1),brightness:math.averageBrightness,edgeActivity:math.edgeActivity,motionDifference:motion});previous=p;onProgress&&onProgress(i+1,count);
  }
  return {duration:+v.duration.toFixed(1),frames,averageMotion:Math.round(totalMotion/Math.max(1,count-1)),summary:"Sampled "+count+" frames over "+v.duration.toFixed(1)+" seconds. Average frame pixel difference "+Math.round(totalMotion/Math.max(1,count-1))+"/255. This detects visual change only, not scenes, objects, emotions or speech."};
 }finally{v.pause();v.removeAttribute("src");v.load();URL.revokeObjectURL(url);}
}
export function summarizeText(text,name){
 const raw=String(text||"").slice(0,100000),words=raw.match(/[A-Za-z0-9'-]+/g)||[],lines=raw.split(/\r?\n/).filter(Boolean),freq={};
 words.forEach(x=>{const w=x.toLowerCase();if(w.length>3)freq[w]=(freq[w]||0)+1;});
 const terms=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8);
 return {name:name||"text",words:words.length,lines:lines.length,characters:raw.length,keyTerms:terms,excerpt:raw.slice(0,1000),summary:"Local text statistics: "+words.length+" words, "+lines.length+" non-empty lines. Frequent terms: "+terms.map(x=>x[0]+" ("+x[1]+")").join(", ")};
}
export async function readLocalDocument(file){
 if(!file)throw new Error("Choose a document.");
 if(file.size>10*1024*1024)throw new Error("Maximum document size is 10 MB.");
 if(!/\.(txt|md|csv|json|html|xml|log)$/i.test(file.name))throw new Error("Offline build supports TXT, MD, CSV, JSON, HTML, XML and LOG. PDF/Word/Excel/OCR require parser assets bundled locally; no remote service will be called.");
 return summarizeText(await file.text(),file.name);
}
export function localMode(mode,input){
 const rules={
 "Negotiator":"NEGOTIATION: Set target price, walk-away point and best alternative. Separate must-haves from tradable terms. Use evidence to justify your opening offer. Trade concessions conditionally and put scope, dates, payment and remedies in writing.",
 "Faith & debate":"FAITH & DEBATE: Define the claim; read the whole passage and historical context; compare parallel passages; separate text from interpretation; state the strongest counterargument fairly. Keyword matching alone is not scriptural proof.",
 "Prophecy research":"PROPHECY RESEARCH: Separate biblical text, historical facts and contemporary interpretation. Keyword similarity cannot establish prophetic fulfillment. Verify current events and record alternative interpretations.",
 "Business strategist":"BUSINESS STRATEGY: Track revenue, variable costs, fixed costs, margin, cash conversion and retention. Find the largest measurable bottleneck. Paste CSV with revenue in column one and cost in column two for arithmetic.",
 "Teacher":"TEACHER: Explain the core idea, mechanism, worked example, common misconception and a short comprehension question. Add your topic and learner level.",
 "Creator":"CREATOR: Define audience, objective, key message, tone and call to action. Draft clearly, then check originality and accuracy. This offline engine creates text templates, not generative AI images."
 };
 let result=rules[mode]||"Local assistant: define the goal, evidence, constraints and next action.";
 if(mode==="Business strategist"&&input){const rows=input.split(/\r?\n/).map(x=>x.split(",").map(Number)).filter(x=>x.length>=2&&x.every(Number.isFinite));if(rows.length){const revenue=rows.reduce((s,x)=>s+x[0],0),cost=rows.reduce((s,x)=>s+x[1],0),profit=revenue-cost;result+="\n\nLOCAL CALCULATION ("+rows.length+" rows): revenue "+revenue.toFixed(2)+", costs "+cost.toFixed(2)+", profit "+profit.toFixed(2)+", margin "+(revenue?(profit/revenue*100).toFixed(2):"n/a")+"%. Confirm CSV column order.";}}
 return result+(input?"\n\nContext: "+input.slice(0,800):"");
}
export function assessEmotion(text){
 const t=String(text||"").toLowerCase(),sets={distressed:["hopeless","overwhelmed","lonely","scared","can't cope"],angry:["angry","furious","hate","unfair","frustrated"],joyful:["happy","excited","grateful","amazing"],uncertain:["confused","not sure","worried","stuck"]};
 let best="neutral",score=0;Object.entries(sets).forEach(([k,words])=>{const n=words.filter(w=>t.includes(w)).length;if(n>score){best=k;score=n;}});
 const openings={distressed:"That sounds heavy. Let's take it one step at a time.",angry:"I hear the frustration. Let's separate facts, impact and next move.",joyful:"That's good to hear! Let's build on that momentum.",uncertain:"It's okay not to have the full picture yet. Let's break it down.",neutral:"Let's work through this clearly and practically."};
 return {emotion:best,opening:openings[best]};
}
const KEY="revelaai.free.memory.v2";
export function saveMemory(text){const m=loadMemory();m.notes.push({text:String(text).slice(0,2000),at:Date.now()});m.notes=m.notes.slice(-100);localStorage.setItem(KEY,JSON.stringify(m));return m;}
export function loadMemory(){try{return JSON.parse(localStorage.getItem(KEY)||'{"notes":[]}');}catch{return {notes:[]};}}
export function searchMemory(query){const words=String(query).toLowerCase().split(/\W+/).filter(x=>x.length>2);return loadMemory().notes.map(n=>Object.assign({},n,{score:words.filter(w=>n.text.toLowerCase().includes(w)).length})).filter(n=>n.score>0).sort((a,b)=>b.score-a.score).slice(0,5);}
export function typewriter(text,onUpdate,delay=12){let i=0,cancelled=false,timer;const tick=()=>{if(cancelled)return;i=Math.min(text.length,i+3);onUpdate(text.slice(0,i));if(i<text.length)timer=setTimeout(tick,delay);};tick();return()=>{cancelled=true;clearTimeout(timer);};}
console.log("RevelaAI v2.0 FREE - Zero Cost - No Paid API");