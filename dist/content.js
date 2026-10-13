(() => {
  'use strict';
  const schema = window.WN_SCHEMA;
  const fields = new Map(schema.fields.map(f => [f.key, f]));
  const database = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('winningtec-content-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('content');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('브라우저 저장 공간을 사용할 수 없습니다.'));
  });
  async function read() {
    const db = await database();
    try { return await new Promise((resolve,reject) => {const t=db.transaction('content');const r=t.objectStore('content').get('draft');r.onsuccess=()=>resolve(r.result||{});r.onerror=()=>reject(r.error);}); } finally { db.close(); }
  }
  async function write(patch, remove=[]) {
    const db = await database();
    try {return await new Promise((resolve,reject) => {
      const t=db.transaction('content','readwrite'), s=t.objectStore('content');let next;
      const r=s.get('draft');r.onsuccess=()=>{next={...(r.result||{}),...patch};remove.forEach(k=>delete next[k]);s.put(next,'draft');};
      t.oncomplete=()=>resolve(next);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error('저장에 실패했습니다.'));
    });} finally {db.close();}
  }
  function validImage(value) {return typeof value==='string' && (/^assets\/[a-zA-Z0-9_./-]+$/.test(value)||/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value));}
  function validLink(value) {try {const url=new URL(value,location.href);return ['https:','mailto:','tel:'].includes(url.protocol);}catch {return false;}}
  function validate(input) {
    if(!input||input.version!==1||!input.fields||typeof input.fields!=='object'||Array.isArray(input.fields))throw new Error('위닝텍 콘텐츠 파일 형식이 아닙니다.');
    const output={};
    for(const [key,value] of Object.entries(input.fields)) {
      const field=fields.get(key);if(!field)throw new Error('알 수 없는 편집 항목이 있습니다.');
      if(field.kind==='link') {if(!value||typeof value.text!=='string'||value.text.length>5000||typeof value.href!=='string'||!validLink(value.href))throw new Error('링크 주소를 확인해주세요.');output[key]={text:value.text,href:value.href};}
      else {if(typeof value!=='string'||value.length>(['image','background'].includes(field.kind)?4000000:20000)||(field.kind==='image'&&!validImage(value))||(field.kind==='background'&&value!==''&&!validImage(value)))throw new Error('이미지 또는 문구 형식을 확인해주세요.');output[key]=value;}
    }
    return output;
  }
  function defaultValue(f){return f.kind==='link'?{text:f.value,href:f.href}:f.value;}
  function putText(element,text){const lines=String(text).split('\n');element.replaceChildren();lines.forEach((line,i)=>{if(i)element.append(document.createElement('br'));element.append(document.createTextNode(line));});}
  function apply(values, root=document) {
    schema.fields.filter(f=>f.kind==='background').forEach(f=>{const el=root.querySelector('[data-background-key="'+f.key+'"]');if(!el)return;const v=values[f.key]||'';el.style.backgroundImage=v&&validImage(v)?'url("'+v+'")':'';el.style.backgroundSize=v?'cover':'';el.style.backgroundPosition=v?'center':'';});
    root.querySelectorAll('[data-content-key]').forEach(el=>{
      const f=fields.get(el.dataset.contentKey);if(!f)return;
      const v=Object.prototype.hasOwnProperty.call(values,f.key)?values[f.key]:defaultValue(f);
      if(f.kind==='image'){if(validImage(v))el.src=v;}
      else if(f.kind==='link'){if(validLink(v.href)){el.href=v.href;putText(el,v.text);}}
      else putText(el,v);
    });
  }
  async function published(){const r=await fetch('content.json',{cache:'no-store'});if(!r.ok)throw new Error('기본 콘텐츠를 불러오지 못했습니다.');return validate(await r.json());}
  window.WN_CONTENT={read,write,validate,apply,defaultValue,published};
  if(document.body.dataset.admin)return;
  const draftMode = new URLSearchParams(location.search).get('draft')==='1';
  window.addEventListener('message',event=>{if(draftMode&&event.origin===location.origin&&event.source===parent&&event.data?.type==='winningtec-preview'){try{apply(validate({version:1,fields:event.data.fields}));}catch{}}});
  async function refresh(){try{const base=await published();let local={};try{local=await read();}catch{}const merged={...base,...local};apply(merged);if(draftMode)parent.postMessage({type:'winningtec-ready'},location.origin);return merged;}catch(error){console.warn(error.message);}}
  window.WN_READY=refresh();
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('winningtec-content'):null;
  if(channel)channel.onmessage=refresh;
  window.addEventListener('pageshow',refresh);
})();
