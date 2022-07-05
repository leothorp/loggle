(()=>{"use strict";var e={d:(t,r)=>{for(var a in r)e.o(r,a)&&!e.o(t,a)&&Object.defineProperty(t,a,{enumerable:!0,get:r[a]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{LOG_LEVELS:()=>n,createLogger:()=>u});const r=(e,t)=>{const r=Object.entries(e).map((([e,r])=>t(e,r)));return Object.fromEntries(r)},a=e=>m(e)?e:()=>e,n={critical:0,error:1,warn:2,info:3,debug:4},o={enabled:!0,level:"info",formatLogSegments:e=>e.join(" "),prefix:{includeLevelName:!0,includeTime:!0,getCurrentTimeString:()=>(new Date).toLocaleTimeString("en-US",{hour12:!1}),format:e=>`[${e.join(" ")}]`,colors:{critical:"red",error:"orange",warn:"yellow",info:"skyblue",debug:"lightgreen"}},sink:{endpoint:null,func:({message:{asSegments:e,asString:t},metadata:r})=>{console.log(...e)}},metadata:()=>({clientTimestamp:Date.now()}),replaceParentConfig:!1,replaceParentMetadata:!1,filter:({message:{asSegments:e,asString:t},metadata:r})=>!0},i=e=>!Array.isArray(e)&&"object"==typeof e&&null!==e,s=e=>{return t=Object.keys(e),r=t=>i(e[t])?{[t]:!0,...s(e[t])}:{[t]:!0},t.reduce(((e,t)=>({...e,...r(t)})),{});var t,r},l=s(o),c=e=>i(e)&&Object.keys(e).every((e=>l.hasOwnProperty(e))),m=e=>"function"==typeof e,g=(e,t)=>{if(t.replaceParentConfig)return t;if(t.replaceParentMetadata&&e.metadata)return g({...e,metadata:null},t);const n=[e.metadata,t.metadata];if(n.every((e=>e))){const r=n.map(a);return g({...e,metadata:null},{...t,metadata:r})}return r(e,((r,a)=>c(e[r])&&c(t[r])?[r,g(e[r],t[r])]:[r,t.hasOwnProperty(r)?t[r]:a]))},f=(e,t,r)=>{if(!t.prefix)return[];const a=[t.prefix.includeLevelName&&e,t.prefix.includeTime&&t.prefix.getCurrentTimeString()].filter((e=>e)),n=(r?"%c":"")+t.prefix.format(a),o=r?`color: ${t.prefix.colors[e]};`:"";return o?[n,o]:[n]},d=(e,t,r,a)=>[...f(t,r,a),...e].filter((e=>e)),u=(e=o)=>{const t=g(o,e);return{...r(n,((e,r)=>{return[e,(a=e,o=r,(...e)=>{const r=c(e[0]),i=r?g(t,e[0]):t,s=r?e.slice(1):e;if(!i.enabled||o>("number"==typeof(l=i.level)?l:n[l]))return;var l;const f={...Array.isArray(i.metadata)?i.metadata.reduce(((e,t)=>Object.assign(e,t())),{}):(u=i.metadata,m(u)?u():u),level:a};var u;const p=d(s,a,i,!!i.prefix.colors),y=i.formatLogSegments(p);if(i.filter({message:{asString:y,asSegments:p},metadata:f})&&(i.sink.func&&i.sink.func({message:{asString:y,asSegments:p},metadata:f}),i.sink.endpoint)){const e=d(s,a,i,!1);(async(e="",t={})=>{(await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},keepalive:!0,body:JSON.stringify(t)})).json()})(i.sink.endpoint,{message:{asString:i.formatLogSegments(e),asSegments:e},metadata:f})}})];var a,o})),createSubLogger:e=>u(g(t,e))}}})();