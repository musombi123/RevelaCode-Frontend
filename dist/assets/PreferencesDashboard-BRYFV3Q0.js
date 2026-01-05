import{r as p,b as A,c as T,j as s}from"./index-N_5HTTJ0.js";import{C as M,a as P,b as D}from"./Card-CKupIoR5.js";import{c as I}from"./createLucideIcon-Dd8W3lPl.js";import{S as L,F as O,H}from"./UserAccountDashboard-Ccu5mCmj.js";import{C as _}from"./copy-C3QVbe31.js";import"./link-2-BQD70If5.js";import"./bot-BaU5_57z.js";const U=I("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"2",x2:"22",y1:"12",y2:"12",key:"1dnqot"}],["path",{d:"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",key:"nb9nel"}]]);let q={data:""},G=e=>typeof window=="object"?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||q,R=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,W=/\/\*[^]*?\*\/|  +/g,E=/\n+/g,f=(e,t)=>{let a="",o="",i="";for(let r in e){let n=e[r];r[0]=="@"?r[1]=="i"?a=r+" "+n+";":o+=r[1]=="f"?f(n,r):r+"{"+f(n,r[1]=="k"?"":t)+"}":typeof n=="object"?o+=f(n,t?t.replace(/([^,])+/g,l=>r.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,d=>/&/.test(d)?d.replace(/&/g,l):l?l+" "+d:d)):r):n!=null&&(r=/^--/.test(r)?r:r.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=f.p?f.p(r,n):r+":"+n+";")}return a+(t&&i?t+"{"+i+"}":i)+o},x={},S=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+S(e[a]);return t}return e},J=(e,t,a,o,i)=>{let r=S(e),n=x[r]||(x[r]=(d=>{let c=0,g=11;for(;c<d.length;)g=101*g+d.charCodeAt(c++)>>>0;return"go"+g})(r));if(!x[n]){let d=r!==e?e:(c=>{let g,y,b=[{}];for(;g=R.exec(c.replace(W,""));)g[4]?b.shift():g[3]?(y=g[3].replace(E," ").trim(),b.unshift(b[0][y]=b[0][y]||{})):b[0][g[1]]=g[2].replace(E," ").trim();return b[0]})(e);x[n]=f(i?{["@keyframes "+n]:d}:d,a?"":"."+n)}let l=a&&x.g?x.g:null;return a&&(x.g=x[n]),((d,c,g,y)=>{y?c.data=c.data.replace(y,d):c.data.indexOf(d)===-1&&(c.data=g?d+c.data:c.data+d)})(x[n],t,o,l),n},V=(e,t,a)=>e.reduce((o,i,r)=>{let n=t[r];if(n&&n.call){let l=n(a),d=l&&l.props&&l.props.className||/^go/.test(l)&&l;n=d?"."+d:l&&typeof l=="object"?l.props?"":f(l,""):l===!1?"":l}return o+i+(n??"")},"");function w(e){let t=this||{},a=e.call?e(t.p):e;return J(a.unshift?a.raw?V(a,[].slice.call(arguments,1),t.p):a.reduce((o,i)=>Object.assign(o,i&&i.call?i(t.p):i),{}):a,G(t.target),t.g,t.o,t.k)}let z,k,N;w.bind({g:1});let u=w.bind({k:1});function Y(e,t,a,o){f.p=t,z=e,k=a,N=o}function h(e,t){let a=this||{};return function(){let o=arguments;function i(r,n){let l=Object.assign({},r),d=l.className||i.className;a.p=Object.assign({theme:k&&k()},l),a.o=/ *go\d+/.test(d),l.className=w.apply(a,o)+(d?" "+d:"");let c=e;return e[0]&&(c=l.as||e,delete l.as),N&&c[0]&&N(l),z(c,l)}return i}}var Z=e=>typeof e=="function",$=(e,t)=>Z(e)?e(t):e,B=(()=>{let e=0;return()=>(++e).toString()})(),K=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),Q=20,F=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,Q)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:a}=t;return F(e,{type:e.toasts.find(r=>r.id===a.id)?1:0,toast:a});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(r=>r.id===o||o===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+i}))}}},X=[],j={toasts:[],pausedAt:void 0},C=e=>{j=F(j,e),X.forEach(t=>{t(j)})},ee=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||B()}),v=e=>(t,a)=>{let o=ee(t,e,a);return C({type:2,toast:o}),o.id},m=(e,t)=>v("blank")(e,t);m.error=v("error");m.success=v("success");m.loading=v("loading");m.custom=v("custom");m.dismiss=e=>{C({type:3,toastId:e})};m.remove=e=>C({type:4,toastId:e});m.promise=(e,t,a)=>{let o=m.loading(t.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let r=t.success?$(t.success,i):void 0;return r?m.success(r,{id:o,...a,...a==null?void 0:a.success}):m.dismiss(o),i}).catch(i=>{let r=t.error?$(t.error,i):void 0;r?m.error(r,{id:o,...a,...a==null?void 0:a.error}):m.dismiss(o)}),e};var te=u`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ae=u`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,re=u`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,se=h("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${te} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ae} 0.15s ease-out forwards;
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
    animation: ${re} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,oe=u`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ie=h("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${oe} 1s linear infinite;
`,ne=u`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,le=u`
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
}`,de=h("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ne} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${le} 0.2s ease-out forwards;
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
`,ce=h("div")`
  position: absolute;
`,pe=h("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,me=u`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ge=h("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${me} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,xe=({toast:e})=>{let{icon:t,type:a,iconTheme:o}=e;return t!==void 0?typeof t=="string"?p.createElement(ge,null,t):t:a==="blank"?null:p.createElement(pe,null,p.createElement(ie,{...o}),a!=="loading"&&p.createElement(ce,null,a==="error"?p.createElement(se,{...o}):p.createElement(de,{...o})))},ue=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,fe=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,he="0%{opacity:0;} 100%{opacity:1;}",ye="0%{opacity:1;} 100%{opacity:0;}",be=h("div")`
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
`,ve=h("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,we=(e,t)=>{let a=e.includes("top")?1:-1,[o,i]=K()?[he,ye]:[ue(a),fe(a)];return{animation:t?`${u(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${u(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};p.memo(({toast:e,position:t,style:a,children:o})=>{let i=e.height?we(e.position||t||"top-center",e.visible):{opacity:0},r=p.createElement(xe,{toast:e}),n=p.createElement(ve,{...e.ariaProps},$(e.message,e));return p.createElement(be,{className:e.className,style:{...i,...a,...e.style}},typeof o=="function"?o({icon:r,message:n}):p.createElement(p.Fragment,null,r,n))});Y(p.createElement);w`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;function ze(){const{fontSize:e,setFontSize:t}=A(),{theme:a,setTheme:o}=T(),i="William",r=`https://avatars.dicebear.com/api/initials/${i}.svg`;return s.jsxs(M,{className:"shadow-xl rounded-2xl flex flex-col min-h-[75vh] overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",children:[s.jsx(P,{className:"bg-indigo-50 dark:bg-indigo-900/30 border-b border-gray-200 dark:border-gray-700 p-4",children:s.jsxs("div",{className:"flex items-center gap-4",children:[s.jsx("img",{src:r,alt:"User Avatar",className:"w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600"}),s.jsxs("div",{children:[s.jsx("h2",{className:"text-xl font-bold text-indigo-700 dark:text-indigo-300",children:i}),s.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400",children:"RevelaCode member since 2025"})]})]})}),s.jsxs(D,{className:"flex-1 flex flex-col gap-8 p-6",children:[s.jsxs("section",{children:[s.jsx("h3",{className:"text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300",children:"🔠 Font Size"}),s.jsxs("select",{value:e,onChange:n=>t(n.target.value),className:"w-full border rounded p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition",children:[s.jsx("option",{value:"sm",children:"Small"}),s.jsx("option",{value:"md",children:"Medium"}),s.jsx("option",{value:"lg",children:"Large"})]})]}),s.jsxs("section",{children:[s.jsxs("h3",{className:"text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2",children:[s.jsx(U,{className:"w-4 h-4"})," Language"]}),s.jsxs("select",{className:"w-full border rounded p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white",children:[s.jsx("option",{children:"English"}),s.jsx("option",{children:"Swahili"}),s.jsx("option",{children:"French"})]})]}),s.jsxs("section",{children:[s.jsx("h3",{className:"text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300",children:"🎨 Theme"}),s.jsx("button",{onClick:()=>o(a==="dark"?"light":"dark"),className:"w-full py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition",children:a==="dark"?"☀ Switch to Light Mode":"🌙 Switch to Dark Mode"})]}),s.jsxs("section",{className:"flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700 pt-4",children:[s.jsxs("div",{className:"flex gap-2",children:[s.jsxs("a",{href:"/privacy-policy",className:"flex-1 text-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:underline flex items-center justify-center gap-1",children:[s.jsx(L,{className:"w-3 h-3"})," Privacy Policy"]}),s.jsxs("a",{href:"/terms-of-service",className:"flex-1 text-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:underline flex items-center justify-center gap-1",children:[s.jsx(O,{className:"w-3 h-3"})," Terms"]})]}),s.jsxs("div",{className:"flex items-center justify-between p-2 border rounded bg-gray-50 dark:bg-gray-800",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(H,{className:"w-4 h-4 text-gray-600 dark:text-gray-400"}),s.jsx("span",{className:"text-xs text-gray-800 dark:text-gray-200",children:"support@revelacode.com"})]}),s.jsxs("button",{onClick:()=>{navigator.clipboard.writeText("support@revelacode.com"),m.success("Copied!")},className:"text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1",children:[s.jsx(_,{className:"w-3 h-3"})," Copy"]})]})]})]})]})}export{ze as default};
