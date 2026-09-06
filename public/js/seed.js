import { count, getAll, putMany, putOne } from './database.js';

export const demoUsers = [
  { id: 1, personId: 1, name: 'Danny Tinoco', email: 'pastor@activa360.demo', password: '1234', role: 'pastor', roleName: 'Pastor principal', scope: 'Iglesia completa', description: 'Visión integral, equipos, células, indicadores y decisiones pastorales.' },
  { id: 2, personId: 3, name: 'Andrés Herrera', email: 'lider12@activa360.demo', password: '1234', role: 'leader12', roleName: 'Líder de 12', scope: 'Equipo directo + cobertura', description: 'Discípulos directos, células propias y células de su línea de discipulado.' },
  { id: 3, personId: 15, name: 'David Ruiz', email: 'lidercelula@activa360.demo', password: '1234', role: 'cellLeader', roleName: 'Líder de célula', scope: 'Célula Renuevo', description: 'Operación semanal, asistencia, invitados y seguimientos de su célula.' },
  { id: 4, personId: 28, name: 'Laura Méndez', email: 'servidor@activa360.demo', password: '1234', role: 'server', roleName: 'Servidor', scope: 'Ministerio de Medios', description: 'Servicio, formación, actividades y compromisos de ministerio.' },
  { id: 5, personId: 42, name: 'Mateo Díaz', email: 'miembro@activa360.demo', password: '1234', role: 'member', roleName: 'Miembro', scope: 'Célula Renuevo', description: 'Célula, crecimiento, formación y participación ministerial.' }
];

const baseNames = ['Andrés Herrera','María Gómez','Daniel Torres','Sara Rincón','Carlos Méndez','Diana López','Felipe Arias','Natalia Ruiz','José Castillo','Paula Herrera','Camilo Vargas','Andrea López'];
const states = ['Nuevo','Consolidación','Discípulo','Activo','Requiere seguimiento'];
const localities = ['Usaquén','Suba','Chapinero','Barrios Unidos','Engativá'];
const principalPastors = [
  { id:1,name:'Danny Tinoco',phone:'3001000001',email:'danny@activa.demo',state:'Activo',cellId:null,trainingLevel:3,active:true,ministryRole:'Pastor principal',mentorId:null,leadershipLevel:0,roleKey:'pastor' },
  { id:2,name:'Laura Tinoco',phone:'3001000002',email:'laura@activa.demo',state:'Activo',cellId:null,trainingLevel:3,active:true,ministryRole:'Pastora principal',mentorId:null,leadershipLevel:0,roleKey:'pastor' }
];

function buildPeople(){
  const people = principalPastors.map(p=>({...p}));
  for(let i=0;i<118;i++){
    const id=i+3;
    const level = i<12 ? 1 : i<48 ? 2 : i<90 ? 3 : 4;
    const mentorId = level===1 ? 1 : level===2 ? 3+(i%12) : level===3 ? 15+(i%34) : 51+(i%38);
    people.push({
      id,
      name: `${baseNames[i%baseNames.length]}${i>=baseNames.length?' '+(Math.floor(i/baseNames.length)+1):''}`,
      phone:`300${String(2000000+i).padStart(7,'0')}`,
      email:`persona${id}@demo.com`,
      state:states[i%states.length],
      cellId:(i%20)+1,
      trainingLevel:(i%3)+1,
      active:i%13!==0,
      ministryRole:level<=2?'Líder / discípulo':'Miembro',
      mentorId,
      leadershipLevel:level
    });
  }
  return people;
}

function networkForLevel(level){ return level<=1?'Equipo de 12':level===2?'Red 144':level===3?'Red 1728':`Nivel ${level}`; }

function buildCells(people){
  const leaders=people.filter(p=>p.id>2 && p.leadershipLevel<=3);
  return Array.from({length:20},(_,i)=>{
    const leader=leaders[i%leaders.length];
    const trainee=leaders[(i+8)%leaders.length];
    return {
      id:i+1,
      name:['Renuevo','Vida','Conexión','Propósito','Gracia','Familias'][i%6]+' '+(i+1),
      leaderId:leader.id,
      leader:leader.name,
      traineeLeaderId:trainee.id,
      traineeLeader:trainee.name,
      network:networkForLevel(leader.leadershipLevel),
      locality:localities[i%localities.length],
      address:`Calle ${120+i} # ${15+i%20} - ${20+i}`,
      day:['Martes','Miércoles','Jueves','Viernes','Sábado'][i%5],
      time:['19:00','19:30','20:00'][i%3],
      members:8+(i%9),
      attendanceRate:72+(i%24),
      status:i%8===0?'Sin reporte':'Activa'
    };
  });
}

