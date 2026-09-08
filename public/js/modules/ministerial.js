import { getAll } from '../database.js';
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function initials(n=''){return n.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
const label=l=>l===0?'Pastores generales':l===1?'Equipo de 12':l===2?'Red 144':l===3?'Red 1728':`Nivel ${l}`;
function childrenOf(people,id){return people.filter(p=>Number(p.mentorId)===Number(id)&&p.active!==false)}
function node(p,people){const direct=childrenOf(people,p.id).length;return `<button class="tree-node interactive tree-node-v13" data-tree-person="${p.id}"><div class="mini-avatar">${initials(p.name)}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.ministryRole||label(Number(p.leadershipLevel||0)))}</small><em>${direct} discípulo${direct===1?'':'s'} directo${direct===1?'':'s'}</em></div><span>${direct?'›':'↗'}</span></button>`}
function levelPeople(people,level){return people.filter(p=>Number(p.leadershipLevel)===Number(level)&&p.active!==false)}
function explorerMarkup(title,subtitle,items,people,parentId=''){return `<div class="tree-explorer-head"><div><span class="eyebrow">Explorador ministerial</span><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div>${parentId?'<button class="btn btn-soft btn-sm" id="treeBack">← Volver</button>':''}</div><div class="tree-explorer-grid">${items.map(p=>node(p,people)).join('')||'<div class="empty-state">No hay personas registradas en este nivel.</div>'}</div>`}
export async function renderMinisterialTree(){
  const people=await getAll('people');
  const groups=[0,1,2,3].map(level=>levelPeople(people,level));
  const roots=groups[0].sort((a,b)=>a.id-b.id);
  return `<div class="page-head"><div><div class="eyebrow">Arquitectura ministerial</div><h1>Árbol ministerial</h1><p>Navega por cobertura y mentoría sin cargar toda la red en una sola pantalla.</p></div><span class="badge presentation-badge">12 → 144 → 1728</span></div>
  <section class="card ministry-summary tree-summary-v13"><div><span>Nivel 0</span><strong>Danny Tinoco + Laura Tinoco</strong></div><div><span>Equipo de 12</span><strong>${groups[1].length} / 12</strong></div><div><span>Regla central</span><strong>La red se calcula por mentoría</strong></div></section>
  <section class="card section-card tree-toolbar"><div><strong>Ir a una generación</strong><div class="tree-filter">${groups.map((g,i)=>`<button class="tree-filter-btn ${i===0?'active':''}" data-tree-level="${i}">${label(i)} <span>${g.length}</span></button>`).join('')}</div></div></section>
  <section class="card section-card tree-explorer" id="treeExplorer">${explorerMarkup(label(0),'Cobertura pastoral general',roots,people)}</section>`;
}
export async function bindMinisterialTree(){
  const people=await getAll('people'); const explorer=document.querySelector('#treeExplorer'); const history=[];
  const bindNodes=()=>document.querySelectorAll('[data-tree-person]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.treePerson),p=people.find(x=>Number(x.id)===id),kids=childrenOf(people,id);if(kids.length){history.push({id,title:p.name,level:Number(p.leadershipLevel||0)});explorer.innerHTML=explorerMarkup(p.name,`${label(Number(p.leadershipLevel||0)+1)} · ${kids.length} integrante${kids.length===1?'':'s'}`,kids,people,id);bindNodes();bindBack();}else location.hash=`#/personas/${id}`;});
  const bindBack=()=>{document.querySelector('#treeBack')?.addEventListener('click',()=>{history.pop();const prev=history[history.length-1];if(prev){const p=people.find(x=>Number(x.id)===Number(prev.id)),kids=childrenOf(people,p.id);explorer.innerHTML=explorerMarkup(p.name,`${label(Number(p.leadershipLevel||0)+1)} · ${kids.length} integrantes`,kids,people,p.id);}else{const roots=levelPeople(people,0);explorer.innerHTML=explorerMarkup(label(0),'Cobertura pastoral general',roots,people);}bindNodes();bindBack();});};
  document.querySelectorAll('[data-tree-level]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-tree-level]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');history.length=0;const level=Number(btn.dataset.treeLevel),items=levelPeople(people,level);explorer.innerHTML=explorerMarkup(label(level),`${items.length} personas en esta generación`,items,people);bindNodes();});
  bindNodes(); bindBack();
}
