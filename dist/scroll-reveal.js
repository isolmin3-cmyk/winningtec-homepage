(() => {
  if(new URLSearchParams(location.search).get('edit')==='1'||!('IntersectionObserver' in window))return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');if(motion.matches)return;
  // Reveal text and cards individually, including elements visible on first load.
  const selector='main section .eyebrow,main section h1,main section h2,main section h3,main section p,.hero-actions>.wn-button,.hero-link,.hero-facts>span,.hero-photo,.product-grid>.product,.application-grid>article,.capability-grid .capacity,.wn-table tr,.partners>li,.certifications>article,.company-info>div,.contact-panel>.contact-link,.contact-panel>.email,.contact-panel>.wn-button,.location-art';
  const elements=[...new Set(document.querySelectorAll(selector))].filter(el=>!el.closest('.hero'));
  const heroItems=[...document.querySelectorAll('.hero .eyebrow,.hero h1,.hero-desc,.hero-actions>.wn-button,.hero-link,.hero-facts>span,.hero-photo img,.hero-photo figcaption span,.hero-photo figcaption b')];
  heroItems.forEach((el,i)=>{el.classList.add('wn-hero-motion');el.style.setProperty('--hero-delay',`${i*80}ms`);});
  const heroObserver=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('wn-hero-visible',entry.isIntersecting);},{threshold:0.01});
  requestAnimationFrame(()=>requestAnimationFrame(()=>heroItems.forEach(el=>{if(el.tagName==='IMG'&&!el.complete){el.addEventListener('load',()=>heroObserver.observe(el),{once:true});el.addEventListener('error',()=>el.classList.remove('wn-hero-motion'),{once:true});}else heroObserver.observe(el);})));
  const positions=new Map();
  for(const el of elements){const section=el.closest('section');const n=positions.get(section)||0;positions.set(section,n+1);el.style.setProperty('--reveal-delay',`${(n%5)*65}ms`);el.classList.add('wn-reveal','wn-reveal-pending');}
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('wn-reveal-pending',!entry.isIntersecting);},{threshold:0.05,rootMargin:'0px 0px -16px 0px'});
  // Commit the starting style before revealing the first two sections.
  document.documentElement.getBoundingClientRect();
  requestAnimationFrame(()=>requestAnimationFrame(()=>elements.forEach(el=>observer.observe(el))));
  document.addEventListener('focusin',event=>{let el=event.target;while(el&&el!==document.body){if(el.classList.contains('wn-reveal'))el.classList.remove('wn-reveal-pending');el=el.parentElement;}});
  motion.addEventListener('change',()=>{if(motion.matches){observer.disconnect();heroObserver.disconnect();heroItems.forEach(el=>el.classList.remove('wn-hero-motion','wn-hero-visible'));elements.forEach(el=>{el.classList.remove('wn-reveal-pending');el.style.removeProperty('--reveal-delay');});}});
})();