const meetingTopics=['Permanecer en Cristo','Una vida de oración','La fe que transforma','El poder del perdón','Servir con excelencia','Familias con propósito'];
const meetingVerses=['Juan 15:5','Filipenses 4:6','Hebreos 11:1','Efesios 4:32','Colosenses 3:23','Josué 24:15'];
const meetings = Array.from({length:36},(_,i)=>({ id:i+1,cellId:(i%20)+1,date:`2026-08-${String((i%7)+1).padStart(2,'0')}`,time:['19:00','19:30','20:00'][i%3],topic:meetingTopics[i%meetingTopics.length],verse:meetingVerses[i%meetingVerses.length],notes:i%4===0?'Oración especial por las familias y próximos invitados.':'Encuentro desarrollado con normalidad.',attendees:7+(i%10),guests:i%4,reported:i%9!==0 }));
const followups = Array.from({length:24},(_,i)=>({ id:i+1,personId:(i*3%120)+1,type:['Llamada','WhatsApp','Visita','Oración'][i%4],status:i%3===0?'Pendiente':'Realizado',reason:i%3===0?'Ausencia':'Seguimiento regular' }));
const training = Array.from({length:60},(_,i)=>({ id:i+1,personId:i+1,level:(i%3)+1,progress:[25,50,75,100][i%4] }));

const generalMeetingsSeed = [
  {id:1,type:'Domingo principal',title:'Reunión principal dominical',date:'2026-08-09',time:'09:00',status:'Programada',speaker:'Pastor Danny Tinoco',theme:'Multiplicación y propósito',attendance:0,newPeople:0,notes:'Reunión general principal de la semana.'},
  {id:2,type:'Martes general',title:'Reunión general de martes',date:'2026-08-11',time:'18:30',status:'Programada',speaker:'Pastora Laura Tinoco',theme:'Oración y formación',attendance:0,newPeople:0,notes:'Encuentro general de entre semana.'},
  {id:3,type:'Martes general',title:'Reunión general de martes',date:'2026-08-04',time:'18:30',status:'Cerrada',speaker:'Pastora Laura Tinoco',theme:'Permanecer y crecer',attendance:168,newPeople:9,notes:'Buena respuesta de servidores y asistentes.',liveNotes:'Ingreso fluido. Dos nuevos registrados al finalizar.',afterNotes:'Reforzar recepción de nuevos.',improvements:'Asignar dos servidores adicionales al punto de bienvenida.'},
  {id:4,type:'Domingo principal',title:'Reunión principal dominical',date:'2026-08-02',time:'09:00',status:'Cerrada',speaker:'Pastor Danny Tinoco',theme:'Fe para avanzar',attendance:286,newPeople:17,notes:'Reunión desarrollada con normalidad.',afterNotes:'Alta asistencia de familias.',improvements:'Mejorar señalización de ingreso a AC Kids.'},
  {id:5,type:'Martes general',title:'Reunión general de martes',date:'2026-07-28',time:'18:30',status:'Cerrada',speaker:'Pastora Laura Tinoco',theme:'Una vida de oración',attendance:154,newPeople:6,notes:'Encuentro de oración y enseñanza.'},
  {id:6,type:'Domingo principal',title:'Reunión principal dominical',date:'2026-07-26',time:'09:00',status:'Cerrada',speaker:'Pastor Danny Tinoco',theme:'Familias con propósito',attendance:271,newPeople:14,notes:'Participación familiar destacada.'}
];

const generalGuestsSeed = [
  {id:1,generalMeetingId:3,name:'Valentina Cruz',phone:'3015550101',email:'',invitedBy:'Paula Herrera',responsibleId:3},
  {id:2,generalMeetingId:3,name:'Jorge Medina',phone:'3155550102',email:'jorge.medina@demo.com',invitedBy:'Carlos Méndez',responsibleId:3},
  {id:3,generalMeetingId:4,name:'Daniela Torres',phone:'3005550103',email:'',invitedBy:'Familia Ruiz',responsibleId:4},
  {id:4,generalMeetingId:4,name:'Santiago León',phone:'3105550104',email:'',invitedBy:'Andrés Herrera',responsibleId:3},
  {id:5,generalMeetingId:4,name:'Marcela Pardo',phone:'3205550105',email:'marcela.pardo@demo.com',invitedBy:'Bienvenida',responsibleId:5},
  {id:6,generalMeetingId:5,name:'Felipe Salazar',phone:'3025550106',email:'',invitedBy:'Laura Méndez',responsibleId:3}
];

