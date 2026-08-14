import{r as m,m as O,n as P,j as i,C as _,f as D,b as I,G as H,o as M}from"./index-CUpezS4a.js";import{F as R,H as G}from"./help-circle-B91v3NzT.js";import{C as U}from"./copy-MeYNn-8l.js";let W={data:""},Z=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||W},q=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,Q=/\/\*[^]*?\*\/|  +/g,E=/\n+/g,f=(e,t)=>{let r="",s="",n="";for(let o in e){let a=e[o];o[0]=="@"?o[1]=="i"?r=o+" "+a+";":s+=o[1]=="f"?f(a,o):o+"{"+f(a,o[1]=="k"?"":t)+"}":typeof a=="object"?s+=f(a,t?t.replace(/([^,])+/g,l=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,d=>/&/.test(d)?d.replace(/&/g,l):l?l+" "+d:d)):o):a!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),n+=f.p?f.p(o,a):o+":"+a+";")}return r+(t&&n?t+"{"+n+"}":n)+s},u={},S=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+S(e[r]);return t}return e},Y=(e,t,r,s,n)=>{let o=S(e),a=u[o]||(u[o]=(d=>{let p=0,g=11;for(;p<d.length;)g=101*g+d.charCodeAt(p++)>>>0;return"go"+g})(o));if(!u[a]){let d=o!==e?e:(p=>{let g,y,b=[{}];for(;g=q.exec(p.replace(Q,""));)g[4]?b.shift():g[3]?(y=g[3].replace(E," ").trim(),b.unshift(b[0][y]=b[0][y]||{})):b[0][g[1]]=g[2].replace(E," ").trim();return b[0]})(e);u[a]=f(n?{["@keyframes "+a]:d}:d,r?"":"."+a)}let l=r&&u.g?u.g:null;return r&&(u.g=u[a]),((d,p,g,y)=>{y?p.data=p.data.replace(y,d):p.data.indexOf(d)===-1&&(p.data=g?d+p.data:p.data+d)})(u[a],t,s,l),a},B=(e,t,r)=>e.reduce((s,n,o)=>{let a=t[o];if(a&&a.call){let l=a(r),d=l&&l.props&&l.props.className||/^go/.test(l)&&l;a=d?"."+d:l&&typeof l=="object"?l.props?"":f(l,""):l===!1?"":l}return s+n+(a??"")},"");function j(e){let t=this||{},r=e.call?e(t.p):e;return Y(r.unshift?r.raw?B(r,[].slice.call(arguments,1),t.p):r.reduce((s,n)=>Object.assign(s,n&&n.call?n(t.p):n),{}):r,Z(t.target),t.g,t.o,t.k)}let z,k,N;j.bind({g:1});let x=j.bind({k:1});function J(e,t,r,s){f.p=t,z=e,k=r,N=s}function h(e,t){let r=this||{};return function(){let s=arguments;function n(o,a){let l=Object.assign({},o),d=l.className||n.className;r.p=Object.assign({theme:k&&k()},l),r.o=/ *go\d+/.test(d),l.className=j.apply(r,s)+(d?" "+d:"");let p=e;return e[0]&&(p=l.as||e,delete l.as),N&&p[0]&&N(l),z(p,l)}return n}}var K=e=>typeof e=="function",$=(e,t)=>K(e)?e(t):e,V=(()=>{let e=0;return()=>(++e).toString()})(),X=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),ee=20,A="default",F=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(a=>a.id===t.toast.id?{...a,...t.toast}:a)};case 2:let{toast:s}=t;return F(e,{type:e.toasts.find(a=>a.id===s.id)?1:0,toast:s});case 3:let{toastId:n}=t;return{...e,toasts:e.toasts.map(a=>a.id===n||n===void 0?{...a,dismissed:!0,visible:!1}:a)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(a=>a.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+o}))}}},te=[],re={toasts:[],pausedAt:void 0,settings:{toastLimit:ee}},v={},T=(e,t=A)=>{v[t]=F(v[t]||re,e),te.forEach(([r,s])=>{r===t&&s(v[t])})},L=e=>Object.keys(v).forEach(t=>T(e,t)),ae=e=>Object.keys(v).find(t=>v[t].toasts.some(r=>r.id===e)),C=(e=A)=>t=>{T(t,e)},se=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||V()}),w=e=>(t,r)=>{let s=se(t,e,r);return C(s.toasterId||ae(s.id))({type:2,toast:s}),s.id},c=(e,t)=>w("blank")(e,t);c.error=w("error");c.success=w("success");c.loading=w("loading");c.custom=w("custom");c.dismiss=(e,t)=>{let r={type:3,toastId:e};t?C(t)(r):L(r)};c.dismissAll=e=>c.dismiss(void 0,e);c.remove=(e,t)=>{let r={type:4,toastId:e};t?C(t)(r):L(r)};c.removeAll=e=>c.remove(void 0,e);c.promise=(e,t,r)=>{let s=c.loading(t.loading,{...r,...r==null?void 0:r.loading});return typeof e=="function"&&(e=e()),e.then(n=>{let o=t.success?$(t.success,n):void 0;return o?c.success(o,{id:s,...r,...r==null?void 0:r.success}):c.dismiss(s),n}).catch(n=>{let o=t.error?$(t.error,n):void 0;o?c.error(o,{id:s,...r,...r==null?void 0:r.error}):c.dismiss(s)}),e};var oe=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ie=x`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ne=x`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,le=h("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${oe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ie} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${ne} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,de=x`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ce=h("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${de} 1s linear infinite;
`,pe=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,me=x`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ge=h("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${pe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${me} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ue=h("div")`
  position: absolute;
`,xe=h("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,fe=x`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,he=h("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${fe} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ye=({toast:e})=>{let{icon:t,type:r,iconTheme:s}=e;return t!==void 0?typeof t=="string"?m.createElement(he,null,t):t:r==="blank"?null:m.createElement(xe,null,m.createElement(ce,{...s}),r!=="loading"&&m.createElement(ue,null,r==="error"?m.createElement(le,{...s}):m.createElement(ge,{...s})))},be=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ve=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,we="0%{opacity:0;} 100%{opacity:1;}",je="0%{opacity:1;} 100%{opacity:0;}",ke=h("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Ne=h("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,$e=(e,t)=>{let r=e.includes("top")?1:-1,[s,n]=X()?[we,je]:[be(r),ve(r)];return{animation:t?`${x(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${x(n)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};m.memo(({toast:e,position:t,style:r,children:s})=>{let n=e.height?$e(e.position||t||"top-center",e.visible):{opacity:0},o=m.createElement(ye,{toast:e}),a=m.createElement(Ne,{...e.ariaProps},$(e.message,e));return m.createElement(ke,{className:e.className,style:{...n,...r,...e.style}},typeof s=="function"?s({icon:o,message:a}):m.createElement(m.Fragment,null,o,a))});J(m.createElement);j`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;function ze(){const{fontSize:e,setFontSize:t}=O(),{theme:r,setTheme:s}=P(),n="William",o=`https://api.dicebear.com/7.x/initials/svg?seed=${n}`;return i.jsxs(_,{className:"shadow-xl rounded-2xl flex flex-col min-h-[75vh] overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",children:[i.jsx(D,{className:"bg-indigo-50 dark:bg-indigo-900/30 border-b border-gray-200 dark:border-gray-700 p-4",children:i.jsxs("div",{className:"flex items-center gap-4",children:[i.jsx("img",{src:o,alt:"User Avatar",className:"w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600"}),i.jsxs("div",{children:[i.jsx("h2",{className:"text-xl font-bold text-indigo-700 dark:text-indigo-300",children:n}),i.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400",children:"RevelaCode member since 2025"})]})]})}),i.jsxs(I,{className:"flex-1 flex flex-col gap-8 p-6",children:[i.jsxs("section",{children:[i.jsx("h3",{className:"text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300",children:"🔠 Font Size"}),i.jsxs("select",{value:e,onChange:a=>t(a.target.value),className:"w-full border rounded p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition",children:[i.jsx("option",{value:"sm",children:"Small"}),i.jsx("option",{value:"md",children:"Medium"}),i.jsx("option",{value:"lg",children:"Large"})]})]}),i.jsxs("section",{children:[i.jsxs("h3",{className:"text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2",children:[i.jsx(H,{className:"w-4 h-4"})," Language"]}),i.jsxs("select",{className:"w-full border rounded p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white",children:[i.jsx("option",{children:"English"}),i.jsx("option",{children:"Swahili"}),i.jsx("option",{children:"French"})]})]}),i.jsxs("section",{children:[i.jsx("h3",{className:"text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300",children:"🎨 Theme"}),i.jsx("button",{onClick:()=>s(r==="dark"?"light":"dark"),className:"w-full py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition",children:r==="dark"?"☀ Switch to Light Mode":"🌙 Switch to Dark Mode"})]}),i.jsxs("section",{className:"flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700 pt-4",children:[i.jsxs("div",{className:"flex gap-2",children:[i.jsxs("a",{href:"/privacy-policy",className:"flex-1 text-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:underline flex items-center justify-center gap-1",children:[i.jsx(M,{className:"w-3 h-3"})," Privacy Policy"]}),i.jsxs("a",{href:"/terms-of-service",className:"flex-1 text-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:underline flex items-center justify-center gap-1",children:[i.jsx(R,{className:"w-3 h-3"})," Terms"]})]}),i.jsxs("div",{className:"flex items-center justify-between p-2 border rounded bg-gray-50 dark:bg-gray-800",children:[i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(G,{className:"w-4 h-4 text-gray-600 dark:text-gray-400"}),i.jsx("span",{className:"text-xs text-gray-800 dark:text-gray-200",children:"support@revelacode.com"})]}),i.jsxs("button",{onClick:()=>{navigator.clipboard.writeText("support@revelacode.com"),c.success("Copied!")},className:"text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1",children:[i.jsx(U,{className:"w-3 h-3"})," Copy"]})]})]})]})]})}export{ze as default};
