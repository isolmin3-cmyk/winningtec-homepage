(() => {
  if(new URLSearchParams(location.search).get('edit')==='1'||!('IntersectionObserver' in window))return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');if(motion.matches)return;
  const elements=[...document.querySelectorAll('.hero-copy,.hero-photo,.intro-grid>div,.section-heading,.product-grid>.product,.application-grid>article,.capability-grid>div,.capability-grid>table,#partners .wn-h2,.partners>li,#certifications .wn-h2,.certifications>article,.company-info,#history .intro-grid>div,#location .wn-h2,.location-grid>div')];
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('wn-reveal-pending',!entry.isIntersecting);},{threshold:0.05,rootMargin:'0px 0px -24px 0px'});
  for(const el of elements){el.classList.add('wn-reveal');if(el.getBoundingClientRect().top>=innerHeight)el.classList.add('wn-reveal-pending');observer.observe(el);}
  document.addEventListener('focusin',event=>event.target.closest('.wn-reveal')?.classList.remove('wn-reveal-pending'));
  motion.addEventListener('change',()=>{if(motion.matches){observer.disconnect();elements.forEach(el=>el.classList.remove('wn-reveal-pending'));}});
})();