const meetingAssignmentsSeed = [
  {id:1,generalMeetingId:1,area:'Sonido',responsible:'Samuel Herrera',task:'Prueba técnica 60 minutos antes',status:'Confirmada'},
  {id:2,generalMeetingId:1,area:'Medios',responsible:'Laura Méndez',task:'Preparar letras, presentación y transmisión',status:'Confirmada'},
  {id:3,generalMeetingId:1,area:'Bienvenida',responsible:'Andrés Herrera',task:'Confirmar equipo de puertas y nuevos',status:'Pendiente'},
  {id:4,generalMeetingId:1,area:'Niños',responsible:'Equipo AC Kids',task:'Confirmar salones y servidores',status:'Pendiente'},
  {id:5,generalMeetingId:2,area:'Alabanza',responsible:'Equipo de Alabanza',task:'Ensayo y repertorio',status:'Confirmada'},
  {id:6,generalMeetingId:2,area:'Logística',responsible:'Equipo Logística',task:'Apertura y organización del auditorio',status:'Pendiente'}
];
const meetingFinancesSeed = [
  {id:1,generalMeetingId:3,type:'Ofrenda',amount:1850000,responsible:'Administración',notes:'Registro demo'},
  {id:2,generalMeetingId:3,type:'Diezmo',amount:3240000,responsible:'Administración',notes:'Registro demo'},
  {id:3,generalMeetingId:4,type:'Ofrenda',amount:2460000,responsible:'Administración',notes:'Registro demo'},
  {id:4,generalMeetingId:4,type:'Diezmo',amount:4980000,responsible:'Administración',notes:'Registro demo'}
];
const notificationsSeed = [
  {id:1,generalMeetingId:1,channel:'WhatsApp',recipient:'Responsables de ministerio',message:'Recordatorio: reunión principal domingo 9:00 a. m. Confirma tu servicio.',sent:false},
  {id:2,generalMeetingId:1,channel:'Correo',recipient:'Pastores principales',message:'Resumen de preparación y responsables pendientes para la reunión del domingo.',sent:true},
  {id:3,generalMeetingId:1,channel:'SMS',recipient:'Equipo de bienvenida',message:'Llegar 45 minutos antes para coordinación de puertas y recepción de nuevos.',sent:false},
  {id:4,generalMeetingId:2,channel:'WhatsApp',recipient:'Servidores martes',message:'Reunión general martes 6:30 p. m. Revisa tu asignación.',sent:false}
];



const twelveMeetingsSeed = [
  {id:1,date:'2026-08-04',time:'18:30',title:'Reunión semanal del Equipo de 12',status:'Cerrada',coordinator:'Pastores Danny y Laura Tinoco',notes:'Revisar seguimiento de nuevos y fortalecer altar familiar.'},
  {id:2,date:'2026-08-11',time:'18:30',title:'Reunión semanal del Equipo de 12',status:'Abierta',coordinator:'Pastores Danny y Laura Tinoco',notes:'Enfoque en Encuentro 180° y reporte de células.'}
];
const twelveMeetingReportsSeed = Array.from({length:24},(_,i)=>({id:i+1,meetingId:i<12?1:2,leaderId:(i%12)+3,devotional:i%5!==0,tithe:i%6!==0,offering:i%4!==0,familyAltar:i%3!==0,notes:i%5===0?'Reforzar disciplina espiritual y seguimiento.':'Semana en avance normal.',updatedAt:'2026-08-08T12:00:00.000Z'}));
const trainingLevelsSeed = [
  {id:1,order:1,name:'Fundamentos',description:'Bases de la fe, identidad en Cristo y vida cristiana.'},
  {id:2,order:2,name:'Discipulado',description:'Hábitos espirituales, servicio, carácter y vida en comunidad.'},
  {id:3,order:3,name:'Liderazgo',description:'Formación para servir, acompañar personas y liderar células.'}
];
const trainingSessionsSeed = [
  {id:1,levelId:1,title:'Salvación e identidad',date:'2026-07-12',time:'10:00',instructor:'Andrés Herrera',notes:'Fundamentos de salvación e identidad en Cristo.'},
  {id:2,levelId:1,title:'Oración y Palabra',date:'2026-07-19',time:'10:00',instructor:'Andrés Herrera',notes:'Hábitos de oración y lectura bíblica.'},
  {id:3,levelId:1,title:'Iglesia y comunidad',date:'2026-07-26',time:'10:00',instructor:'Laura Tinoco',notes:'Pertenencia, comunión y célula.'},
  {id:4,levelId:2,title:'Carácter del discípulo',date:'2026-07-13',time:'16:00',instructor:'Laura Tinoco',notes:'Madurez, fruto y relaciones.'},
  {id:5,levelId:2,title:'Servicio y dones',date:'2026-07-20',time:'16:00',instructor:'Laura Tinoco',notes:'Servicio, dones y propósito.'},
  {id:6,levelId:2,title:'Consolidar a otros',date:'2026-07-27',time:'16:00',instructor:'Danny Tinoco',notes:'Cuidado pastoral y seguimiento.'},
  {id:7,levelId:3,title:'Principios de liderazgo',date:'2026-07-18',time:'15:00',instructor:'Danny Tinoco',notes:'Liderazgo de servicio y ejemplo.'},
  {id:8,levelId:3,title:'Cómo dirigir una célula',date:'2026-07-25',time:'15:00',instructor:'Danny Tinoco',notes:'Preparación, dinámica y cuidado de una célula.'},
  {id:9,levelId:3,title:'Multiplicación y envío',date:'2026-08-01',time:'15:00',instructor:'Danny Tinoco',notes:'Visión de multiplicación y formación de equipos.'}
];

