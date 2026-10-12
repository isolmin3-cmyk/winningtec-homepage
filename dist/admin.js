(async()=>{
'use strict';
const api=window.WN_CONTENT,schema=window.WN_SCHEMA,globalStatus=document.querySelector('#global-status'),preview=document.querySelector('#preview');
let published={},saved={},draft={},dirty=new Set(),uploads=0,previewReady=false;
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('winningtec-content'):null;
function notify(){channel?.postMessage('updated');}
function value(f){return Object.hasOwn(draft,f.key)?draft[f.key]:api.defaultValue(f);}
function status(el,message){el.textContent=message;}
function sendPreview(){if(previewReady)preview.contentWindow.postMessage({type:'winningtec-preview',fields:draft},location.origin);}
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===preview.contentWindow&&e.data?.type==='winningtec-ready'){previewReady=true;sendPreview();}});
preview.addEventListener('load',()=>{previewReady=true;sendPreview();});
function mark(group){dirty.add(group);document.querySelector(`#edit-${group} .dirty`).textContent='저장하지 않은 변경사항';sendPreview();}
function download(name,text){const u=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function setText(f,input){const v=value(f);input.value=f.kind==='link'?v.text:v;input.addEventListener('input',()=>{draft[f.key]=f.kind==='link'?{...value(f),text:input.value}:input.value;mark(f.group);});}
function render(){
 const nav=document.querySelector('#section-nav'),root=document.querySelector('#editors');nav.replaceChildren();root.replaceChildren();
 for(const group of schema.groups){
  const link=document.createElement('a');link.href=`#edit-${group.id}`;link.textContent=group.title;nav.append(link);
  const section=document.createElement('section');section.className='admin-section';section.id=`edit-${group.id}`;
  const heading=document.createElement('div');heading.className='section-header';heading.innerHTML='<div><h2></h2><p>문구와 이미지를 수정한 뒤 변경사항을 저장하세요.</p></div><span class="dirty"></span>';heading.querySelector('h2').textContent=group.title+' 관리';section.append(heading);
  const form=document.createElement('form'),grid=document.createElement('div');grid.className='field-grid';form.append(grid);
  for(const f of schema.fields.filter(f=>f.group===group.id)){
   const card=document.createElement('div');card.className='field-card';const label=document.createElement('label');label.htmlFor=f.key;label.textContent=f.label;card.append(label);
   if(f.kind==='image'){
    const image=document.createElement('img');image.className='image-preview';image.alt=f.alt+' 미리보기';image.src=value(f);card.prepend(image);
    const input=document.createElement('input');input.type='file';input.id=f.key;input.accept='image/png,image/jpeg,image/webp';card.append(input);
    const hint=document.createElement('p');hint.className='field-hint';hint.textContent='PNG · JPEG · WebP / 최대 8MB, 저장용 크기로 자동 조정';card.append(hint);
    input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;uploads++;try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('8MB 이하 PNG, JPEG, WebP 이미지를 선택해주세요.');const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const data=canvas.toDataURL('image/webp',.86);api.validate({version:1,fields:{[f.key]:data}});draft[f.key]=data;image.src=data;mark(f.group);status(hint,'새 이미지를 선택했습니다. 섹션 저장을 눌러주세요.');}catch(e){status(hint,e.message);input.value='';}finally{uploads--;}});
    const reset=document.createElement('button');reset.type='button';reset.className='secondary image-reset';reset.textContent='기본 이미지 사용';reset.addEventListener('click',()=>{draft[f.key]=published[f.key]??api.defaultValue(f);image.src=value(f);input.value='';mark(f.group);});card.append(reset);
   }else{
    const input=document.createElement(f.kind==='link'?'input':'textarea');input.id=f.key;if(f.kind==='link')input.type='text';input.maxLength=20000;setText(f,input);card.append(input);
    if(f.kind==='link'){const hrefLabel=document.createElement('label');hrefLabel.className='link-label';hrefLabel.htmlFor=f.key+'-href';hrefLabel.textContent='연결 주소';const href=document.createElement('input');href.type='text';href.id=f.key+'-href';href.value=value(f).href;href.addEventListener('input',()=>{draft[f.key]={...value(f),href:href.value};mark(f.group);});card.append(hrefLabel,href);}
   }
   grid.append(card);
  }
  const actions=document.createElement('div');actions.className='actions';const save=document.createElement('button');save.type='submit';save.textContent='변경사항 저장';const reset=document.createElement('button');reset.type='button';reset.className='secondary';reset.textContent='기본값으로 복원';const check=document.createElement('a');check.className='secondary';check.href=`index.html#${group.id}`;check.target='_blank';check.rel='noopener';check.textContent='페이지 확인 ↗';actions.append(save,reset,check);form.append(actions);
  const message=document.createElement('p');message.role='status';message.setAttribute('aria-live','polite');form.append(message);
  form.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;try{if(uploads)throw Error('이미지 처리가 끝난 뒤 저장해주세요.');const patch={};schema.fields.filter(f=>f.group===group.id).forEach(f=>{if(Object.hasOwn(draft,f.key))patch[f.key]=draft[f.key];});api.validate({version:1,fields:patch});saved=await api.write(patch);dirty.delete(group.id);heading.querySelector('.dirty').textContent='';status(message,'저장했습니다. 현재 브라우저의 홈페이지에 적용됩니다.');notify();}catch(error){status(message,error.message||'저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.');}finally{save.disabled=false;}});
  reset.addEventListener('click',async()=>{if(!confirm(group.title+'의 브라우저 편집 내용을 기본값으로 복원할까요?'))return;try{const keys=schema.fields.filter(f=>f.group===group.id).map(f=>f.key);saved=await api.write({},keys);keys.forEach(k=>{if(Object.hasOwn(published,k))draft[k]=published[k];else delete draft[k];});dirty.delete(group.id);render();sendPreview();notify();status(globalStatus,group.title+'을 기본값으로 복원했습니다.');}catch(e){status(message,e.message);}});
  section.append(form);root.append(section);
 }
 bindNav();
}
const sidebar=document.querySelector('#sidebar'),menu=document.querySelector('.admin-mobile-menu');
function closeMenu(){sidebar.classList.remove('is-open');menu.setAttribute('aria-expanded','false');document.querySelector('.admin-overlay')?.remove();}
menu.addEventListener('click',()=>{const open=!sidebar.classList.contains('is-open');closeMenu();if(open){sidebar.classList.add('is-open');menu.setAttribute('aria-expanded','true');const overlay=document.createElement('button');overlay.className='admin-overlay';overlay.setAttribute('aria-label','메뉴 닫기');overlay.onclick=closeMenu;document.body.append(overlay);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sidebar.classList.contains('is-open')){closeMenu();menu.focus();}});
function bindNav(){document.querySelectorAll('.admin-nav a').forEach(a=>a.addEventListener('click',()=>{closeMenu();document.querySelectorAll('.admin-nav a').forEach(l=>l.removeAttribute('aria-current'));a.setAttribute('aria-current','location');}));}
window.addEventListener('beforeunload',e=>{if(dirty.size){e.preventDefault();e.returnValue='';}});
document.querySelector('#export').addEventListener('click',()=>{try{if(uploads)throw Error('이미지 처리가 끝난 뒤 내보내세요.');const data={version:1,fields:{...draft}};api.validate(data);download('content.json',JSON.stringify(data,null,2));status(globalStatus,'content.json을 내보냈습니다. GitHub의 dist/content.json에 업로드하면 전체 방문자에게 반영됩니다.');}catch(e){status(globalStatus,e.message);}});
document.querySelector('#import').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>20*1024*1024)throw Error('20MB 이하 콘텐츠 파일을 선택해주세요.');const next=api.validate(JSON.parse(await file.text()));const keys=schema.fields.map(f=>f.key);saved=await api.write(next,keys.filter(k=>!Object.hasOwn(next,k)));draft={...published,...saved};dirty.clear();render();sendPreview();notify();status(globalStatus,'파일을 불러와 현재 브라우저에 저장했습니다.');}catch(error){status(globalStatus,error.message||'파일을 확인해주세요.');}finally{e.target.value='';}});
try{published=await api.published();saved=await api.read();draft={...published,...saved};render();status(globalStatus,'편집 준비가 완료됐습니다. 저장은 현재 브라우저에만 적용됩니다.');sendPreview();}catch(e){status(globalStatus,e.message||'콘텐츠를 불러오지 못했습니다.');document.querySelector('#export').disabled=true;document.querySelector('#import').disabled=true;}
})();
