import { getAll, getOne, putOne, deleteOne, nextId } from '../database.js';

export function esc(v=''){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
export function firstName(name=''){return String(name||'').trim().split(/\s+/).filter(Boolean)[0]||'Persona';}
export function unitName(unit, peopleById){
  if(unit?.displayName) return unit.displayName;
  const a=peopleById.get(Number(unit?.primaryPersonId));
  const b=peopleById.get(Number(unit?.secondaryPersonId));
  return b?`${firstName(a?.name)} y ${firstName(b?.name)}`:(a?.name||'Unidad ministerial');
}
export function syntheticUnitId(personId){return 900000+Number(personId);}
export function isSyntheticUnit(unit){return Number(unit?.id)>=900000;}
export function unitMembers(unit, peopleById){
  return [unit?.primaryPersonId,unit?.secondaryPersonId].filter(Boolean).map(id=>peopleById.get(Number(id))).filter(Boolean);
}
export function unitRepresentative(unit, peopleById){return peopleById.get(Number(unit?.representativePersonId||unit?.primaryPersonId));}
export function unitLevel(unit, peopleById){
  const p=peopleById.get(Number(unit?.primaryPersonId));
  return Number(unit?.leadershipLevel ?? p?.leadershipLevel ?? 99);
}

export async function getMinistryUnits({levels=[0,1,2,3]}={}){
  const [people,saved]=await Promise.all([getAll('people'),getAll('ministryUnits')]);
  const peopleById=new Map(people.map(p=>[Number(p.id),p]));
  const activeSaved=saved.filter(u=>u.active!==false);
  const assigned=new Set();
  activeSaved.forEach(u=>[u.primaryPersonId,u.secondaryPersonId].filter(Boolean).forEach(id=>assigned.add(Number(id))));
  const unassigned=people.filter(p=>p.active!==false&&levels.includes(Number(p.leadershipLevel))&&!assigned.has(Number(p.id)));
  const level0=unassigned.filter(p=>Number(p.leadershipLevel)===0);
  const autoPastoralCouple=(levels.includes(0)&&level0.length===2)?[{id:899999,type:'couple',primaryPersonId:Number(level0[0].id),secondaryPersonId:Number(level0[1].id),representativePersonId:Number(level0[0].id),displayName:`${firstName(level0[0].name)} y ${firstName(level0[1].name)}`,leadershipLevel:0,active:true,synthetic:true}]:[];
  const autoPastoralIds=new Set(autoPastoralCouple.flatMap(u=>[u.primaryPersonId,u.secondaryPersonId]));
  const synthetic=[...autoPastoralCouple,...unassigned.filter(p=>!autoPastoralIds.has(Number(p.id))).map(p=>({
    id:syntheticUnitId(p.id),
    type:'individual',
    primaryPersonId:Number(p.id),
    secondaryPersonId:null,
    representativePersonId:Number(p.id),
    displayName:p.name,
    leadershipLevel:Number(p.leadershipLevel),
    active:true,
    synthetic:true
  }))];
  const units=[...activeSaved,...synthetic].filter(u=>levels.includes(unitLevel(u,peopleById))).map(u=>({...u,displayName:unitName(u,peopleById)}));
  return {units,people,peopleById,saved:activeSaved};
}

export function unitContainsPerson(unit,personId){return [unit?.primaryPersonId,unit?.secondaryPersonId].map(Number).includes(Number(personId));}
export function findUnitForPerson(units,personId){return units.find(u=>unitContainsPerson(u,personId));}

export async function createCoupleUnit({primaryPersonId,secondaryPersonId,representativePersonId,displayName=''}){
  const [a,b]=await Promise.all([getOne('people',primaryPersonId),getOne('people',secondaryPersonId)]);
  if(!a||!b) throw new Error('No fue posible encontrar las dos personas seleccionadas.');
  const id=await nextId('ministryUnits');
  const unit={id,type:'couple',primaryPersonId:Number(primaryPersonId),secondaryPersonId:Number(secondaryPersonId),representativePersonId:Number(representativePersonId||primaryPersonId),displayName:displayName.trim()||`${firstName(a.name)} y ${firstName(b.name)}`,leadershipLevel:Number(a.leadershipLevel??b.leadershipLevel??1),active:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  await putOne('ministryUnits',unit); return unit;
}
export async function saveMinistryUnit(unit){
  const payload={...unit,id:Number(unit.id||await nextId('ministryUnits')),updatedAt:new Date().toISOString()};
  if(!payload.createdAt) payload.createdAt=new Date().toISOString();
  await putOne('ministryUnits',payload); return payload;
}
export async function removeMinistryUnit(id){return deleteOne('ministryUnits',id);}