const leadershipDevelopmentSeed = [
  {id:1,personId:15,mentorId:3,status:'Asistente',startDate:'2026-05-10',notes:'Acompaña la célula y está próximo a asumir nuevas responsabilidades.'},
  {id:2,personId:16,mentorId:4,status:'Formación',startDate:'2026-06-01',notes:'Cursando Nivel 3 y acompañamiento quincenal.'},
  {id:3,personId:17,mentorId:5,status:'Aprobado',startDate:'2026-04-15',notes:'Formación aprobada. Pendiente definición de fecha de envío.'},
  {id:4,personId:18,mentorId:6,status:'Identificado',startDate:'2026-07-20',notes:'Potencial de liderazgo detectado en célula.'},
  {id:5,personId:19,mentorId:7,status:'Enviado',startDate:'2026-02-10',notes:'Enviado para dirigir célula y desarrollar equipo.'},
  {id:6,personId:20,mentorId:8,status:'Formación',startDate:'2026-06-18',notes:'Fortaleciendo consolidación y dirección de reuniones.'},
  {id:7,personId:21,mentorId:9,status:'Asistente',startDate:'2026-05-26',notes:'Sirve como líder en formación en su célula.'},
  {id:8,personId:22,mentorId:10,status:'Identificado',startDate:'2026-07-28',notes:'Inicia observación y mentoría.'}
];

const ministries = [
  {id:1,name:'Alabanza',icon:'♫',category:'Creativo',leaderId:7,status:'Activo',description:'Adoración, dirección musical y acompañamiento de las reuniones generales.'},
  {id:2,name:'Medios',icon:'◉',category:'Creativo',leaderId:28,status:'Activo',description:'Proyección, contenido, cámaras, transmisión y apoyo audiovisual.'},
  {id:3,name:'Niños',icon:'★',category:'Pastoral',leaderId:8,status:'Activo',description:'Cuidado, enseñanza y acompañamiento de niños durante reuniones y actividades.'},
  {id:4,name:'Jóvenes',icon:'⚡',category:'Pastoral',leaderId:9,status:'Activo',description:'Acompañamiento, formación y actividades para adolescentes y jóvenes.'},
  {id:5,name:'Intercesión',icon:'♡',category:'Pastoral',leaderId:10,status:'Activo',description:'Oración, cobertura espiritual y apoyo a las necesidades de la iglesia.'},
  {id:6,name:'Bienvenida',icon:'⌂',category:'Servicio',leaderId:11,status:'Activo',description:'Recepción, orientación y acompañamiento a personas nuevas y asistentes.'},
  {id:7,name:'Consolidación',icon:'✓',category:'Pastoral',leaderId:12,status:'Activo',description:'Contacto, seguimiento e integración de personas nuevas a la vida de la iglesia.'},
  {id:8,name:'Logística',icon:'▦',category:'Servicio',leaderId:13,status:'Activo',description:'Montaje, orden, operación de espacios y apoyo general a las reuniones.'}
];

const ministryMembersSeed = [
  {id:1,ministryId:1,personId:7,role:'Líder de alabanza',availability:'Martes y domingos',status:'Activo',joinedAt:'2025-02-01'},
  {id:2,ministryId:1,personId:19,role:'Voz',availability:'Domingos',status:'Activo',joinedAt:'2025-05-10'},
  {id:3,ministryId:1,personId:31,role:'Teclado',availability:'Según programación',status:'Activo',joinedAt:'2026-01-12'},
  {id:4,ministryId:2,personId:28,role:'Coordinación de medios',availability:'Martes y domingos',status:'Activo',joinedAt:'2025-04-05'},
  {id:5,ministryId:2,personId:40,role:'Cámara',availability:'Domingos',status:'Activo',joinedAt:'2026-02-02'},
  {id:6,ministryId:2,personId:52,role:'Proyección',availability:'Martes y domingos',status:'Activo',joinedAt:'2026-03-11'},
  {id:7,ministryId:3,personId:8,role:'Coordinación AC Kids',availability:'Domingos',status:'Activo',joinedAt:'2025-03-02'},
  {id:8,ministryId:3,personId:20,role:'Maestra',availability:'Domingos',status:'Activo',joinedAt:'2026-01-08'},
  {id:9,ministryId:4,personId:9,role:'Líder de jóvenes',availability:'Según programación',status:'Activo',joinedAt:'2025-08-15'},
  {id:10,ministryId:5,personId:10,role:'Coordinación de intercesión',availability:'Martes y domingos',status:'Activo',joinedAt:'2025-01-18'},
  {id:11,ministryId:6,personId:11,role:'Coordinación bienvenida',availability:'Martes y domingos',status:'Activo',joinedAt:'2025-02-16'},
  {id:12,ministryId:6,personId:23,role:'Puerta principal',availability:'Domingos',status:'Activo',joinedAt:'2026-05-01'},
  {id:13,ministryId:7,personId:12,role:'Coordinación consolidación',availability:'Martes y domingos',status:'Activo',joinedAt:'2025-06-14'},
  {id:14,ministryId:8,personId:13,role:'Coordinación logística',availability:'Martes y domingos',status:'Activo',joinedAt:'2025-02-20'},
  {id:15,ministryId:8,personId:25,role:'Montaje',availability:'Domingos',status:'Activo',joinedAt:'2026-06-03'}
];

