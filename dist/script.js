const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu(returnFocus = false) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); if (returnFocus) toggle.focus(); }
toggle.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { const target = link.hash && document.querySelector(link.hash); closeMenu(); if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); } }));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('header')) closeMenu(); });
window.matchMedia('(min-width: 1200px)').addEventListener('change', () => closeMenu());
document.querySelector('#year').textContent = new Date().getFullYear();
// Use document order and the sticky-header offset, rather than observer callback order.
const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')].filter(section => sectionLinks.some(link => link.hash === `#${section.id}`));
let scheduled = false;
function updateCurrentSection() {
  scheduled = false;
  if (!sections.length) return;
  const headerHeight = document.querySelector('header').getBoundingClientRect().height;
  const line = headerHeight + 40;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= line) current = section;
    else break;
  }
  if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
  for (const link of sectionLinks) {
    if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
function scheduleCurrentSection() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateCurrentSection); }
}
window.addEventListener('scroll', scheduleCurrentSection, { passive: true });
window.addEventListener('resize', scheduleCurrentSection);
window.addEventListener('hashchange', scheduleCurrentSection);
window.addEventListener('load', scheduleCurrentSection);
window.addEventListener('pageshow', scheduleCurrentSection);
if (document.fonts) document.fonts.ready.then(scheduleCurrentSection);
updateCurrentSection();
