import { getAll } from '../database.js';
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function initials(n=''){return n.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
const label=l=>l===0?'Pastores generales':l===1?'Equipo de 12':l===2?'Red 144':l===3?'Red 1728':`Nivel ${l}`;
function node(p,people){const direct=people.filter(x=>Number(x.mentorId)===Number(p.id)).length;return `<button class="tree-node interactive" data-tree-person="${p.id}"><div class="mini-avatar">${initials(p.name)}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.ministryRole||label(p.leadershipLevel))}</small><em>${direct} discípulos directos</em></div><span>›</span></button>`}
export async function renderMinisterialTree(){
  const people=await getAll('people');
  const roots=people.filter(p=>p.leadershipLevel===0 || /pastor(a)? principal/i.test(p.ministryRole||'')).sort((a,b)=>a.id-b.id).slice(0,2);
  const l1=people.filter(p=>p.leadershipLevel===1).slice(0,12),l2=people.filter(p=>p.leadershipLevel===2).slice(0,36),l3=people.filter(p=>p.leadershipLevel===3).slice(0,40);
  const groups=[roots,l1,l2,l3];
  return `<div class="page-head"><div><div class="eyebrow">Arquitectura ministerial</div><h1>Árbol ministerial interactivo</h1><p>Explora cobertura, mentoría y multiplicación. Selecciona un líder para abrir su equipo o Persona 360.</p></div><span class="badge presentation-badge">12 → 144 → 1728</span></div>
  <section class="card ministry-summary"><div><span>Nivel 0</span><strong>Danny Tinoco + Laura Tinoco</strong></div><div><span>Primera generación</span><strong>${l1.length} / 12</strong></div><div><span>Regla central</span><strong>La red se calcula por mentoría</strong></div></section>
  <section class="card section-card tree-toolbar"><div><strong>Explorar por generación</strong><div class="tree-filter">${groups.map((g,i)=>`<button class="tree-filter-btn ${i<3?'active':''}" data-tree-level="${i}">${label(i)} <span>${g.length}</span></button>`).join('')}</div></div></section>
  <section class="card section-card tree-canvas">${groups.map((g,i)=>`<div class="tree-level" data-level-block="${i}"><div class="tree-level-title"><span>${i}</span><div><strong>${label(i)}</strong><small>${i===0?'Cobertura pastoral general':g.length+' registros demo'}</small></div></div><div class="tree-nodes">${g.map(p=>node(p,people)).join('')}</div></div>`).join('')}</section>`;
}
export async function bindMinisterialTree(){
  document.querySelectorAll('[data-tree-person]').forEach(b=>b.onclick=async()=>{const id=b.dataset.treePerson;const people=await getAll('people');const hasTeam=people.some(p=>Number(p.mentorId)===Number(id));location.hash=hasTeam?`#/doce/${id}`:`#/personas/${id}`;});
  document.querySelectorAll('[data-tree-level]').forEach(btn=>btn.onclick=()=>{btn.classList.toggle('active');const block=document.querySelector(`[data-level-block="${btn.dataset.treeLevel}"]`);if(block)block.hidden=!btn.classList.contains('active');});
}