const ministryServicesSeed = [
  {id:1,ministryId:1,generalMeetingId:1,personId:7,role:'Dirección de alabanza',callTime:'07:30',status:'Confirmado',notes:'Ensayo y oración previa.'},
  {id:2,ministryId:1,generalMeetingId:1,personId:19,role:'Voz',callTime:'07:30',status:'Confirmado',notes:''},
  {id:3,ministryId:2,generalMeetingId:1,personId:28,role:'Coordinación medios',callTime:'07:45',status:'Confirmado',notes:'Validar presentación y transmisión.'},
  {id:4,ministryId:2,generalMeetingId:1,personId:40,role:'Cámara principal',callTime:'08:00',status:'Asignado',notes:''},
  {id:5,ministryId:3,generalMeetingId:1,personId:8,role:'Coordinación AC Kids',callTime:'08:00',status:'Asignado',notes:'Revisar salones.'},
  {id:6,ministryId:6,generalMeetingId:1,personId:11,role:'Coordinación de puertas',callTime:'08:10',status:'Asignado',notes:'Preparar punto de nuevos.'},
  {id:7,ministryId:8,generalMeetingId:1,personId:13,role:'Apertura auditorio',callTime:'07:45',status:'Confirmado',notes:''},
  {id:8,ministryId:1,generalMeetingId:2,personId:7,role:'Dirección de alabanza',callTime:'17:15',status:'Asignado',notes:''},
  {id:9,ministryId:2,generalMeetingId:2,personId:28,role:'Medios',callTime:'17:30',status:'Confirmado',notes:''},
  {id:10,ministryId:5,generalMeetingId:2,personId:10,role:'Intercesión previa',callTime:'17:45',status:'Confirmado',notes:''},
  {id:11,ministryId:6,generalMeetingId:2,personId:11,role:'Bienvenida',callTime:'18:00',status:'Asignado',notes:''}
];


