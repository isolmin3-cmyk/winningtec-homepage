const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu(returnFocus = false) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); if (returnFocus) toggle.focus(); }
toggle.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { const target = link.hash && document.querySelector(link.hash); closeMenu(); if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); } }));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('header')) closeMenu(); });
window.matchMedia('(min-width: 1200px)').addEventListener('change', () => closeMenu());
document.querySelector('#year').textContent = new Date().getFullYear();
const sections = [...document.querySelectorAll('main section[id]')];
const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (!entry.isIntersecting) return; nav.querySelectorAll('a[href^="#"]').forEach(a => { if (a.hash === `#${entry.target.id}`) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); }); }, { rootMargin: '-15% 0px -65% 0px' });
sections.forEach(section => observer.observe(section));
