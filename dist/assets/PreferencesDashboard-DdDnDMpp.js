import{c as P,r as x,o as Y,p as Z,j as t,q as A,s as z,M as Q,f as V,t as T,F as W,v as B}from"./index-COTP2ueu.js";import{H as G}from"./help-circle-DHQxM7EN.js";import{C as J}from"./copy-DFnABOfl.js";import{E as K}from"./external-link-SpsBWLof.js";const X=P("Languages",[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]]),D=P("Type",[["polyline",{points:"4 7 4 4 20 4 20 7",key:"1nosan"}],["line",{x1:"9",x2:"15",y1:"20",y2:"20",key:"swin9y"}],["line",{x1:"12",x2:"12",y1:"4",y2:"20",key:"1tx1rr"}]]);let ee={data:""},te=e=>{if(typeof window=="object"){let s=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return s.nonce=window.__nonce__,s.parentNode||(e||document.head).appendChild(s),s.firstChild}return e||ee},se=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,ae=/\/\*[^]*?\*\/|  +/g,F=/\n+/g,u=(e,s)=>{let a="",r="",o="";for(let i in e){let l=e[i];i[0]=="@"?i[1]=="i"?a=i+" "+l+";":r+=i[1]=="f"?u(l,i):i+"{"+u(l,i[1]=="k"?"":s)+"}":typeof l=="object"?r+=u(l,s?s.replace(/([^,])+/g,d=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,n=>/&/.test(n)?n.replace(/&/g,d):d?d+" "+n:n)):i):l!=null&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=u.p?u.p(i,l):i+":"+l+";")}return a+(s&&o?s+"{"+o+"}":o)+r},b={},R=e=>{if(typeof e=="object"){let s="";for(let a in e)s+=a+R(e[a]);return s}return e},re=(e,s,a,r,o)=>{let i=R(e),l=b[i]||(b[i]=(n=>{let m=0,p=11;for(;m<n.length;)p=101*p+n.charCodeAt(m++)>>>0;return"go"+p})(i));if(!b[l]){let n=i!==e?e:(m=>{let p,g,h=[{}];for(;p=se.exec(m.replace(ae,""));)p[4]?h.shift():p[3]?(g=p[3].replace(F," ").trim(),h.unshift(h[0][g]=h[0][g]||{})):h[0][p[1]]=p[2].replace(F," ").trim();return h[0]})(e);b[l]=u(o?{["@keyframes "+l]:n}:n,a?"":"."+l)}let d=a&&b.g?b.g:null;return a&&(b.g=b[l]),((n,m,p,g)=>{g?m.data=m.data.replace(g,n):m.data.indexOf(n)===-1&&(m.data=p?n+m.data:m.data+n)})(b[l],s,r,d),l},le=(e,s,a)=>e.reduce((r,o,i)=>{let l=s[i];if(l&&l.call){let d=l(a),n=d&&d.props&&d.props.className||/^go/.test(d)&&d;l=n?"."+n:d&&typeof d=="object"?d.props?"":u(d,""):d===!1?"":d}return r+o+(l??"")},"");function k(e){let s=this||{},a=e.call?e(s.p):e;return re(a.unshift?a.raw?le(a,[].slice.call(arguments,1),s.p):a.reduce((r,o)=>Object.assign(r,o&&o.call?o(s.p):o),{}):a,te(s.target),s.g,s.o,s.k)}let I,C,$;k.bind({g:1});let f=k.bind({k:1});function ie(e,s,a,r){u.p=s,I=e,C=a,$=r}function v(e,s){let a=this||{};return function(){let r=arguments;function o(i,l){let d=Object.assign({},i),n=d.className||o.className;a.p=Object.assign({theme:C&&C()},d),a.o=/ *go\d+/.test(n),d.className=k.apply(a,r)+(n?" "+n:"");let m=e;return e[0]&&(m=d.as||e,delete d.as),$&&m[0]&&$(d),I(m,d)}return o}}var oe=e=>typeof e=="function",E=(e,s)=>oe(e)?e(s):e,de=(()=>{let e=0;return()=>(++e).toString()})(),ne=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let s=matchMedia("(prefers-reduced-motion: reduce)");e=!s||s.matches}return e}})(),ce=20,O="default",_=(e,s)=>{let{toastLimit:a}=e.settings;switch(s.type){case 0:return{...e,toasts:[s.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(l=>l.id===s.toast.id?{...l,...s.toast}:l)};case 2:let{toast:r}=s;return _(e,{type:e.toasts.find(l=>l.id===r.id)?1:0,toast:r});case 3:let{toastId:o}=s;return{...e,toasts:e.toasts.map(l=>l.id===o||o===void 0?{...l,dismissed:!0,visible:!1}:l)};case 4:return s.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(l=>l.id!==s.toastId)};case 5:return{...e,pausedAt:s.time};case 6:let i=s.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(l=>({...l,pauseDuration:l.pauseDuration+i}))}}},me=[],xe={toasts:[],pausedAt:void 0,settings:{toastLimit:ce}},y={},H=(e,s=O)=>{y[s]=_(y[s]||xe,e),me.forEach(([a,r])=>{a===s&&r(y[s])})},U=e=>Object.keys(y).forEach(s=>H(e,s)),pe=e=>Object.keys(y).find(s=>y[s].toasts.some(a=>a.id===e)),S=(e=O)=>s=>{H(s,e)},he=(e,s="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:s,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||de()}),j=e=>(s,a)=>{let r=he(s,e,a);return S(r.toasterId||pe(r.id))({type:2,toast:r}),r.id},c=(e,s)=>j("blank")(e,s);c.error=j("error");c.success=j("success");c.loading=j("loading");c.custom=j("custom");c.dismiss=(e,s)=>{let a={type:3,toastId:e};s?S(s)(a):U(a)};c.dismissAll=e=>c.dismiss(void 0,e);c.remove=(e,s)=>{let a={type:4,toastId:e};s?S(s)(a):U(a)};c.removeAll=e=>c.remove(void 0,e);c.promise=(e,s,a)=>{let r=c.loading(s.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(o=>{let i=s.success?E(s.success,o):void 0;return i?c.success(i,{id:r,...a,...a==null?void 0:a.success}):c.dismiss(r),o}).catch(o=>{let i=s.error?E(s.error,o):void 0;i?c.error(i,{id:r,...a,...a==null?void 0:a.error}):c.dismiss(r)}),e};var be=f`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,fe=f`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ge=f`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ue=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${be} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${fe} 0.15s ease-out forwards;
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
    animation: ${ge} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ve=f`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ye=v("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ve} 1s linear infinite;
`,je=f`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ke=f`
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
}`,we=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${je} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ke} 0.2s ease-out forwards;
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
`,Ne=v("div")`
  position: absolute;
`,Ce=v("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,$e=f`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Ee=v("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${$e} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Se=({toast:e})=>{let{icon:s,type:a,iconTheme:r}=e;return s!==void 0?typeof s=="string"?x.createElement(Ee,null,s):s:a==="blank"?null:x.createElement(Ce,null,x.createElement(ye,{...r}),a!=="loading"&&x.createElement(Ne,null,a==="error"?x.createElement(ue,{...r}):x.createElement(we,{...r})))},Le=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ae=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,ze="0%{opacity:0;} 100%{opacity:1;}",Te="0%{opacity:1;} 100%{opacity:0;}",Fe=v("div")`
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
`,Me=v("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Pe=(e,s)=>{let a=e.includes("top")?1:-1,[r,o]=ne()?[ze,Te]:[Le(a),Ae(a)];return{animation:s?`${f(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${f(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};x.memo(({toast:e,position:s,style:a,children:r})=>{let o=e.height?Pe(e.position||s||"top-center",e.visible):{opacity:0},i=x.createElement(Se,{toast:e}),l=x.createElement(Me,{...e.ariaProps},E(e.message,e));return x.createElement(Fe,{className:e.className,style:{...o,...a,...e.style}},typeof r=="function"?r({icon:i,message:l}):x.createElement(x.Fragment,null,i,l))});ie(x.createElement);k`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;function He({userData:e}){var h,L;const{fontSize:s,setFontSize:a}=Y(),{theme:r,setTheme:o}=Z(),[i,l]=x.useState(!1),d=(e==null?void 0:e.name)||(e==null?void 0:e.username)||((L=(h=e==null?void 0:e.contact)==null?void 0:h.split("@"))==null?void 0:L[0])||"RevelaCode User",n=(e==null?void 0:e.contact)||"",m=e!=null&&e.created_at?new Date(e.created_at).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"}):"—",p=x.useMemo(()=>`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d)}`,[d]),g=async()=>{const q="support@revelacode.com";try{await navigator.clipboard.writeText(q),l(!0),c.success("Support email copied"),window.setTimeout(()=>{l(!1)},1800)}catch{c.error("Unable to copy email")}};return t.jsxs("div",{className:"w-full",children:[t.jsxs("div",{className:"mb-6",children:[t.jsxs("div",{className:"mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:bg-slate-900",children:[t.jsx(A,{className:"h-3 w-3"}),"Preferences"]}),t.jsx("h2",{className:"text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl",children:"Preferences & Experience"}),t.jsx("p",{className:"mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400",children:"Customize how RevelaCode looks, reads, and feels across your devices."})]}),t.jsxs("div",{className:"space-y-5",children:[t.jsx("section",{className:"overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",children:t.jsxs("div",{className:"flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",children:[t.jsxs("div",{className:"flex min-w-0 items-center gap-4",children:[t.jsx("img",{src:p,alt:"",className:"h-14 w-14 flex-shrink-0 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"}),t.jsxs("div",{className:"min-w-0",children:[t.jsx("p",{className:"text-lg font-bold text-slate-900 dark:text-white",children:d}),n&&t.jsx("p",{className:"mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400",children:n}),t.jsxs("p",{className:"mt-1 text-xs text-slate-400",children:["Member since ",m]})]})]}),t.jsxs("div",{className:"inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400",children:[t.jsx("span",{className:"h-1.5 w-1.5 rounded-full bg-emerald-500"}),"Preferences synced"]})]})}),t.jsxs("section",{className:"overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",children:[t.jsx("div",{className:"border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6",children:t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800",children:t.jsx(z,{className:"h-5 w-5 text-slate-500 dark:text-slate-300"})}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white",children:"Appearance"}),t.jsx("p",{className:"mt-0.5 text-xs text-slate-400",children:"Control how RevelaCode looks on your device."})]})]})}),t.jsxs("div",{className:"divide-y divide-slate-200 dark:divide-slate-800",children:[t.jsxs("div",{className:"p-5 sm:p-6",children:[t.jsxs("div",{className:"mb-4",children:[t.jsx("p",{className:"text-sm font-semibold text-slate-800 dark:text-slate-200",children:"Theme"}),t.jsx("p",{className:"mt-1 text-xs leading-5 text-slate-400",children:"Choose a visual mode for the interface."})]}),t.jsxs("div",{className:"grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3",children:[t.jsx(w,{icon:z,label:"Light",active:r==="light",onClick:()=>o("light")}),t.jsx(w,{icon:Q,label:"Dark",active:r==="dark",onClick:()=>o("dark")}),t.jsx(w,{icon:A,label:"System",active:r==="system",onClick:()=>o("system")})]})]}),t.jsxs("div",{className:"p-5 sm:p-6",children:[t.jsxs("div",{className:"mb-4",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(D,{className:"h-4 w-4 text-slate-400"}),t.jsx("p",{className:"text-sm font-semibold text-slate-800 dark:text-slate-200",children:"Reading size"})]}),t.jsx("p",{className:"mt-1 text-xs leading-5 text-slate-400",children:"Adjust text size across compatible screens."})]}),t.jsxs("div",{className:"grid grid-cols-3 gap-2 sm:max-w-xl",children:[t.jsx(N,{value:"sm",label:"Small",preview:"Aa",active:s==="sm",onClick:()=>a("sm")}),t.jsx(N,{value:"md",label:"Medium",preview:"Aa",active:s==="md",onClick:()=>a("md")}),t.jsx(N,{value:"lg",label:"Large",preview:"Aa",active:s==="lg",onClick:()=>a("lg")})]})]})]})]}),t.jsxs("section",{className:"overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",children:[t.jsx("div",{className:"border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6",children:t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30",children:t.jsx(X,{className:"h-5 w-5 text-blue-500"})}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white",children:"Language"}),t.jsx("p",{className:"mt-0.5 text-xs text-slate-400",children:"Set your preferred display language."})]})]})}),t.jsxs("div",{className:"p-5 sm:p-6",children:[t.jsx("label",{htmlFor:"language",className:"mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400",children:"Interface language"}),t.jsxs("div",{className:"relative max-w-xl",children:[t.jsxs("select",{id:"language",defaultValue:"English",className:"w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500",children:[t.jsx("option",{children:"English"}),t.jsx("option",{children:"Swahili"}),t.jsx("option",{children:"French"})]}),t.jsx(V,{className:"pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400"})]}),t.jsx("p",{className:"mt-2 text-[11px] text-slate-400",children:"More languages can be added as localization support expands."})]})]}),t.jsxs("section",{className:"overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",children:[t.jsx("div",{className:"border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6",children:t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30",children:t.jsx(T,{className:"h-5 w-5 text-amber-500"})}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white",children:"Legal & Support"}),t.jsx("p",{className:"mt-0.5 text-xs text-slate-400",children:"Policies, documentation, and help resources."})]})]})}),t.jsxs("div",{className:"p-5 sm:p-6",children:[t.jsxs("div",{className:"grid gap-3 sm:grid-cols-2",children:[t.jsx(M,{href:"/privacy-policy",icon:T,title:"Privacy Policy",description:"How your information is handled"}),t.jsx(M,{href:"/terms-of-service",icon:W,title:"Terms of Service",description:"Rules governing platform use"})]}),t.jsx("div",{className:"mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40",children:t.jsxs("div",{className:"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",children:[t.jsxs("div",{className:"flex items-start gap-3",children:[t.jsx("div",{className:"flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900",children:t.jsx(G,{className:"h-4 w-4 text-slate-500"})}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm font-semibold text-slate-800 dark:text-slate-200",children:"Need help?"}),t.jsx("p",{className:"mt-0.5 text-xs text-slate-400",children:"Contact RevelaCode support."}),t.jsx("p",{className:"mt-1 text-xs font-medium text-slate-600 dark:text-slate-300",children:"support@revelacode.com"})]})]}),t.jsxs("button",{type:"button",onClick:g,className:"inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",children:[i?t.jsx(B,{className:"h-3.5 w-3.5 text-emerald-500"}):t.jsx(J,{className:"h-3.5 w-3.5"}),i?"Copied":"Copy email"]})]})})]})]}),t.jsxs("div",{className:"flex items-center justify-between gap-4 px-1 pb-4",children:[t.jsx("p",{className:"text-[11px] leading-5 text-slate-400",children:"Your preferences are stored locally and applied across compatible RevelaCode interfaces."}),t.jsx("span",{className:"hidden text-[11px] font-medium text-slate-400 sm:block",children:"RevelaCode"})]})]})]})}function w({icon:e,label:s,active:a,onClick:r}){return t.jsxs("button",{type:"button",onClick:r,className:`
        flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition
        ${a?"border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900":"border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"}
      `,children:[t.jsx(e,{className:"h-4 w-4 flex-shrink-0"}),t.jsx("span",{className:"text-xs font-semibold",children:s})]})}function N({label:e,preview:s,active:a,onClick:r}){return t.jsxs("button",{type:"button",onClick:r,className:`
        flex flex-col items-center justify-center gap-1.5 rounded-xl border px-4 py-4 transition
        ${a?"border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900":"border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"}
      `,children:[t.jsx("span",{className:`
          font-serif
          ${e==="Small"?"text-lg":e==="Medium"?"text-xl":"text-2xl"}
        `,children:s}),t.jsx("span",{className:"text-[11px] font-semibold",children:e})]})}function M({href:e,icon:s,title:a,description:r}){return t.jsxs("a",{href:e,className:"group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700",children:[t.jsx("div",{className:"flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800",children:t.jsx(s,{className:"h-4 w-4 text-slate-500 dark:text-slate-400"})}),t.jsxs("div",{className:"min-w-0 flex-1",children:[t.jsx("p",{className:"text-sm font-semibold text-slate-800 dark:text-slate-200",children:a}),t.jsx("p",{className:"mt-0.5 text-[11px] leading-5 text-slate-400",children:r})]}),t.jsx(K,{className:"h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300"})]})}export{He as default};