const eventsSeed = [
  {id:1,title:'Lanzamiento Panes y Peces',type:'Lanzamiento',status:'Planificación',startDate:'2026-08-22',endDate:'2026-08-22',time:'18:00',location:'Auditorio Activa Tu Corazón',responsible:'Danny Tinoco',capacity:320,budget:6500000,price:0,description:'Lanzamiento especial con invitados, alabanza, medios, bienvenida y operación logística.'},
  {id:2,title:'Congreso Activa 2026',type:'Congreso',status:'Convocatoria',startDate:'2026-09-18',endDate:'2026-09-19',time:'08:00',location:'Bogotá',responsible:'Laura Tinoco',capacity:500,budget:18000000,price:85000,description:'Congreso de formación, adoración y liderazgo abierto a toda la iglesia.'},
  {id:3,title:'Noche de Oración e Intercesión',type:'Vigilia',status:'Finalizado',startDate:'2026-07-31',endDate:'2026-08-01',time:'21:00',location:'Sede Bogotá Norte',responsible:'Equipo de Intercesión',capacity:220,budget:800000,price:0,description:'Jornada especial de oración e intercesión.'}
];
const eventTasksSeed = [
  {id:1,eventId:1,area:'Medios',responsible:'Laura Méndez',title:'Preparar visuales y transmisión',dueDate:'2026-08-20',status:'En curso'},
  {id:2,eventId:1,area:'Logística',responsible:'Andrés Herrera',title:'Definir acceso y ubicación de invitados',dueDate:'2026-08-21',status:'Pendiente'},
  {id:3,eventId:1,area:'Sonido',responsible:'Samuel Herrera',title:'Prueba técnica general',dueDate:'2026-08-22',status:'Pendiente'},
  {id:4,eventId:2,area:'Inscripciones',responsible:'María Gómez',title:'Configurar mesa de acreditaciones',dueDate:'2026-09-15',status:'Pendiente'},
  {id:5,eventId:3,area:'Intercesión',responsible:'Equipo de Intercesión',title:'Cobertura de oración por bloques',dueDate:'2026-07-31',status:'Completada'}
];
const eventParticipantsSeed = [
  {id:1,eventId:2,name:'Juliana Pérez',phone:'3007000101',status:'Confirmado',paid:85000},
  {id:2,eventId:2,name:'Miguel Rojas',phone:'3007000102',status:'Registrado',paid:0},
  {id:3,eventId:3,name:'Andrea Salas',phone:'3007000103',status:'Asistió',paid:0}
];
const encountersSeed = [
  {id:1,title:'Encuentro 180° · Agosto 2026',startDate:'2026-08-28',endDate:'2026-08-30',rhema:'Vuelve al primer amor',verse:'Apocalipsis 2:4-5',coordinatorId:3,coordinator:'Andrés Herrera',goal:120,price:180000,status:'Inscripciones',location:'Casa de Encuentros · Sabana de Bogotá',notes:'Encuentro mensual de transformación, restauración y consolidación.'},
  {id:2,title:'Encuentro 180° · Julio 2026',startDate:'2026-07-24',endDate:'2026-07-26',rhema:'He aquí, yo hago nuevas todas las cosas',verse:'Apocalipsis 21:5',coordinatorId:4,coordinator:'María Gómez',goal:100,price:175000,status:'Finalizado',location:'Casa de Encuentros · Sabana de Bogotá',notes:'Edición cerrada con seguimiento posterior.'}
];
const encounterGoalsSeed = Array.from({length:12},(_,i)=>({id:i+1,encounterId:1,leaderId:i+3,leaderName:baseNames[i%baseNames.length],goal:10+(i%3)}));
const encounterParticipantsSeed = Array.from({length:72},(_,i)=>({id:i+1,encounterId:1,name:`Participante 180 ${i+1}`,phone:`31088${String(i+1).padStart(5,'0')}`,email:'',leaderId:3+(i%12),status:i<8?'Preinscrito':i<50?'Inscrito':i<62?'Pagado':'Pago parcial',paid:i<8?0:i<50?0:i<62?180000:90000,registeredAt:'2026-08-01'})).concat(Array.from({length:48},(_,i)=>({id:100+i,encounterId:2,name:`Participante julio ${i+1}`,phone:`31177${String(i+1).padStart(5,'0')}`,email:'',leaderId:3+(i%12),status:i<43?'Completó':'No asistió',paid:175000,registeredAt:'2026-07-01'})));
const encounterTasksSeed = [
  {id:1,encounterId:1,area:'Coordinación',responsible:'Andrés Herrera',title:'Reunión general de responsables',dueDate:'2026-08-15',status:'Completada'},
  {id:2,encounterId:1,area:'Logística',responsible:'Carlos Méndez',title:'Confirmar transporte y horarios',dueDate:'2026-08-22',status:'En curso'},
  {id:3,encounterId:1,area:'Intercesión',responsible:'Diana López',title:'Activar cadena de oración de 21 días',dueDate:'2026-08-08',status:'Completada'},
  {id:4,encounterId:1,area:'Inscripciones',responsible:'María Gómez',title:'Validar pagos y listados finales',dueDate:'2026-08-26',status:'Pendiente'},
  {id:5,encounterId:1,area:'Alimentación',responsible:'Paula Herrera',title:'Confirmar menú y restricciones',dueDate:'2026-08-24',status:'Pendiente'},
  {id:6,encounterId:1,area:'Medios',responsible:'Laura Méndez',title:'Preparar material visual y testimonios',dueDate:'2026-08-25',status:'En curso'},
  {id:7,encounterId:1,area:'Seguimiento',responsible:'Felipe Arias',title:'Preparar responsables post encuentro',dueDate:'2026-08-28',status:'Pendiente'}
];
const encounterUpdatesSeed = [
  {id:1,encounterId:1,week:1,date:'2026-08-03',pre:28,inscriptions:16,paid:8,notes:'Inicio de convocatoria.'},
  {id:2,encounterId:1,week:2,date:'2026-08-10',pre:49,inscriptions:33,paid:19,notes:'Avance sostenido.'},
  {id:3,encounterId:1,week:3,date:'2026-08-17',pre:68,inscriptions:52,paid:34,notes:'Reforzar líderes por debajo de 50%.'},
  {id:4,encounterId:1,week:4,date:'2026-08-24',pre:82,inscriptions:72,paid:50,notes:'Cierre de inscripciones en curso.'}
];
const encounterFinancesSeed = Array.from({length:62},(_,i)=>({id:i+1,encounterId:1,participantId:i+1,type:'Inscripción',amount:i<50?180000:90000,date:'2026-08-15'}));

