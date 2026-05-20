// ============================================================
// Main entry — wires scene + UI + Java backend
// ============================================================

import { PortfolioScene } from './scene.js';

// ---- Boot the 3D scene -------------------------------------
const canvas = document.querySelector('#scene');
const scene  = new PortfolioScene(canvas);
window.__scene = scene; // for debugging

// ---- Loader fade-out ---------------------------------------
const loader = document.querySelector('#loader');
window.addEventListener('load', () => {
  // give the GPU a frame, then fade
  setTimeout(() => loader.classList.add('hidden'), 600);
});

// ---- Scroll progress + camera ------------------------------
const progressFill = document.querySelector('#progressFill');

function onScroll() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  scene.setScroll(p);
  progressFill.style.width = (p * 100).toFixed(1) + '%';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Reveal panels on scroll -------------------------------
const panels = document.querySelectorAll('.panel');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });
panels.forEach(p => io.observe(p));

// ---- Crystal hover tooltip ---------------------------------
const tooltip = document.querySelector('#crystalTooltip');
let lastHover = null;

function updateTooltip() {
  const hover = scene.hoveredCrystal;
  if (hover) {
    if (hover !== lastHover) {
      tooltip.textContent = hover.userData.label;
      tooltip.classList.add('visible');
      lastHover = hover;
    }
    // Project crystal world position → screen
    const v = hover.position.clone().project(scene.camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  } else if (lastHover) {
    tooltip.classList.remove('visible');
    lastHover = null;
  }
  requestAnimationFrame(updateTooltip);
}
updateTooltip();

// ---- Crystal click → scroll to projects --------------------
window.addEventListener('crystal:click', (e) => {
  document.querySelector('#projects').scrollIntoView({ behavior: 'smooth' });
});

// ============================================================
//   BACKEND BRIDGE
// ============================================================

// ---- Visit counter -----------------------------------------
async function loadVisits() {
  const el = document.querySelector('#visitCount');
  try {
    const res = await fetch('api/visits');
    if (!res.ok) throw new Error('visits-failed');
    const data = await res.json();
    el.textContent = data.count.toLocaleString();
  } catch {
    // Backend not running (e.g. you opened the HTML file directly)
    el.textContent = '∞';
  }
}
loadVisits();

// ---- Projects list -----------------------------------------
const projectList = document.querySelector('#projectList');

function renderProjects(projects) {
  if (!projects || projects.length === 0) {
    projectList.innerHTML = '<div class="project-placeholder">No projects yet.</div>';
    return;
  }
  projectList.innerHTML = projects.map(p => `
    <a class="project-card" href="${p.url || '#'}" ${p.url ? 'target="_blank" rel="noopener"' : ''}>
      <div class="project-card-header">
        <span class="project-card-title">${escapeHtml(p.title)}</span>
        <span class="project-card-tags">
          ${(p.tags || []).map(t => `<span class="project-card-tag">${escapeHtml(t)}</span>`).join('')}
        </span>
      </div>
      <p class="project-card-desc">${escapeHtml(p.description)}</p>
    </a>
  `).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const FALLBACK_PROJECTS = [
  {
    title: 'Java Servlet Website',
    description: 'A full-stack web application built with Java Servlets and JSP — handles routing, sessions, and dynamic content the classic way.',
    tags: ['Java', 'Servlet', 'JSP'],
    url: ''
  },
  {
    title: 'This Portfolio',
    description: 'The site you\'re looking at right now — Three.js for the 3D world, Java Servlets serving the backend. Vanilla JS for the glue.',
    tags: ['Three.js', 'Java', 'Frontend'],
    url: ''
  }
];

async function loadProjects() {
  try {
    const res = await fetch('api/projects');
    if (!res.ok) throw new Error('projects-failed');
    const data = await res.json();
    renderProjects(data.projects || []);
  } catch {
    renderProjects(FALLBACK_PROJECTS);
  }
}
loadProjects();

// ---- Contact form ------------------------------------------
const form   = document.querySelector('#contactForm');
const status = document.querySelector('#contactStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.classList.remove('error');
  status.textContent = '';

  const data = {
    name:    form.name.value.trim(),
    email:   form.email.value.trim(),
    message: form.message.value.trim()
  };

  if (!data.name || !data.email || !data.message) {
    status.classList.add('error');
    status.textContent = 'Please fill in all fields.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    status.classList.add('error');
    status.textContent = 'That email looks off — double-check it?';
    return;
  }

  status.textContent = 'Sending…';

  try {
    const res = await fetch('api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('send-failed');
    const result = await res.json();
    status.textContent = result.message || 'Thanks! Your message landed safely. ✦';
    form.reset();
  } catch {
    status.classList.add('error');
    status.textContent = 'Couldn\'t send — start the Tomcat server (mvn tomcat7:run) and try again.';
  }
});

// ---- Soft smooth scroll for nav links ----------------------
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Add a placeholder attribute so floating labels animate
// (only fields without placeholder need this hack)
document.querySelectorAll('.field input, .field textarea').forEach(el => {
  if (!el.placeholder) el.placeholder = ' ';
});