export async function seedDatabase(){
  if(await count('settings')===0) await putOne('settings',{id:1,churchName:'Activa Tu Corazón',campus:'Bogotá Norte',city:'Bogotá D.C.',generalMeetingSunday:'09:00',generalMeetingTuesday:'18:30',contactEmail:'',contactPhone:'',demoMode:true,updatedAt:new Date().toISOString()});
  const peopleSeed=buildPeople();
  if(await count('people')===0) await putMany('people',peopleSeed);
  // Los pastores generales son registros canónicos del nivel 0. Esta actualización
  // corrige bases demo provenientes de v0.1/v0.2 sin exigir borrar Cloudflare D1.
  await putMany('people',principalPastors);
  const people=await getAll('people');
  if(await count('cells')===0) await putMany('cells',buildCells(peopleSeed));
  if(await count('meetings')===0) await putMany('meetings',meetings);
  // Migración v0.4: enriquece reuniones antiguas sin perder datos creados por el usuario.
  const currentMeetings=await getAll('meetings');
  for(let i=0;i<currentMeetings.length;i++){
    const m=currentMeetings[i];
    if(!m.topic || !m.time){
      await putOne('meetings',{...m,time:m.time||['19:00','19:30','20:00'][i%3],topic:m.topic||meetingTopics[i%meetingTopics.length],verse:m.verse||meetingVerses[i%meetingVerses.length],notes:m.notes||'Encuentro semanal registrado en Activa 360.'});
    }
  }
  // Datos de asistencia demo para que la v0.4 se presente con información realista.
  if(await count('attendance')===0){
    const seededPeople=await getAll('people');
    const seededMeetings=await getAll('meetings');
    const attendanceSeed=[];
    let aid=1;
    for(const m of seededMeetings){
      const members=seededPeople.filter(p=>p.cellId===m.cellId && p.active!==false).slice(0,10);
      members.forEach((p,j)=>attendanceSeed.push({id:aid++,meetingId:m.id,personId:p.id,status:j%7===0?'Ausente':j%9===0?'Justificado':'Presente',isGuest:false}));
      for(let g=0;g<(m.guests||0);g++) attendanceSeed.push({id:aid++,meetingId:m.id,personId:null,status:'Presente',isGuest:true,guestName:`Invitado ${g+1}`,phone:'',invitedBy:'Miembro de la célula'});
    }
    if(attendanceSeed.length) await putMany('attendance',attendanceSeed);
  }
  // Sincroniza los totales visibles de cada reunión con los registros de asistencia.
  const allAttendance=await getAll('attendance');
  const syncedMeetings=await getAll('meetings');
  for(const m of syncedMeetings){
    const rs=allAttendance.filter(a=>a.meetingId===m.id);
    if(rs.length){
      const attendees=rs.filter(a=>a.status==='Presente').length;
      const guests=rs.filter(a=>a.isGuest).length;
      await putOne('meetings',{...m,attendees,guests});
    }
  }
  if(await count('followups')===0) await putMany('followups',followups);
  if(await count('training')===0) await putMany('training',training);
  if(await count('trainingLevels')===0) await putMany('trainingLevels',trainingLevelsSeed);
  if(await count('trainingSessions')===0) await putMany('trainingSessions',trainingSessionsSeed);
  // v0.6: normaliza matrículas antiguas y crea asistencia demo sin borrar progreso existente.
  const currentTraining=await getAll('training');
  for(const e of currentTraining){
    const levelId=e.levelId||Math.max(1,Math.min(3,Number(e.level)||1));
    const status=e.status||(Number(e.progress)>=100?'Aprobado':'En curso');
    await putOne('training',{...e,levelId,level:Number(e.level)||levelId,status,startDate:e.startDate||'2026-07-01',approvedDate:status==='Aprobado'?(e.approvedDate||'2026-08-01'):''});
  }
  if(await count('trainingAttendance')===0){
    const tr=await getAll('training'); const sessions=await getAll('trainingSessions'); let tid=1; const ta=[];
    for(const session of sessions){
      const students=tr.filter(e=>e.levelId===session.levelId).slice(0,18);
      students.forEach((e,i)=>ta.push({id:tid++,sessionId:session.id,personId:e.personId,status:i%8===0?'Ausente':i%11===0?'Justificado':'Presente'}));
    }
    if(ta.length) await putMany('trainingAttendance',ta);
  }
  // v0.7: pipeline de formación y envío de nuevos líderes.
  if(await count('leadershipDevelopment')===0) await putMany('leadershipDevelopment',leadershipDevelopmentSeed);
  // v0.8: ministerios enriquecidos, servidores y programación de servicio.
  if(await count('ministries')===0) await putMany('ministries',ministries);
  else {
    const currentMinistries=await getAll('ministries');
    for(const canonical of ministries){
      const current=currentMinistries.find(x=>x.id===canonical.id);
      if(current) await putOne('ministries',{...current,...canonical});
    }
  }
  if(await count('ministryMembers')===0) await putMany('ministryMembers',ministryMembersSeed);
  if(await count('ministryServices')===0) await putMany('ministryServices',ministryServicesSeed);
  if(await count('generalMeetings')===0) await putMany('generalMeetings',generalMeetingsSeed);
  if(await count('generalGuests')===0) await putMany('generalGuests',generalGuestsSeed);
  if(await count('meetingAssignments')===0) await putMany('meetingAssignments',meetingAssignmentsSeed);
  if(await count('meetingFinances')===0) await putMany('meetingFinances',meetingFinancesSeed);
  if(await count('notifications')===0) await putMany('notifications',notificationsSeed);
  // v1.2: Reunión semanal del Equipo de 12.
  if(await count('twelveMeetings')===0) await putMany('twelveMeetings',twelveMeetingsSeed);
  if(await count('twelveMeetingReports')===0) await putMany('twelveMeetingReports',twelveMeetingReportsSeed);
  // v1.1: Eventos + Encuentros 180°.
  if(await count('events')===0) await putMany('events',eventsSeed);
  if(await count('eventTasks')===0) await putMany('eventTasks',eventTasksSeed);
  if(await count('eventParticipants')===0) await putMany('eventParticipants',eventParticipantsSeed);
  if(await count('encounters')===0) await putMany('encounters',encountersSeed);
  if(await count('encounterGoals')===0) await putMany('encounterGoals',encounterGoalsSeed);
  if(await count('encounterParticipants')===0) await putMany('encounterParticipants',encounterParticipantsSeed);
  if(await count('encounterTasks')===0) await putMany('encounterTasks',encounterTasksSeed);
  if(await count('encounterUpdates')===0) await putMany('encounterUpdates',encounterUpdatesSeed);
  if(await count('encounterFinances')===0) await putMany('encounterFinances',encounterFinancesSeed);
  // Siempre sincroniza los perfiles demo de la versión actual.
  await putMany('users',demoUsers);
  // Migración no destructiva v0.3 para registros antiguos.
  for(const p of people){
    if(p.id>2 && p.leadershipLevel===undefined){
      const level=p.id<=14?1:p.id<=50?2:p.id<=90?3:4;
      await putOne('people',{...p,leadershipLevel:level,mentorId:level===1?1:level===2?3+((p.id-15)%12):15+((p.id-51)%34)});
    }
  }
  const updatedPeople=await getAll('people');
  const cells=await getAll('cells');
  for(let i=0;i<cells.length;i++){
    const c=cells[i];
    if(!c.leaderId || !c.locality || ['Esperanza','Propósito','Gracia'].includes(c.network)){
      const candidates=updatedPeople.filter(p=>p.id>2 && p.leadershipLevel<=3);
      const leader=candidates[i%candidates.length] || updatedPeople[2];
      const trainee=candidates[(i+8)%candidates.length] || updatedPeople[3];
      await putOne('cells',{...c,leaderId:leader.id,leader:leader.name,traineeLeaderId:trainee.id,traineeLeader:trainee.name,network:networkForLevel(leader.leadershipLevel),locality:localities[i%localities.length],address:c.address||`Calle ${120+i} # 15 - 20`,day:c.day||'Jueves',time:c.time||'19:00'});
    }
  }

  // v0.5: conecta invitados de reuniones de célula y nuevos de reuniones generales
  // con un único pipeline pastoral de Seguimiento + Consolidación.
  const existingCases=await getAll('consolidationCases');
  const sourceKeys=new Set(existingCases.map(c=>c.sourceKey).filter(Boolean));
  const meetingsNow=await getAll('meetings');
  const generalMeetingsNow=await getAll('generalMeetings');
  const generalGuestsNow=await getAll('generalGuests');
  const cellsNow=await getAll('cells');
  let caseId=existingCases.length?Math.max(...existingCases.map(c=>Number(c.id)||0))+1:1;
  const statuses=['Nuevo','Contactado','En seguimiento','Integrado','Consolidado'];
  for(const a of (await getAll('attendance')).filter(x=>x.isGuest)){
    const key=`cell:${a.id}`; if(sourceKeys.has(key))continue;
    const m=meetingsNow.find(x=>x.id===a.meetingId); const cell=cellsNow.find(x=>x.id===m?.cellId); const status=statuses[(a.id+1)%statuses.length];
    await putOne('consolidationCases',{id:caseId++,sourceKey:key,sourceType:'cell',sourceId:a.meetingId,sourceRecordId:a.id,name:a.guestName||'Invitado de célula',phone:a.phone||'',email:'',invitedBy:a.invitedBy||'',cellId:m?.cellId||null,firstVisitDate:m?.date||'2026-08-01',status,responsibleId:cell?.leaderId||null,nextActionType:status==='Nuevo'?'WhatsApp':'Llamada',nextActionDate:status==='Consolidado'?'':`2026-08-${String(8+((a.id)%4)).padStart(2,'0')}`,notes:'Ingreso automático desde reunión de célula.',personId:null,createdAt:new Date().toISOString()}); sourceKeys.add(key);
  }
  for(const g of generalGuestsNow){
    const key=`general:${g.id}`; if(sourceKeys.has(key))continue;
    const m=generalMeetingsNow.find(x=>x.id===g.generalMeetingId); const status=statuses[(g.id-1)%statuses.length];
    await putOne('consolidationCases',{id:caseId++,sourceKey:key,sourceType:'general',sourceId:g.generalMeetingId,sourceRecordId:g.id,name:g.name,phone:g.phone||'',email:g.email||'',invitedBy:g.invitedBy||'',cellId:null,firstVisitDate:m?.date||'2026-08-01',status,responsibleId:g.responsibleId||null,nextActionType:status==='Nuevo'?'Llamada':'WhatsApp',nextActionDate:status==='Consolidado'?'':`2026-08-${String(8+g.id%4).padStart(2,'0')}`,notes:'Ingreso automático desde reunión general.',personId:null,createdAt:new Date().toISOString()}); sourceKeys.add(key);
  }
  const casesNow=await getAll('consolidationCases');
  const linkedInteractions=(await getAll('followups')).filter(f=>f.caseId);
  if(linkedInteractions.length===0 && casesNow.length){
    let fid=(await getAll('followups')).reduce((m,f)=>Math.max(m,Number(f.id)||0),0)+1;
    for(const c of casesNow.filter(x=>x.status!=='Nuevo').slice(0,8)){
      await putOne('followups',{id:fid++,caseId:c.id,personId:c.personId||null,type:c.status==='Contactado'?'Llamada':'WhatsApp',date:'2026-08-07',status:'Realizado',result:'Conversación realizada',notes:'Contacto inicial registrado en el demo de consolidación.',nextActionDate:c.nextActionDate,createdBy:1});
    }
  }
}

export { networkForLevel };
