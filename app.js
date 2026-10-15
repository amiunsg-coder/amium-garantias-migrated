const today = new Date();
const iso = d => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);
const AMIUN_SUPABASE_URL = window.AMIUN_SUPABASE_URL || 'https://tpwefamipnzzepwktquy.supabase.co';
const AMIUN_SUPABASE_PUBLISHABLE_KEY = window.AMIUN_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hnFyb4IBvYaMiGpXcQ7Reg_kINVPX64';
const AMIUN_SHARED_CASES_KEY = 'warranty-cases';
const CASE_BRANCH_MIGRATION_KEY = 'amiun-case-branch-santa-fe-v1';
const AMIUN_CASES_TABLE = 'case_records';
const AMIUN_DATA_RESET_VERSION = '2026-08-21-empty-v1';
const AMIUN_PENDING_CASES_KEY = 'warranty-cases-pending-sync-v1';
const AMIUN_RECOVERY_SNAPSHOT_URL = 'recovery-case-records.json?v=20261013';
const AMIUN_LOCAL_RECOVERY_VERSION = '2026-10-13';
const AMIUN_LOCAL_RECOVERY_STATE_KEY = 'amiun-local-recovery-version-v1';
// En modo `file://` los navegadores pueden bloquear fetch() hacia un JSON local.
// Esta copia embebida permite abrir index.html con doble clic y usar la misma
// exportación de recuperación sin depender de un servidor local.
const AMIUN_EMBEDDED_RECOVERY_SNAPSHOT = window.AMIUN_RECOVERY_SNAPSHOT || null;
// Realtime es el canal principal. Estos sondeos quedan como respaldo para
// evitar descargar toda la base cada pocos segundos y agotar egress/logs de
// Supabase cuando hay varias pestañas abiertas.
// Realtime entrega los cambios al instante. Estos sondeos son solo respaldo.
const AMIUN_SHARED_SYNC_INTERVAL = 30 * 60 * 1000;
const AMIUN_FAST_SYNC_INTERVAL = 15 * 60 * 1000;
const NEW_CASE_NOTIFICATION_ENDPOINT = window.AMIUN_NEW_CASE_NOTIFICATION_ENDPOINT || 'https://tpwefamipnzzepwktquy.supabase.co/functions/v1/notify-new-case';
// Gmail puede necesitar renovar el token OAuth antes de enviar. Nueve segundos
// provocaban falsos errores aunque el servicio siguiera procesando el correo.
const NEW_CASE_NOTIFICATION_TIMEOUT = 30000;
const PARTS_ORDER_EMAIL_SETTINGS_KEY = 'amiun-parts-order-email-settings-v1';
const PARTS_ORDER_EMAIL_REMOTE_KEY = 'parts-order-email-settings';
const REGISTRY_RESPONSIBLES_KEY = 'amiun-registry-responsibles-v1';
const MANUAL_PARTS_REGISTRY_KEY = 'parts-registry-manual';
const AMIUN_LOCAL_DEMO_MODE = window.location.protocol === 'file:' || ['127.0.0.1','localhost'].includes(window.location.hostname);
const AMIUN_LOCAL_DEMO_CLEARED_KEY = 'amiun-local-demo-cleared-v1';
const seedCases = [
  {order:'OR-2487',plate:'AF 482 QZ',client:'Martín Quiroga',phone:'11 6218 4032',priority:'Urgente',vor:false,requested:true,arrived:false,requestDate:iso(-12),saleDate:iso(-540),km:'48200',arrivalDate:'',appointmentDate:'',time:'',partCode:'RP-8840',part:'Módulo de dirección',status:'PENDIENTE DE REPUESTO'},
  {order:'OR-2481',plate:'AE 119 LM',client:'Lucía Pereyra',phone:'11 4590 7231',priority:'Alta',vor:false,requested:true,arrived:true,requestDate:iso(-9),saleDate:iso(-380),km:'31200',arrivalDate:iso(-2),appointmentDate:'',time:'',partCode:'RP-7201',part:'Sensor de estacionamiento',status:'PENDIENTE DE TURNO'},
  {order:'OR-2476',plate:'AD 730 RK',client:'Diego Salvatierra',phone:'11 3844 9030',priority:'Normal',vor:false,requested:true,arrived:true,requestDate:iso(-15),saleDate:iso(-720),km:'65400',arrivalDate:iso(-6),appointmentDate:iso(2),time:'09:30',partCode:'RP-1932',part:'Óptica delantera derecha',status:'PROGRAMADO'},
  {order:'OR-2472',plate:'AC 954 BT',client:'Carolina Méndez',phone:'11 5621 7720',priority:'Urgente',vor:true,requested:true,arrived:true,requestDate:iso(-7),saleDate:iso(-260),km:'18400',arrivalDate:iso(-1),appointmentDate:'',time:'',partCode:'RP-4410',part:'Unidad de control',status:'SIN AVISAR'},
  {order:'OR-2468',plate:'AF 003 JN',client:'Ramiro Acosta',phone:'11 4902 1566',priority:'Alta',vor:false,requested:true,arrived:false,requestDate:iso(-18),saleDate:iso(-610),km:'52300',arrivalDate:'',appointmentDate:iso(1),time:'14:00',partCode:'RP-3088',part:'Bomba de combustible',status:'TURNO SIN REPUESTO'},
  {order:'OR-2459',plate:'AB 821 XS',client:'Valentina Sosa',phone:'11 6180 4429',priority:'Normal',vor:false,requested:true,arrived:true,requestDate:iso(-23),saleDate:iso(-820),km:'78100',arrivalDate:iso(-11),appointmentDate:iso(-3),time:'11:00',partCode:'RP-6502',part:'Manija exterior',status:'REALIZADO'}
];
const quarterlyDemoCases = [
  {order:'DEMO-JUL-01',vin:'8AJFA3CD0G1001001',plate:'AA 101 JL',client:'Laura Benítez',phone:'11 4101 2201',priority:'Urgente',vor:false,requested:true,arrived:false,requestDate:'2026-07-02',saleDate:'2024-03-14',km:'42800',arrivalDate:'',appointmentDate:'',time:'',partCode:'81110-0D450',part:'Óptica delantera izquierda',repairTime:'2 h',observations:'Seguimiento de pedido pendiente',status:'PENDIENTE DE REPUESTO'},
  {order:'DEMO-JUL-02',vin:'8AJBA3CD5G1001002',plate:'AB 202 JL',client:'Pablo Medina',phone:'11 4101 2202',priority:'Alta',vor:false,requested:true,arrived:true,requestDate:'2026-07-06',saleDate:'2023-11-22',km:'61300',arrivalDate:'2026-07-20',appointmentDate:'',time:'',partCode:'04465-0K290',part:'Pastillas de freno delanteras',repairTime:'1.5 h',firstConversation:'2026-07-21',comment:'Cliente contactado; pendiente de confirmar disponibilidad.',status:'PENDIENTE DE TURNO'},
  {order:'DEMO-JUL-03',vin:'8AJCA3CD9G1001003',plate:'AC 303 JL',client:'Mariana López',phone:'11 4101 2203',priority:'Normal',vor:false,requested:true,arrived:true,requestDate:'2026-07-08',saleDate:'2024-06-05',km:'28750',arrivalDate:'2026-07-23',appointmentDate:'2026-08-06',time:'08:30',partCode:'90915-YZZD2',part:'Filtro de aceite',repairTime:'1 h',scheduled:true,status:'PROGRAMADO'},
  {order:'DEMO-JUL-04',vin:'8AJDA3CD2G1001004',plate:'AD 404 JL',client:'Sergio Acuña',phone:'11 4101 2204',priority:'Alta',vor:false,requested:true,arrived:true,requestDate:'2026-07-10',saleDate:'2022-09-18',km:'84500',arrivalDate:'2026-07-18',appointmentDate:'2026-07-29',time:'10:00',partCode:'48510-8Z120',part:'Amortiguador delantero',repairTime:'3 h',scheduled:true,repairDate:'2026-07-29',arrivalKm:'84920',registryOrder:'OR-T-7104',depositStatus:'DEPÓSITO INF',status:'REALIZADO'},
  {order:'DEMO-JUL-05',vin:'8AJEA3CD7G1001005',plate:'AE 505 JL',client:'Natalia Ríos',phone:'11 4101 2205',priority:'Urgente',vor:true,requested:true,arrived:true,requestDate:'2026-07-15',saleDate:'2025-01-10',km:'16400',arrivalDate:'2026-07-30',appointmentDate:'',time:'',partCode:'89661-0KG40',part:'Unidad electrónica de control',repairTime:'2.5 h',vorStatus:'NO AVISADO',status:'SIN AVISAR'},
  {order:'DEMO-AGO-01',vin:'8AJFA3CD0G1002001',plate:'AF 101 AG',client:'Tomás Herrera',phone:'11 4202 3301',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-03',saleDate:'2024-08-09',km:'33600',arrivalDate:'',appointmentDate:'',time:'',partCode:'52119-0K120',part:'Paragolpes delantero',repairTime:'4 h',status:'PENDIENTE DE REPUESTO'},
  {order:'DEMO-AGO-02',vin:'8AJGA3CD5G1002002',plate:'AG 202 AG',client:'Camila Suárez',phone:'11 4202 3302',priority:'Alta',vor:false,requested:true,arrived:true,requestDate:'2026-08-03',saleDate:'2023-05-27',km:'57400',arrivalDate:'2026-08-03',appointmentDate:'',time:'',partCode:'87910-0K330',part:'Espejo retrovisor derecho',repairTime:'2 h',status:'PENDIENTE DE TURNO'},
  {order:'DEMO-AGO-03',vin:'8AJHA3CD9G1002003',plate:'AH 303 AG',client:'Julián Castro',phone:'11 4202 3303',priority:'Urgente',vor:false,requested:true,arrived:false,requestDate:'2026-08-03',saleDate:'2022-12-01',km:'70600',arrivalDate:'',appointmentDate:'2026-08-07',time:'09:00',partCode:'23220-0P090',part:'Bomba de combustible',repairTime:'3 h',missingSince:'2026-08-03',status:'TURNO SIN REPUESTO'},
  {order:'DEMO-AGO-04',vin:'8AJIA3CD2G1002004',plate:'AI 404 AG',client:'Andrea Torres',phone:'11 4202 3304',priority:'Normal',vor:false,requested:true,arrived:true,requestDate:'2026-07-24',saleDate:'2025-02-16',km:'12800',arrivalDate:'2026-08-03',appointmentDate:'2026-08-12',time:'14:30',partCode:'69040-0K080',part:'Cerradura de puerta delantera',repairTime:'2 h',scheduled:true,status:'PROGRAMADO'},
  {order:'DEMO-AGO-05',vin:'8AJJA3CD7G1002005',plate:'AJ 505 AG',client:'Rodrigo Vera',phone:'11 4202 3305',priority:'Alta',vor:false,requested:true,arrived:true,requestDate:'2026-07-28',saleDate:'2023-07-30',km:'49100',arrivalDate:'2026-08-03',appointmentDate:'',time:'',partCode:'43420-0K050',part:'Semieje delantero',repairTime:'3.5 h',manualStatus:true,status:'REPROGRAMAR'},
  {order:'DEMO-SEP-01',vin:'8AJKA3CD0G1003001',plate:'AK 101 SP',client:'Mónica Funes',phone:'11 4303 4401',priority:'Urgente',vor:false,requested:true,arrived:false,requestDate:'2026-09-01',saleDate:'2024-10-11',km:'25900',arrivalDate:'',appointmentDate:'',time:'',partCode:'27060-0L022',part:'Alternador',repairTime:'3 h',status:'PENDIENTE DE REPUESTO'},
  {order:'DEMO-SEP-02',vin:'8AJLA3CD5G1003002',plate:'AL 202 SP',client:'Federico Núñez',phone:'11 4303 4402',priority:'Alta',vor:false,requested:true,arrived:true,requestDate:'2026-09-02',saleDate:'2025-04-19',km:'9800',arrivalDate:'2026-09-10',appointmentDate:'',time:'',partCode:'87139-0K060',part:'Filtro de habitáculo',repairTime:'1 h',status:'PENDIENTE DE TURNO'},
  {order:'DEMO-SEP-03',vin:'8AJMA3CD9G1003003',plate:'AM 303 SP',client:'Gabriel Ortiz',phone:'11 4303 4403',priority:'Normal',vor:false,requested:true,arrived:true,requestDate:'2026-09-03',saleDate:'2023-02-08',km:'68700',arrivalDate:'2026-09-11',appointmentDate:'2026-09-18',time:'11:30',partCode:'17801-0L040',part:'Filtro de aire del motor',repairTime:'1 h',scheduled:true,status:'PROGRAMADO'},
  {order:'DEMO-SEP-04',vin:'8AJNA3CD2G1003004',plate:'AN 404 SP',client:'Paula Giménez',phone:'11 4303 4404',priority:'Urgente',vor:true,requested:true,arrived:true,requestDate:'2026-09-04',saleDate:'2024-01-25',km:'37200',arrivalDate:'2026-09-12',appointmentDate:'',time:'',partCode:'04000-3250A',part:'Kit de reparación de transmisión',repairTime:'6 h',vorStatus:'AVISADO',status:'SIN AVISAR'},
  {order:'DEMO-SEP-05',vin:'8AJOA3CD7G1003005',plate:'AO 505 SP',client:'Esteban Molina',phone:'11 4303 4405',priority:'Normal',vor:false,requested:true,arrived:true,requestDate:'2026-09-05',saleDate:'2022-06-12',km:'91300',arrivalDate:'2026-09-14',appointmentDate:'2026-09-25',time:'15:00',partCode:'90919-01275',part:'Bobina de encendido',repairTime:'2 h',scheduled:true,repairDate:'2026-09-25',arrivalKm:'91910',registryOrder:'OR-T-9305',depositStatus:'ENVIADO A TOYOTA',status:'REALIZADO'}
];
const augustPendingDemoCases = [
  {order:'FICT-AGO-001',vin:'8AJFICAG000000001',plate:'FA 001 AG',client:'Cliente Ficticio 01',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-01',saleDate:'2024-01-15',km:'32500',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1001',part:'Repuesto ficticio 01',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-002',vin:'8AJFICAG000000002',plate:'FA 002 AG',client:'Cliente Ficticio 02',phone:'',priority:'Baja',vor:false,requested:true,arrived:false,requestDate:'2026-08-02',saleDate:'2023-11-08',km:'41800',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1002',part:'Repuesto ficticio 02',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-003',vin:'8AJFICAG000000003',plate:'FA 003 AG',client:'Cliente Ficticio 03',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-03',saleDate:'2024-04-22',km:'50700',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1003',part:'Repuesto ficticio 03',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-004',vin:'8AJFICAG000000004',plate:'FA 004 AG',client:'Cliente Ficticio 04',phone:'',priority:'Alta',vor:false,requested:true,arrived:false,requestDate:'2026-08-04',saleDate:'2022-09-19',km:'61200',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1004',part:'Repuesto ficticio 04',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-005',vin:'8AJFICAG000000005',plate:'FA 005 AG',client:'Cliente Ficticio 05',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-05',saleDate:'2024-07-30',km:'28400',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1005',part:'Repuesto ficticio 05',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-006',vin:'8AJFICAG000000006',plate:'FA 006 AG',client:'Cliente Ficticio 06',phone:'',priority:'Baja',vor:false,requested:true,arrived:false,requestDate:'2026-08-06',saleDate:'2023-02-11',km:'73500',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1006',part:'Repuesto ficticio 06',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-007',vin:'8AJFICAG000000007',plate:'FA 007 AG',client:'Cliente Ficticio 07',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-07',saleDate:'2025-03-04',km:'19600',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1007',part:'Repuesto ficticio 07',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-008',vin:'8AJFICAG000000008',plate:'FA 008 AG',client:'Cliente Ficticio 08',phone:'',priority:'Alta',vor:false,requested:true,arrived:false,requestDate:'2026-08-08',saleDate:'2021-12-16',km:'88400',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1008',part:'Repuesto ficticio 08',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-009',vin:'8AJFICAG000000009',plate:'FA 009 AG',client:'Cliente Ficticio 09',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-09',saleDate:'2024-09-27',km:'35400',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1009',part:'Repuesto ficticio 09',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-010',vin:'8AJFICAG000000010',plate:'FA 010 AG',client:'Cliente Ficticio 10',phone:'',priority:'Baja',vor:false,requested:true,arrived:false,requestDate:'2026-08-10',saleDate:'2023-06-01',km:'64200',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1010',part:'Repuesto ficticio 10',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-011',vin:'8AJFICAG000000011',plate:'FA 011 AG',client:'Cliente Ficticio 11',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-11',saleDate:'2024-12-09',km:'27100',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1011',part:'Repuesto ficticio 11',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-012',vin:'8AJFICAG000000012',plate:'FA 012 AG',client:'Cliente Ficticio 12',phone:'',priority:'Alta',vor:false,requested:true,arrived:false,requestDate:'2026-08-12',saleDate:'2022-04-18',km:'97300',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1012',part:'Repuesto ficticio 12',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-013',vin:'8AJFICAG000000013',plate:'FA 013 AG',client:'Cliente Ficticio 13',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-13',saleDate:'2025-01-26',km:'18800',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1013',part:'Repuesto ficticio 13',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-014',vin:'8AJFICAG000000014',plate:'FA 014 AG',client:'Cliente Ficticio 14',phone:'',priority:'Baja',vor:false,requested:true,arrived:false,requestDate:'2026-08-14',saleDate:'2023-08-13',km:'46600',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1014',part:'Repuesto ficticio 14',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-015',vin:'8AJFICAG000000015',plate:'FA 015 AG',client:'Cliente Ficticio 15',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-15',saleDate:'2024-05-17',km:'52900',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1015',part:'Repuesto ficticio 15',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-016',vin:'8AJFICAG000000016',plate:'FA 016 AG',client:'Cliente Ficticio 16',phone:'',priority:'Alta',vor:false,requested:true,arrived:false,requestDate:'2026-08-16',saleDate:'2022-11-03',km:'80100',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1016',part:'Repuesto ficticio 16',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-017',vin:'8AJFICAG000000017',plate:'FA 017 AG',client:'Cliente Ficticio 17',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-17',saleDate:'2024-02-28',km:'39100',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1017',part:'Repuesto ficticio 17',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-018',vin:'8AJFICAG000000018',plate:'FA 018 AG',client:'Cliente Ficticio 18',phone:'',priority:'Baja',vor:false,requested:true,arrived:false,requestDate:'2026-08-18',saleDate:'2023-10-21',km:'65700',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1018',part:'Repuesto ficticio 18',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-019',vin:'8AJFICAG000000019',plate:'FA 019 AG',client:'Cliente Ficticio 19',phone:'',priority:'Normal',vor:false,requested:true,arrived:false,requestDate:'2026-08-19',saleDate:'2025-05-12',km:'22100',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1019',part:'Repuesto ficticio 19',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'},
  {order:'FICT-AGO-020',vin:'8AJFICAG000000020',plate:'FA 020 AG',client:'Cliente Ficticio 20',phone:'',priority:'Alta',vor:false,requested:true,arrived:false,requestDate:'2026-08-21',saleDate:'2021-07-07',km:'104000',arrivalDate:'',appointmentDate:'',time:'',partCode:'FIC-1020',part:'Repuesto ficticio 20',repairTime:'',firstConversation:'',comment:'',observations:'Caso ficticio cargado para prueba de agosto',status:'PENDIENTE DE REPUESTO'}
];
const localDemoCases = [
  {order:'LOCAL-DEMO-001',vin:'8AJLOC25000000001',plate:'LD 101 AA',client:'Cliente Local Alvarez',phone:'11 5550 1001',priority:'Urgente',vor:false,requested:true,arrived:false,requestDate:iso(-16),saleDate:'2023-08-18',km:'64200',arrivalDate:'',appointmentDate:'',time:'',partCode:'LD-4101',part:'Compresor de aire acondicionado',repairTime:'3 h',firstConversation:'',comment:'Dato ficticio local para demostración.',observations:'DATOS FICTICIOS - SOLO LOCAL',status:'PENDIENTE DE REPUESTO'},
  {order:'LOCAL-DEMO-002',vin:'8AJLOC25000000002',plate:'LD 202 BB',client:'Cliente Local Benitez',phone:'11 5550 1002',priority:'Alta',vor:false,requested:true,arrived:true,requestDate:iso(-11),saleDate:'2024-02-10',km:'31800',arrivalDate:iso(-3),appointmentDate:'',time:'',partCode:'LD-5202',part:'Sensor de oxígeno',repairTime:'1.5 h',firstConversation:iso(-2),comment:'Cliente contactado; pendiente de confirmar turno.',observations:'DATOS FICTICIOS - SOLO LOCAL',status:'PENDIENTE DE TURNO'},
  {order:'LOCAL-DEMO-003',vin:'8AJLOC25000000003',plate:'LD 303 CC',client:'Cliente Local Castro',phone:'11 5550 1003',priority:'Normal',vor:false,requested:true,arrived:true,requestDate:iso(-14),saleDate:'2022-12-05',km:'78100',arrivalDate:iso(-7),appointmentDate:iso(2),time:'10:30',partCode:'LD-6303',part:'Bomba de agua',repairTime:'2 h',firstConversation:iso(-5),comment:'Turno coordinado para control de temperatura.',observations:'DATOS FICTICIOS - SOLO LOCAL',scheduled:true,status:'PROGRAMADO'},
  {order:'LOCAL-DEMO-004',vin:'8AJLOC25000000004',plate:'LD 404 DD',client:'Cliente Local Duarte',phone:'11 5550 1004',priority:'Urgente',vor:true,requested:true,arrived:true,requestDate:iso(-9),saleDate:'2025-01-22',km:'19200',arrivalDate:iso(-1),appointmentDate:'',time:'',partCode:'LD-7404',part:'Módulo electrónico de transmisión',repairTime:'4 h',firstConversation:'',comment:'Caso VOR ficticio para probar aviso operativo.',observations:'DATOS FICTICIOS - SOLO LOCAL',vorStatus:'NO AVISADO',status:'SIN AVISAR'},
  {order:'LOCAL-DEMO-005',vin:'8AJLOC25000000005',plate:'LD 505 EE',client:'Cliente Local Escobar',phone:'11 5550 1005',priority:'Alta',vor:false,requested:true,arrived:false,requestDate:iso(-6),saleDate:'2021-11-15',km:'96300',arrivalDate:'',appointmentDate:iso(1),time:'14:00',partCode:'LD-8505',part:'Cremallera de dirección',repairTime:'3.5 h',firstConversation:iso(-4),comment:'Turno tomado antes de confirmar disponibilidad.',observations:'DATOS FICTICIOS - SOLO LOCAL',missingSince:iso(-2),status:'TURNO SIN REPUESTO'}
];
const IMPORT_SEED_DATA_VERSION = 'v1';
const IMPORT_SEED_STATE_KEY = `amiun-active-cases-seed-${IMPORT_SEED_DATA_VERSION}`;

const normalizeSeedText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
};

const normalizeSeedDate = value => {
  const raw = normalizeSeedText(value);
  if (!raw) return '';
  const numeric = Number(String(raw).replace(',', '.'));
  if (Number.isFinite(numeric) && numeric > 1 && numeric < 100000) {
    const date = new Date((numeric - 25569) * 86400 * 1000);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return raw;
};

const normalizeSeedTime = value => {
  const raw = normalizeSeedText(value);
  if (!raw) return '';
  const numeric = Number(String(raw).replace(',', '.'));
  if (Number.isFinite(numeric) && numeric >= 0 && numeric < 1) {
    const totalMinutes = Math.round(((numeric * 24 * 60) % (24 * 60)));
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const rawTime = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::\d{2})?$/);
  return rawTime ? rawTime[0].slice(0, 5) : '';
};

const normalizeSeedBoolean = value => {
  if (typeof value === 'boolean') return value;
  const token = normalizeSeedText(value).toUpperCase();
  return ['1', 'SI', 'SÍ', 'TRUE', 'VERDADERO', 'YES', 'ARRIBADO', 'ARRIBADA', 'CONFIRMADO', 'CONFIRMADA'].includes(token);
};

const pickSeedValue = (row, keys, fallback = '') => {
  for (const key of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, key)) {
      const value = normalizeSeedText(row[key]);
      if (value !== '' && value !== '-') return value;
    }
  }
  for (const key of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, key)) {
      const value = normalizeSeedText(row[key]);
      if (value !== '') return value;
    }
  }
  return fallback;
};

const normalizeImportedOrder = (value, index) => {
  const raw = normalizeSeedText(value);
  return raw && raw !== '-' ? raw : `SIN-OR-${String(index + 1).padStart(4, '0')}`;
};

const activeSeedCases = Array.isArray(window.AMIUN_ACTIVE_CASES_SEED_20260818)
  ? window.AMIUN_ACTIVE_CASES_SEED_20260818
      .map((row, index) => {
        if (!row || typeof row !== 'object') return null;
        const order = normalizeImportedOrder(
          pickSeedValue(row, ['order', 'nroOr', 'orderNumber', 'NRO OR', 'NRO_OR', 'NROOR']),
          index
        );
        return {
          order,
          vin: normalizeSeedText(pickSeedValue(row, ['vin', 'VIN'])),
          plate: normalizeSeedText(pickSeedValue(row, ['plate', 'PATENTE', 'patente'])),
          client: normalizeSeedText(pickSeedValue(row, ['client', 'CLIENTE', 'cliente'])),
          phone: normalizeSeedText(pickSeedValue(row, ['phone', 'TELÉFONO', 'TELEFONO', 'telefono'])),
          priority: normalizeSeedText(pickSeedValue(row, ['priority', 'PRIORIDAD', 'prioridad']), 'Normal'),
          vor: normalizeSeedBoolean(pickSeedValue(row, ['vor', 'VOR', 'isVor'])),
          requested: true,
          observations: normalizeSeedText(pickSeedValue(row, ['observations', 'OBSERVACIONES', 'observaciones'])),
          partCode: normalizeSeedText(pickSeedValue(row, ['partCode', 'CÓDIGO REPUESTO', 'CODIGO REPUESTO', 'codigoRepuesto', 'codigoRepuesto'])),
          part: normalizeSeedText(pickSeedValue(row, ['part', 'DESCRIPCIÓN REPUESTO', 'descripcionRepuesto', 'partDescription'])),
          repairTime: normalizeSeedText(pickSeedValue(row, ['repairTime', 'TIEMPO DE REPARACIÓN', 'tiempoReparacion', 'TIEMPO DE REPARACION'])),
          requestDate: normalizeSeedDate(pickSeedValue(row, ['requestDate', 'INGRESOS', 'ingresos', 'fechaPedido', 'fecha_ingreso', 'fechaIngreso'])),
          saleDate: normalizeSeedDate(pickSeedValue(row, ['saleDate', 'FECHA DE VENTA', 'fechaVenta', 'fecha_venta'])),
          km: normalizeSeedText(pickSeedValue(row, ['km', 'KM', 'KILOMETRAJE', 'kilometraje'])),
          arrivalDate: normalizeSeedDate(pickSeedValue(row, ['arrivalDate', 'FECHA DE ARRIBO', 'fechaArribo', 'arriboDate'])),
          arrived: normalizeSeedBoolean(pickSeedValue(row, ['arrived', 'ARRIBO', 'arribo', 'isArrived'])),
          appointmentDate: normalizeSeedDate(pickSeedValue(row, ['appointmentDate', 'FECHA TURNO', 'fechaTurno'])),
          time: normalizeSeedTime(pickSeedValue(row, ['time', 'HORA TURNO', 'horaTurno', 'appointmentTime'])),
          status: normalizeSeedText(pickSeedValue(row, ['status', 'ESTADO', 'estado']), 'PENDIENTE DE REPUESTO'),
          documentUrl: normalizeSeedText(pickSeedValue(row, ['documentUrl', 'DOCUMENTO JPG', 'DOCUMENTO_JPG', 'documento'])),
          importedAt: normalizeSeedText(pickSeedValue(row, ['importedAt'])),
          importedFrom: normalizeSeedText(pickSeedValue(row, ['importedFrom'])),
          nroOr: order,
          patente: normalizeSeedText(pickSeedValue(row, ['plate', 'PATENTE', 'patente'])),
          cliente: normalizeSeedText(pickSeedValue(row, ['client', 'CLIENTE', 'cliente'])),
          telefono: normalizeSeedText(pickSeedValue(row, ['phone', 'TELÉFONO', 'TELEFONO', 'telefono'])),
          codigoRepuesto: normalizeSeedText(pickSeedValue(row, ['partCode', 'CÓDIGO REPUESTO', 'CODIGO REPUESTO', 'codigoRepuesto'])),
          descripcionRepuesto: normalizeSeedText(pickSeedValue(row, ['part', 'DESCRIPCIÓN REPUESTO', 'descripcionRepuesto', 'partDescription'])),
          prioridad: normalizeSeedText(pickSeedValue(row, ['priority', 'PRIORIDAD', 'prioridad']), 'Normal'),
          fechaPedido: normalizeSeedDate(pickSeedValue(row, ['requestDate', 'INGRESOS', 'fechaPedido'])),
          fechaArribo: normalizeSeedDate(pickSeedValue(row, ['arrivalDate', 'FECHA DE ARRIBO', 'fechaArribo'])),
          arribo: normalizeSeedBoolean(pickSeedValue(row, ['arrived', 'ARRIBO', 'arribo'])),
          fechaTurno: normalizeSeedDate(pickSeedValue(row, ['appointmentDate', 'FECHA TURNO', 'fechaTurno'])),
          horaTurno: normalizeSeedTime(pickSeedValue(row, ['time', 'HORA TURNO', 'horaTurno', 'appointmentTime'])),
          estado: normalizeSeedText(pickSeedValue(row, ['status', 'ESTADO', 'estado']), 'PENDIENTE DE REPUESTO'),
          createdAt: normalizeSeedText(pickSeedValue(row, ['createdAt'])),
          updatedAt: normalizeSeedText(pickSeedValue(row, ['updatedAt']))
        };
      }).filter(Boolean)
  : [];
const loadStoredArray = (key,fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch(error) {
    console.error(`[Datos] No se pudo leer ${key}`,error);
    return fallback;
  }
};
const amiunSupabaseRestHeaders = {
  apikey: AMIUN_SUPABASE_PUBLISHABLE_KEY,
  Authorization: 'Bearer ' + AMIUN_SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
  'X-Amiun-Session': ''
};
const splitEmailAddresses=value=>String(value||'').split(/[;,\n]+/).map(item=>item.trim().toLowerCase()).filter(Boolean);
const validEmailAddress=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
const normalizePartsOrderEmailSettings=value=>{
  const source=value&&typeof value==='object'?value:{};
  return {
    to:[...new Set(Array.isArray(source.to)?source.to.flatMap(splitEmailAddresses):splitEmailAddresses(source.to))].filter(validEmailAddress),
    cc:[...new Set(Array.isArray(source.cc)?source.cc.flatMap(splitEmailAddresses):splitEmailAddresses(source.cc))].filter(validEmailAddress)
  };
};
const loadPartsOrderEmailSettings=()=>{
  try{return normalizePartsOrderEmailSettings(JSON.parse(localStorage.getItem(PARTS_ORDER_EMAIL_SETTINGS_KEY)||'{}'))}
  catch(error){console.warn('[Configuración] No se pudieron leer los destinatarios de Repuestos',error);return {to:[],cc:[]}}
};
let partsOrderEmailSettings=loadPartsOrderEmailSettings();
const amiunSupabaseClient = !AMIUN_LOCAL_DEMO_MODE && Boolean(AMIUN_SUPABASE_URL && AMIUN_SUPABASE_PUBLISHABLE_KEY);
// La aplicación usa una sesión propia. No expone correos ni depende de Supabase Auth.
let amiunCustomSessionToken = sessionStorage.getItem('amiun-app-session-token') || '';
amiunSupabaseRestHeaders['X-Amiun-Session'] = amiunCustomSessionToken;
const amiunSupabaseAuthClient = null;
const amiunSupabaseRealtimeClient = null;
function updateAmiunRestAuthorization(token){
  amiunSupabaseRestHeaders.Authorization = `Bearer ${AMIUN_SUPABASE_PUBLISHABLE_KEY}`;
  amiunCustomSessionToken = typeof token === 'string' ? token : '';
  amiunSupabaseRestHeaders['X-Amiun-Session'] = amiunCustomSessionToken;
  if(amiunCustomSessionToken)sessionStorage.setItem('amiun-app-session-token',amiunCustomSessionToken);
  else sessionStorage.removeItem('amiun-app-session-token');
}
let amiunRemoteSyncReady = false;
let amiunRemotePullBusy = false;
let amiunRemoteSyncTimer = 0;
let amiunFastSyncTimer = 0;
let amiunRemoteProbeBusy = false;
let amiunRealtimeChannel = null;
let amiunRealtimeRefreshTimer = 0;
let amiunRealtimeAppStateRefreshTimer = 0;
let amiunLastRemoteSignature = '';
let amiunRemoteCasesMarker = '';
let amiunRemoteAppStateMarker = '';
let amiunLastRemoteCasesUpdatedAt = '';
let amiunPendingCaseSync = loadStoredArray(AMIUN_PENDING_CASES_KEY,[]);
let amiunPendingCaseSyncBusy = false;
let amiunPendingSyncNoticeAt = 0;
let amiunRecoverySnapshotBusy = false;
let amiunRecoverySnapshotLoaded = false;
let amiunRecoveryMode = false;
const amiunCrossTabSyncChannel = amiunSupabaseClient && typeof BroadcastChannel === 'function'
  ? new BroadcastChannel('amiun-shared-data-live-v1')
  : null;
function announceSharedDataChange(scope='all'){
  try{amiunCrossTabSyncChannel?.postMessage({scope,at:Date.now()})}catch(error){console.warn('[Sincronización] No se pudo avisar a las otras pestañas',error)}
}
function refreshSharedAppState(){
  pullPartsOrderEmailSettings();
  pullRegistryResponsibles();
  pullManualPartsRegistry();
  syncSharedReminders();
}
amiunCrossTabSyncChannel?.addEventListener('message',event=>{
  const scope=event?.data?.scope||'all';
  if(scope==='all'||scope==='cases')pullSharedCasesFromSupabase();
  if(scope==='all'||scope==='app-state')refreshSharedAppState();
});
async function pushPartsOrderEmailSettings(){
  localStorage.setItem(PARTS_ORDER_EMAIL_SETTINGS_KEY,JSON.stringify(partsOrderEmailSettings));
  if(!amiunSupabaseClient)return true;
  try{
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?on_conflict=key`,{
      method:'POST',
      headers:{...amiunSupabaseRestHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({key:PARTS_ORDER_EMAIL_REMOTE_KEY,value:{...partsOrderEmailSettings,registryResponsibles},updated_at:new Date().toISOString()})
    });
    if(!response.ok)throw new Error(await response.text());
    announceSharedDataChange('app-state');
    return true;
  }catch(error){console.warn('[Configuración] No se pudieron compartir los destinatarios de Repuestos',error);return false}
}
async function pullPartsOrderEmailSettings(){
  if(!amiunSupabaseClient)return false;
  try{
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?key=eq.${encodeURIComponent(PARTS_ORDER_EMAIL_REMOTE_KEY)}&select=value`,{headers:amiunSupabaseRestHeaders});
    if(!response.ok)throw new Error(await response.text());
    const rows=await response.json(),remote=normalizePartsOrderEmailSettings(rows?.[0]?.value||{});
    if(remote.to.length||remote.cc.length){
      const changed=JSON.stringify(remote)!==JSON.stringify(partsOrderEmailSettings);
      partsOrderEmailSettings=remote;
      localStorage.setItem(PARTS_ORDER_EMAIL_SETTINGS_KEY,JSON.stringify(partsOrderEmailSettings));
      if(changed&&currentView==='settings'&&typeof renderAfterRemoteSync==='function')renderAfterRemoteSync();
    }
    return true;
  }catch(error){console.warn('[Configuración] No se pudieron leer los destinatarios compartidos de Repuestos',error);return false}
}
const normalizeRegistryResponsibles=value=>{
  const source=Array.isArray(value)?value:Array.isArray(value?.items)?value.items:[];
  const unique=new Map();
  source.forEach(item=>{const name=String(item||'').trim().replace(/\s+/g,' ');if(name&&!unique.has(name.toLocaleLowerCase('es')))unique.set(name.toLocaleLowerCase('es'),name)});
  return [...unique.values()].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
};
async function pushRegistryResponsibles(){
  localStorage.setItem(REGISTRY_RESPONSIBLES_KEY,JSON.stringify(registryResponsibles));
  if(!amiunSupabaseClient)return true;
  try{
    const currentResponse=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?key=eq.${encodeURIComponent(PARTS_ORDER_EMAIL_REMOTE_KEY)}&select=value`,{headers:amiunSupabaseRestHeaders});
    if(!currentResponse.ok)throw new Error(await currentResponse.text());
    const currentRows=await currentResponse.json();
    const sharedEmailSettings=normalizePartsOrderEmailSettings(currentRows?.[0]?.value||partsOrderEmailSettings);
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?on_conflict=key`,{
      method:'POST',
      headers:{...amiunSupabaseRestHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({key:PARTS_ORDER_EMAIL_REMOTE_KEY,value:{...sharedEmailSettings,registryResponsibles},updated_at:new Date().toISOString()})
    });
    if(!response.ok)throw new Error(await response.text());
    announceSharedDataChange('app-state');
    return true;
  }catch(error){console.warn('[Configuración] No se pudieron compartir los responsables de Registro de repuestos',error);return false}
}
async function pullRegistryResponsibles(){
  if(!amiunSupabaseClient)return false;
  try{
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?key=eq.${encodeURIComponent(PARTS_ORDER_EMAIL_REMOTE_KEY)}&select=value`,{headers:amiunSupabaseRestHeaders});
    if(!response.ok)throw new Error(await response.text());
    const rows=await response.json(),remote=normalizeRegistryResponsibles(rows?.[0]?.value?.registryResponsibles||[]);
    if(remote.length){
      const changed=JSON.stringify(remote)!==JSON.stringify(registryResponsibles);
      registryResponsibles=remote;
      localStorage.setItem(REGISTRY_RESPONSIBLES_KEY,JSON.stringify(registryResponsibles));
      if(changed&&['settings','parts-registry','reminders'].includes(currentView)&&typeof renderAfterRemoteSync==='function')renderAfterRemoteSync();
    }
    return true;
  }catch(error){console.warn('[Configuración] No se pudieron leer los responsables compartidos',error);return false}
}
const normalizeManualPartsRegistry=value=>(Array.isArray(value)?value:[])
  .filter(item=>item&&typeof item==='object'&&String(item.id||'').trim())
  .map(item=>({...item,id:String(item.id).trim(),branch:item.branch||'Santa Fe',updatedAt:item.updatedAt||''}));
const manualRegistrySignature=value=>JSON.stringify(normalizeManualPartsRegistry(value).sort((a,b)=>a.id.localeCompare(b.id)));
const mergeManualPartsRegistry=(...sources)=>{
  const merged=new Map();
  sources.flatMap(normalizeManualPartsRegistry).forEach(item=>{
    const previous=merged.get(item.id);
    const previousTime=Date.parse(previous?.updatedAt||'')||0;
    const itemTime=Date.parse(item.updatedAt||'')||0;
    if(!previous||itemTime>=previousTime)merged.set(item.id,item);
  });
  return [...merged.values()].sort((a,b)=>String(b.appointmentDate||b.repairDate||'').localeCompare(String(a.appointmentDate||a.repairDate||''))||a.id.localeCompare(b.id));
};
let manualRegistryPushQueue=Promise.resolve(true);
async function pushManualPartsRegistry(replaceRemote=false){
  localStorage.setItem(MANUAL_PARTS_REGISTRY_KEY,JSON.stringify(manualPartsRegistry));
  if(!amiunSupabaseClient)return true;
  try{
    const currentResponse=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?key=eq.${encodeURIComponent(MANUAL_PARTS_REGISTRY_KEY)}&select=value`,{headers:amiunSupabaseRestHeaders});
    if(!currentResponse.ok)throw new Error(await currentResponse.text());
    const currentRows=await currentResponse.json();
    const merged=replaceRemote?normalizeManualPartsRegistry(manualPartsRegistry):mergeManualPartsRegistry(currentRows?.[0]?.value||[],manualPartsRegistry);
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?on_conflict=key`,{
      method:'POST',
      headers:{...amiunSupabaseRestHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({key:MANUAL_PARTS_REGISTRY_KEY,value:merged,updated_at:new Date().toISOString()})
    });
    if(!response.ok)throw new Error(await response.text());
    announceSharedDataChange('app-state');
    if(manualRegistrySignature(merged)!==manualRegistrySignature(manualPartsRegistry)){
      manualPartsRegistry=merged;
      localStorage.setItem(MANUAL_PARTS_REGISTRY_KEY,JSON.stringify(manualPartsRegistry));
      if(currentView==='parts-registry'&&typeof renderAfterRemoteSync==='function')renderAfterRemoteSync();
    }
    return true;
  }catch(error){console.warn('[Registro de repuestos] No se pudieron compartir los registros sin turno',error);return false}
}
function enqueueManualPartsRegistryPush(replaceRemote=false){
  manualRegistryPushQueue=manualRegistryPushQueue.then(()=>pushManualPartsRegistry(replaceRemote));
  return manualRegistryPushQueue;
}
async function pullManualPartsRegistry(){
  if(!amiunSupabaseClient)return false;
  try{
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?key=eq.${encodeURIComponent(MANUAL_PARTS_REGISTRY_KEY)}&select=value`,{headers:amiunSupabaseRestHeaders});
    if(!response.ok)throw new Error(await response.text());
    const rows=await response.json();
    const remote=normalizeManualPartsRegistry(rows?.[0]?.value||[]);
    if(!remote.length){if(manualPartsRegistry.length)await enqueueManualPartsRegistryPush();return true}
    const merged=mergeManualPartsRegistry(manualPartsRegistry,remote);
    const changed=manualRegistrySignature(merged)!==manualRegistrySignature(manualPartsRegistry);
    const hasLocalOnly=manualRegistrySignature(merged)!==manualRegistrySignature(remote);
    manualPartsRegistry=merged;
    localStorage.setItem(MANUAL_PARTS_REGISTRY_KEY,JSON.stringify(manualPartsRegistry));
    if(hasLocalOnly)await enqueueManualPartsRegistryPush();
    if(changed&&currentView==='parts-registry'&&typeof renderAfterRemoteSync==='function')renderAfterRemoteSync();
    return true;
  }catch(error){console.warn('[Registro de repuestos] No se pudieron leer los registros sin turno compartidos',error);return false}
}
const stableCasesSignature = items => {
  try {
    const canonicalize = value => {
      if(Array.isArray(value))return value.map(canonicalize);
      if(value && typeof value === 'object'){
        return Object.fromEntries(
          Object.keys(value).sort().map(key => [key, canonicalize(value[key])])
        );
      }
      return value;
    };
    return JSON.stringify((Array.isArray(items) ? items : [])
      .map(canonicalize)
      .sort((a,b)=>String(a?.order||'').localeCompare(String(b?.order||''))));
  } catch(error) {
    return `${Date.now()}`;
  }
};
const caseOrderKey = value => String(value?.order_number||value?.order||'').trim().toUpperCase();
function persistPendingCaseSync(){
  try{localStorage.setItem(AMIUN_PENDING_CASES_KEY,JSON.stringify(amiunPendingCaseSync));return true}
  catch(error){console.warn('[Datos] No se pudo guardar la cola local de sincronización',error);return false}
}
function announcePendingCaseSync(){
  const now=Date.now();
  if(now-amiunPendingSyncNoticeAt<60000)return;
  amiunPendingSyncNoticeAt=now;
  if(typeof toast==='function'&&!document.body.classList.contains('auth-locked'))toast('Guardado en este equipo; pendiente de sincronización entre computadoras');
}
function queuePendingCaseRows(rows=[]){
  const merged=new Map((Array.isArray(amiunPendingCaseSync)?amiunPendingCaseSync:[]).map(row=>[caseOrderKey(row),row]).filter(([key])=>key));
  (Array.isArray(rows)?rows:[]).forEach(row=>{
    const key=caseOrderKey(row);
    if(!key||!row?.payload||typeof row.payload!=='object')return;
    const next={...row,order_number:key,updated_at:row.updated_at||new Date().toISOString()};
    const previous=merged.get(key);
    const previousTime=Date.parse(previous?.updated_at||'')||0;
    const nextTime=Date.parse(next.updated_at||'')||0;
    if(!previous||nextTime>=previousTime)merged.set(key,next);
  });
  amiunPendingCaseSync=[...merged.values()];
  persistPendingCaseSync();
  if(Array.isArray(rows)&&rows.length)announcePendingCaseSync();
}
function removePendingCaseRows(rows=[]){
  const sent=new Map((Array.isArray(rows)?rows:[]).map(row=>[caseOrderKey(row),Date.parse(row?.updated_at||'')||0]).filter(([key])=>key));
  amiunPendingCaseSync=(Array.isArray(amiunPendingCaseSync)?amiunPendingCaseSync:[]).filter(row=>{
    const key=caseOrderKey(row),sentAt=sent.get(key);
    if(!sentAt)return true;
    return (Date.parse(row?.updated_at||'')||0)>sentAt;
  });
  persistPendingCaseSync();
}
function pendingCaseRecords(){
  return (Array.isArray(amiunPendingCaseSync)?amiunPendingCaseSync:[])
    .map((row,index)=>normalizeCaseRecord(row?.payload,index))
    .filter(record=>String(record?.order||'').trim());
}
async function flushPendingCaseSync(){
  if(!amiunSupabaseClient||amiunPendingCaseSyncBusy||!amiunPendingCaseSync.length)return false;
  amiunPendingCaseSyncBusy=true;
  const batch=amiunPendingCaseSync.map(row=>({...row,order_number:caseOrderKey(row),updated_at:row.updated_at||new Date().toISOString()}));
  try{
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?on_conflict=order_number`,{
      method:'POST',
      headers:{...amiunSupabaseRestHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify(batch)
    });
    if(!response.ok)throw new Error(await response.text());
    removePendingCaseRows(batch);
    amiunRecoveryMode=false;
    amiunRemoteSyncReady=true;
    announceSharedDataChange('cases');
    return true;
  }catch(error){
    console.warn('[Supabase] La cola local de casos sigue pendiente',error);
    announcePendingCaseSync();
    return false;
  }finally{amiunPendingCaseSyncBusy=false}
}
async function loadRecoverySnapshot(){
  if(amiunRecoverySnapshotLoaded||amiunRecoverySnapshotBusy||(!AMIUN_LOCAL_DEMO_MODE&&cases.length))return false;
  if(AMIUN_LOCAL_DEMO_MODE && localStorage.getItem(AMIUN_LOCAL_RECOVERY_STATE_KEY)===AMIUN_LOCAL_RECOVERY_VERSION && cases.length)return false;
  amiunRecoverySnapshotBusy=true;
  try{
    let snapshot=AMIUN_EMBEDDED_RECOVERY_SNAPSHOT;
    if(!snapshot){
      const response=await fetch(AMIUN_RECOVERY_SNAPSHOT_URL,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      snapshot=await response.json();
    }
    const recoveryRows=(Array.isArray(snapshot?.rows)?snapshot.rows:[])
      .filter(row=>row?.payload&&typeof row.payload==='object')
      .map((row,index)=>{
        const record=normalizeCaseRecord(row.payload,index);
        return {...record,updatedAt:row.updated_at||record.updatedAt};
      });
    if(!recoveryRows.length)throw new Error('Snapshot de recuperación vacío');
    const snapshotByOrder=new Map(recoveryRows.map(record=>[caseOrderKey(record),record]));
    // En local, la exportación es la fuente visible al abrir index.html. Esto
    // evita que casos demo antiguos del navegador reemplacen la recuperación.
    const byOrder=new Map(snapshotByOrder);
    if(!AMIUN_LOCAL_DEMO_MODE)pendingCaseRecords().forEach(record=>byOrder.set(caseOrderKey(record),record));
    cases=[...byOrder.values()];
    amiunRecoveryMode=!AMIUN_LOCAL_DEMO_MODE;
    amiunRecoverySnapshotLoaded=true;
    refreshAutomaticStates({persist:false});
    localStorage.setItem(AMIUN_SHARED_CASES_KEY,JSON.stringify(cases));
    if(AMIUN_LOCAL_DEMO_MODE)localStorage.setItem(AMIUN_LOCAL_RECOVERY_STATE_KEY,AMIUN_LOCAL_RECOVERY_VERSION);
    if(typeof renderAfterRemoteSync==='function'&&!document.body.classList.contains('auth-locked'))renderAfterRemoteSync();
    if(!AMIUN_LOCAL_DEMO_MODE)toast(`Modo recuperación activo: ${cases.length} casos de la copia del 13/10`);
    return true;
  }catch(error){
    console.warn('[Recuperación] No se pudo cargar la copia local publicada',error);
    return false;
  }finally{amiunRecoverySnapshotBusy=false}
}
async function pushSharedCasesToSupabase(sourceCases = cases, changedOrders = null) {
  const changed = changedOrders ? new Set(changedOrders.map(order=>String(order).trim().toUpperCase())) : null;
  const value = (Array.isArray(sourceCases) ? sourceCases : []).filter(item=>{
    const order=String(item?.order||'').trim().toUpperCase();
    return order&&(!changed||changed.has(order));
  });
  if(!value.length)return true;
  const rows=value.map(item=>({
    order_number:String(item.order).trim().toUpperCase(),
    payload:item,
    updated_at:new Date().toISOString()
  }));
  if(!amiunSupabaseClient){
    queuePendingCaseRows(rows);
    return false;
  }
  try {
    const response = await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?on_conflict=order_number`, {
      method: 'POST',
      headers: {
        ...amiunSupabaseRestHeaders,
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(rows)
    });
    if(!response.ok)throw new Error(await response.text());
    removePendingCaseRows(rows);
    amiunLastRemoteSignature = stableCasesSignature(sourceCases);
    amiunRemoteSyncReady = true;
    amiunRecoveryMode = false;
    announceSharedDataChange('cases');
    return true;
  } catch(error) {
    queuePendingCaseRows(rows);
    console.warn('[Supabase] No se pudo guardar la base compartida', error);
    return false;
  }
}
async function pullSharedCasesFromSupabase({full=false}={}) {
  if(!amiunSupabaseClient || amiunRemotePullBusy)return false;
  amiunRemotePullBusy = true;
  try {
    // Después de la primera carga solo pedimos filas nuevas o modificadas.
    // Realtime cubre los cambios normales; la carga completa queda como respaldo.
    const since = !full && amiunLastRemoteCasesUpdatedAt
      ? `&updated_at=gt.${encodeURIComponent(amiunLastRemoteCasesUpdatedAt)}` : '';
    const response = await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?select=order_number,payload,updated_at&order=updated_at.asc${since}`, {
      headers: amiunSupabaseRestHeaders
    });
    if(!response.ok)throw new Error(await response.text());
    const rows = await response.json();
    if(!Array.isArray(rows))throw new Error('Respuesta inválida de Supabase');
    const dataRows = (Array.isArray(rows) ? rows : []).filter(row=>!isRemoteCaseLockRow(row));
    const remoteCases = dataRows.map(row=>row?.payload).filter(item=>item&&typeof item==='object').map(normalizeCaseRecord);
    dataRows.forEach(row=>{if(row.updated_at && row.updated_at>amiunLastRemoteCasesUpdatedAt)amiunLastRemoteCasesUpdatedAt=row.updated_at});
    if(!full && amiunRemoteSyncReady && !remoteCases.length){
      amiunRemoteSyncReady=true;
      return true;
    }
    // Una respuesta vacía puede ser causada por RLS, una cuota agotada o una
    // lectura parcial. Si todavía tenemos datos locales, conservarlos evita
    // que una falla transitoria se convierta en una aparente eliminación.
    if(!remoteCases.length && cases.length){
      console.warn('[Supabase] Respuesta vacía; se conserva la última copia local de casos');
      amiunRemoteSyncReady = false;
      return false;
    }
    if(!remoteCases.length){
      amiunRemoteSyncReady = false;
      return await loadRecoverySnapshot();
    }
    // Las altas y ediciones hechas mientras Supabase estaba restringido viven
    // en la cola local. Se muestran junto con la copia remota y se intentan
    // subir de nuevo cuando el servicio acepta escrituras.
    const pending = pendingCaseRecords();
    if(pending.length){
      const mergedByOrder = new Map(remoteCases.map(record=>[caseOrderKey(record),record]));
      pending.forEach(record=>mergedByOrder.set(caseOrderKey(record),record));
      remoteCases.splice(0,remoteCases.length,...mergedByOrder.values());
    }
    const localSignature = stableCasesSignature(cases);
    if(full || !amiunRemoteSyncReady){
      cases = remoteCases;
    }else{
      const merged = new Map(cases.map(record=>[caseOrderKey(record),record]));
      remoteCases.forEach(record=>merged.set(caseOrderKey(record),record));
      cases = [...merged.values()];
    }
    refreshAutomaticStates({persist:false});
    const remoteSignature = stableCasesSignature(cases);
    if(remoteSignature !== localSignature) {
      localStorage.setItem(AMIUN_SHARED_CASES_KEY, JSON.stringify(cases));
      if(typeof renderAfterRemoteSync === 'function' && !document.body.classList.contains('auth-locked')) renderAfterRemoteSync();
      toast('Base de datos sincronizada con Supabase');
    }
    amiunLastRemoteSignature = remoteSignature;
    amiunRemoteSyncReady = true;
    amiunRecoveryMode = false;
    if(pending.length)void flushPendingCaseSync();
    return true;
  } catch(error) {
    console.warn('[Supabase] No se pudo leer la base compartida', error);
    amiunRemoteSyncReady = false;
    // Si el servicio devuelve 402 por cuota, servimos la última exportación
    // incluida en Vercel. Esto permite consultar y seguir cargando datos sin
    // tocar ni reemplazar la base original.
    return await loadRecoverySnapshot();
  } finally {
    amiunRemotePullBusy = false;
  }
}
async function deleteCaseFromSupabase(order) {
  if(!amiunSupabaseClient||!order)return false;
  try {
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=eq.${encodeURIComponent(String(order).trim().toUpperCase())}`,{method:'DELETE',headers:amiunSupabaseRestHeaders});
    if(!response.ok)throw new Error(await response.text());
    announceSharedDataChange('cases');
    return true;
  } catch(error) {
    console.warn(`[Supabase] No se pudo eliminar ${order}`,error);
    return false;
  }
}
async function renameCaseInSupabase(previousOrder,record) {
  if(!amiunSupabaseClient||!previousOrder||!record?.order)return true;
  try {
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=eq.${encodeURIComponent(String(previousOrder).trim().toUpperCase())}`,{
      method:'PATCH',
      headers:{...amiunSupabaseRestHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({order_number:String(record.order).trim().toUpperCase(),payload:record,updated_at:new Date().toISOString()})
    });
    if(!response.ok)throw new Error(await response.text());
    announceSharedDataChange('cases');
    return true;
  } catch(error) {
    console.warn(`[Supabase] No se pudo cambiar el NRO OR ${previousOrder}`,error);
    return false;
  }
}
async function clearCasesInSupabase() {
  if(!amiunSupabaseClient)return false;
  try {
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=not.is.null`,{method:'DELETE',headers:amiunSupabaseRestHeaders});
    if(!response.ok)throw new Error(await response.text());
    announceSharedDataChange('cases');
    return true;
  } catch(error) {
    console.warn('[Supabase] No se pudo vaciar la base de casos',error);
    return false;
  }
}
function scheduleRealtimeCasesRefresh() {
  clearTimeout(amiunRealtimeRefreshTimer);
  amiunRealtimeRefreshTimer=setTimeout(()=>pullSharedCasesFromSupabase(),80);
}
function handleRealtimeCaseChange(change){
  const row=change?.new?.order_number?change.new:change?.old;
  if(isRemoteCaseLockRow(row)){
    const order=row?.payload?.order||orderFromRemoteCaseLockKey(row?.order_number);
    if(change?.eventType==='DELETE')forgetCaseLock(order);
    else syncRemoteCaseLocks([row]);
    return;
  }
  scheduleRealtimeCasesRefresh();
}
function scheduleRealtimeAppStateRefresh() {
  clearTimeout(amiunRealtimeAppStateRefreshTimer);
  amiunRealtimeAppStateRefreshTimer=setTimeout(refreshSharedAppState,80);
}
const remoteUpdateMarker=(rows,key)=>JSON.stringify((Array.isArray(rows)?rows:[])
  .map(row=>[String(row?.[key]||''),String(row?.updated_at||'')])
  .sort((a,b)=>a[0].localeCompare(b[0])));
async function probeRemoteChanges({force=false}={}){
  if(!amiunSupabaseClient||amiunRemoteProbeBusy)return;
  amiunRemoteProbeBusy=true;
  try{
    const [casesResponse,stateResponse,locksResponse]=await Promise.all([
      fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?select=order_number,updated_at&order=order_number.asc`,{headers:amiunSupabaseRestHeaders}),
      fetch(`${AMIUN_SUPABASE_URL}/rest/v1/app_state?select=key,updated_at&order=key.asc`,{headers:amiunSupabaseRestHeaders}),
      fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=like.${encodeURIComponent(CASE_LOCK_REMOTE_PREFIX+'*')}&select=order_number,payload,updated_at`,{headers:amiunSupabaseRestHeaders})
    ]);
    if(casesResponse.ok){
      const marker=remoteUpdateMarker((await casesResponse.json()).filter(row=>!isRemoteCaseLockRow(row)),'order_number');
      const changed=Boolean(amiunRemoteCasesMarker&&marker!==amiunRemoteCasesMarker);
      amiunRemoteCasesMarker=marker;
      if(force||changed)pullSharedCasesFromSupabase();
    }
    if(stateResponse.ok){
      const marker=remoteUpdateMarker(await stateResponse.json(),'key');
      const changed=Boolean(amiunRemoteAppStateMarker&&marker!==amiunRemoteAppStateMarker);
      amiunRemoteAppStateMarker=marker;
      if(force||changed)refreshSharedAppState();
    }
    if(locksResponse.ok)syncRemoteCaseLocks(await locksResponse.json(),true);
  }catch(error){console.warn('[Sincronización] No se pudo comprobar si hay cambios nuevos',error)}
  finally{amiunRemoteProbeBusy=false}
}
function startSharedCasesSync() {
  if(!amiunSupabaseClient || amiunRemoteSyncTimer)return;
  pullSharedCasesFromSupabase({full:true});
  pullPartsOrderEmailSettings();
  pullRegistryResponsibles();
  pullManualPartsRegistry();
  syncSharedReminders();
  if(amiunSupabaseRealtimeClient&&!amiunRealtimeChannel){
    amiunRealtimeChannel=amiunSupabaseRealtimeClient
      .channel('amiun-shared-data-live')
      .on('postgres_changes',{event:'*',schema:'public',table:AMIUN_CASES_TABLE},handleRealtimeCaseChange)
      .on('postgres_changes',{event:'*',schema:'public',table:'app_state'},scheduleRealtimeAppStateRefresh)
      .subscribe(status=>{
        if(status==='SUBSCRIBED')probeRemoteChanges({force:true});
      });
  }
  amiunRemoteSyncTimer = setInterval(()=>{pullSharedCasesFromSupabase();pullPartsOrderEmailSettings();pullRegistryResponsibles();pullManualPartsRegistry();syncSharedReminders()}, AMIUN_SHARED_SYNC_INTERVAL);
  amiunFastSyncTimer = setInterval(probeRemoteChanges, AMIUN_FAST_SYNC_INTERVAL);
  probeRemoteChanges();
  window.addEventListener('focus', ()=>probeRemoteChanges({force:true}));
  window.addEventListener('online', ()=>probeRemoteChanges({force:true}));
}
const normalizeCaseRecord = (record,index) => {
  const source = record && typeof record === 'object' ? record : {};
  const text = (value,fallback='') => value === null || value === undefined ? fallback : String(value);
  const first = (...keys) => {
    for (const key of keys) {
      const value = source[key];
      if (value !== null && value !== undefined && String(value).trim() !== '') return value;
    }
    return '';
  };
  const normalizedAppointmentDate = normalizeSeedDate(first('appointmentDate','fechaTurno','FECHA TURNO'));
  const normalizedTime = normalizeSeedTime(first('time','horaTurno','HORA TURNO','appointmentTime'));
  const normalizedArrived = source.arrived === true || normalizeSeedBoolean(first('arribo','ARRIBO','isArrived'));
  const normalizedScheduled = source.scheduled === true || normalizeSeedBoolean(first('programado','PROGRAMADO','programmed'))
    ? true
    : source.scheduled === false ? false : undefined;
  return {
    ...source,
    branch:text(source.branch,'Santa Fe') || 'Santa Fe',
    order:text(first('order','nroOr','NRO OR'),`SIN-OR-${index+1}`),
    vin:text(source.vin),
    plate:text(source.plate),
    client:text(source.client),
    phone:text(source.phone),
    priority:text(source.priority,'Normal') || 'Normal',
    requestDate:text(source.requestDate),
    saleDate:text(source.saleDate),
    km:text(source.km),
    arrivalDate:normalizeSeedDate(first('arrivalDate','fechaArribo','FECHA DE ARRIBO')),
    appointmentDate:normalizedAppointmentDate,
    time:normalizedTime,
    partCode:text(source.partCode),
    part:text(source.part,'Sin especificar') || 'Sin especificar',
    repairTime:text(source.repairTime),
    observations:text(source.observations),
    comment:text(source.comment),
    releasedStatus:source.status==='DADO DE BAJA'?(source.releasedStatus==='AVISADO'?'AVISADO':'NO AVISADO'):undefined,
    status:source.vor===true&&normalizedArrived&&source.status!=='REALIZADO'&&source.status!=='DADO DE BAJA'
      ? (source.vorStatus==='AVISADO'?'AVISADO':'SIN AVISAR')
      : (text(first('status','estado','ESTADO'),'PENDIENTE DE REPUESTO') || 'PENDIENTE DE REPUESTO'),
    requested:source.requested !== false,
    arrived:normalizedArrived,
    ...(normalizedScheduled === undefined ? {} : {scheduled:normalizedScheduled}),
    vor:source.vor === true
  };
};
const demoQuarterKey = 'warranty-demo-q3-2026-v1';
const augustPendingDemoKey = 'warranty-demo-august-pending-2026-v1';
if(AMIUN_LOCAL_DEMO_MODE && localStorage.getItem(AMIUN_LOCAL_RECOVERY_STATE_KEY)!==AMIUN_LOCAL_RECOVERY_VERSION){
  // Descarta la copia demo anterior para que la primera apertura importe el
  // contenido real de recovery-case-records.json.
  localStorage.removeItem(AMIUN_SHARED_CASES_KEY);
}
if(localStorage.getItem('amiun-data-reset-version')!==AMIUN_DATA_RESET_VERSION){
  [
    // La copia local de casos es un respaldo de emergencia. Solo se puede
    // limpiar automáticamente en el modo demo local; en producción nunca se
    // debe reemplazar por vacío durante una actualización de la aplicación.
    ...(AMIUN_LOCAL_DEMO_MODE && window.location.protocol !== 'file:' ? [AMIUN_SHARED_CASES_KEY] : []),
    'parts-registry-manual',
    'amiun-operational-reminders-v1',
    'amiun-deleted-case-audit-v1',
    'amiun-case-locks-v1'
  ].forEach(key=>localStorage.removeItem(key));
  localStorage.setItem('amiun-data-reset-version',AMIUN_DATA_RESET_VERSION);
}
// En producción, `warranty-cases` es la última copia disponible si Supabase
// no responde. Nunca se debe vaciar al iniciar la aplicación.
localStorage.removeItem(IMPORT_SEED_STATE_KEY);
localStorage.removeItem(demoQuarterKey);
localStorage.removeItem(augustPendingDemoKey);
const cachedSharedCases = loadStoredArray(AMIUN_SHARED_CASES_KEY,[])
  .filter(item=>item&&typeof item==='object'&&String(item.order||'').trim())
  .map((item,index)=>normalizeCaseRecord(item,index));
// En la primera apertura local se importa la recuperación. Luego se conserva
// la copia del navegador para que los cambios locales sigan disponibles.
let cases = cachedSharedCases;
const caseBranchMigrationNeeded=!localStorage.getItem(CASE_BRANCH_MIGRATION_KEY);
if(caseBranchMigrationNeeded){
  cases.forEach(record=>{record.branch='Santa Fe'});
  localStorage.setItem(CASE_BRANCH_MIGRATION_KEY,'done');
  localStorage.setItem(AMIUN_SHARED_CASES_KEY,JSON.stringify(cases));
}
if(caseBranchMigrationNeeded&&amiunSupabaseClient)setTimeout(()=>{void pushSharedCasesToSupabase(cases)},0);
let manualPartsRegistry = normalizeManualPartsRegistry(loadStoredArray(MANUAL_PARTS_REGISTRY_KEY,[]));
const activeManualPartsRegistry=()=>manualPartsRegistry.filter(item=>!item.deletedAt);
const REMINDERS_KEY='amiun-operational-reminders-v1';
let reminders=loadStoredArray(REMINDERS_KEY,[]).map(item=>({...item,branch:item.branch||'Santa Fe'}));
const REMINDER_REMOTE_PREFIX='operational-reminder:';
const REMINDER_PENDING_KEY=REMINDERS_KEY+'-pending';
let reminderPending=loadStoredArray(REMINDER_PENDING_KEY,[]);
let reminderSavedSnapshot=new Map(reminders.map(item=>[item.id,JSON.stringify(item)]));
let reminderSyncBusy=false,reminderSyncReady=false,reminderSyncError=false;
const DELETED_CASE_AUDIT_KEY='amiun-deleted-case-audit-v1';
let deletedCaseAudit=loadStoredArray(DELETED_CASE_AUDIT_KEY,[]);
const CASE_LOCKS_KEY='amiun-case-locks-v1';
const CASE_LOCK_TAB_KEY='amiun-case-lock-tab-v1';
const CASE_LOCK_REMOTE_PREFIX='__AMIUN_CASE_LOCK__:';
const CASE_LOCK_TTL=120000;
const CASE_LOCK_HEARTBEAT=20000;
const caseLockTabId=sessionStorage.getItem(CASE_LOCK_TAB_KEY)||(crypto.randomUUID?.()||`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`);
sessionStorage.setItem(CASE_LOCK_TAB_KEY,caseLockTabId);
let activeCaseLockOrder='';
const pendingCaseLockOrders=new Set();
let currentView = 'dashboard';
let settingsPanel = 'email';
let query = '';
let managedOrder = '';
let turnFilter = 'all';
let turnsSort = 'days-desc';
let partsFilter = 'all';
let partsSort = 'days-desc';
let vorFilter = 'all';
let summaryMode = 'bottlenecks';
let summaryVorFilter = 'all';
let databaseVorFilter = 'all';
const DATABASE_PAGE_SIZE = 100;
let databasePage = 1;
let summaryToyota10Filter = 'all';
let databaseToyota10Filter = 'all';
let databaseBranchFilter = 'all';
let partsToyota10Filter = 'all';
let turnsToyota10Filter = 'all';
let calendarMode = 'week';
let calendarOffset = 0;
let calendarPriority = '';
let selectedExecutionDate = iso(0);
let pendingResultsOpen = false;
let pendingTurnAlertsExpanded = true;
let pendingDepositAlertsExpanded = true;
let pendingReminderAlertsExpanded = true;
let pendingPartCodeAlertsExpanded = true;
let reminderStatusFilter = 'active';
let reminderCategoryFilter = '';
let reminderSearch = '';
let reminderAlertTimer = 0;
let reminderAlertOpening = false;
let executionReportDate = iso(0);
let weeklyReportDate = iso(0);
let selectedRegistryDate = iso(0);
let registryMode = 'records';
let registryLabelOrders = ['', '', '', ''];
let depositQuery = '';
let depositStatusFilter = '';
let depositDateFrom = '';
let depositDateTo = '';
let selectedCalendarOrder = '';
let selectedDatabaseOrder = '';
let selectedTurnOrder = '';
let selectedMissingOrder = '';
let selectedPartCommentOrder = '';
let editingDatabaseOrder = '';
let selectedRegistryKey = '';
let historyQuery = '';
let historyActionFilter = '';
let historyTypeFilter = '';
let historyBranchFilter = 'all';
let selectedHistoryId = '';
const DEFAULT_REGISTRY_RESPONSIBLES=['BUIATI E.','SERVIN D.','GIMENEZ M.','ROJAS N.','LOPEZ J.','ARAGON L.','DELGADO J.','VEGA J.','CROPPI M.','ALAGUIBE B.','IBALO E.','DOMINGUEZ A.','ARGAÑARAZ N.','DOLDAN S.','MENDOZA J.','BENITEZ T.','ROBLES U.','MORRO M.','SANCHEZ A.','WALEMBERG H.','SARLA A.','IFRAM A.','DOELO D.','CRUDO R.','CASTILLO M.'];
let registryResponsibles=(()=>{try{const stored=normalizeRegistryResponsibles(JSON.parse(localStorage.getItem(REGISTRY_RESPONSIBLES_KEY)||'[]'));return stored.length?stored:normalizeRegistryResponsibles(DEFAULT_REGISTRY_RESPONSIBLES)}catch(error){return normalizeRegistryResponsibles(DEFAULT_REGISTRY_RESPONSIBLES)}})();
const views = [
  {group:'GENERAL',id:'dashboard',label:'Resumen',icon:'RE'},
  {id:'database',label:'Base de datos',icon:'BD'},
  {id:'reminders',label:'Recordatorios',icon:'RC'},
  {group:'OPERACIÓN',id:'parts',label:'Repuestos',icon:'RP'},
  {id:'appointments',label:'Turnos',icon:'TU'},
  {id:'today-appointments',label:'Ejecución de turnos',icon:'ET'},
  {id:'parts-registry',label:'Registro de repuestos',icon:'RR'},
  {group:'EXCEPCIONES',id:'missing-parts',label:'Turnos sin repuestos',icon:'TS'},
  {id:'released',label:'Dados de baja',icon:'DB'},
  {id:'vor',label:'VOR',icon:'VR'},
  {group:'SISTEMA',id:'history',label:'Historial',icon:'HT'},
  {id:'settings',label:'Configuración',icon:'CF'}
];
const page = document.getElementById('page');
const AUDIT_IGNORED_FIELDS=new Set(['auditHistory','updatedAt']);
const AUDIT_FIELD_LABELS={order:'NRO OR',vin:'VIN',plate:'Patente',client:'Cliente',phone:'Teléfono',priority:'Prioridad',vor:'Caso VOR',requested:'Pedido de repuesto',arrived:'Arribo',requestDate:'Fecha del pedido',arrivalDate:'Fecha de arribo',saleDate:'Fecha de venta',km:'Kilometraje',appointmentDate:'Fecha del turno',time:'Hora del turno',scheduled:'Programado',programmedAt:'Fecha de programación',firstConversation:'Primera conversación',comment:'Comentario de seguimiento',appointmentObservations:'Observaciones de cita',observations:'Observaciones',partCode:'Código de repuesto',part:'Descripción del repuesto',repairTime:'Tiempo de reparación',partOrderRequestedAt:'Pedido enviado',partOrderRequestedBy:'Pedido enviado por',partOrderRequestedTo:'Destinatarios del pedido',partOrderRequestedCc:'Copias del pedido',status:'Estado',vorStatus:'Estado VOR',cancelReason:'Motivo de baja',releasedStatus:'Gestión de baja',missingReason:'Motivo sin repuesto',depositStatus:'Estado de depósito',registryOrder:'N.º de orden del turno',repairDate:'Fecha de reparación',arrivalKm:'Kilometraje de ingreso',registryResponsible:'Responsable',executionStatus:'Ejecución del turno',executionDate:'Fecha de ejecución',executionTime:'Hora de ejecución',separateScheduleReason:'Motivo de programación separada'};
const auditValue=value=>{
  if(value===true)return 'Sí';
  if(value===false)return 'No';
  if(value===null||value===undefined||value==='')return 'Sin dato';
  if(Array.isArray(value))return `${value.length} registro${value.length===1?'':'s'}`;
  if(typeof value==='object')return 'Información actualizada';
  return String(value);
};
const auditActor=()=>{
  const username=sessionStorage.getItem('amiun-auth-session')||'Sistema';
  return typeof APPLICATION_USERS!=='undefined'&&APPLICATION_USERS[username]?.displayName
    ? APPLICATION_USERS[username].displayName
    : username==='fneyra'?'Fneyra':username;
};
function saveDeletedCaseAudit(){localStorage.setItem(DELETED_CASE_AUDIT_KEY,JSON.stringify(deletedCaseAudit))}
function recordDeletedCaseAudit(record,action='Caso eliminado'){
  if(!record)return;
  deletedCaseAudit.unshift({
    id:`DEL-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    at:new Date().toISOString(),
    user:auditActor(),
    action,
    deleted:true,
    order:record.order,
    branch:record.branch||'Santa Fe',
    plate:record.plate,
    client:record.client,
    currentStatus:'ELIMINADO',
    snapshot:{vin:record.vin,phone:record.phone,priority:record.priority,partCode:record.partCode,part:record.part,status:record.status},
    changes:[{key:'deleted',field:'Eliminación definitiva',before:'Caso activo',after:'Caso eliminado'}]
  });
  saveDeletedCaseAudit();
}
function readCaseLocks(){
  let locks={};
  try{locks=JSON.parse(localStorage.getItem(CASE_LOCKS_KEY)||'{}')||{}}catch(error){locks={}}
  const now=Date.now();
  Object.keys(locks).forEach(order=>{if(!locks[order]?.expiresAt||locks[order].expiresAt<=now)delete locks[order]});
  return locks;
}
function writeCaseLocks(locks){localStorage.setItem(CASE_LOCKS_KEY,JSON.stringify(locks))}
function caseLockFor(order){return readCaseLocks()[order]||null}
const remoteCaseLockKey=order=>`${CASE_LOCK_REMOTE_PREFIX}${String(order||'').trim().toUpperCase()}`;
const orderFromRemoteCaseLockKey=key=>String(key||'').startsWith(CASE_LOCK_REMOTE_PREFIX)?String(key).slice(CASE_LOCK_REMOTE_PREFIX.length):'';
const isRemoteCaseLockRow=row=>String(row?.order_number||'').startsWith(CASE_LOCK_REMOTE_PREFIX)||row?.payload?.__caseLock===true;
function rememberCaseLock(lock){
  if(!lock?.order)return;
  const locks=readCaseLocks();
  if(lock.expiresAt>Date.now())locks[lock.order]=lock;
  else delete locks[lock.order];
  writeCaseLocks(locks);
}
function forgetCaseLock(order,tabId=''){
  const locks=readCaseLocks();
  if(locks[order]&&(!tabId||locks[order].tabId===tabId)){delete locks[order];writeCaseLocks(locks)}
}
async function readRemoteCaseLock(order){
  if(!amiunSupabaseClient)return caseLockFor(order);
  const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=eq.${encodeURIComponent(remoteCaseLockKey(order))}&select=payload,updated_at`,{headers:amiunSupabaseRestHeaders});
  if(!response.ok)throw new Error(await response.text());
  const row=(await response.json())?.[0];
  return row?{...(row.payload||{}),remoteUpdatedAt:row.updated_at}:null;
}
function loseActiveCaseLock(order,lock){
  if(activeCaseLockOrder!==order)return;
  activeCaseLockOrder='';
  selectedDatabaseOrder='';selectedTurnOrder='';selectedMissingOrder='';selectedPartCommentOrder='';selectedRegistryKey='';editingDatabaseOrder='';
  render();showCaseLockNotice(order,lock||{user:'Otro usuario',context:'Ficha del caso',at:new Date().toISOString()});
}
function syncRemoteCaseLocks(rows=[],authoritative=false){
  const remoteOrders=new Set();
  rows.forEach(row=>{
    const lock=row?.payload;
    const order=lock?.order||orderFromRemoteCaseLockKey(row?.order_number);
    if(!order)return;
    remoteOrders.add(order);
    if(lock?.expiresAt>Date.now())rememberCaseLock({...lock,order});
    else forgetCaseLock(order);
    if(activeCaseLockOrder===order&&lock?.expiresAt>Date.now()&&lock.tabId!==caseLockTabId)loseActiveCaseLock(order,lock);
  });
  const locks=readCaseLocks();
  if(authoritative)Object.keys(locks).forEach(order=>{
    if(locks[order]?.remote&&!remoteOrders.has(order))delete locks[order];
  });
  writeCaseLocks(locks);
}
function showCaseLockNotice(order,lock){
  document.querySelector('.case-lock-backdrop')?.remove();
  const backdrop=document.createElement('div');
  backdrop.className='case-lock-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  const opened=new Date(lock?.at||Date.now());
  const openedAt=Number.isNaN(opened.getTime())?'hora no disponible':new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit'}).format(opened);
  const owner=lock?.user||'Otro usuario';
  backdrop.innerHTML=`<section class="case-lock-dialog"><header><span>CONTROL DE CONCURRENCIA</span><button type="button" data-close-case-lock aria-label="Cerrar">×</button></header><div class="case-lock-lead"><strong aria-hidden="true">!</strong><div><h2>La ficha ${escapeHtml(lock?.label||order)} está en uso</h2><p>Para evitar que dos personas sobrescriban información, la edición quedó reservada temporalmente.</p></div></div><dl><div><dt>RESPONSABLE</dt><dd>${escapeHtml(owner)}${owner===auditActor()?' · otra pestaña':''}</dd></div><div><dt>SECCIÓN</dt><dd>${escapeHtml(lock?.context||'Ficha del caso')}</dd></div><div><dt>DESDE</dt><dd>${escapeHtml(openedAt)}</dd></div></dl><aside>La reserva se libera al cerrar la ficha y vence automáticamente si la sesión deja de responder.</aside><footer><button class="primary-button" type="button" data-close-case-lock>Entendido</button></footer></section>`;
  document.body.appendChild(backdrop);
  const onKeydown=event=>{if(event.key==='Escape')close()};
  const close=()=>{document.removeEventListener('keydown',onKeydown);backdrop.remove()};
  document.addEventListener('keydown',onKeydown);
  backdrop.querySelectorAll('[data-close-case-lock]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  backdrop.querySelector('[data-close-case-lock]')?.focus();
}
async function acquireCaseLock(order,context='Ficha del caso',label=order){
  if(!order)return false;
  if(pendingCaseLockOrders.has(order))return false;
  pendingCaseLockOrders.add(order);
  const locks=readCaseLocks(),existing=locks[order];
  if(!amiunSupabaseClient){
    if(existing&&existing.tabId!==caseLockTabId){pendingCaseLockOrders.delete(order);showCaseLockNotice(order,existing);return false}
    if(activeCaseLockOrder&&activeCaseLockOrder!==order)releaseCaseLock(activeCaseLockOrder);
    const now=Date.now(),lock={order,label,user:auditActor(),tabId:caseLockTabId,context,at:existing?.at||new Date(now).toISOString(),expiresAt:now+CASE_LOCK_TTL};
    locks[order]=lock;writeCaseLocks(locks);activeCaseLockOrder=order;pendingCaseLockOrders.delete(order);return true;
  }
  if(activeCaseLockOrder&&activeCaseLockOrder!==order)releaseCaseLock(activeCaseLockOrder);
  const now=Date.now(),lock={__caseLock:true,remote:true,order,label,user:auditActor(),tabId:caseLockTabId,context,at:new Date(now).toISOString(),expiresAt:now+CASE_LOCK_TTL};
  try{
    const insertResponse=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?on_conflict=order_number`,{
      method:'POST',headers:{...amiunSupabaseRestHeaders,Prefer:'resolution=ignore-duplicates,return=representation'},
      body:JSON.stringify({order_number:remoteCaseLockKey(order),payload:lock,updated_at:new Date(now).toISOString()})
    });
    if(!insertResponse.ok)throw new Error(await insertResponse.text());
    let confirmed=await readRemoteCaseLock(order);
    if(confirmed?.expiresAt<=Date.now()){
      const takeoverResponse=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=eq.${encodeURIComponent(remoteCaseLockKey(order))}&updated_at=eq.${encodeURIComponent(confirmed.remoteUpdatedAt||'')}`,{
        method:'PATCH',headers:{...amiunSupabaseRestHeaders,Prefer:'return=representation'},
        body:JSON.stringify({payload:lock,updated_at:new Date().toISOString()})
      });
      if(!takeoverResponse.ok)throw new Error(await takeoverResponse.text());
      confirmed=await readRemoteCaseLock(order);
    }
    if(!confirmed||confirmed.tabId!==caseLockTabId){if(confirmed)rememberCaseLock(confirmed);showCaseLockNotice(order,confirmed||existing);return false}
    rememberCaseLock(confirmed);activeCaseLockOrder=order;return true;
  }catch(error){console.warn('[Bloqueo de ficha] No se pudo reservar el caso',error);toast(`No se pudo reservar ${order}. Revisá la conexión e intentá nuevamente.`);return false}
  finally{pendingCaseLockOrders.delete(order)}
}
function releaseCaseLock(order=activeCaseLockOrder){
  if(!order)return;
  const locks=readCaseLocks();
  const owned=locks[order]?.tabId===caseLockTabId;
  if(owned){delete locks[order];writeCaseLocks(locks)}
  if(activeCaseLockOrder===order)activeCaseLockOrder='';
  if(owned&&amiunSupabaseClient){
    fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=eq.${encodeURIComponent(remoteCaseLockKey(order))}`,{method:'DELETE',headers:amiunSupabaseRestHeaders,keepalive:true})
      .catch(error=>console.warn('[Bloqueo de ficha] No se pudo liberar la reserva',error));
  }
}
async function renewCaseLock(order=activeCaseLockOrder){
  if(!order)return;
  if(!amiunSupabaseClient){
    const locks=readCaseLocks(),current=locks[order];
    if(current&&current.tabId!==caseLockTabId){loseActiveCaseLock(order,current);return}
    const now=Date.now();
    locks[order]={...(current||{}),order,user:auditActor(),tabId:caseLockTabId,context:current?.context||'Ficha del caso',at:current?.at||new Date(now).toISOString(),expiresAt:now+CASE_LOCK_TTL};
    writeCaseLocks(locks);return;
  }
  try{
    const current=await readRemoteCaseLock(order);
    if(!current||current.tabId!==caseLockTabId){loseActiveCaseLock(order,current);return}
    const renewed={...current,__caseLock:true,remote:true,expiresAt:Date.now()+CASE_LOCK_TTL};
    delete renewed.remoteUpdatedAt;
    const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/${AMIUN_CASES_TABLE}?order_number=eq.${encodeURIComponent(remoteCaseLockKey(order))}&updated_at=eq.${encodeURIComponent(current.remoteUpdatedAt||'')}`,{
      method:'PATCH',headers:{...amiunSupabaseRestHeaders,Prefer:'return=representation'},body:JSON.stringify({payload:renewed,updated_at:new Date().toISOString()})
    });
    if(!response.ok)throw new Error(await response.text());
    const rows=await response.json();
    if(!rows.length){const winner=await readRemoteCaseLock(order);if(!winner||winner.tabId!==caseLockTabId){loseActiveCaseLock(order,winner);return}}
    rememberCaseLock(renewed);
  }catch(error){console.warn('[Bloqueo de ficha] No se pudo renovar la reserva',error)}
}
function caseAvailableForAction(order){
  const lock=caseLockFor(order);
  if(lock&&lock.tabId!==caseLockTabId){showCaseLockNotice(order,lock);return false}
  return true;
}
function auditAction(changes,isNew){
  if(isNew)return 'Caso creado';
  const keys=changes.map(change=>change.key);
  if(keys.includes('status'))return 'Estado actualizado';
  if(keys.some(key=>['arrived','arrivalDate'].includes(key)))return 'Arribo actualizado';
  if(keys.some(key=>['appointmentDate','time','scheduled'].includes(key)))return 'Programación actualizada';
  if(keys.includes('comment'))return 'Comentario actualizado';
  if(keys.includes('vorStatus'))return 'Seguimiento VOR actualizado';
  return 'Datos del caso actualizados';
}
function manualAuditChanges(changes=[]){
  const effectiveChanges=changes.filter(change=>{
    const before=auditValue(change.before);
    const after=auditValue(change.after);
    return before!==after;
  });
  const has=key=>effectiveChanges.some(change=>change.key===key);
  const keep=keys=>effectiveChanges.filter(change=>keys.includes(change.key));
  if(has('executionStatus'))return keep(['executionStatus']);
  if(has('arrived'))return keep(['arrived']);
  if(has('vorStatus'))return keep(['vorStatus']);
  if(has('depositStatus'))return keep(['depositStatus']);
  if(has('cancelReason'))return keep(['status','cancelReason']);
  if(has('appointmentDate')||has('time'))return keep(['appointmentDate','time']);
  if(has('scheduled'))return keep(['scheduled']);
  if(has('firstConversation'))return keep(['firstConversation']);
  if(has('comment'))return keep(['comment']);
  if(has('status'))return keep(['status']);
  const automatic=new Set(['arrivalDate','executionDate','executionTime','missingSince','manualStatus','programmedAt']);
  return effectiveChanges.filter(change=>!automatic.has(change.key));
}
function save(){
  let previous=[];
  const changedOrders=new Set();
  try{previous=JSON.parse(localStorage.getItem('warranty-cases')||'[]')}catch(error){previous=[]}
  const previousByOrder=new Map(previous.map(item=>[item.order,item]));
  cases.forEach((current,currentIndex)=>{
    const before=previousByOrder.get(current.order),isNew=!before;
    const foreignLock=caseLockFor(current.order);
    if(before&&foreignLock&&foreignLock.tabId!==caseLockTabId&&JSON.stringify(before)!==JSON.stringify(current)){
      cases[currentIndex]=normalizeCaseRecord(before,currentIndex);
      setTimeout(()=>showCaseLockNotice(current.order,foreignLock),0);
      return;
    }
    const keys=new Set([...Object.keys(before||{}),...Object.keys(current)]);
    const changes=[];
    keys.forEach(key=>{
      if(AUDIT_IGNORED_FIELDS.has(key))return;
      const oldValue=before?.[key],newValue=current[key];
      if(JSON.stringify(oldValue)===JSON.stringify(newValue))return;
      changes.push({key,field:AUDIT_FIELD_LABELS[key]||key,before:auditValue(oldValue),after:auditValue(newValue)});
    });
    if(!changes.length)return;
    changedOrders.add(current.order);
    if(AMIUN_LOCAL_DEMO_MODE)current.updatedAt=new Date().toISOString();
    const history=Array.isArray(current.auditHistory)?current.auditHistory:[],manualChanges=manualAuditChanges(changes);
    if(!isNew&&!manualChanges.length)return;
    current.auditHistory=[...history,{id:`AUD-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:new Date().toISOString(),user:auditActor(),action:auditAction(manualChanges,isNew),changes:isNew?[]:manualChanges}];
  });
  localStorage.setItem('warranty-cases',JSON.stringify(cases));
  pushSharedCasesToSupabase(cases,[...changedOrders]);
}
const saveRegistry = (replaceRemote=false) => {
  manualPartsRegistry=normalizeManualPartsRegistry(manualPartsRegistry);
  localStorage.setItem(MANUAL_PARTS_REGISTRY_KEY,JSON.stringify(manualPartsRegistry));
  enqueueManualPartsRegistryPush(replaceRemote);
};
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const dateOnly = date => new Date(date + 'T12:00:00');
const isBusinessDay = date => date.getDay() !== 0 && date.getDay() !== 6;
const businessDaysBetween = (start,end) => {
  if(!start || !end) return 0;
  const a = dateOnly(start), b = dateOnly(end), sign = a <= b ? 1 : -1;
  let current = new Date(a), count = 0;
  while((sign > 0 && current < b) || (sign < 0 && current > b)){
    current.setDate(current.getDate() + sign);
    if(isBusinessDay(current)) count += sign;
  }
  return count;
};
const daysFrom = date => date ? Math.max(0, businessDaysBetween(date, iso(0))) : 0;
const daysBetween = (start,end) => start&&end ? Math.max(0,businessDaysBetween(start,end)) : daysFrom(start);
const fmtDate = date => {
  if(!date) return 'Sin fecha';
  const value = String(date).slice(0,10);
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'Sin fecha' : new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(parsed);
};
const parseStoredDate = value => {
  if(!value) return null;
  if(value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text=String(value).trim();
  const iso=text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if(iso){
    const parsed=new Date(Number(iso[1]),Number(iso[2])-1,Number(iso[3]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const local=text.match(/^(\d{2})[\/-](\d{2})[\/-](\d{2}|\d{4})$/);
  if(local){
    const year=local[3].length===2 ? 2000+Number(local[3]) : Number(local[3]);
    const parsed=new Date(year,Number(local[2])-1,Number(local[1]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed=new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const fmtSaleDate = date => {
  if(!date) return 'Sin fecha';
  const value = String(date).slice(0,10);
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'Sin fecha' : new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(parsed);
};
const fmtKm = value => value ? `${new Intl.NumberFormat('es-AR').format(Number(String(value).replace(/\D/g,'')))} km` : 'Sin dato';
const badgeClass = status => ({'PENDIENTE DE REPUESTO':'pending','ARRIBO PARCIAL':'missing','PENDIENTE DE TURNO':'arrived','PROGRAMADO':'scheduled','RESULTADO PENDIENTE':'result-pending','REPROGRAMAR':'pending','TURNO SIN REPUESTO':'missing','REALIZADO':'done','SIN AVISAR':'missing','NO AVISADO':'missing','AVISADO':'scheduled','DADO DE BAJA':'cancelled'}[status] || 'pending');
const plateKey = value => String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function plateColor(value){const palette=['#2563EB','#7C3AED','#C2410C','#047857','#B4236A','#0E7490','#6D5B00','#4F46E5'];const key=plateKey(value);let hash=0;for(let i=0;i<key.length;i++)hash=((hash<<5)-hash+key.charCodeAt(i))|0;return palette[Math.abs(hash)%palette.length]}
function samePlateCases(c){const key=plateKey(c.plate);if(!key)return [c];return branchVisibleCases(cases).filter(item=>item.status!=='DADO DE BAJA'&&!item.vor&&item.requested&&item.status!=='REALIZADO'&&plateKey(item.plate)===key)}
function relatedCasesNotice(c){return samePlateCases(c).filter(item=>item.order!==c.order)}
function showRelatedArrivalNotice(c){const related=relatedCasesNotice(c);if(!related.length)return;document.querySelector('.related-arrival-backdrop')?.remove();const backdrop=document.createElement('div');backdrop.className='related-arrival-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','relatedArrivalTitle');backdrop.innerHTML=`<section class="related-arrival-dialog"><header><span>CASOS RELACIONADOS</span><button type="button" data-close-related-arrival aria-label="Cerrar">×</button></header><div class="related-arrival-lead"><strong aria-hidden="true">!</strong><div><h2 id="relatedArrivalTitle">Arribo confirmado para ${escapeHtml(c.order)}</h2><p>La patente <b>${escapeHtml(c.plate)}</b> tiene ${related.length} caso${related.length===1?'':'s'} adicional${related.length===1?'':'es'} activo${related.length===1?'':'s'}.</p></div></div><div class="related-arrival-list arrival-action-list">${related.map(item=>`<article><div><span>NRO OR</span><strong>${escapeHtml(item.order)}</strong></div><div><span>FECHA DEL NUEVO CASO</span><strong>${fmtDate(item.requestDate)}</strong></div><div><span>REPUESTO</span><strong>${escapeHtml(item.part||'Sin especificar')}</strong></div><div class="related-arrival-action"><span>ARRIBO</span>${item.arrived?`<strong class="related-ready">Ya arribado</strong>`:`<button type="button" data-arrive-related="${escapeHtml(item.order)}">Confirmar arribo</button>`}</div></article>`).join('')}</div><footer><p>Podés confirmar aquí los repuestos relacionados que también hayan llegado. Cada acción registra automáticamente la fecha actual.</p><button class="primary-button" type="button" data-close-related-arrival>Entendido</button></footer></section>`;document.body.appendChild(backdrop);const close=()=>backdrop.remove();backdrop.querySelectorAll('[data-close-related-arrival]').forEach(button=>button.onclick=close);backdrop.querySelectorAll('[data-arrive-related]').forEach(button=>button.onclick=()=>{button.disabled=true;updateArrival(button.dataset.arriveRelated,true)});backdrop.onclick=e=>{if(e.target===backdrop)close()};backdrop.querySelector('[data-close-related-arrival]')?.focus()}
function showRelatedTurnNotice(c){const related=relatedCasesNotice(c);if(!related.length)return;document.querySelector('.related-arrival-backdrop')?.remove();const backdrop=document.createElement('div');backdrop.className='related-arrival-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','relatedTurnTitle');backdrop.innerHTML=`<section class="related-arrival-dialog related-turn-dialog"><header><span>ATENCIÓN ANTES DE CONTACTAR</span><button type="button" data-close-related-turn aria-label="Cerrar">×</button></header><div class="related-arrival-lead"><strong aria-hidden="true">!</strong><div><h2 id="relatedTurnTitle">Turno programado para ${escapeHtml(c.order)}</h2><p>La patente <b>${escapeHtml(c.plate)}</b> tiene ${related.length} caso${related.length===1?'':'s'} adicional${related.length===1?'':'es'} que conviene revisar en la misma llamada.</p></div></div><div class="related-arrival-list">${related.map(item=>`<article><div><span>NRO OR</span><strong>${escapeHtml(item.order)}</strong></div><div><span>FECHA DEL NUEVO CASO</span><strong>${fmtDate(item.requestDate)}</strong></div><div><span>DISPONIBILIDAD</span><strong class="${item.arrived?'related-ready':'related-pending'}">${item.arrived?'Repuesto arribado':'Repuesto pendiente'}</strong></div></article>`).join('')}</div><footer><p>El turno se programó solamente para ${escapeHtml(c.order)}. Los demás casos mantienen su estado actual.</p><button class="primary-button" type="button" data-close-related-turn>Entendido</button></footer></section>`;document.body.appendChild(backdrop);const close=()=>backdrop.remove();backdrop.querySelectorAll('[data-close-related-turn]').forEach(button=>button.onclick=close);backdrop.onclick=e=>{if(e.target===backdrop)close()};backdrop.querySelector('[data-close-related-turn]')?.focus()}
function showRelatedCasesOverview(c){const linked=samePlateCases(c);if(linked.length<2)return;document.querySelector('.related-arrival-backdrop')?.remove();const backdrop=document.createElement('div');backdrop.className='related-arrival-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','relatedOverviewTitle');backdrop.innerHTML=`<section class="related-arrival-dialog related-overview-dialog"><header><span>CASOS VINCULADOS POR PATENTE</span><button type="button" data-close-related-overview aria-label="Cerrar">×</button></header><div class="related-arrival-lead"><strong aria-hidden="true">${linked.length}</strong><div><h2 id="relatedOverviewTitle">Patente ${escapeHtml(c.plate)}</h2><p>Resumen de las órdenes activas detectadas para el mismo vehículo.</p></div></div><div class="related-arrival-list">${linked.map(item=>`<article><div><span>NRO OR</span><strong>${escapeHtml(item.order)}</strong></div><div><span>FECHA DEL NUEVO CASO</span><strong>${fmtDate(item.requestDate)}</strong></div><div><span>DISPONIBILIDAD</span><strong class="${item.arrived?'related-ready':'related-pending'}">${item.arrived?'Repuesto arribado':'Repuesto pendiente'}</strong></div></article>`).join('')}</div><footer><p>Esta vista es informativa. No modifica el arribo ni la programación de las órdenes.</p><button class="primary-button" type="button" data-close-related-overview>Cerrar</button></footer></section>`;document.body.appendChild(backdrop);const close=()=>backdrop.remove();backdrop.querySelectorAll('[data-close-related-overview]').forEach(button=>button.onclick=close);backdrop.onclick=e=>{if(e.target===backdrop)close()};backdrop.querySelector('[data-close-related-overview]')?.focus()}
function applyTurnProgramming(c,targets,reason=''){targets.forEach(item=>{item.appointmentDate=c.appointmentDate;item.time=c.time;item.scheduled=true;item.programmedAt=iso(0);item.manualStatus=false;item.status='PROGRAMADO';delete item.executionDate;delete item.executionTime;delete item.executionStatus;if(targets.length>1){delete item.separateScheduleReason;delete item.separateScheduleAt}else if(reason){item.separateScheduleReason=reason;item.separateScheduleAt=iso(0)}});save();toast(targets.length>1?`${c.plate}: ${targets.length} órdenes programadas juntas`:`${c.order}: turno programado`);render()}
function showRelatedProgrammingDecision(c){const linked=samePlateCases(c),pending=linked.filter(item=>!item.arrived),conflicts=linked.filter(item=>item.order!==c.order&&isProgrammed(item)&&(item.appointmentDate!==c.appointmentDate||item.time!==c.time));document.querySelector('.related-arrival-backdrop')?.remove();const blocked=pending.length>0,backdrop=document.createElement('div');backdrop.className='related-arrival-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','relatedProgrammingTitle');backdrop.innerHTML=`<section class="related-arrival-dialog programming-decision-dialog"><header><span>${blocked?'PROGRAMACIÓN BLOQUEADA':'DECISIÓN DE PROGRAMACIÓN'}</span><button type="button" data-close-programming-decision aria-label="Cerrar">×</button></header><div class="related-arrival-lead"><strong aria-hidden="true">${blocked?'!':linked.length}</strong><div><h2 id="relatedProgrammingTitle">${blocked?'Faltan repuestos relacionados':`Programar patente ${escapeHtml(c.plate)}`}</h2><p>${blocked?'No se puede confirmar el turno mientras alguna orden de este vehículo siga sin arribo.':`Se detectaron ${linked.length} órdenes activas para el mismo vehículo.`}</p></div></div><div class="programming-case-list">${linked.map(item=>`<article class="${item.order===c.order?'current':''}"><div><span>NRO OR</span><strong>${escapeHtml(item.order)}</strong></div><div><span>REPUESTO</span><strong>${escapeHtml(item.part||'Sin especificar')}</strong></div><div><span>ARRIBO</span><strong class="${item.arrived?'related-ready':'related-pending'}">${item.arrived?'Confirmado':'Pendiente'}</strong></div><div><span>TURNO ACTUAL</span><strong>${isProgrammed(item)?`${fmtDate(item.appointmentDate)} · ${escapeHtml(item.time||'-')}`:'Sin turno'}</strong></div></article>`).join('')}</div>${conflicts.length?`<p class="programming-conflict"><strong>Atención:</strong> ${conflicts.length} orden${conflicts.length===1?' tiene':'es tienen'} un turno diferente. “Programar todos juntos” reemplazará esa programación.</p>`:''}${blocked?'':`<label class="separate-programming-reason"><span>MOTIVO PARA MANTENER SEPARADO</span><textarea rows="2" placeholder="Obligatorio solo si programás esta orden por separado"></textarea><small></small></label>`}<footer><p>${blocked?'Revisá y confirmá los arribos faltantes antes de coordinar con el cliente.':'La opción recomendada aplica la misma fecha y hora a todas las órdenes relacionadas.'}</p><div class="programming-actions">${blocked?`<button class="secondary-button" type="button" data-go-related-parts>Revisar repuestos</button>`:`<button class="secondary-button" type="button" data-program-separate>Mantener separado</button><button class="primary-button" type="button" data-program-all>Programar todos juntos</button>`}<button class="text-button" type="button" data-close-programming-decision>Cancelar</button></div></footer></section>`;document.body.appendChild(backdrop);const close=()=>backdrop.remove();backdrop.querySelectorAll('[data-close-programming-decision]').forEach(button=>button.onclick=close);backdrop.onclick=e=>{if(e.target===backdrop)close()};const all=backdrop.querySelector('[data-program-all]');if(all)all.onclick=()=>{close();applyTurnProgramming(c,linked)};const separate=backdrop.querySelector('[data-program-separate]');if(separate)separate.onclick=()=>{const field=backdrop.querySelector('.separate-programming-reason textarea'),error=backdrop.querySelector('.separate-programming-reason small'),reason=field.value.trim();if(!reason){error.textContent='Indicá por qué esta orden se programa por separado.';field.focus();return}close();applyTurnProgramming(c,[c],reason)};const review=backdrop.querySelector('[data-go-related-parts]');if(review)review.onclick=()=>{close();selectedTurnOrder='';currentView='parts';partsFilter='without-arrival';render()};backdrop.querySelector('[data-program-all],[data-go-related-parts],[data-close-programming-decision]')?.focus()}
function plateCases(c){return [c]}
function plateReady(c){return plateCases(c).every(item=>item.arrived)}
function uniquePlateCases(items){return items}
function getViewCases(id){
  const active=c=>c.status!=='DADO DE BAJA';
  const map={database:()=>true,parts:c=>active(c)&&c.requested,appointments:c=>active(c)&&c.arrived&&!c.vor,calendar:c=>active(c)&&isProgrammed(c)&&!!c.appointmentDate,today_appointments:c=>active(c)&&c.arrived&&!c.vor&&(c.appointmentDate===selectedExecutionDate||c.executionDate===selectedExecutionDate),parts_registry:c=>active(c)&&isProgrammed(c)&&!!c.appointmentDate,no_appointments:c=>active(c)&&c.arrived&&!c.vor&&!c.appointmentDate&&!c.time&&!c.scheduled,management:()=>true,missing_parts:c=>active(c)&&c.requested&&!!(c.appointmentDate||c.time)&&!c.arrived,released:c=>c.status==='DADO DE BAJA',vor:c=>active(c)&&c.vor&&c.arrived};
  const normalized=id.replaceAll('-','_'),items=branchVisibleCases(cases).filter(map[normalized] || (()=>true));
  if(['appointments','no_appointments','calendar','today_appointments'].includes(normalized))return uniquePlateCases(items.filter(c=>plateReady(c)));
  return items;
}
function canViewOtherBranches(user=currentApplicationUser()){if(!user)return true;const stored=USER_PERMISSION_MATRIX[user.username]?.crossBranch;return typeof stored==='boolean'?stored:user.role==='Gerencial'}
function branchVisibleCases(items=cases,user=currentApplicationUser()){if(canViewOtherBranches(user))return items;const branch=user?.branch||'Santa Fe';return items.filter(item=>(item.branch||'Santa Fe')===branch)}
function navCount(id){if(id==='dashboard'||id==='settings')return '';if(id==='reminders')return activeReminders().length;if(id==='history')return auditEntries().length;if(id==='parts-registry')return registryRows().filter(item=>item.appointmentDate===selectedRegistryDate).length;return getViewCases(id).length}
function closeTransientUi(){document.querySelectorAll('.related-arrival-backdrop,.pdf-confirmation,.case-lock-backdrop').forEach(element=>element.remove());releaseCaseLock();selectedDatabaseOrder='';selectedTurnOrder='';selectedMissingOrder='';selectedPartCommentOrder='';selectedRegistryKey='';editingDatabaseOrder=''}
function navigateToView(view){
  closeTransientUi();
  const target=view==='calendar'?'appointments':view;
  if(!canAccessView(target)){
    currentView=defaultViewForCurrentUser();
    const allowedLabels=(currentApplicationUser()?.allowedViews||[]).map(id=>views.find(item=>item.id===id)?.label).filter(Boolean);
    toast(`Tu perfil solo tiene acceso a ${allowedLabels.join(' y ')||'las secciones autorizadas'}`);
  }else currentView=target;
  render();
  document.getElementById('sidebar')?.classList.remove('open');
}
function pendingExecutionResults(){
  const today=iso(0);
  return branchVisibleCases(cases).filter(c=>c.status!=='DADO DE BAJA'&&c.status!=='REALIZADO'&&c.arrived&&!c.vor&&plateReady(c)&&c.appointmentDate&&c.appointmentDate<today&&!c.executionStatus)
    .sort((a,b)=>`${a.appointmentDate} ${a.time||''}`.localeCompare(`${b.appointmentDate} ${b.time||''}`));
}
function pendingDepositClassifications(){
  return registryRows().filter(item=>item.repairDate&&!item.depositStatus)
    .sort((a,b)=>String(a.repairDate).localeCompare(String(b.repairDate))||String(a.order||a.sourceOrder||'').localeCompare(String(b.order||b.sourceOrder||'')));
}
function saveReminders(){
  const current=new Map(reminders.map(item=>[item.id,JSON.stringify(item)]));
  const changed=reminders.filter(item=>reminderSavedSnapshot.get(item.id)!==current.get(item.id));
  const removed=[...reminderSavedSnapshot.keys()].filter(id=>!current.has(id));
  for(const record of [...changed,...removed.map(id=>({id,deleted:true}))]){
    const value={...record,updatedAt:new Date().toISOString()};
    reminderPending=reminderPending.filter(item=>item.id!==value.id);
    reminderPending.push(value);
  }
  localStorage.setItem(REMINDERS_KEY,JSON.stringify(reminders));
  localStorage.setItem(REMINDER_PENDING_KEY,JSON.stringify(reminderPending));
  reminderSavedSnapshot=current;
  syncSharedReminders();
}
function renderReminderSyncStatus(){
  if(currentView!=='reminders')return;
  let notice=document.getElementById('reminderSyncStatus');
  if(!notice){notice=document.createElement('p');notice.id='reminderSyncStatus';notice.setAttribute('role','status');document.querySelector('.reminder-command')?.before(notice)}
  notice.textContent=!amiunSupabaseClient?'Recordatorios locales de demostración.':reminderSyncError?'No se pudieron sincronizar los recordatorios. Los cambios están guardados en este navegador y se reintentará automáticamente.':reminderSyncBusy||reminderPending.length?'Sincronizando recordatorios…':reminderSyncReady?'Recordatorios sincronizados entre computadoras.':'Conectando recordatorios…';
}
async function syncSharedReminders(){
  if(!amiunSupabaseClient||reminderSyncBusy)return;
  reminderSyncBusy=true;renderReminderSyncStatus();
  let wroteRemote=false;
  const endpoint=`${AMIUN_SUPABASE_URL}/rest/v1/app_state`;
  const request=async(url,options={})=>{
    const response=await fetch(url,{...options,signal:AbortSignal.timeout(15000),headers:{...amiunSupabaseRestHeaders,...options.headers}});
    if(!response.ok)throw new Error(`Sincronización de recordatorios: HTTP ${response.status}`);
    return response;
  };
  try{
    // Import existing browser records once. Existing server rows (including deletions) win.
    if(!reminderSyncReady&&reminders.length){
      await request(endpoint+'?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(reminders.map(value=>({key:REMINDER_REMOTE_PREFIX+value.id,value,updated_at:value.updatedAt||new Date().toISOString()})))});
      wroteRemote=true;
    }
    const batch=[...reminderPending];
    if(batch.length){
      await request(endpoint+'?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(batch.map(value=>({key:REMINDER_REMOTE_PREFIX+value.id,value,updated_at:value.updatedAt})))});
      wroteRemote=true;
      // Keep edits made while this request was in flight.
      reminderPending=reminderPending.filter(item=>!batch.includes(item));
      localStorage.setItem(REMINDER_PENDING_KEY,JSON.stringify(reminderPending));
    }
    if(wroteRemote)announceSharedDataChange('app-state');
    const rows=[];
    for(let offset=0;;offset+=500){
      const response=await request(endpoint+`?key=like.operational-reminder:*&select=value&order=key&limit=500&offset=${offset}`);
      const page=await response.json();
      if(!Array.isArray(page))throw new Error('Respuesta inválida de recordatorios');
      rows.push(...page);
      if(page.length<500)break;
    }
    // La sincronización debe continuar aunque haya una alerta abierta. Una alerta
    // puede haber sido resuelta desde otra computadora y quedar obsoleta en pantalla.
    // Los formularios de edición sí conservan su referencia local hasta guardarse.
    if(document.querySelector('.reminder-modal-backdrop'))return;
    const merged=new Map();
    rows.filter(row=>row.value?.id).forEach(row=>{
      const value=row.value,previous=merged.get(value.id);
      const previousTime=Date.parse(previous?.updatedAt||'')||0;
      const valueTime=Date.parse(value.updatedAt||row.updated_at||'')||0;
      if(!previous||valueTime>=previousTime)merged.set(value.id,value);
    });
    reminderPending.forEach(value=>{
      const previous=merged.get(value.id);
      const previousTime=Date.parse(previous?.updatedAt||'')||0;
      const valueTime=Date.parse(value.updatedAt||'')||0;
      if(!previous||valueTime>=previousTime)merged.set(value.id,value);
    });
    const next=[...merged.values()].filter(value=>!value.deleted);
    const changed=JSON.stringify(next)!==JSON.stringify(reminders);
    reminders=next;
    localStorage.setItem(REMINDERS_KEY,JSON.stringify(reminders));
    closeObsoleteReminderAlert();
    reminderSavedSnapshot=new Map(reminders.map(item=>[item.id,JSON.stringify(item)]));
    reminderSyncReady=true;reminderSyncError=false;
    if(changed&&!document.body.classList.contains('auth-locked')){
      // Preserve open forms and refresh the list after the user closes them.
      if(currentView==='reminders'&&!document.querySelector('.reminder-modal-backdrop,.reminder-alert-backdrop'))renderAfterRemoteSync();
      else{renderNav();renderPendingResultAlerts()}
    }
  }catch(error){reminderSyncError=true;console.warn('[Recordatorios]',error)}
  finally{reminderSyncBusy=false;renderReminderSyncStatus()}
}
function reminderDateTime(item){const value=new Date(`${item.date||'9999-12-31'}T${item.time||'23:59'}:00`);return Number.isNaN(value.getTime())?Number.MAX_SAFE_INTEGER:value.getTime()}
function reminderIsoDate(value){const date=value instanceof Date?value:new Date(`${value}T12:00:00`);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function reminderIsRecurring(item){return Boolean(item&&item.recurrence&&item.recurrence!=='once')}
function reminderRecurrenceLabel(item){
  const labels={once:'Una vez',daily:'Todos los días',weekdays:'Lunes a viernes',weekly:'Semanal',monthly:'Mensual',selected:'Días elegidos'};
  if(item?.recurrence==='selected'){
    const names=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const days=(item.recurrenceDays||[]).map(Number).sort((a,b)=>a-b).map(day=>names[day]).filter(Boolean);
    return days.length?days.join(', '):'Días elegidos';
  }
  return labels[item?.recurrence||'once']||'Una vez';
}
function reminderNextOccurrence(item,fromDate=item.date){
  if(!reminderIsRecurring(item)||!fromDate)return '';
  const date=new Date(`${fromDate}T12:00:00`),frequency=item.recurrence;
  if(Number.isNaN(date.getTime()))return '';
  if(frequency==='daily')date.setDate(date.getDate()+1);
  else if(frequency==='weekdays')do{date.setDate(date.getDate()+1)}while([0,6].includes(date.getDay()));
  else if(frequency==='weekly')date.setDate(date.getDate()+7);
  else if(frequency==='monthly'){
    const targetDay=Number(item.recurrenceMonthDay)||date.getDate(),nextMonth=date.getMonth()+1,nextYear=date.getFullYear()+Math.floor(nextMonth/12),month=((nextMonth%12)+12)%12,lastDay=new Date(nextYear,month+1,0).getDate();
    date.setFullYear(nextYear,month,Math.min(targetDay,lastDay));
  }else if(frequency==='selected'){
    const allowed=(item.recurrenceDays||[]).map(Number);
    if(!allowed.length)return '';
    let guard=0;do{date.setDate(date.getDate()+1);guard+=1}while(!allowed.includes(date.getDay())&&guard<8);
  }
  const next=reminderIsoDate(date);
  return item.recurrenceEnd&&next>item.recurrenceEnd?'':next;
}
function reminderAdvanceOccurrence(item,outcome='completed',reason=''){
  const actor=currentApplicationUser()?.username||'Usuario',now=new Date().toISOString();
  item.occurrenceHistory=Array.isArray(item.occurrenceHistory)?item.occurrenceHistory:[];
  item.occurrenceHistory.push({date:item.date,time:item.time,status:outcome,reason,at:now,by:actor});
  resetReminderAlertState(item);
  const next=reminderNextOccurrence(item);
  if(next){item.date=next;item.status='pending';item.lastOccurrenceAt=now;item.lastOccurrenceBy=actor;delete item.completedAt;delete item.completedBy}
  else{item.status='completed';item.completedAt=now;item.completedBy=actor;item.seriesEndedAt=reminderIsRecurring(item)?now:item.seriesEndedAt}
  item.updatedAt=now;item.updatedBy=actor;
  return next;
}
function reminderDayState(item){
  if(item.status==='completed')return 'completed';
  if(item.status==='paused')return 'paused';
  const today=iso(0),now=Date.now(),stamp=reminderDateTime(item);
  if(String(item.date||'')<today||stamp<now)return 'overdue';
  if(item.date===today)return 'today';
  return 'upcoming';
}
function reminderVisible(item,user=currentApplicationUser()){return canViewOtherBranches(user)||(item.branch||'Santa Fe')===(user?.branch||'Santa Fe')}
function activeReminders(){return reminders.filter(item=>!item.deleted&&(item.status==='pending'||!item.status)&&reminderVisible(item))}
function reminderAlertItems(){const now=Date.now();return activeReminders().filter(item=>reminderDateTime(item)-Number(item.leadMinutes||0)*60000<=now).sort((a,b)=>reminderDateTime(a)-reminderDateTime(b))}
function reminderOccurrenceKey(item){return `${item.date||''}T${item.time||''}`}
function resetReminderAlertState(item){delete item.alertAcknowledgedFor;delete item.alertAcknowledgedAt;delete item.alertAcknowledgedBy;delete item.snoozedUntil;delete item.snoozedAt;delete item.snoozedBy}
function reminderPopupItems(){
  const now=Date.now();
  return reminderAlertItems().filter(item=>{
    if(item.alertAcknowledgedFor===reminderOccurrenceKey(item))return false;
    const snoozed=Date.parse(item.snoozedUntil||'');
    return !Number.isFinite(snoozed)||snoozed<=now;
  });
}
function reminderStateLabel(item){return {overdue:'Vencido',today:'Hoy',upcoming:'Próximo',completed:'Completado',paused:'Pausado'}[reminderDayState(item)]}
function reminderRelatedCase(item){const visible=branchVisibleCases(cases);return visible.find(c=>c.order===item.order)||(item.plate?visible.find(c=>c.plate===item.plate):null)}
function reminderOptions(selected=''){
  const names=[...new Set([...registryResponsibles,...Object.values(APPLICATION_USERS).map(user=>user.displayName||user.username)])].sort((a,b)=>a.localeCompare(b));
  return names.map(name=>`<option value="${escapeHtml(name)}" ${name===selected?'selected':''}>${escapeHtml(name)}</option>`).join('');
}
function reminderFilteredItems(){
  const query=reminderSearch.trim().toLowerCase();
  return reminders.filter(item=>{
    if(!reminderVisible(item))return false;
    const statusOk=reminderStatusFilter==='all'||(reminderStatusFilter==='active'?(item.status==='pending'||!item.status):reminderStatusFilter==='paused'?item.status==='paused':item.status==='completed');
    const categoryOk=!reminderCategoryFilter||item.category===reminderCategoryFilter;
    const text=[item.title,item.note,item.order,item.plate,item.responsible,item.category].join(' ').toLowerCase();
    return statusOk&&categoryOk&&(!query||text.includes(query));
  }).sort((a,b)=>{
    if(a.status==='completed'&&b.status!=='completed')return 1;
    if(a.status!=='completed'&&b.status==='completed')return -1;
    return reminderDateTime(a)-reminderDateTime(b);
  });
}
function remindersView(){
  const items=reminderFilteredItems(),overdue=activeReminders().filter(item=>reminderDayState(item)==='overdue').length,today=activeReminders().filter(item=>reminderDayState(item)==='today').length,upcoming=activeReminders().filter(item=>reminderDayState(item)==='upcoming').length,completed=reminders.filter(item=>item.status==='completed'&&reminderVisible(item)).length;
  const rows=items.map(item=>{const linked=reminderRelatedCase(item),state=reminderDayState(item),caseLabel=item.order||linked?.order||item.plate||'Sin vincular',recurring=reminderIsRecurring(item);let actions='';if(item.status==='completed')actions=`<button data-reminder-action="reopen" data-reminder-id="${escapeHtml(item.id)}">Reabrir</button>`;else if(item.status==='paused')actions=`<button class="is-primary" data-reminder-action="resume" data-reminder-id="${escapeHtml(item.id)}">Reanudar</button><button data-reminder-action="finish" data-reminder-id="${escapeHtml(item.id)}">Finalizar serie</button>`;else actions=`<button class="is-primary" data-reminder-action="complete" data-reminder-id="${escapeHtml(item.id)}">${recurring?'Completar hoy':'Completar'}</button>${recurring?`<button data-reminder-action="skip" data-reminder-id="${escapeHtml(item.id)}">Omitir</button><button data-reminder-action="pause" data-reminder-id="${escapeHtml(item.id)}">Pausar</button>`:''}<button title="Mover un día" data-reminder-action="postpone" data-reminder-id="${escapeHtml(item.id)}">+1 día</button>`;return `<tr class="reminder-row is-${state}"><td data-label="Fecha y hora"><div class="reminder-date"><strong>${fmtDate(item.date)}</strong><small>${escapeHtml(item.time||'Sin hora')}</small>${recurring?`<span class="reminder-recurrence">↻ ${escapeHtml(reminderRecurrenceLabel(item))}</span>`:''}</div></td><td data-label="Acción"><div class="reminder-subject"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note||'Sin observaciones adicionales')}</small></div></td><td data-label="Sucursal"><span class="branch-chip">${escapeHtml(item.branch||'Santa Fe')}</span></td><td data-label="Categoría"><span class="reminder-category">${escapeHtml(item.category||'Seguimiento')}</span></td><td data-label="Caso"><strong>${escapeHtml(caseLabel)}</strong>${linked?.plate?`<small>${escapeHtml(linked.plate)}</small>`:''}</td><td data-label="Responsable"><strong>${escapeHtml(item.responsible||'Sin asignar')}</strong></td><td data-label="Prioridad"><span class="reminder-priority is-${escapeHtml((item.priority||'normal').toLowerCase())}">${escapeHtml(item.priority||'Normal')}</span></td><td data-label="Estado"><span class="reminder-status is-${state}">${reminderStateLabel(item)}</span></td><td data-label="Acciones"><div class="reminder-actions">${actions}<button data-reminder-action="edit" data-reminder-id="${escapeHtml(item.id)}">Editar</button>${linked?`<button data-reminder-action="case" data-reminder-id="${escapeHtml(item.id)}">Ver caso</button>`:''}<button class="is-danger" data-reminder-action="delete" data-reminder-id="${escapeHtml(item.id)}">Eliminar</button></div></td></tr>`}).join('');
  return `${heading('Recordatorios','Agenda operativa de compromisos únicos y recurrentes.')}<section class="reminder-command"><div><span>CONTROL VISUAL TPS</span><strong>Primero lo vencido; después lo comprometido para hoy</strong><p>Los compromisos recurrentes generan su próxima fecha al cerrar cada ocurrencia.</p></div><button type="button" class="primary-button" id="newReminderButton"><span>＋</span> Nuevo recordatorio</button></section><section class="reminder-kpis" aria-label="Resumen de recordatorios"><article class="is-overdue"><span>Vencidos</span><strong>${overdue}</strong><small>Acción inmediata</small></article><article class="is-today"><span>Para hoy</span><strong>${today}</strong><small>Compromiso del día</small></article><article class="is-upcoming"><span>Próximos</span><strong>${upcoming}</strong><small>Carga planificada</small></article><article class="is-completed"><span>Completados</span><strong>${completed}</strong><small>Cierre trazado</small></article></section><section class="reminder-workbench"><div class="reminder-filters"><label><span>Estado</span><select id="reminderStatusFilter"><option value="active" ${reminderStatusFilter==='active'?'selected':''}>Pendientes</option><option value="paused" ${reminderStatusFilter==='paused'?'selected':''}>Pausados</option><option value="completed" ${reminderStatusFilter==='completed'?'selected':''}>Completados</option><option value="all" ${reminderStatusFilter==='all'?'selected':''}>Todos</option></select></label><label><span>Categoría</span><select id="reminderCategoryFilter"><option value="">Todas</option>${['Seguimiento','Cliente','Repuesto','Turno','Depósito','Administrativo'].map(value=>`<option ${reminderCategoryFilter===value?'selected':''}>${value}</option>`).join('')}</select></label><label class="reminder-search"><span>Buscar</span><input id="reminderSearch" value="${escapeHtml(reminderSearch)}" placeholder="Título, orden, patente o responsable"></label><output>${items.length} ${items.length===1?'registro':'registros'}</output></div><section class="panel reminder-table-panel">${items.length?`<div class="table-wrap"><table class="data-table reminder-table"><thead><tr><th>PRÓXIMA FECHA</th><th>ACCIÓN COMPROMETIDA</th><th>SUCURSAL</th><th>CATEGORÍA</th><th>CASO</th><th>RESPONSABLE</th><th>PRIORIDAD</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty-state reminder-empty"><span class="empty-icon">✓</span><h3>Sin recordatorios en esta vista</h3><p>Creá un compromiso para asegurar el próximo paso operativo.</p><button type="button" class="secondary-button" data-create-reminder-empty>Crear recordatorio</button></div>`}</section></section>`;
}
function openReminderModal(id=''){
  document.querySelector('.reminder-modal-backdrop')?.remove();
  const item=reminders.find(entry=>entry.id===id)||{},linked=reminderRelatedCase(item),defaultTime=new Date(Date.now()+3600000).toTimeString().slice(0,5);
  const modal=document.createElement('div');modal.className='reminder-modal-backdrop';
  const selectedDays=(item.recurrenceDays||[]).map(Number);
  modal.innerHTML=`<form class="reminder-modal" data-reminder-form="${escapeHtml(id)}" novalidate><header><div class="reminder-modal-id">RC</div><div><span>AGENDA OPERATIVA</span><h2>${id?'Editar recordatorio':'Nuevo recordatorio'}</h2><p>Definí la acción, su frecuencia y la persona responsable.</p></div><button type="button" data-close-reminder aria-label="Cerrar">×</button></header><div class="reminder-form-body"><section class="reminder-form-section"><div class="reminder-form-section-title"><b>01</b><div><strong>Acción comprometida</strong><small>Una instrucción breve, concreta y verificable</small></div></div><div class="reminder-form-grid"><label class="span-2">Título de la acción <em>*</em><input name="title" required maxlength="120" value="${escapeHtml(item.title||'')}" placeholder="Ej. Enviar reporte de repuestos pendientes"></label><label>Categoría <em>*</em><select name="category" required>${['Seguimiento','Cliente','Repuesto','Turno','Depósito','Administrativo'].map(value=>`<option ${item.category===value?'selected':''}>${value}</option>`).join('')}</select></label><label>Prioridad <em>*</em><select name="priority" required>${['Normal','Alta','Urgente'].map(value=>`<option ${item.priority===value?'selected':''}>${value}</option>`).join('')}</select></label></div></section><section class="reminder-form-section"><div class="reminder-form-section-title"><b>02</b><div><strong>Programación</strong><small>La fecha corresponde a la próxima ocurrencia</small></div></div><div class="reminder-form-grid reminder-schedule-grid"><label>Próxima fecha <em>*</em><input name="date" type="date" required value="${escapeHtml(item.date||iso(0))}"></label><label>Hora <em>*</em><input name="time" type="time" required value="${escapeHtml(item.time||defaultTime)}"></label><label>Frecuencia <em>*</em><select name="recurrence" required>${[['once','Una sola vez'],['daily','Todos los días'],['weekdays','Lunes a viernes'],['selected','Días específicos'],['weekly','Cada semana'],['monthly','Cada mes']].map(([value,label])=>`<option value="${value}" ${(item.recurrence||'once')===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Finaliza<input name="recurrenceEnd" type="date" value="${escapeHtml(item.recurrenceEnd||'')}" aria-describedby="recurrenceEndHelp"><small id="recurrenceEndHelp">Vacío: sin fecha final</small></label><label>Aviso anticipado<select name="leadMinutes">${[[0,'A la hora indicada'],[15,'15 minutos antes'],[30,'30 minutos antes'],[60,'1 hora antes'],[1440,'1 día antes']].map(([value,label])=>`<option value="${value}" ${Number(item.leadMinutes||0)===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Responsable <em>*</em><select name="responsible" required><option value="">Seleccionar responsable</option>${reminderOptions(item.responsible||currentApplicationUser()?.displayName||'')}</select></label><fieldset class="reminder-weekdays span-2" data-recurrence-days ${item.recurrence==='selected'?'':'hidden'}><legend>Días de ejecución <em>*</em></legend><div>${[['Lun',1],['Mar',2],['Mié',3],['Jue',4],['Vie',5],['Sáb',6],['Dom',0]].map(([label,value])=>`<label><input type="checkbox" name="recurrenceDays" value="${value}" ${selectedDays.includes(value)?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset></div></section><section class="reminder-form-section"><div class="reminder-form-section-title"><b>03</b><div><strong>Contexto</strong><small>Vinculación y datos útiles para ejecutar la tarea</small></div></div><div class="reminder-form-grid"><label class="span-2">Vincular caso<select name="order"><option value="">Sin caso vinculado</option>${branchVisibleCases(cases).slice().sort((a,b)=>a.order.localeCompare(b.order)).map(c=>`<option value="${escapeHtml(c.order)}" ${c.order===(item.order||linked?.order)?'selected':''}>${escapeHtml(c.order)} · ${escapeHtml(c.plate||'Sin patente')} · ${escapeHtml(c.client||'')}</option>`).join('')}</select></label><label class="span-2">Observaciones<textarea name="note" rows="3" maxlength="500" placeholder="Contexto necesario, destinatario del reporte o siguiente paso">${escapeHtml(item.note||'')}</textarea></label></div></section><div class="reminder-form-error" role="alert" hidden></div></div><footer><span><b>*</b> Campos obligatorios</span><div><button type="button" class="secondary-button" data-close-reminder>Cancelar</button><button type="submit" class="primary-button">${id?'Guardar cambios':'Crear recordatorio'}</button></div></footer></form>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close-reminder]').forEach(button=>button.onclick=()=>modal.remove());
  modal.onclick=event=>{if(event.target===modal)modal.remove()};
  modal.onkeydown=event=>{if(event.key==='Escape')modal.remove()};
  modal.querySelector('[name="title"]')?.focus();
  const recurrence=modal.querySelector('[name="recurrence"]'),dayFields=modal.querySelector('[data-recurrence-days]');
  recurrence.onchange=()=>{dayFields.hidden=recurrence.value!=='selected'};
  modal.querySelector('form').onsubmit=event=>{event.preventDefault();const form=event.currentTarget,error=form.querySelector('.reminder-form-error'),submit=form.querySelector('[type="submit"]');if(!form.checkValidity()){error.textContent='Completá todos los campos obligatorios antes de guardar.';error.hidden=false;form.querySelector(':invalid')?.focus();return}const data=new FormData(form),order=String(data.get('order')||''),caseItem=branchVisibleCases(cases).find(c=>c.order===order),existing=reminders.find(entry=>entry.id===id),title=String(data.get('title')||'').trim(),date=String(data.get('date')||''),time=String(data.get('time')||''),responsible=String(data.get('responsible')||''),recurrenceValue=String(data.get('recurrence')||'once'),recurrenceDays=data.getAll('recurrenceDays').map(Number),recurrenceEnd=String(data.get('recurrenceEnd')||'');if(recurrenceValue==='selected'&&!recurrenceDays.length){error.textContent='Seleccioná al menos un día para el recordatorio recurrente.';error.hidden=false;dayFields.querySelector('input')?.focus();return}if(recurrenceEnd&&recurrenceEnd<date){error.textContent='La fecha final no puede ser anterior a la próxima ocurrencia.';error.hidden=false;form.querySelector('[name="recurrenceEnd"]')?.focus();return}const duplicate=reminders.find(entry=>entry.id!==id&&entry.status!=='completed'&&String(entry.title||'').trim().toLowerCase()===title.toLowerCase()&&entry.date===date&&entry.time===time&&entry.responsible===responsible&&String(entry.order||'')===order);if(duplicate){error.textContent='Ya existe un recordatorio pendiente con la misma acción, fecha, hora, responsable y caso.';error.hidden=false;return}submit.disabled=true;const record={...(existing||{}),id:existing?.id||`REM-${Date.now()}`,title,date,time,category:String(data.get('category')||''),priority:String(data.get('priority')||'Normal'),responsible,recurrence:recurrenceValue,recurrenceDays,recurrenceEnd,recurrenceMonthDay:Number(date.slice(-2)),leadMinutes:Number(data.get('leadMinutes')||0),order,plate:caseItem?.plate||'',note:String(data.get('note')||'').trim(),status:existing?.status||'pending',occurrenceHistory:existing?.occurrenceHistory||[],createdAt:existing?.createdAt||new Date().toISOString(),createdBy:existing?.createdBy||currentApplicationUser()?.username||'Usuario',updatedAt:new Date().toISOString(),updatedBy:currentApplicationUser()?.username||'Usuario',branch:existing?.branch||caseItem?.branch||currentApplicationUser()?.branch||'Santa Fe'};resetReminderAlertState(record);if(existing)reminders=reminders.map(entry=>entry.id===id?record:entry);else reminders.push(record);saveReminders();modal.remove();render();setTimeout(checkDueReminderAlerts,120);toast(existing?'Recordatorio actualizado':'Recordatorio creado')};
}
function openReminderSkipModal(item){
  document.querySelector('.reminder-skip-backdrop')?.remove();
  const modal=document.createElement('div');modal.className='reminder-modal-backdrop reminder-skip-backdrop';
  modal.innerHTML=`<form class="reminder-skip-modal"><header><div><span>EXCEPCIÓN DE LA SERIE</span><h2>Omitir esta ocurrencia</h2><p>${escapeHtml(item.title)} · ${fmtDate(item.date)} ${escapeHtml(item.time||'')}</p></div><button type="button" data-close-skip aria-label="Cerrar">×</button></header><div><label>Motivo de omisión <em>*</em><textarea name="reason" required maxlength="300" rows="4" placeholder="Indicá por qué no corresponde ejecutar esta ocurrencia"></textarea></label></div><footer><button type="button" class="secondary-button" data-close-skip>Cancelar</button><button type="submit" class="primary-button">Omitir y continuar serie</button></footer></form>`;
  document.body.appendChild(modal);modal.querySelectorAll('[data-close-skip]').forEach(button=>button.onclick=()=>modal.remove());modal.querySelector('textarea')?.focus();
  modal.querySelector('form').onsubmit=event=>{event.preventDefault();const reason=event.currentTarget.reason.value.trim();if(!reason){event.currentTarget.reason.focus();return}const next=reminderAdvanceOccurrence(item,'skipped',reason);saveReminders();modal.remove();render();toast(next?`Ocurrencia omitida. Próxima: ${fmtDate(next)}`:'Ocurrencia omitida y serie finalizada')};
}
function closeDueReminderAlert(modal,delay=280){
  modal?.remove();
  reminderAlertOpening=false;
  window.setTimeout(checkDueReminderAlerts,delay);
}
function closeObsoleteReminderAlert(){
  const modal=document.querySelector('.reminder-alert-backdrop');
  if(!modal)return false;
  const item=reminders.find(entry=>entry.id===modal.dataset.reminderId);
  if(item&&['pending',''].includes(item.status||'')&&modal.dataset.reminderOccurrence===reminderOccurrenceKey(item))return false;
  closeDueReminderAlert(modal,0);
  return true;
}
function openDueReminderAlert(item){
  if(!item||reminderAlertOpening||document.querySelector('.reminder-alert-backdrop'))return;
  reminderAlertOpening=true;
  const linked=reminderRelatedCase(item),dueAt=reminderDateTime(item),isOverdue=Date.now()>dueAt;
  const stateLabel=isOverdue?'VENCIDO':Number(item.leadMinutes||0)>0?'AVISO ANTICIPADO':'AHORA';
  const caseLabel=item.order||linked?.order||item.plate||'Sin vincular';
  const plateLabel=item.plate||linked?.plate||'Sin patente';
  const modal=document.createElement('div');
  modal.className='reminder-alert-backdrop';
  modal.dataset.reminderId=item.id;
  modal.dataset.reminderOccurrence=reminderOccurrenceKey(item);
  modal.innerHTML=`<section class="reminder-alert-card ${isOverdue?'is-overdue':''}" role="alertdialog" aria-modal="true" aria-labelledby="dueReminderTitle"><header class="reminder-alert-header"><div class="reminder-alert-symbol" aria-hidden="true">!</div><div class="reminder-alert-heading"><span>RECORDATORIO OPERATIVO</span><h2 id="dueReminderTitle">${escapeHtml(item.title)}</h2><p>${isOverdue?'Este compromiso venció y requiere una decisión.':'Se alcanzó el aviso anticipado configurado.'}</p></div><button class="reminder-alert-close" type="button" data-alert-action="close" aria-label="Posponer el aviso 15 minutos">×</button></header><div class="reminder-alert-body"><span class="reminder-alert-state">${stateLabel}</span><div class="reminder-alert-meta"><div><span>Fecha y hora</span><strong>${fmtDate(item.date)} · ${escapeHtml(item.time||'Sin hora')}</strong></div><div><span>Responsable</span><strong>${escapeHtml(item.responsible||'Sin asignar')}</strong></div><div><span>Categoría</span><strong>${escapeHtml(item.category||'Seguimiento')}</strong></div><div><span>Caso</span><strong>${escapeHtml(caseLabel)} · ${escapeHtml(plateLabel)}</strong></div></div>${item.note?`<p class="reminder-alert-note"><b>Contexto:</b> ${escapeHtml(item.note)}</p>`:''}</div><footer class="reminder-alert-footer"><button type="button" data-alert-action="view">Ver recordatorio</button><div><button type="button" class="is-snooze" data-alert-action="snooze">Avisar en 15 min</button><button type="button" data-alert-action="acknowledge">Avisado</button><button type="button" class="is-complete" data-alert-action="complete">Completar</button></div></footer></section>`;
  document.body.appendChild(modal);
  const snooze=()=>{
    const actor=currentApplicationUser()?.username||'Usuario',now=new Date();
    item.snoozedUntil=new Date(now.getTime()+15*60000).toISOString();item.snoozedAt=now.toISOString();item.snoozedBy=actor;
    saveReminders();closeDueReminderAlert(modal);renderPendingResultAlerts();toast('Volveremos a avisarte en 15 minutos');
  };
  modal.querySelector('[data-alert-action="close"]').onclick=snooze;
  modal.querySelector('[data-alert-action="snooze"]').onclick=snooze;
  modal.querySelector('[data-alert-action="acknowledge"]').onclick=()=>{
    item.alertAcknowledgedFor=reminderOccurrenceKey(item);item.alertAcknowledgedAt=new Date().toISOString();item.alertAcknowledgedBy=currentApplicationUser()?.username||'Usuario';
    saveReminders();closeDueReminderAlert(modal);renderPendingResultAlerts();toast('Aviso registrado');
  };
  modal.querySelector('[data-alert-action="complete"]').onclick=()=>{
    const next=reminderAdvanceOccurrence(item,'completed');
    saveReminders();closeDueReminderAlert(modal);render();toast(next?`Ocurrencia completada. Próxima: ${fmtDate(next)}`:'Recordatorio completado');
  };
  modal.querySelector('[data-alert-action="view"]').onclick=()=>{
    item.alertAcknowledgedFor=reminderOccurrenceKey(item);item.alertAcknowledgedAt=new Date().toISOString();item.alertAcknowledgedBy=currentApplicationUser()?.username||'Usuario';
    saveReminders();reminderStatusFilter='active';reminderSearch=item.title||'';closeDueReminderAlert(modal,500);navigateToView('reminders');
  };
  modal.onclick=event=>{if(event.target===modal)snooze()};
  modal.onkeydown=event=>{if(event.key==='Escape')snooze()};
  modal.querySelector('[data-alert-action="snooze"]')?.focus();
}
function checkDueReminderAlerts(){
  const user=currentApplicationUser();
  if(!user||!canAccessView('reminders',user)||document.hidden||reminderAlertOpening||document.querySelector('.reminder-alert-backdrop')||document.querySelector('.reminder-modal-backdrop'))return;
  const item=reminderPopupItems()[0];
  if(item)openDueReminderAlert(item);
}
function startReminderAlertWatcher(){
  if(reminderAlertTimer)window.clearInterval(reminderAlertTimer);
  reminderAlertTimer=window.setInterval(checkDueReminderAlerts,15000);
  window.setTimeout(checkDueReminderAlerts,300);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.setTimeout(checkDueReminderAlerts,150)});
window.addEventListener('focus',()=>window.setTimeout(checkDueReminderAlerts,150));
function bindReminders(){
  renderReminderSyncStatus();
  const openNew=()=>openReminderModal();
  const newButton=document.getElementById('newReminderButton');if(newButton)newButton.onclick=openNew;
  document.querySelector('[data-create-reminder-empty]')?.addEventListener('click',openNew);
  const status=document.getElementById('reminderStatusFilter'),category=document.getElementById('reminderCategoryFilter'),search=document.getElementById('reminderSearch');
  if(status)status.onchange=()=>{reminderStatusFilter=status.value;render()};
  if(category)category.onchange=()=>{reminderCategoryFilter=category.value;render()};
  if(search)search.oninput=()=>{reminderSearch=search.value;const table=document.querySelector('.reminder-table-panel');if(table)table.outerHTML=new DOMParser().parseFromString(remindersView(),'text/html').querySelector('.reminder-table-panel').outerHTML;bindReminders()};
  document.querySelectorAll('[data-reminder-action]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.reminderId,item=reminders.find(entry=>entry.id===id),action=button.dataset.reminderAction;
    if(!item)return;
    if(action==='edit'){openReminderModal(id);return}
    if(action==='case'){const linked=reminderRelatedCase(item);if(linked){selectedDatabaseOrder=linked.order;navigateToView('database')}return}
    if(action==='skip'){openReminderSkipModal(item);return}
    const actor=currentApplicationUser()?.username||'Usuario',now=new Date().toISOString();
    let message='Recordatorio actualizado';
    if(action==='delete'){
      if(!confirm(`¿Eliminar el recordatorio “${item.title}”?`))return;
      reminders=reminders.filter(entry=>entry.id!==id);message='Recordatorio eliminado'
    }else if(action==='complete'){
      const next=reminderAdvanceOccurrence(item,'completed');
      message=next?`Ocurrencia completada. Próxima: ${fmtDate(next)}`:'Recordatorio completado'
    }else if(action==='reopen'){
      item.status='pending';item.reopenedAt=now;item.reopenedBy=actor;delete item.completedAt;delete item.completedBy;message='Recordatorio reabierto'
    }else if(action==='pause'){
      item.status='paused';item.pausedAt=now;item.pausedBy=actor;message='Serie pausada'
    }else if(action==='resume'){
      item.status='pending';item.resumedAt=now;item.resumedBy=actor;
      if(new Date(`${item.date}T${item.time||'00:00'}:00`).getTime()<Date.now()){
        let next=reminderIsRecurring(item)?reminderNextOccurrence(item):reminderIsoDate(new Date()),guard=0;
        while(next&&new Date(`${next}T${item.time||'00:00'}:00`).getTime()<Date.now()&&guard<400){next=reminderNextOccurrence(item,next);guard+=1}
        item.date=next||reminderIsoDate(new Date());
      }
      message='Serie reanudada'
    }else if(action==='finish'){
      if(!confirm(`¿Finalizar definitivamente la serie “${item.title}”?`))return;
      item.status='completed';item.completedAt=now;item.completedBy=actor;item.seriesFinished=true;message='Serie finalizada'
    }else if(action==='postpone'){
      const previousDate=item.date,date=new Date(`${item.date}T12:00:00`);date.setDate(date.getDate()+1);item.date=reminderIsoDate(date);item.status='pending';item.postponedFrom=previousDate;item.postponedAt=now;item.postponedBy=actor;message='Recordatorio pospuesto un día'
    }
    item.updatedAt=now;item.updatedBy=actor;saveReminders();render();toast(message)
  });
}
const PART_CODE_ALERT_AFTER_MS=24*60*60*1000;
function partCodeReferenceTime(c){
  const createdAt=Date.parse(c.createdAt||'');
  if(Number.isFinite(createdAt))return createdAt;
  const auditTimes=(Array.isArray(c.auditHistory)?c.auditHistory:[]).map(entry=>Date.parse(entry.at||'')).filter(Number.isFinite);
  if(auditTimes.length)return Math.min(...auditTimes);
  const requestDate=Date.parse(c.requestDate?`${c.requestDate}T00:00:00`:'');
  return Number.isFinite(requestDate)?requestDate:Date.now();
}
function partCodePendingHours(c,now=Date.now()){
  return Math.max(0,Math.floor((now-partCodeReferenceTime(c))/(60*60*1000)));
}
function pendingPartCodeCases(now=Date.now()){
  return branchVisibleCases(cases).filter(c=>c.status!=='DADO DE BAJA'&&c.requested&&!String(c.partCode||'').trim()&&now-partCodeReferenceTime(c)>PART_CODE_ALERT_AFTER_MS).sort((a,b)=>partCodeReferenceTime(a)-partCodeReferenceTime(b));
}
function renderPendingResultAlerts(){
  const control=document.getElementById('pendingAlertControl'),button=document.getElementById('pendingAlertButton'),panel=document.getElementById('pendingAlertPanel'),count=document.getElementById('pendingAlertCount'),total=document.getElementById('pendingAlertTotal'),list=document.getElementById('pendingAlertList');
  if(!control||!button||!panel||!count||!total||!list)return;
  const pendingTurns=canAccessView('today-appointments')?pendingExecutionResults():[];
  const pendingDeposits=canAccessView('parts-registry')?pendingDepositClassifications():[];
  const pendingReminders=canAccessView('reminders')?reminderAlertItems():[];
  const pendingPartCodes=canAccessView('parts')?pendingPartCodeCases():[];
  const pendingTotal=pendingTurns.length+pendingDeposits.length+pendingReminders.length+pendingPartCodes.length;
  control.hidden=!canAccessView('today-appointments')&&!canAccessView('parts-registry')&&!canAccessView('reminders')&&!canAccessView('parts');
  count.textContent=String(pendingTotal);
  count.hidden=pendingTotal===0;
  total.textContent=String(pendingTotal);
  button.classList.toggle('has-pending',pendingTotal>0);
  button.setAttribute('aria-label',pendingTotal?`${pendingTotal} pendiente${pendingTotal===1?'':'s'} operativo${pendingTotal===1?'':'s'} por resolver`:'No hay pendientes operativos');
  button.setAttribute('aria-expanded',String(pendingResultsOpen));
  panel.hidden=!pendingResultsOpen;
  const turnGroup=pendingTurns.length?`<section class="pending-alert-group is-critical ${pendingTurnAlertsExpanded?'is-expanded':'is-collapsed'}" aria-labelledby="pendingTurnTitle"><header><button class="pending-alert-group-toggle" type="button" data-toggle-alert-group="turns" aria-expanded="${pendingTurnAlertsExpanded}" aria-controls="pendingTurnAlertsBody"><div><span>RESULTADOS DE TURNOS</span><strong id="pendingTurnTitle">Confirmación pendiente</strong></div><span class="pending-alert-group-controls"><output>${pendingTurns.length}</output><span class="pending-alert-toggle-label">${pendingTurnAlertsExpanded?'Ocultar':'Mostrar'}</span><span class="pending-alert-chevron" aria-hidden="true">⌄</span></span></button></header><div class="pending-alert-group-body" id="pendingTurnAlertsBody" ${pendingTurnAlertsExpanded?'':'hidden'}><p>Turnos vencidos sin resultado registrado.</p><div class="pending-alert-group-items">${pendingTurns.slice(0,5).map(c=>`<button type="button" data-pending-result-date="${escapeHtml(c.appointmentDate)}"><span class="pending-alert-item-mark" aria-hidden="true">!</span><span><strong>${escapeHtml(c.order)} <i>${escapeHtml(c.plate||'Sin patente')}</i></strong><small>Turno ${fmtDate(c.appointmentDate)}${c.time?` · ${escapeHtml(c.time)}`:''}</small></span><b>Revisar</b></button>`).join('')}</div><button class="pending-alert-group-action" type="button" data-review-turn-results>Revisar resultados <span aria-hidden="true">→</span></button></div></section>`:'';
  const partCodeGroup=pendingPartCodes.length?`<section class="pending-alert-group is-warning part-code-alert-group ${pendingPartCodeAlertsExpanded?'is-expanded':'is-collapsed'}" aria-labelledby="pendingPartCodeTitle"><header><button class="pending-alert-group-toggle" type="button" data-toggle-alert-group="part-code" aria-expanded="${pendingPartCodeAlertsExpanded}" aria-controls="pendingPartCodeAlertsBody"><div><span>CÓDIGO DE REPUESTO</span><strong id="pendingPartCodeTitle">Más de 24 h sin código</strong></div><span class="pending-alert-group-controls"><output>${pendingPartCodes.length}</output><span class="pending-alert-toggle-label">${pendingPartCodeAlertsExpanded?'Ocultar':'Mostrar'}</span><span class="pending-alert-chevron" aria-hidden="true">⌄</span></span></button></header><div class="pending-alert-group-body" id="pendingPartCodeAlertsBody" ${pendingPartCodeAlertsExpanded?'':'hidden'}><p>Casos creados hace más de 24 horas que todavía no tienen código cargado en Repuestos.</p><div class="pending-alert-group-items">${pendingPartCodes.slice(0,5).map(c=>`<button type="button" data-pending-part-code-order="${escapeHtml(c.order)}"><span class="pending-alert-item-mark" aria-hidden="true">!</span><span><strong>${escapeHtml(c.order)} <i>${escapeHtml(c.plate||'Sin patente')}</i></strong><small>${escapeHtml(c.part||'Repuesto sin especificar')} · ${partCodePendingHours(c)} h sin código</small></span><b>Completar</b></button>`).join('')}</div><button class="pending-alert-group-action" type="button" data-review-part-codes>Ir a Repuestos <span aria-hidden="true">→</span></button></div></section>`:'';
  const depositGroup=pendingDeposits.length?`<section class="pending-alert-group is-warning ${pendingDepositAlertsExpanded?'is-expanded':'is-collapsed'}" aria-labelledby="pendingDepositTitle"><header><button class="pending-alert-group-toggle" type="button" data-toggle-alert-group="deposit" aria-expanded="${pendingDepositAlertsExpanded}" aria-controls="pendingDepositAlertsBody"><div><span>CLASIFICACIÓN DE DEPÓSITO</span><strong id="pendingDepositTitle">Ubicación o condición pendiente</strong></div><span class="pending-alert-group-controls"><output>${pendingDeposits.length}</output><span class="pending-alert-toggle-label">${pendingDepositAlertsExpanded?'Ocultar':'Mostrar'}</span><span class="pending-alert-chevron" aria-hidden="true">⌄</span></span></button></header><div class="pending-alert-group-body" id="pendingDepositAlertsBody" ${pendingDepositAlertsExpanded?'':'hidden'}><p>Repuestos reparados todavía en “Seleccionar estado”.</p><div class="pending-alert-group-items">${pendingDeposits.slice(0,5).map(item=>{const order=item.order||item.sourceOrder||'Sin N.º OR';return `<button type="button" data-pending-deposit-key="${escapeHtml(item.key)}"><span class="pending-alert-item-mark" aria-hidden="true">!</span><span><strong>${escapeHtml(order)} <i>${escapeHtml(item.partCode||'Sin código')}</i></strong><small>${escapeHtml(item.part||'Repuesto sin especificar')} · ${fmtDate(item.repairDate)}</small></span><b>Clasificar</b></button>`}).join('')}</div><button class="pending-alert-group-action" type="button" data-review-deposit-results>Ir a Depósito <span aria-hidden="true">→</span></button></div></section>`:'';
  const reminderGroup=pendingReminders.length?`<section class="pending-alert-group is-information ${pendingReminderAlertsExpanded?'is-expanded':'is-collapsed'}" aria-labelledby="pendingReminderTitle"><header><button class="pending-alert-group-toggle" type="button" data-toggle-alert-group="reminders" aria-expanded="${pendingReminderAlertsExpanded}" aria-controls="pendingReminderAlertsBody"><div><span>AGENDA OPERATIVA</span><strong id="pendingReminderTitle">Recordatorios para atender</strong></div><span class="pending-alert-group-controls"><output>${pendingReminders.length}</output><span class="pending-alert-toggle-label">${pendingReminderAlertsExpanded?'Ocultar':'Mostrar'}</span><span class="pending-alert-chevron" aria-hidden="true">⌄</span></span></button></header><div class="pending-alert-group-body" id="pendingReminderAlertsBody" ${pendingReminderAlertsExpanded?'':'hidden'}><p>Compromisos vencidos, para hoy o dentro de su aviso anticipado.</p><div class="pending-alert-group-items">${pendingReminders.slice(0,5).map(item=>{const state=reminderDayState(item),stateLabel=state==='overdue'?'Vencido':state==='today'?'Hoy':'Próximo';return `<button type="button" data-pending-reminder-id="${escapeHtml(item.id)}"><span class="pending-alert-item-mark" aria-hidden="true">${state==='overdue'?'!':'•'}</span><span><strong>${escapeHtml(item.title)} <i>${escapeHtml(item.order||item.plate||'Sin caso')}</i></strong><small>${stateLabel} · ${fmtDate(item.date)} · ${escapeHtml(item.time||'Sin hora')} · ${escapeHtml(item.responsible||'Sin asignar')}</small></span><b>Ver</b></button>`}).join('')}</div><button class="pending-alert-group-action" type="button" data-review-reminders>Ir a Recordatorios <span aria-hidden="true">→</span></button></div></section>`:'';
  list.innerHTML=pendingTotal?turnGroup+partCodeGroup+depositGroup+reminderGroup:`<div class="pending-alert-empty"><strong>Todo bajo control</strong><span>No hay códigos, resultados, clasificaciones ni recordatorios pendientes.</span></div>`;
  button.onclick=event=>{event.stopPropagation();pendingResultsOpen=!pendingResultsOpen;renderPendingResultAlerts()};
  panel.onclick=event=>event.stopPropagation();
  panel.querySelectorAll('[data-toggle-alert-group]').forEach(toggle=>toggle.onclick=()=>{if(toggle.dataset.toggleAlertGroup==='turns')pendingTurnAlertsExpanded=!pendingTurnAlertsExpanded;else if(toggle.dataset.toggleAlertGroup==='part-code')pendingPartCodeAlertsExpanded=!pendingPartCodeAlertsExpanded;else if(toggle.dataset.toggleAlertGroup==='deposit')pendingDepositAlertsExpanded=!pendingDepositAlertsExpanded;else pendingReminderAlertsExpanded=!pendingReminderAlertsExpanded;renderPendingResultAlerts()});
  panel.querySelectorAll('[data-pending-result-date]').forEach(item=>item.onclick=()=>{pendingResultsOpen=false;selectedExecutionDate=item.dataset.pendingResultDate;navigateToView('today-appointments')});
  panel.querySelector('[data-review-turn-results]')?.addEventListener('click',()=>{pendingResultsOpen=false;selectedExecutionDate=pendingTurns[0].appointmentDate;navigateToView('today-appointments')});
  const openPartCodeCase=async order=>{pendingResultsOpen=false;navigateToView('parts');if(!(await acquireCaseLock(order,'Repuestos')))return;selectedPartCommentOrder=order;render();setTimeout(()=>document.querySelector('[data-part-code-form] input')?.focus(),0)};
  panel.querySelectorAll('[data-pending-part-code-order]').forEach(item=>item.onclick=()=>openPartCodeCase(item.dataset.pendingPartCodeOrder));
  panel.querySelector('[data-review-part-codes]')?.addEventListener('click',()=>{pendingResultsOpen=false;navigateToView('parts')});
  panel.querySelectorAll('[data-pending-deposit-key]').forEach(item=>item.onclick=()=>{const record=pendingDeposits.find(entry=>entry.key===item.dataset.pendingDepositKey);pendingResultsOpen=false;registryMode='deposit';depositStatusFilter='SIN CLASIFICAR';depositQuery=record?.order||record?.sourceOrder||record?.partCode||'';navigateToView('parts-registry')});
  panel.querySelector('[data-review-deposit-results]')?.addEventListener('click',()=>{pendingResultsOpen=false;registryMode='deposit';depositStatusFilter='SIN CLASIFICAR';depositQuery='';navigateToView('parts-registry')});
  panel.querySelectorAll('[data-pending-reminder-id]').forEach(item=>item.onclick=()=>{const reminder=reminders.find(entry=>entry.id===item.dataset.pendingReminderId);pendingResultsOpen=false;reminderStatusFilter='active';reminderSearch=reminder?.title||'';navigateToView('reminders')});
  panel.querySelector('[data-review-reminders]')?.addEventListener('click',()=>{pendingResultsOpen=false;reminderStatusFilter='active';reminderSearch='';navigateToView('reminders')});
}
function renderNav(){const allowed=views.filter(v=>canAccessView(v.id));document.getElementById('navigation').innerHTML=allowed.map(v=>`${v.group?`<div class="nav-group">${v.group}</div>`:''}<button class="nav-item ${currentView===v.id?'active':''}" data-view="${v.id}" aria-label="${escapeHtml(v.label)}" title="${escapeHtml(v.label)}"><span class="nav-icon" aria-hidden="true"><span>${v.icon}</span></span><span class="nav-label">${v.label}</span>${navCount(v.id)!==''?`<span class="nav-count">${navCount(v.id)}</span>`:''}</button>`).join('');document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>navigateToView(button.dataset.view))}
function actionFor(c){if(c.status==='RESULTADO PENDIENTE')return 'Registrar resultado';if(c.requested&&!c.arrived)return 'Confirmar arribo';if(c.arrived&&!c.vor&&!plateReady(c))return 'Esperar otros repuestos';if(c.arrived&&!c.appointmentDate&&!c.vor)return 'Asignar turno';return 'Ver detalle'}
function row(c){const displayStatus=databaseDisplayStatus(c);return `<tr><td class="order-cell"><strong>${escapeHtml(c.order)}</strong><small>${fmtDate(c.requestDate)}</small></td><td>${escapeHtml(c.plate)}</td><td>${escapeHtml(c.client)}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td>${escapeHtml(c.part)}</td><td><span class="badge ${badgeClass(displayStatus)}">${escapeHtml(displayStatus)}</span></td><td>${c.appointmentDate?`${fmtDate(c.appointmentDate)} ${escapeHtml(c.time)}`:'-'}</td><td><button class="row-action" data-order="${escapeHtml(c.order)}">${actionFor(c)}</button></td></tr>`}
function table(items){if(!items.length)return `<div class="empty-state"><span class="empty-icon">✓</span><h3>No hay casos en esta vista</h3><p>Los casos aparecerán cuando cumplan las condiciones del circuito.</p></div>`;return `<div class="table-wrap"><table class="data-table"><thead><tr><th>ORDEN</th><th>PATENTE</th><th>CLIENTE</th><th>PRIORIDAD</th><th>REPUESTO</th><th>ESTADO</th><th>TURNO</th><th>PRÓXIMA ACCIÓN</th></tr></thead><tbody>${items.map(row).join('')}</tbody></table></div>`}
function databaseDisplayStatus(c){return caseOperationalStatus(c)}
function databaseTable(items){if(!items.length)return table(items);const totalPages=Math.max(1,Math.ceil(items.length/DATABASE_PAGE_SIZE));databasePage=Math.min(databasePage,totalPages);const start=(databasePage-1)*DATABASE_PAGE_SIZE;const pageItems=items.slice(start,start+DATABASE_PAGE_SIZE);return `<div class="readonly-notice"><span aria-hidden="true">◉</span><div><strong>Vista de solo lectura</strong><p>Registro maestro. Tocá una fila para abrir la ficha completa del caso.</p></div></div><div class="table-wrap no-scroll-table"><table class="data-table database-table"><thead><tr><th>FECHA</th><th>SUCURSAL</th><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>PRIORIDAD</th><th>REPUESTO</th><th>TIEMPO REP.</th><th>ESTADO</th></tr></thead><tbody>${pageItems.map(c=>{const displayStatus=databaseDisplayStatus(c);return `<tr data-database-order="${escapeHtml(c.order)}" tabindex="0" aria-label="Abrir ficha del caso ${escapeHtml(c.order)}"><td>${fmtDate(c.requestDate)}</td><td><span class="branch-chip">${escapeHtml(c.branch||'Santa Fe')}</span></td><td class="order-cell"><strong>${escapeHtml(c.order)}</strong></td><td>${escapeHtml(c.plate)}</td><td>${escapeHtml(c.client)}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td class="part-description" title="${escapeHtml(c.part||'-')}">${escapeHtml(c.part||'-')}</td><td>${escapeHtml(c.repairTime||'-')}</td><td><span class="badge ${badgeClass(displayStatus)}">${escapeHtml(displayStatus)}</span></td></tr>`}).join('')}</tbody></table></div>${totalPages>1?`<nav class="table-pagination" aria-label="Paginación de base de datos"><button type="button" class="secondary-button" data-database-page="prev" ${databasePage===1?'disabled':''}>Anterior</button><span>Página ${databasePage} de ${totalPages} · ${items.length} casos</span><button type="button" class="secondary-button" data-database-page="next" ${databasePage===totalPages?'disabled':''}>Siguiente</button></nav>`:''}`}
function databaseStateKpis(items){const states=['PENDIENTE DE REPUESTO','PENDIENTE DE TURNO','PROGRAMADO','TURNO SIN REPUESTO','REALIZADO','DADO DE BAJA'];return `<section class="state-kpis">${states.map(state=>{const count=items.filter(c=>databaseDisplayStatus(c)===state).length;return `<article class="${count?'':'empty'}"><span>${escapeHtml(state)}</span><strong>${count}</strong></article>`}).join('')}</section>`}
function databaseVorKpis(items){const vorItems=items.filter(c=>c.vor),states=['NO AVISADO','AVISADO','REALIZADO'];return `<section class="database-vor-summary"><header><span>SEGUIMIENTO VOR</span><small>${vorItems.length} ${vorItems.length===1?'caso':'casos'} VOR</small></header><div class="database-vor-kpis">${states.map(state=>{const count=vorItems.filter(c=>normalizedVorStatus(c)===state).length;return `<article class="vor-${state.toLowerCase().replaceAll(' ','-')} ${count?'':'empty'}"><span>${state}</span><strong>${count}</strong></article>`}).join('')}</div></section>`}
function databaseEditPanel(c){return `<form class="database-edit-panel" data-db-edit-form="${escapeHtml(c.order)}"><header class="db-edit-heading"><div><span>CORRECCIÓN DEL REGISTRO</span><h3>Editar información</h3><p>Actualizá los datos maestros del caso sin alterar su recorrido operativo.</p></div><div class="db-edit-record"><small>NRO OR ACTUAL</small><strong>${escapeHtml(c.order)}</strong></div></header><div class="db-edit-sections"><section class="db-edit-section"><header><b>01</b><div><h4>Identificación del caso</h4><p>Datos que permiten localizar la orden y el vehículo.</p></div></header><div class="db-edit-grid db-edit-grid-identification"><label><span>VIN <b>*</b></span><input name="vin" maxlength="17" value="${escapeHtml(c.vin||'')}" required></label><label><span>NRO OR <b>*</b></span><input name="order" value="${escapeHtml(c.order)}" required></label><label><span>Patente <b>*</b></span><input name="plate" value="${escapeHtml(c.plate)}" required></label></div></section><section class="db-edit-section"><header><b>02</b><div><h4>Cliente y cobertura</h4><p>Contacto y condiciones registradas para la evaluación.</p></div></header><div class="db-edit-grid db-edit-grid-coverage"><label class="span-2"><span>Cliente <b>*</b></span><input name="client" value="${escapeHtml(c.client)}" required></label><label class="span-2"><span>Teléfono <b>*</b></span><input name="phone" value="${escapeHtml(c.phone||'')}" required></label><label><span>Fecha de venta <b>*</b></span><input name="saleDate" type="date" value="${escapeHtml(c.saleDate||'')}" required></label><label><span>Kilometraje <b>*</b></span><input name="km" type="number" min="0" step="1" value="${escapeHtml(String(c.km||'').replace(/\D/g,''))}" required></label><label class="span-2"><span>Prioridad <b>*</b></span><select name="priority" required><option ${c.priority==='Normal'?'selected':''}>Normal</option><option ${c.priority==='Alta'?'selected':''}>Alta</option><option ${c.priority==='Urgente'?'selected':''}>Urgente</option></select></label></div></section><section class="db-edit-section"><header><b>03</b><div><h4>Trabajo solicitado</h4><p>Alcance técnico y observaciones generales del caso.</p></div></header><div class="db-edit-grid db-edit-grid-work"><label><span>Tiempo de reparación <b>*</b></span><input name="repairTime" value="${escapeHtml(c.repairTime||'')}" required></label><label class="db-edit-check db-edit-vor"><input name="vor" type="checkbox" ${c.vor?'checked':''}><span><strong>Caso VOR</strong><small>Atención prioritaria del vehículo</small></span></label><aside class="db-edit-code-note"><span>RP</span><p><strong>Código administrado en Repuestos</strong><small>La modificación del código se realiza únicamente desde su ficha operativa.</small></p></aside><label class="span-2"><span>Descripción del repuesto <b>*</b></span><textarea name="part" rows="3" required>${escapeHtml(c.part||'')}</textarea></label><label class="span-2"><span>Observaciones <b>*</b></span><textarea name="observations" rows="3" required>${escapeHtml(c.observations||'')}</textarea></label></div></section></div><footer><p><strong>Registro maestro</strong><span>Los cambios quedarán disponibles en todas las vistas relacionadas.</span></p><div><button type="button" class="secondary-button" data-db-edit-cancel>Cancelar</button><button type="submit" class="primary-button">Guardar cambios</button></div></footer></form>`}
function databaseCaseSheet(){const c=selectedDatabaseOrder?branchVisibleCases(cases).find(item=>item.order===selectedDatabaseOrder):null;if(!c)return '';const field=(label,value,wide=false)=>`<div class="case-detail ${wide?'wide':''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value||'-')}</dd></div>`;const timeline=[{label:'Pedido registrado',date:c.requestDate,active:Boolean(c.requestDate)},{label:'Repuesto arribado',date:c.arrivalDate,active:Boolean(c.arrived&&c.arrivalDate)},{label:'Primer contacto',date:c.firstConversation,active:Boolean(c.firstConversation)},{label:c.status==='REALIZADO'?'Trabajo realizado':'Turno programado',date:c.status==='REALIZADO'?c.appointmentDate:(isProgrammed(c)?c.appointmentDate:''),time:c.time,active:c.status==='REALIZADO'||isProgrammed(c)}];if(c.status==='DADO DE BAJA')timeline.push({label:'Caso dado de baja',date:c.cancelledAt,active:true});const requestDays=c.requestDate?(c.arrived?daysBetween(c.requestDate,c.arrivalDate):daysFrom(c.requestDate)):0;const arrivalDays=c.arrivalDate?daysFrom(c.arrivalDate):0;const nextAction=c.status==='PENDIENTE DE REPUESTO'?'Dar seguimiento al pedido del repuesto':c.status==='PENDIENTE DE TURNO'?'Contactar al cliente y coordinar turno':c.status==='TURNO SIN REPUESTO'?'Resolver disponibilidad antes del turno':c.status==='PROGRAMADO'?'Preparar la recepción del vehículo':c.status==='SIN AVISAR'?'Gestionar el caso VOR':'Revisar el estado del caso';const stageIndex=c.status==='REALIZADO'?4:isProgrammed(c)?3:c.arrived?2:c.requested?1:0;const processStages=['Pedido','Arribo','Coordinación','Cierre'];return `<div class="case-sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="caseSheetTitle"><aside class="case-sheet"><header class="case-sheet-header"><div class="case-sheet-brandmark" aria-hidden="true">OR</div><div class="case-sheet-title"><span>Ficha operativa</span><h2 id="caseSheetTitle">${escapeHtml(c.order)}</h2><p><strong>${escapeHtml(c.plate)}</strong><i></i>${escapeHtml(c.client)}</p></div><div class="case-sheet-reference"><span>Registro maestro</span><strong>Solo lectura</strong></div><button class="case-sheet-close" data-close-sheet aria-label="Cerrar ficha">×</button></header><section class="case-command"><div class="case-command-state"><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'SIN ESTADO')}</span><span class="priority-mark ${escapeHtml(c.priority.toLowerCase())}">Prioridad ${escapeHtml(c.priority)}</span>${c.vor?'<span class="vor-mark">VOR</span>':''}</div><div class="case-next-action"><span>Próxima acción sugerida</span><strong>${escapeHtml(nextAction)}</strong></div></section>${editingDatabaseOrder===c.order?databaseEditPanel(c):``}<section class="case-metrics" aria-label="Indicadores del caso"><article><span>Días en circuito</span><strong>${daysFrom(c.requestDate)}</strong><small>desde el pedido</small></article><article><span>Desde arribo</span><strong>${c.arrivalDate?arrivalDays:'-'}</strong><small>${c.arrivalDate?'días transcurridos':'sin arribo'}</small></article><article><span>Turno</span><strong class="metric-date">${c.appointmentDate?fmtDate(c.appointmentDate):'-'}</strong><small>${escapeHtml(c.time||'sin programar')}</small></article></section><section class="case-process-block"><header><span>04</span><div><h3>Trazabilidad</h3><p>Avance principal del circuito</p></div></header><nav class="case-process" aria-label="Avance del proceso">${processStages.map((stage,index)=>`<div class="${index<stageIndex?'complete':index===stageIndex?'current':''}"><span>${String(index+1).padStart(2,'0')}</span><strong>${stage}</strong><i></i></div>`).join('')}</nav></section><div class="case-sheet-body"><section class="case-section identity-section"><header><span>01</span><div><h3>Cliente y vehículo</h3><p>Identificación y datos de contacto</p></div></header><dl class="case-detail-grid">${field('Cliente',c.client,true)}${field('Patente',c.plate)}${field('Teléfono',c.phone||'-',true)}${field('Fecha de venta',fmtDate(c.saleDate))}${field('Kilometraje',fmtKm(c.km))}</dl></section><section class="case-section parts-section"><header><span>02</span><div><h3>Repuesto y reparación</h3><p>Información técnica y disponibilidad</p></div></header><dl class="case-detail-grid">${field('Pedido de repuesto',c.requested?'Sí':'No')}${field('Fecha del pedido',fmtDate(c.requestDate))}${field('Código',c.partCode||'-')}${field('Tiempo de reparación',c.repairTime||'-')}${field('Descripción',c.part||'-',true)}${field('Estado del arribo',c.arrived?'Confirmado':'Pendiente')}${field('Fecha de arribo',fmtDate(c.arrivalDate))}</dl></section><section class="case-section coordination-section"><header><span>03</span><div><h3>Coordinación y seguimiento</h3><p>Contacto, turno y notas operativas</p></div></header><dl class="case-detail-grid">${field('Primera conversación',fmtDate(c.firstConversation))}${field('Programado',isProgrammed(c)?'Sí':'No')}${field('Fecha del turno',fmtDate(c.appointmentDate))}${field('Hora del turno',c.time||'-')}${field('Comentario de seguimiento',c.comment||'Sin comentarios registrados',true)}${field('Observaciones',c.observations||'Sin observaciones registradas',true)}</dl></section><section class="case-section trace-section"><header><span>04</span><div><h3>Trazabilidad</h3><p>Hitos principales del circuito</p></div></header><ol class="case-timeline">${timeline.map(item=>`<li class="${item.active?'complete':''}"><i aria-hidden="true"></i><div><strong>${escapeHtml(item.label)}</strong><span>${item.active?`${fmtDate(item.date)}${item.time?` · ${escapeHtml(item.time)}`:''}`:'Pendiente'}</span></div></li>`).join('')}</ol></section></div><footer class="case-sheet-actions"><div class="case-actions-heading"><div><span class="action-kicker">Centro de control</span><h3>Acciones del caso</h3><p>Cada acción actualiza el circuito maestro.</p></div><div class="case-heading-actions"><button class="text-button" data-db-edit-open="${escapeHtml(c.order)}">Editar datos</button><button class="text-button clear-resolution" data-resolution="RESTABLECER" data-order="${escapeHtml(c.order)}">Restablecer estado</button></div></div><div class="sheet-actions"><button class="case-action secondary" data-resolution="REPROGRAMAR" data-order="${escapeHtml(c.order)}"><span>01</span><strong>Reprogramar</strong><small>Quita el turno actual</small></button><button class="case-action primary" data-resolution="REALIZADO" data-order="${escapeHtml(c.order)}"><span>02</span><strong>Marcar realizado</strong><small>Cierra la reparación</small></button><button class="case-action warning" data-resolution="DADO DE BAJA" data-order="${escapeHtml(c.order)}"><span>03</span><strong>Dar de baja</strong><small>Conserva el historial</small></button></div><div class="case-danger-zone"><div><strong>Eliminar carga errónea</strong><span>Esta acción borra el caso y no conserva historial.</span></div><button data-delete-case="${escapeHtml(c.order)}">Eliminar caso</button></div></footer></aside></div>`}
function partsOrderButton(c){const hasCode=Boolean(String(c.partCode||'').trim()),sent=Boolean(c.partOrderRequestedAt),blocked=!hasCode||sent||c.arrived,label=sent?'Pedido':c.arrived?'Arribado':hasCode?'Pedir':'Sin código',title=sent?`Pedido enviado ${fmtDate(c.partOrderRequestedAt)} por ${c.partOrderRequestedBy||'usuario'}`:c.arrived?'El repuesto ya tiene arribo confirmado':hasCode?'Enviar solicitud del repuesto por correo':'Cargá primero el código de repuesto';return `<button type="button" class="parts-order-button ${sent?'is-sent':blocked?'is-blocked':''}" data-part-request="${escapeHtml(c.order)}" ${blocked?'disabled':''} title="${escapeHtml(title)}"><span aria-hidden="true">${sent?'✓':'→'}</span><b>${escapeHtml(label)}</b></button>`}
function partsRow(c){const elapsed=c.arrived?daysBetween(c.requestDate,c.arrivalDate):daysFrom(c.requestDate),matches=samePlateCases(c),repeated=matches.length>1,color=repeated?plateColor(c.plate):'',arrivalLabel=c.arrived?'Arribó':'Pendiente',arrivalBlocked=!c.arrived&&!String(c.partCode||'').trim(),plateNotice=repeated?`<small class="coordination-alert">${matches.length} casos relacionados</small>`:'';return `<tr data-part-order="${escapeHtml(c.order)}" tabindex="0" class="${!c.arrived&&elapsed>10?'delayed-row':''} ${repeated?'repeated-plate-row':''}"${repeated?` style="--plate-color:${color}"`:''} aria-label="Abrir ficha de repuesto ${escapeHtml(c.order)}"><td>${fmtDate(c.requestDate)}</td><td><strong class="days-value">${elapsed}</strong><small class="days-label"> días</small></td><td class="order-cell"><strong>${escapeHtml(c.order)}</strong></td><td class="plate-cell"><strong>${escapeHtml(c.plate||'-')}</strong>${plateNotice}</td><td>${escapeHtml(c.client||'-')}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td>${escapeHtml(c.partCode||'-')}</td><td class="part-description" title="${escapeHtml(c.part||'-')}">${escapeHtml(c.part||'-')}</td><td>${partsOrderButton(c)}</td><td><label class="arrival-toggle ${arrivalBlocked?'is-blocked':''}"${arrivalBlocked?' title="Cargá primero el código de repuesto"':''}><input type="checkbox" data-part-arrival="${escapeHtml(c.order)}" ${c.arrived?'checked':''} ${arrivalBlocked?'disabled aria-label="Arribo bloqueado hasta cargar el código de repuesto"':''}><span aria-hidden="true"></span><b>${arrivalBlocked?'Sin código':escapeHtml(arrivalLabel)}</b></label></td></tr>`}
function partCommentSheet(){const c=selectedPartCommentOrder?branchVisibleCases(cases).find(item=>item.order===selectedPartCommentOrder):null;if(!c)return '';const elapsed=c.arrived?daysBetween(c.requestDate,c.arrivalDate):daysFrom(c.requestDate),arrivalLabel=c.arrived?'Confirmado':'Pendiente',related=samePlateCases(c).filter(item=>item.order!==c.order),nextAction=c.arrived?'Informar a Turnos y sostener trazabilidad del caso':'Dar seguimiento al pedido y confirmar disponibilidad';const detail=(label,value,wide=false,tone='')=>`<div class="case-detail${wide?' wide':''}${tone?` ${tone}`:''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value||'-')}</dd></div>`;return `<div class="case-sheet-backdrop part-comment-backdrop parts-sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="partCommentTitle"><aside class="case-sheet tps-case-sheet turn-sheet part-comment-sheet parts-case-sheet"><header class="case-sheet-header"><div class="case-sheet-brandmark" aria-hidden="true">RP</div><div class="case-sheet-title"><span>CONTROL OPERATIVO DEL REPUESTO</span><h2 id="partCommentTitle">${escapeHtml(c.order)}</h2><p><strong>${escapeHtml(c.plate)}</strong><i></i>${escapeHtml(c.client)}</p></div><div class="case-sheet-reference"><span>Repuestos</span><strong>${elapsed} días de espera</strong></div><button class="case-sheet-close" data-close-part-comment aria-label="Cerrar ficha">×</button></header><section class="case-command"><div class="case-command-state"><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'SIN ESTADO')}</span><span class="priority-mark ${escapeHtml(c.priority.toLowerCase())}">Prioridad ${escapeHtml(c.priority)}</span>${c.vor?`<span class="vor-mark">VOR · ${escapeHtml(c.vorStatus||'NO AVISADO')}</span>`:''}</div><div class="case-next-action"><span>PRÓXIMA ACCIÓN</span><strong>${escapeHtml(nextAction)}</strong></div></section><section class="case-metrics tps-case-metrics" aria-label="Indicadores del repuesto"><article class="${!c.arrived&&elapsed>10?'attention':''}"><span>Días desde pedido</span><strong>${elapsed}</strong><small>cálculo hábil operativo</small></article><article class="${c.arrived?'':'attention'}"><span>Estado de arribo</span><strong class="metric-date">${escapeHtml(arrivalLabel)}</strong><small>${c.arrivalDate?fmtDate(c.arrivalDate):'sin fecha de arribo'}</small></article><article><span>Órdenes vinculadas</span><strong>${related.length+1}</strong><small>${related.length?related.map(item=>item.order).join(' / '):'sin relacionados'}</small></article></section><div class="case-sheet-body tps-case-body turn-sheet-body"><section class="case-section turn-identity-section"><header><span>01</span><div><h3>Vehículo y cliente</h3><p>Identificación para validar la pieza</p></div></header><dl class="case-detail-grid">${detail('VIN',c.vin||'-',true)}${detail('Cliente',c.client,true)}${detail('Patente',c.plate)}${detail('Teléfono',c.phone||'-')}${detail('Fecha de venta',fmtSaleDate(c.saleDate),false,isToyota10SaleDate(c.saleDate)?'toyota10-detail':'')}${detail('Kilometraje',fmtKm(c.km),false,isToyota10Km(c.km)?'toyota10-detail':'')}</dl></section><section class="case-section turn-part-section parts-technical-section"><header><span>02</span><div><h3>Repuesto y reparación</h3><p>Datos técnicos administrados por el área de Repuestos</p></div></header><form class="parts-code-form" data-part-code-form="${escapeHtml(c.order)}"><label><span>Código de repuesto <em>Dato de Repuestos</em></span><div><input name="partCode" required autocomplete="off" value="${escapeHtml(c.partCode||'')}" placeholder="Ej. 81110-0D450"><button class="primary-button" type="submit">Guardar código</button></div><small>Ingresá el código exacto de catálogo. Se guardará en la ficha maestra del caso.</small></label></form><dl class="case-detail-grid parts-technical-grid">${detail('Descripción',c.part||'Sin especificar',true)}${detail('Fecha del pedido',fmtDate(c.requestDate))}${detail('Tiempo de reparación',c.repairTime||'-')}${detail('Estado del arribo',arrivalLabel,false,c.arrived?'arrival-confirmed':'arrival-pending')}${detail('Fecha de arribo',fmtDate(c.arrivalDate))}${detail('Observaciones',c.observations||'Sin observaciones registradas',true)}</dl></section></div></aside></div>`}
function partsTable(items){const reminder=`<aside class="parts-operational-reminder" role="note"><strong aria-hidden="true">!</strong><div><span>RECORDATORIO OPERATIVO</span><p>Si un mismo vehículo tiene repuestos solicitados en dos o más órdenes diferentes, no se deberá registrar el arribo de una sola orden. Todos los pedidos deberán arribar en conjunto; de lo contrario, no se dará arribo a ninguno, <strong>salvo en casos excepcionales que cuenten con autorización previa</strong>.</p></div></aside>`;if(!items.length)return reminder+table(items);return `${reminder}<div class="parts-guide"><span><strong>${items.filter(c=>!c.arrived).length}</strong> pendientes</span><span><strong>${items.filter(c=>String(c.partCode||'').trim()&&!c.partOrderRequestedAt&&!c.arrived).length}</strong> listos para pedir</span><span><strong>${items.filter(c=>c.partOrderRequestedAt).length}</strong> pedidos</span><span><strong>${items.filter(c=>c.arrived).length}</strong> arribados</span><p>Circuito: cargar código → pedir por correo → confirmar arribo.</p></div><div class="table-wrap no-scroll-table"><table class="data-table parts-table"><thead><tr><th>FECHA</th><th>DÍAS</th><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>PRIORIDAD</th><th>CÓDIGO</th><th>REPUESTO</th><th>PEDIR</th><th>ARRIBO</th></tr></thead><tbody>${items.map(partsRow).join('')}</tbody></table></div>${partCommentSheet()}`}
function isProgrammed(c){return c.scheduled===true||(c.scheduled!==false&&Boolean(c.appointmentDate&&c.time))}
function caseOperationalStatus(c){
  if(!c)return 'PENDIENTE DE REPUESTO';
  const stored=String(c.status||'').toUpperCase();
  if(stored==='DADO DE BAJA')return 'DADO DE BAJA';
  if(stored==='REALIZADO'||c.executionStatus==='EJECUTADO')return 'REALIZADO';
  if(c.vor)return normalizedVorStatus(c);
  const hasDate=/^\d{4}-\d{2}-\d{2}$/.test(String(c.appointmentDate||''));
  const hasTime=/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(c.time||''));
  const hasTurnData=hasDate||hasTime;
  const confirmedTurn=hasDate&&hasTime&&(c.scheduled===true||c.scheduled===undefined);
  if(hasTurnData&&!c.arrived)return 'TURNO SIN REPUESTO';
  if(c.arrived&&confirmedTurn)return 'PROGRAMADO';
  if(c.arrived)return 'PENDIENTE DE TURNO';
  return 'PENDIENTE DE REPUESTO';
}
function programmedDateFor(c){
  if(/^\d{4}-\d{2}-\d{2}$/.test(String(c.programmedAt||'')))return c.programmedAt;
  const history=Array.isArray(c.auditHistory)?[...c.auditHistory].reverse():[];
  const event=history.find(entry=>(entry.changes||[]).some(change=>
    (change.key==='scheduled'&&change.after===true)||
    (change.key==='status'&&['PROGRAMADO','RESULTADO PENDIENTE','REALIZADO'].includes(change.after))||
    ['appointmentDate','time'].includes(change.key)
  ));
  const auditedDate=String(event?.at||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(auditedDate))return auditedDate;
  const updatedDate=String(c.updatedAt||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(updatedDate))return updatedDate;
  return c.appointmentDate||iso(0);
}
function turnArrivalDays(c,arrivalDate=c.arrivalDate){if(!arrivalDate)return 0;return isProgrammed(c)?daysBetween(arrivalDate,programmedDateFor(c)):daysFrom(arrivalDate)}
function turnRow(c,derived=false){const group=plateCases(c),matches=samePlateCases(c),repeated=matches.length>1,color=repeated?plateColor(c.plate):'',lastArrival=group.map(item=>item.arrivalDate).filter(Boolean).sort().at(-1)||c.arrivalDate,arrivalDays=turnArrivalDays(c,lastArrival),orders=group.map(item=>item.order).join(' / '),parts=group.map(item=>item.part||'Sin especificar').join(' + '),times=group.map(item=>item.repairTime).filter(Boolean).join(' + '),plateMarkup=repeated?`<button class="plate-related-button" type="button" data-related-turns="${escapeHtml(c.order)}" aria-label="Ver ${matches.length} casos relacionados de la patente ${escapeHtml(c.plate)}"><strong>${escapeHtml(c.plate)}</strong></button>`:`<strong>${escapeHtml(c.plate)}</strong>`;return `<tr data-turn-order="${escapeHtml(c.order)}" tabindex="0" class="${repeated?'repeated-plate-row':''}"${repeated?` style="--plate-color:${color}"`:''} aria-label="Abrir ficha de turno de la patente ${escapeHtml(c.plate)}"><td>${fmtDate(lastArrival)}</td><td class="order-cell"><strong>${escapeHtml(orders)}</strong></td><td class="plate-cell">${plateMarkup}</td><td>${escapeHtml(c.client)}</td><td>${escapeHtml(c.phone||'-')}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td class="part-description">${escapeHtml(parts)}</td><td>${escapeHtml(times||'-')}</td><td><strong class="days-value">${arrivalDays}</strong><small class="days-label"> días</small></td></tr>`}
function turnCaseSheet(){const c=selectedTurnOrder?branchVisibleCases(cases).find(item=>item.order===selectedTurnOrder):null;if(!c)return '';const group=plateCases(c),joint=group.length>1,lastArrival=group.map(item=>item.arrivalDate).filter(Boolean).sort().at(-1)||c.arrivalDate,orders=group.map(item=>item.order).join(' / '),parts=group.map(item=>`${item.partCode||'Sin código'}: ${item.part||'Sin especificar'}`).join(' | '),repairTimes=group.map(item=>item.repairTime).filter(Boolean).join(' + '),conversationDays=c.firstConversation?(isProgrammed(c)?daysBetween(c.firstConversation,c.appointmentDate||iso(0)):daysFrom(c.firstConversation)):'-',arrivalDays=turnArrivalDays(c,lastArrival);return `<div class="case-sheet-backdrop turn-sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="turnSheetTitle"><aside class="case-sheet turn-sheet"><header class="case-sheet-header"><div class="case-sheet-brandmark" aria-hidden="true">TU</div><div class="case-sheet-title"><span>${joint?'Ficha de coordinación conjunta':'Ficha de turno'}</span><h2 id="turnSheetTitle">${escapeHtml(joint?c.plate:c.order)}</h2><p><strong>${group.length} orden${group.length===1?'':'es'}</strong><i></i>${escapeHtml(c.client)}</p></div><div class="case-sheet-reference"><span>${joint?'Coordinación confirmada':'Gestión individual'}</span><strong>${joint?'Una sola llamada':escapeHtml(c.plate)}</strong></div><button class="case-sheet-close" data-close-turn-sheet aria-label="Cerrar ficha">×</button></header><section class="case-command"><div class="case-command-state"><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'SIN ESTADO')}</span><span class="priority-mark ${escapeHtml(c.priority.toLowerCase())}">Prioridad ${escapeHtml(c.priority)}</span></div><div class="case-next-action"><span>${joint?'Programación conjunta':'Programación'}</span><strong>${isProgrammed(c)?`${fmtDate(c.appointmentDate)} · ${escapeHtml(c.time||'sin hora')}`:(joint?'Todos los repuestos disponibles':'Repuesto disponible')}</strong></div></section><div class="case-sheet-body turn-sheet-body"><section class="case-section"><header><span>01</span><div><h3>Datos del vehículo</h3><p>${joint?'Órdenes vinculadas manualmente para una única coordinación':'Gestión individual del caso'}</p></div></header><dl class="case-detail-grid">${['Último arribo',joint?'NRO OR asociados':'NRO OR','Patente','Cliente','Teléfono','Prioridad','Fecha de venta','Kilometraje','Observaciones',joint?'Repuestos del grupo':'Repuesto','Tiempo rep.','Días desde completar'].map((label,index)=>{const values=[fmtDate(lastArrival),orders,c.plate,c.client,c.phone||'-',c.priority,fmtDate(c.saleDate),fmtKm(c.km),c.observations||'-',parts,repairTimes||'-',`${arrivalDays} días`];return `<div class="case-detail ${['NRO OR asociados','Observaciones','Repuestos del grupo','Repuesto'].includes(label)?'wide':''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(values[index])}</dd></div>`}).join('')}</dl></section><section class="case-section turn-edit-section"><header><span>02</span><div><h3>Datos de cita</h3><p>${joint?'Los cambios se aplican a todas las órdenes vinculadas':'Los cambios se aplican únicamente a esta orden'}</p></div></header><div class="turn-edit-grid"><label>Primera conversación<input class="table-date" type="date" data-turn-first="${escapeHtml(c.order)}" value="${escapeHtml(c.firstConversation||'')}"></label><label>Días conversación<input value="${escapeHtml(conversationDays==='-'?'-':`${conversationDays} días`)}" readonly></label><label class="span-2">Comentario<textarea data-turn-comment="${escapeHtml(c.order)}" rows="3" placeholder="Agregar seguimiento">${escapeHtml(c.comment||'')}</textarea></label><label>Fecha turno<input class="table-date" type="date" data-turn-date="${escapeHtml(c.order)}" value="${escapeHtml(c.appointmentDate||'')}"></label><label>Hora<input class="table-time" type="text" inputmode="numeric" data-turn-time="${escapeHtml(c.order)}" value="${escapeHtml(c.time||'')}" placeholder="HH:mm" maxlength="5"></label><label class="turn-program-card"><input type="checkbox" data-turn-programmed="${escapeHtml(c.order)}" ${isProgrammed(c)?'checked':''}><span>Programado</span><strong>${isProgrammed(c)?'Sí':'No'}</strong></label></div></section></div></aside></div>`}
function turnsCharts(items){
  const noProgram=items.filter(c=>!isProgrammed(c)),withConversation=noProgram.filter(c=>c.firstConversation).length,withoutConversation=noProgram.length-withConversation,totalConversation=noProgram.length,conversationPct=totalConversation?Math.round(withConversation/totalConversation*100):0;
  const priorities=['Urgente','Alta','Normal'].map(priority=>({priority,count:items.filter(c=>c.priority===priority).length})),maxPriority=Math.max(1,...priorities.map(p=>p.count)),dominantPriority=[...priorities].sort((a,b)=>b.count-a.count)[0];
  const ageBuckets=[{label:'0 a 7',note:'Reciente',tone:'recent',count:items.filter(c=>daysFrom(c.arrivalDate)>=0&&daysFrom(c.arrivalDate)<=7).length},{label:'8 a 14',note:'Seguimiento',tone:'follow',count:items.filter(c=>daysFrom(c.arrivalDate)>=8&&daysFrom(c.arrivalDate)<=14).length},{label:'15 a 21',note:'Demorado',tone:'delayed',count:items.filter(c=>daysFrom(c.arrivalDate)>=15&&daysFrom(c.arrivalDate)<=21).length},{label:'22+',note:'Crítico',tone:'critical',count:items.filter(c=>daysFrom(c.arrivalDate)>=22).length}],ageTotal=Math.max(1,items.length),attentionCount=ageBuckets.slice(2).reduce((sum,b)=>sum+b.count,0);
  return `<section class="turn-insights" aria-label="Lectura operativa de turnos">
    <article class="turn-insight contact-insight">
      <header><div><span>CONTACTO</span><h3>Primera conversación</h3></div><b>${conversationPct}% gestionado</b></header>
      <div class="insight-lead"><strong>${withoutConversation}</strong><div><b>por contactar</b><small>de ${totalConversation} casos sin programar</small></div></div>
      <div class="contact-progress" aria-label="${withConversation} contactados y ${withoutConversation} pendientes"><i style="--contact:${conversationPct}%"></i></div>
      <footer><span><b>${withConversation}</b> con conversación</span><span class="needs-action"><b>${withoutConversation}</b> sin conversación</span></footer>
    </article>
    <article class="turn-insight priority-insight">
      <header><div><span>PRIORIDAD</span><h3>Distribución de casos</h3></div><b>${dominantPriority.count?`${dominantPriority.priority}: ${dominantPriority.count}`:'Sin casos'}</b></header>
      <div class="priority-list">${priorities.map(p=>`<div class="priority-row ${p.priority.toLowerCase()}"><span>${p.priority}</span><strong>${p.count}</strong><i><em style="--size:${Math.round(p.count/maxPriority*100)}%"></em></i><small>${items.length?Math.round(p.count/items.length*100):0}%</small></div>`).join('')}</div>
    </article>
    <article class="turn-insight age-insight ${attentionCount?'has-risk':''}">
      <header><div><span>ANTIGÜEDAD</span><h3>Días desde el arribo</h3></div><b>${attentionCount?`${attentionCount} requieren atención`:'Sin demoras críticas'}</b></header>
      <div class="age-distribution">${ageBuckets.map(b=>`<div class="${b.tone}"><strong>${b.count}</strong><span>${b.label} días</span><small>${b.note}</small><i style="--share:${Math.round(b.count/ageTotal*100)}%"></i></div>`).join('')}</div>
    </article>
  </section>`
}
/* Ficha de Turnos alineada visualmente con la ficha maestra de Base de datos. */
turnCaseSheet=function(){
  const c=selectedTurnOrder?branchVisibleCases(cases).find(item=>item.order===selectedTurnOrder):null;
  if(!c)return '';
  const group=plateCases(c),joint=group.length>1;
  const lastArrival=group.map(item=>item.arrivalDate).filter(Boolean).sort().at(-1)||c.arrivalDate;
  const orders=group.map(item=>item.order).join(' / ');
  const codes=group.map(item=>item.partCode||'Sin código').join(' / ');
  const parts=group.map(item=>item.part||'Sin especificar').join(' / ');
  const repairTimes=group.map(item=>item.repairTime).filter(Boolean).join(' + ')||'-';
  const conversationDays=c.firstConversation?(isProgrammed(c)?daysBetween(c.firstConversation,c.appointmentDate||iso(0)):daysFrom(c.firstConversation)):'-';
  const arrivalDays=daysFrom(lastArrival);
  const allArrived=group.every(item=>item.arrived),hasContact=Boolean(c.firstConversation),hasSlot=Boolean(c.appointmentDate&&c.time),programmed=isProgrammed(c);
  const nextAction=!allArrived?'Resolver repuestos pendientes antes de coordinar':!hasContact?'Realizar el primer contacto con el cliente':!hasSlot?'Definir fecha y hora del turno':!programmed?'Confirmar la programación':'Turno coordinado y listo para seguimiento';
  const processStages=[
    {label:'Arribo',date:lastArrival,done:allArrived},
    {label:'Contacto',date:c.firstConversation,done:hasContact},
    {label:'Programación',date:c.appointmentDate,done:hasSlot},
    {label:'Confirmación',date:c.appointmentDate,done:programmed}
  ];
  const completedStages=processStages.filter(item=>item.done).length;
  const detail=(label,value,wide=false,tone='')=>`<div class="case-detail${wide?' wide':''}${tone?` ${tone}`:''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value||'-')}</dd></div>`;
  return `<div class="case-sheet-backdrop turn-sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="turnSheetTitle">
    <aside class="case-sheet tps-case-sheet turn-sheet turn-database-style">
      <header class="case-sheet-header">
        <div class="case-sheet-brandmark" aria-hidden="true">TU</div>
        <div class="case-sheet-title"><span>CONTROL OPERATIVO DEL TURNO</span><h2 id="turnSheetTitle">${escapeHtml(c.order)}</h2><p><strong>${escapeHtml(c.plate)}</strong><i></i>${escapeHtml(c.client)}</p></div>
        <div class="case-sheet-reference"><span>TURNOS</span><strong>${joint?`${group.length} órdenes relacionadas`:'Coordinación'}</strong></div>
        <button class="case-sheet-close" data-close-turn-sheet aria-label="Cerrar ficha">×</button>
      </header>
      <section class="case-command">
        <div class="case-command-state"><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'SIN ESTADO')}</span><span class="priority-mark ${escapeHtml(c.priority.toLowerCase())}">Prioridad ${escapeHtml(c.priority)}</span></div>
        <div class="case-next-action"><span>PRÓXIMA ACCIÓN</span><strong>${escapeHtml(nextAction)}</strong></div>
      </section>
      <div class="case-sheet-body tps-case-body turn-sheet-body">
          <section class="case-section turn-identity-section">
            <header><span>01</span><div><h3>Vehículo y cliente</h3><p>Identificación y datos para tomar contacto</p></div></header>
            <dl class="case-detail-grid turn-identity-grid">
              ${detail('VIN',c.vin||'-',true)}
              ${detail('Cliente',c.client,true)}
              ${detail('Patente',c.plate)}
              ${detail('Teléfono',c.phone||'-')}
              ${detail('Fecha de venta',fmtSaleDate(c.saleDate),false,isToyota10SaleDate(c.saleDate)?'toyota10-detail':'')}
              ${detail('Kilometraje',fmtKm(c.km),false,isToyota10Km(c.km)?'toyota10-detail':'')}
            </dl>
          </section>
          <section class="case-section turn-part-section">
            <header><span>02</span><div><h3>Repuesto y reparación</h3><p>Disponibilidad y alcance técnico del trabajo</p></div></header>
            <dl class="case-detail-grid turn-part-grid">
              ${detail('Ingreso del repuesto',fmtDate(lastArrival))}
              ${detail('Estado del arribo',allArrived?'Confirmado':'Pendiente',false,allArrived?'arrival-confirmed':'arrival-pending')}
              ${detail(joint?'NRO OR asociados':'NRO OR',orders,true)}
              ${detail('Código de repuesto',codes,true)}
              ${detail(joint?'Repuestos del grupo':'Repuesto',parts,true)}
              ${detail('Tiempo de reparación',repairTimes)}
              ${detail('Observaciones',c.observations||'Sin observaciones registradas')}
            </dl>
          </section>
        <section class="case-section turn-edit-section turn-coordination-section">
          <header><span>03</span><div><h3>Coordinación del turno</h3><p>${joint?'La programación se aplica a las órdenes vinculadas':'Contacto, seguimiento y programación de esta orden'}</p></div></header>
          <div class="turn-edit-grid">
            <label class="turn-first-field">Primera conversación<input class="table-date" type="date" data-turn-first="${escapeHtml(c.order)}" value="${escapeHtml(c.firstConversation||'')}"></label>
            <label class="turn-days-field">Días conversación<input value="${escapeHtml(conversationDays==='-'?'-':`${conversationDays} días`)}" readonly></label>
            <label class="turn-date-field">Fecha del turno<input class="table-date" type="date" data-turn-date="${escapeHtml(c.order)}" value="${escapeHtml(c.appointmentDate||'')}"></label>
            <label class="turn-time-field">Hora<input class="table-time" type="text" inputmode="numeric" data-turn-time="${escapeHtml(c.order)}" value="${escapeHtml(c.time||'')}" placeholder="HH:mm" maxlength="5"></label>
            <label class="turn-program-card"><input type="checkbox" data-turn-programmed="${escapeHtml(c.order)}" ${isProgrammed(c)?'checked':''}><span>Programado</span></label>
            <div class="turn-notes-grid">
              <label>Comentario de seguimiento<textarea data-turn-comment="${escapeHtml(c.order)}" rows="3" placeholder="Registrar contacto, acuerdo o próxima acción">${escapeHtml(c.comment||'')}</textarea></label>
              <label>Observaciones de cita<textarea data-turn-appointment-observations="${escapeHtml(c.order)}" rows="3" placeholder="Indicaciones o información específica para la cita">${escapeHtml(c.appointmentObservations||'')}</textarea></label>
            </div>
          </div>
        </section>
      </div>
    </aside>
  </div>`;
};

function turnsTable(items,derived=false){const relatedPlates=new Set(items.filter(c=>samePlateCases(c).length>1).map(c=>plateKey(c.plate))).size,pendingRelated=new Set(items.filter(c=>samePlateCases(c).some(item=>!item.arrived)).map(c=>plateKey(c.plate))).size,expired=items.filter(c=>isProgrammed(c)&&c.appointmentDate<iso(0)&&c.status!=='REALIZADO').length,uncontacted=items.filter(c=>!isProgrammed(c)&&!c.firstConversation).length,warnings=[pendingRelated?`${pendingRelated} patente${pendingRelated===1?'':'s'} con repuestos relacionados pendientes`:'',expired?`${expired} turno${expired===1?' vencido':'s vencidos'} sin resolución`:'',uncontacted?`${uncontacted} caso${uncontacted===1?'':'s'} sin primera conversación`:''].filter(Boolean);const reminder=`<aside class="parts-operational-reminder turn-operational-reminder" role="note"><strong aria-hidden="true">!</strong><div><span>RECORDATORIO DE COORDINACIÓN</span><p>Antes de programar un turno, verificá si existen otras órdenes activas para la misma patente. Siempre que sea posible, coordiná todos los trabajos en una única visita. Si se programan por separado, registrá el motivo.</p>${warnings.length?`<div class="turn-reminder-alerts">${warnings.map(message=>`<b>${escapeHtml(message)}</b>`).join('')}</div>`:''}</div></aside>`;if(!items.length)return reminder+table(items);return `${reminder}<div class="parts-guide"><span><strong>${items.filter(c=>!isProgrammed(c)).length}</strong> por programar</span><span><strong>${items.filter(isProgrammed).length}</strong> programados</span><span><strong>${items.filter(c=>c.firstConversation).length}</strong> contactados</span>${relatedPlates?`<span><strong>${relatedPlates}</strong> patentes relacionadas</span>`:''}<p>Tocá una fila para abrir la ficha y completar la programación.</p></div><div class="table-wrap"><table class="data-table turns-table"><thead><tr><th>INGRESO REPUESTO</th><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>TELÉFONO</th><th>PRIORIDAD</th><th>REPUESTO</th><th>TIEMPO REP.</th><th>DÍAS ARRIBO</th></tr></thead><tbody>${items.map(c=>turnRow(c,derived)).join('')}</tbody></table></div>${turnCaseSheet()}`}
function daysUntil(date){return date?businessDaysBetween(iso(0),date):'-'}
function normalizedVorStatus(c){if(c.status==='REALIZADO'||c.vorStatus==='REALIZADO')return 'REALIZADO';const value=c.vorStatus||c.status||'NO AVISADO';if(value==='SIN AVISAR')return 'NO AVISADO';if(value==='COORDINADO')return 'AVISADO';return value}
function vorTable(items){if(!items.length)return table(items);return `<div class="parts-guide"><span><strong>${items.filter(c=>normalizedVorStatus(c)==='NO AVISADO').length}</strong> no avisados</span><span><strong>${items.filter(c=>normalizedVorStatus(c)==='AVISADO').length}</strong> avisados</span><span><strong>${items.filter(c=>normalizedVorStatus(c)==='REALIZADO').length}</strong> realizados</span><p>El aviso al taller cambia el estado únicamente después de confirmar el envío.</p></div><div class="table-wrap"><table class="data-table vor-table"><thead><tr><th>INGRESO ARRIBO</th><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>PRIORIDAD</th><th>VOR</th><th>OBSERVACIONES</th><th>REPUESTO</th><th>TIEMPO REP.</th><th>DÍAS ARRIBO</th><th>ESTADO</th><th>AVISO AL TALLER</th></tr></thead><tbody>${items.map(c=>{const vorState=normalizedVorStatus(c),notifiedAt=c.vorNotifiedAt?fmtDate(String(c.vorNotifiedAt).slice(0,10)):'';return `<tr><td>${fmtDate(c.arrivalDate)}</td><td class="order-cell"><strong>${escapeHtml(c.order)}</strong></td><td>${escapeHtml(c.plate)}</td><td>${escapeHtml(c.client)}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td><span class="vor-value active">SÍ</span></td><td class="turn-text">${escapeHtml(c.observations||'-')}</td><td class="part-description">${escapeHtml(c.part)}</td><td>${escapeHtml(c.repairTime||'-')}</td><td><strong class="days-value">${daysFrom(c.arrivalDate)}</strong><small class="days-label"> días</small></td><td><select class="inline-select" data-vor-status="${escapeHtml(c.order)}"><option ${vorState==='NO AVISADO'?'selected':''}>NO AVISADO</option><option ${vorState==='AVISADO'?'selected':''}>AVISADO</option><option ${vorState==='REALIZADO'?'selected':''}>REALIZADO</option></select></td><td>${vorState==='NO AVISADO'?`<button type="button" class="vor-notify-button" data-vor-notify="${escapeHtml(c.order)}">Avisar al jefe de taller</button>`:`<span class="vor-notify-state ${vorState==='REALIZADO'?'complete':''}">${vorState==='REALIZADO'?'Caso realizado':`Avisado${notifiedAt?` · ${notifiedAt}`:''}`}</span>`}</td></tr>`}).join('')}</tbody></table></div>`}
function missingPartsSheet(){const c=selectedMissingOrder?branchVisibleCases(cases).find(item=>item.order===selectedMissingOrder):null;if(!c)return '';const risk=daysUntil(c.appointmentDate)<=2?'Crítico':'En seguimiento';return `<div class="case-sheet-backdrop missing-sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="missingSheetTitle"><aside class="case-sheet turn-sheet missing-sheet"><header class="case-sheet-header"><div class="case-sheet-brandmark" aria-hidden="true">TS</div><div class="case-sheet-title"><span>Turno sin repuesto</span><h2 id="missingSheetTitle">${escapeHtml(c.order)}</h2><p><strong>${escapeHtml(c.plate)}</strong><i></i>${escapeHtml(c.client)}</p></div><div class="case-sheet-reference"><span>Riesgo operativo</span><strong>${escapeHtml(risk)}</strong></div><button class="case-sheet-close" data-close-missing-sheet aria-label="Cerrar ficha">×</button></header><section class="case-command"><div class="case-command-state"><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'TURNO SIN REPUESTO')}</span><span class="priority-mark ${escapeHtml(c.priority.toLowerCase())}">Prioridad ${escapeHtml(c.priority)}</span>${c.vor?'<span class="vor-mark">VOR</span>':''}</div><div class="case-next-action"><span>Acción sugerida</span><strong>Confirmar disponibilidad antes del turno</strong></div></section><div class="case-sheet-body turn-sheet-body"><section class="case-section"><header><span>01</span><div><h3>Datos del caso</h3><p>Información completa del turno en riesgo</p></div></header><dl class="case-detail-grid">${['NRO OR','Patente','Cliente','Teléfono','Prioridad','VOR','Fecha de venta','Kilometraje','Código','Repuesto','Tiempo rep.','Pedido original','Falta desde','Días sin repuesto','Fecha turno','Hora','Días para turno','Observaciones'].map((label,index)=>{const values=[c.order,c.plate,c.client,c.phone||'-',c.priority,c.vor?'SÍ':'NO',fmtDate(c.saleDate),fmtKm(c.km),c.partCode||'-',c.part||'-',c.repairTime||'-',fmtDate(c.requestDate),fmtDate(c.missingSince||iso(0)),`${daysFrom(c.missingSince||iso(0))} días`,fmtDate(c.appointmentDate),c.time||'-',`${daysUntil(c.appointmentDate)} días`,c.observations||'-'];return `<div class="case-detail ${['Repuesto','Observaciones'].includes(label)?'wide':''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(values[index])}</dd></div>`}).join('')}</dl></section><section class="case-section turn-edit-section"><header><span>02</span><div><h3>Seguimiento del bloqueo</h3><p>Motivo y confirmación de arribo</p></div></header><div class="missing-edit-grid"><label>Motivo<textarea data-missing-reason="${escapeHtml(c.order)}" rows="4" placeholder="Indicar motivo del bloqueo">${escapeHtml(c.missingReason||'')}</textarea></label><label class="turn-program-card missing-arrival-card"><input type="checkbox" data-missing-arrival="${escapeHtml(c.order)}"><span>Arribo</span><strong>Pendiente</strong></label></div></section></div></aside></div>`}
function missingPartsTable(items){if(!items.length)return table(items);return `<div class="parts-guide"><span><strong>${items.length}</strong> turnos en riesgo</span><span><strong>${items.filter(c=>daysUntil(c.appointmentDate)<=2).length}</strong> críticos</span><p>Tocá una fila para abrir la ficha. Confirmar ARRIBO reconstruye automáticamente el circuito.</p></div><div class="table-wrap"><table class="data-table missing-table missing-summary-table"><thead><tr><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>PRIORIDAD</th><th>REPUESTO</th><th>FECHA TURNO</th><th>DÍAS PARA TURNO</th><th>ARRIBO</th></tr></thead><tbody>${items.map(c=>`<tr data-missing-order="${escapeHtml(c.order)}" tabindex="0" class="${daysUntil(c.appointmentDate)<=2?'delayed-row':''}"><td class="order-cell"><strong>${escapeHtml(c.order)}</strong></td><td>${escapeHtml(c.plate)}</td><td>${escapeHtml(c.client)}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td class="part-description">${escapeHtml(c.part)}</td><td>${fmtDate(c.appointmentDate)}</td><td><strong class="days-value">${daysUntil(c.appointmentDate)}</strong><small class="days-label"> días</small></td><td><label class="arrival-toggle"><input type="checkbox" data-missing-arrival="${escapeHtml(c.order)}"><span aria-hidden="true"></span><b>Pendiente</b></label></td></tr>`).join('')}</tbody></table></div>${missingPartsSheet()}`}
function normalizedReleasedStatus(record){return record?.releasedStatus==='AVISADO'?'AVISADO':'NO AVISADO'}
function releasedTable(items){
  const allReleased=branchVisibleCases(cases).filter(c=>c.status==='DADO DE BAJA');
  const pending=allReleased.filter(c=>normalizedReleasedStatus(c)==='NO AVISADO');
  const notified=allReleased.filter(c=>normalizedReleasedStatus(c)==='AVISADO');
  const rows=items.length?`<div class="table-wrap"><table class="data-table released-table released-cases-table"><thead><tr><th>FECHA BAJA</th><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>PRIORIDAD</th><th>REPUESTO</th><th>MOTIVO DE BAJA</th><th>ESTADO</th></tr></thead><tbody>${items.map(c=>`<tr><td>${fmtDate(c.cancelledAt)}</td><td class="order-cell"><strong>${escapeHtml(c.order)}</strong></td><td>${escapeHtml(c.plate)}</td><td>${escapeHtml(c.client)}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td class="part-description">${escapeHtml(c.part||'-')}</td><td class="released-reason">${escapeHtml(c.cancelReason||'Sin motivo registrado')}</td><td><select class="inline-select" data-released-status="${escapeHtml(c.order)}" aria-label="Estado de aviso de ${escapeHtml(c.order)}"><option ${normalizedReleasedStatus(c)==='NO AVISADO'?'selected':''}>NO AVISADO</option><option ${normalizedReleasedStatus(c)==='AVISADO'?'selected':''}>AVISADO</option></select></td></tr>`).join('')}</tbody></table></div>`:table(items);
  return `<div class="parts-guide released-guide"><div class="released-guide-counts"><span><strong>${pending.length}</strong> no avisados</span><span><strong>${notified.length}</strong> avisados</span></div><p>La tabla conserva todos los casos. El reporte incluye únicamente los que figuran como NO AVISADO.</p><button type="button" class="released-notify-button" data-released-report ${pending.length?'':'disabled'}>Generar reporte de no avisados</button></div>${rows}`;
}
function calendarBaseDate(){return new Date(today.getTime()+calendarOffset*86400000)}
function calendarDate(offset=0){const base=calendarBaseDate();return new Date(base.getFullYear(),base.getMonth(),base.getDate()+offset)}
function dateKey(date){return new Date(date.getFullYear(),date.getMonth(),date.getDate()).toISOString().slice(0,10)}
function dayName(date){return new Intl.DateTimeFormat('es-AR',{weekday:'short'}).format(date)}
function monthName(date){return new Intl.DateTimeFormat('es-AR',{month:'long'}).format(date)}
function scheduledCases(){let items=filtered(getViewCases('calendar'));if(calendarPriority)items=items.filter(c=>c.priority===calendarPriority);return items.sort((a,b)=>(a.appointmentDate+a.time).localeCompare(b.appointmentDate+b.time))}
function timeToMinutes(value){const match=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return match?Number(match[1])*60+Number(match[2]):8*60}
function repairMinutes(value){const raw=String(value||'').toLowerCase(),match=raw.match(/(\d+(?:[.,]\d+)?)/);if(!match)return 60;const n=Number(match[1].replace(',','.'));return raw.includes('min')?Math.max(30,n):Math.max(30,n*60)}
function currentTimeMarker(date){const now=new Date(),key=dateKey(date);if(key!==iso(0))return '';const minutes=now.getHours()*60+now.getMinutes();if(minutes<7*60||minutes>17*60)return '';return `<span class="now-line" style="top:${minutes-7*60}px"><b>${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}</b></span>`}
function overlaps(a,b){const aStart=timeToMinutes(a.time),aEnd=aStart+repairMinutes(a.repairTime),bStart=timeToMinutes(b.time),bEnd=bStart+repairMinutes(b.repairTime);return a.order!==b.order&&a.appointmentDate===b.appointmentDate&&aStart<bEnd&&bStart<aEnd}
function hasConflict(c,items){return items.some(other=>overlaps(c,other))}
function dayCapacity(dayItems){if(dayItems.length>=6)return 'saturado';if(dayItems.length>=4)return 'normal';return 'liviano'}
function visibleDays(){if(calendarMode==='day')return [calendarBaseDate()];const start=calendarDate(-((calendarBaseDate().getDay()+6)%7));return Array.from({length:7},(_,i)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i))}
function groupByTime(dayItems){const groups={};dayItems.forEach(c=>{const key=c.time||'Sin hora';groups[key]=groups[key]||[];groups[key].push(c)});return Object.entries(groups).sort((a,b)=>timeToMinutes(a[0])-timeToMinutes(b[0])).map(([time,items])=>({time,items}))}
function calendarMonthGroup(group,allItems){const first=group.items[0],conflict=group.items.length>1||group.items.some(c=>hasConflict(c,allItems));return `<button class="calendar-event month-group ${conflict?'conflict':''}" data-calendar-order="${escapeHtml(first.order)}"><strong>${escapeHtml(group.time)}</strong><span>${group.items.length}</span><small>${escapeHtml(first.priority)}</small></button>`}
function calendarDayCell(date,items,compact=false){const key=dateKey(date),dayItems=items.filter(c=>c.appointmentDate===key),groups=groupByTime(dayItems),visible=groups.slice(0,4),hidden=Math.max(0,groups.length-visible.length),isToday=key===iso(0),capacity=dayCapacity(dayItems);return `<article class="calendar-day ${isToday?'today':''} capacity-${capacity}"><header><span>${dayName(date)}</span><strong>${date.getDate()}</strong></header><small class="capacity-label">${dayItems.length?`${dayItems.length} turnos · ${capacity}`:'Disponible'}</small><div class="calendar-month-stack">${dayItems.length?`${visible.map(g=>calendarMonthGroup(g,items)).join('')}${hidden?`<button class="calendar-more" data-calendar-day="${key}">+${hidden} horarios</button>`:''}`:`<p>${compact?'Libre':'Sin turnos programados'}</p>`}</div></article>`}
function calendarMonth(items){const base=calendarBaseDate(),first=new Date(base.getFullYear(),base.getMonth(),1),start=new Date(first);start.setDate(first.getDate()-((first.getDay()+6)%7));const days=Array.from({length:42},(_,i)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i));return `<div class="calendar-month-head">${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-month">${days.map(d=>`<div class="${d.getMonth()===base.getMonth()?'':'muted-month'}">${calendarDayCell(d,items,true)}</div>`).join('')}</div>`}
function timedCalendarGroup(group,allItems){const first=group.items[0],start=Math.max(7*60,timeToMinutes(group.time)),top=Math.max(0,start-7*60),height=Math.min(96,Math.max(44,Math.max(...group.items.map(c=>repairMinutes(c.repairTime))))),conflict=group.items.length>1||group.items.some(c=>hasConflict(c,allItems));return `<button class="calendar-event timed group ${first.priority.toLowerCase()} ${conflict?'conflict':''} ${group.items.some(c=>selectedCalendarOrder===c.order)?'selected':''}" style="top:${top}px;min-height:${height}px" data-calendar-order="${escapeHtml(first.order)}"><span class="event-time">${escapeHtml(group.time)}</span><strong>${group.items.length>1?`${group.items.length} turnos`:escapeHtml(first.order)}</strong><small>${group.items.length>1?'Mismo horario':`${escapeHtml(first.plate)} · ${escapeHtml(first.client)}`}</small></button>`}
function calendarDaySummary(date,items){const dayItems=items.filter(c=>c.appointmentDate===dateKey(date));return `<div class="calendar-day-summary"><span>${dayName(date)}</span><strong>${date.getDate()}</strong><small>${dayItems.length} turnos · ${dayCapacity(dayItems)}</small></div>`}
function timeGrid(days,items){const hours=Array.from({length:11},(_,i)=>i+7);return `<div class="calendar-timegrid pro-calendar-grid" style="--days:${days.length}"><div class="timegrid-head spacer"><span>Hora</span></div>${days.map(d=>{const dayItems=items.filter(c=>c.appointmentDate===dateKey(d));return `<div class="timegrid-head ${dateKey(d)===iso(0)?'today':''} capacity-${dayCapacity(dayItems)}">${calendarDaySummary(d,items)}</div>`}).join('')}<div class="time-axis">${hours.map(h=>`<span>${String(h).padStart(2,'0')}:00</span>`).join('')}</div>${days.map(d=>{const key=dateKey(d),dayItems=items.filter(c=>c.appointmentDate===key),groups=groupByTime(dayItems);return `<div class="time-column" aria-label="${escapeHtml(dayName(d))} ${d.getDate()}">${hours.map(()=>'<i></i>').join('')}${currentTimeMarker(d)}${groups.map(g=>timedCalendarGroup(g,items)).join('')}</div>`}).join('')}</div>`}
function calendarWeek(items){return timeGrid(visibleDays(),items)}
function calendarDay(items){return timeGrid([calendarBaseDate()],items)}
function calendarList(items){if(!items.length)return `<div class="empty-state"><span class="empty-icon">□</span><h3>No hay turnos programados</h3><p>Cuando se confirme PROGRAMADO, aparecerá en el calendario.</p></div>`;return `<div class="calendar-list">${items.map(c=>`<article class="calendar-list-item ${hasConflict(c,items)?'conflict':''} ${selectedCalendarOrder===c.order?'selected':''}" data-calendar-order="${escapeHtml(c.order)}"><time>${fmtDate(c.appointmentDate)}<strong>${escapeHtml(c.time||'Sin hora')}</strong></time><div><strong>${escapeHtml(c.order)} · ${escapeHtml(c.plate)}</strong><p>${escapeHtml(c.client)} · ${escapeHtml(c.part)}</p></div><span class="priority-chip ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</span></article>`).join('')}</div>`}
function calendarDetail(items){const visibleItems=branchVisibleCases(cases),c=selectedCalendarOrder?visibleItems.find(item=>item.order===selectedCalendarOrder):items[0];if(!c)return `<aside class="calendar-detail pro-calendar-detail"><h2>Detalle operativo</h2><p>Seleccioná un turno para ver cliente, repuesto y bloqueos.</p></aside>`;const group=items.filter(item=>item.appointmentDate===c.appointmentDate&&(item.time||'Sin hora')===(c.time||'Sin hora'));return `<aside class="calendar-detail pro-calendar-detail"><header><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status)}</span><h2>${escapeHtml(c.time||'Sin hora')}</h2><p>${fmtDate(c.appointmentDate)} · ${group.length} turno${group.length>1?'s':''}</p></header>${group.length>1?`<div class="calendar-detail-group"><span class="detail-label">Mismo horario</span>${group.map(item=>`<button data-calendar-order="${escapeHtml(item.order)}" class="${selectedCalendarOrder===item.order?'active':''}"><strong>${escapeHtml(item.order)} · ${escapeHtml(item.plate)}</strong><small>${escapeHtml(item.client)} · ${escapeHtml(item.part)}</small></button>`).join('')}</div>`:''}<dl><div><dt>Orden</dt><dd>${escapeHtml(c.order)}</dd></div><div><dt>Patente</dt><dd>${escapeHtml(c.plate)}</dd></div><div><dt>Cliente</dt><dd>${escapeHtml(c.client)}</dd></div><div><dt>Teléfono</dt><dd>${escapeHtml(c.phone||'-')}</dd></div><div><dt>Prioridad</dt><dd>${escapeHtml(c.priority)}</dd></div><div><dt>Repuesto</dt><dd>${escapeHtml(c.part)}</dd></div><div><dt>Tiempo rep.</dt><dd>${escapeHtml(c.repairTime||'-')}</dd></div><div><dt>Comentario</dt><dd>${escapeHtml(c.comment||'Sin comentario')}</dd></div></dl><button class="secondary-button" data-go="appointments">Abrir ficha en Turnos</button></aside>`}
function calendarView(){const items=scheduledCases(),visible=visibleDays(),visibleKeys=visible.map(dateKey),visibleItems=items.filter(c=>calendarMode==='month'?c.appointmentDate.slice(0,7)===dateKey(calendarBaseDate()).slice(0,7):calendarMode==='list'?true:visibleKeys.includes(c.appointmentDate)),todayItems=items.filter(c=>c.appointmentDate===iso(0)),conflicts=items.filter(c=>hasConflict(c,items)),lateItems=items.filter(c=>c.appointmentDate<iso(0)),urgentItems=visibleItems.filter(c=>c.priority==='Urgente'),nextItem=items.find(c=>c.appointmentDate>=iso(0));const body={day:calendarDay(items),week:calendarWeek(items),month:calendarMonth(items),list:calendarList(visibleItems)}[calendarMode];return `${heading('Calendario','Agenda profesional de taller, de 7:00 a 17:00, con conflictos y carga visible.','AGENDA DE TALLER')}<section class="calendar-hero"><article><span>Próximo turno</span><strong>${nextItem?`${escapeHtml(nextItem.time||'Sin hora')} · ${escapeHtml(nextItem.order)}`:'Sin próximos turnos'}</strong><small>${nextItem?`${fmtDate(nextItem.appointmentDate)} · ${escapeHtml(nextItem.plate)}`:'La agenda está despejada'}</small></article><article><span>Hoy</span><strong>${todayItems.length}</strong><small>turnos programados</small></article><article class="${conflicts.length?'attention':''}"><span>Conflictos</span><strong>${conflicts.length}</strong><small>mismo horario o solapados</small></article><article class="${urgentItems.length?'attention':''}"><span>Urgentes visibles</span><strong>${urgentItems.length}</strong><small>prioridad Toyota</small></article></section><div class="calendar-shell"><div class="calendar-controlbar"><div><span class="eyebrow">Vista actual</span><h2>${monthName(calendarBaseDate())} ${calendarBaseDate().getFullYear()}</h2></div><div class="calendar-nav"><button class="secondary-button" data-calendar-shift="-1">‹</button><button class="secondary-button" data-calendar-today>Hoy</button><button class="secondary-button" data-calendar-shift="1">›</button></div><div class="segmented-filter" id="calendarMode"><button data-calendar-view="day" class="${calendarMode==='day'?'active':''}">Día</button><button data-calendar-view="week" class="${calendarMode==='week'?'active':''}">Semana</button><button data-calendar-view="month" class="${calendarMode==='month'?'active':''}">Mes</button><button data-calendar-view="list" class="${calendarMode==='list'?'active':''}">Lista</button></div><select class="filter-select" id="calendarPriority"><option value="">Todas las prioridades</option><option ${calendarPriority==='Urgente'?'selected':''}>Urgente</option><option ${calendarPriority==='Alta'?'selected':''}>Alta</option><option ${calendarPriority==='Normal'?'selected':''}>Normal</option></select></div><div class="calendar-layout pro-calendar-layout"><section class="panel calendar-panel">${body}</section>${calendarDetail(visibleItems.length?visibleItems:items)}</div></div>`}
function todayAppointmentsView(){const items=getViewCases('today-appointments').sort((a,b)=>String(a.executionTime||a.time||'99:99').localeCompare(String(b.executionTime||b.time||'99:99'))),executed=items.filter(c=>c.executionDate===selectedExecutionDate&&c.executionStatus==='EJECUTADO').length,missed=items.filter(c=>c.executionDate===selectedExecutionDate&&c.executionStatus==='NO EJECUTADO').length,pending=items.length-executed-missed,selectedLabel=new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateOnly(selectedExecutionDate));return `${heading('Ejecución de turnos','Consultá cualquier fecha y registrá el resultado de cada cita.','CIERRE OPERATIVO')}<div class="execution-datebar"><div><span>FECHA OPERATIVA</span><strong>${escapeHtml(selectedLabel)}</strong></div><div class="execution-date-controls"><button data-execution-shift="-1" aria-label="Día anterior">‹</button><input id="executionDateFilter" type="date" value="${escapeHtml(selectedExecutionDate)}"><button data-execution-shift="1" aria-label="Día siguiente">›</button><button class="execution-today" data-execution-today>Hoy</button></div></div><section class="today-turn-kpis"><article><span>TURNOS DEL DÍA</span><strong>${items.length}</strong><small>Agenda y resultados</small></article><article><span>PENDIENTES</span><strong>${pending}</strong><small>Esperan confirmación</small></article><article class="done"><span>EJECUTADOS</span><strong>${executed}</strong><small>Trabajo realizado</small></article><article class="${missed?'attention':''}"><span>NO EJECUTADOS</span><strong>${missed}</strong><small>Enviados a reprogramar</small></article></section>${items.length?`<section class="today-turn-list">${items.map(c=>{const result=c.executionDate===selectedExecutionDate?c.executionStatus:'',displayStatus=result==='EJECUTADO'?'REALIZADO':result==='NO EJECUTADO'?'PENDIENTE DE TURNO':caseOperationalStatus(c),originalTime=c.executionTime||c.time||'Sin hora';return `<article class="today-turn-card ${result==='EJECUTADO'?'executed':result==='NO EJECUTADO'?'missed':''}"><time>${escapeHtml(originalTime)}</time><div class="today-turn-main"><div><span class="badge ${badgeClass(displayStatus)}">${escapeHtml(displayStatus)}</span><h2>${escapeHtml(c.order)} <small>${escapeHtml(c.plate)}</small></h2><p>${escapeHtml(c.client)} | ${escapeHtml(c.phone||'Sin teléfono')}</p></div><dl><div><dt>Repuesto</dt><dd>${escapeHtml(c.part||'Sin especificar')}</dd></div><div><dt>Prioridad</dt><dd>${escapeHtml(c.priority)}</dd></div><div><dt>Tiempo estimado</dt><dd>${escapeHtml(c.repairTime||'Sin dato')}</dd></div></dl></div>${result?`<div class="today-turn-result"><span>RESULTADO</span><strong>${result==='EJECUTADO'?'Ejecutado':'No ejecutado'}</strong><small>${result==='NO EJECUTADO'?'Caso enviado a Turnos para reprogramar':'Caso cerrado como realizado'}</small></div>`:`<div class="today-turn-actions"><button class="execute-turn" data-today-result="EJECUTADO" data-order="${escapeHtml(c.order)}">Ejecutado</button><button class="miss-turn" data-today-result="NO EJECUTADO" data-order="${escapeHtml(c.order)}">No ejecutado</button></div>`}</article>`}).join('')}</section>`:`<div class="empty-state"><span class="empty-icon">✓</span><h3>Sin turnos en esta fecha</h3><p>Elegí otro día o programá una cita desde la sección Turnos.</p></div>`}`}
function registryRows(){const depositState=value=>['PÉRDIDA','TIRADA','DEPÓSITO INF','DEPÓSITO SUP','ENVIADO A TOYOTA'].includes(value)?value:'';const automatic=getViewCases('parts-registry').map(c=>({key:`auto:${c.order}`,automatic:true,branch:c.branch||'Santa Fe',appointmentDate:c.appointmentDate,vin:c.vin||'',plate:c.plate,saleDate:c.saleDate||'',partCode:c.partCode||'',part:c.part||'',order:c.registryOrder||'',sourceOrder:c.order,repairDate:c.repairDate||'',km:c.arrivalKm||'',origin:'Con turno',responsible:c.registryResponsible||'',depositStatus:depositState(c.depositStatus)})),manual=activeManualPartsRegistry().filter(item=>canViewOtherBranches()||(item.branch||'Santa Fe')===(currentApplicationUser()?.branch||'Santa Fe')).map(item=>({...item,origin:'Sin turno',responsible:item.responsible||'',depositStatus:depositState(item.depositStatus),key:`manual:${item.id}`,automatic:false}));return [...automatic,...manual].sort((a,b)=>String(b.appointmentDate||'').localeCompare(String(a.appointmentDate||''))||String(a.order||'').localeCompare(String(b.order||'')))}
const todayAppointmentsViewWithoutSearch=todayAppointmentsView;
todayAppointmentsView=function(){
  const executionQuery=query.trim().toLowerCase();
  if(!executionQuery)return todayAppointmentsViewWithoutSearch();
  const originalCases=cases;
  const scheduledForDate=getViewCases('today-appointments').length;
  cases=cases.filter(c=>[c.order,c.plate,c.client,c.part,c.phone].some(value=>String(value||'').toLowerCase().includes(executionQuery)));
  try{
    const visibleForDate=getViewCases('today-appointments').length;
    const html=todayAppointmentsViewWithoutSearch();
    return scheduledForDate&&!visibleForDate
      ?html.replace('<span class="empty-icon">✓</span><h3>Sin turnos en esta fecha</h3><p>Elegí otro día o programá una cita desde la sección Turnos.</p>','<span class="empty-icon">⌕</span><h3>Sin coincidencias</h3><p>Probá con otro NRO OR, patente, cliente, repuesto o teléfono.</p>')
      :html;
  }finally{
    cases=originalCases;
  }
};
function isToyota10SaleDate(value){
  if(!value)return false;
  const sale=dateOnly(value),current=new Date(today),minimumAge=new Date(today),maximumAge=new Date(today);
  current.setHours(0,0,0,0);
  minimumAge.setHours(0,0,0,0);
  maximumAge.setHours(0,0,0,0);
  minimumAge.setFullYear(minimumAge.getFullYear()-5);
  maximumAge.setFullYear(maximumAge.getFullYear()-10);
  return !Number.isNaN(sale.getTime())&&sale>=maximumAge&&sale<minimumAge;
}
function isToyota10Km(value){
  const digits=String(value??'').replace(/\D/g,'');
  if(!digits)return false;
  const km=Number(digits);
  return Number.isFinite(km)&&km>150000&&km<=200000;
}
function partsDepositView(){const allItems=registryRows().filter(item=>item.repairDate).sort((a,b)=>String(a.repairDate).localeCompare(String(b.repairDate))||String(a.order).localeCompare(String(b.order))),statuses=['PÉRDIDA','TIRADA','DEPÓSITO INF','DEPÓSITO SUP','ENVIADO A TOYOTA'],needle=depositQuery.trim().toLowerCase(),items=allItems.filter(item=>(!needle||[item.order,item.partCode,item.part].some(value=>String(value||'').toLowerCase().includes(needle)))&&(!depositStatusFilter||(depositStatusFilter==='SIN CLASIFICAR'?!item.depositStatus:item.depositStatus===depositStatusFilter))&&(!depositDateFrom||item.repairDate>=depositDateFrom)&&(!depositDateTo||item.repairDate<=depositDateTo)),stored=allItems.filter(item=>['DEPÓSITO INF','DEPÓSITO SUP'].includes(item.depositStatus)).length,unclassified=allItems.filter(item=>!item.depositStatus).length;return `<div class="deposit-actionbar"><div class="deposit-action-stats"><span><strong>${stored}</strong> en depósito</span><span class="${unclassified?'attention':''}"><strong>${unclassified}</strong> sin clasificar</span><span><strong>${items.length}</strong> visibles</span></div><button class="primary-button" id="generateDepositPdf" type="button">Generar reporte</button></div><div class="deposit-filters"><label class="deposit-search"><span>BUSCAR</span><input id="depositQuery" value="${escapeHtml(depositQuery)}" placeholder="Orden, código o repuesto"></label><label><span>ESTADO</span><select id="depositStatusFilter"><option value="">Todos los estados</option><option value="SIN CLASIFICAR" ${depositStatusFilter==='SIN CLASIFICAR'?'selected':''}>Sin clasificar</option>${statuses.map(status=>`<option ${depositStatusFilter===status?'selected':''}>${status}</option>`).join('')}</select></label><label><span>DESDE</span><input id="depositDateFrom" type="date" value="${escapeHtml(depositDateFrom)}"></label><label><span>HASTA</span><input id="depositDateTo" type="date" value="${escapeHtml(depositDateTo)}"></label><button class="secondary-button" id="clearDepositFilters">Limpiar</button></div><div class="deposit-table-meta"><strong>${items.length} ${items.length===1?'registro':'registros'}</strong><span>Días hábiles desde la reparación</span></div><section class="panel deposit-panel">${items.length?`<div class="table-wrap deposit-table-scroll"><table class="data-table deposit-table"><thead><tr><th>FECHA DE REPARACIÓN</th><th>DÍAS PASADOS</th><th>NÚMERO DE ORDEN</th><th>CÓDIGO DE REPUESTO</th><th>REPUESTO</th><th>ESTADO</th></tr></thead><tbody>${items.map(item=>`<tr><td>${fmtDate(item.repairDate)}</td><td><strong class="days-value">${daysFrom(item.repairDate)}</strong><small class="days-label"> días</small></td><td class="order-cell"><strong>${escapeHtml(item.order||'-')}</strong></td><td>${escapeHtml(item.partCode||'-')}</td><td class="part-description">${escapeHtml(item.part||'-')}</td><td><select class="inline-select" data-deposit-status="${escapeHtml(item.key)}"><option value="" ${!item.depositStatus?'selected':''} disabled>SELECCIONAR ESTADO</option>${statuses.map(status=>`<option ${item.depositStatus===status?'selected':''}>${status}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state registry-empty"><span class="empty-icon">□</span><h3>Sin resultados</h3><p>${allItems.length?'Ajustá o limpiá los filtros.':'Los registros aparecerán al completar una reparación.'}</p></div>`}</section>`}
function registryLabelRecord(order){const value=String(order||'').trim().toUpperCase();return value?registryRows().find(item=>String(item.order||'').trim().toUpperCase()===value):null}
function registryLabelMarkup(item,index,print=false){const value=(field,fallback='SIN DATOS')=>escapeHtml(item?.[field]||fallback),order=value('order'),vin=value('vin'),saleDate=item?.saleDate?fmtDate(item.saleDate):'SIN DATOS',repairDate=item?.repairDate?fmtDate(item.repairDate):'SIN DATOS',km=item?.km?escapeHtml(item.km):'SIN DATOS';return `<article class="warranty-label ${item?'is-complete':'is-empty'}">${print?'':`<div class="label-order-entry"><label for="labelOrder${index}">N.º ORDEN</label><input id="labelOrder${index}" data-label-order="${index}" value="${escapeHtml(registryLabelOrders[index])}" placeholder="Ingresar orden"><button data-label-search="${index}">Cargar</button></div>`}<div class="warranty-label-sheet" style="grid-template-rows:repeat(18,minmax(0,1fr))"><div class="tag-row shade tag-title">WARRANTY PARTS TAG</div><div class="tag-row">AMN</div><div class="tag-row shade">AMIUN S.A.</div><div class="tag-row">VEHICLE IDENTIFICATION NUMBER</div><div class="tag-row shade">VIN</div><div class="tag-row">${vin}</div><div class="tag-row shade">DELIVERY DATE</div><div class="tag-row">${saleDate}</div><div class="tag-row shade">REPAIR DATE</div><div class="tag-row">${repairDate}</div><div class="tag-split"><span>REPAIR OR</span><strong>${order}</strong><span>KM</span><strong>${km}</strong></div><div class="tag-row shade tag-caption">Part Number</div><div class="tag-row">${value('partCode')}</div><div class="tag-row shade tag-caption">Spare part</div><div class="tag-row">${value('part')}</div><div class="tag-row shade tag-caption">Responsable</div><div class="tag-row">${value('responsible')}</div><div class="tag-row tag-footer">TOYOTA MOTOR CORPORATIONS</div></div>${!print&&registryLabelOrders[index]&&!item?'<p class="label-not-found">No encontramos esa orden en Registro de repuestos.</p>':''}</article>`}
function printRegistryLabels(){const records=registryLabelOrders.map(registryLabelRecord),content=records.map((item,index)=>registryLabelMarkup(item,index,true)).join(''),popup=window.open('','_blank');if(!popup){toast('El navegador bloqueó la ventana de impresión');return}popup.document.open();popup.document.write(`<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Etiquetas de repuestos</title><style>@page{size:A4 portrait;margin:22mm 15mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}body{display:grid;place-items:start center}.print-label-grid{display:grid;grid-template-columns:repeat(2,86mm);grid-template-rows:repeat(2,78mm);column-gap:8mm;row-gap:5mm;width:180mm;height:161mm}.warranty-label{display:flex;min-width:0;min-height:0;flex-direction:column;break-inside:avoid}.warranty-label-sheet{flex:1;min-height:0;border:1px solid #181818;display:grid;grid-template-rows:repeat(16,minmax(0,1fr));overflow:hidden;font-weight:800;text-align:center}.tag-row,.tag-split{display:flex;min-width:0;align-items:center;justify-content:center;border-bottom:1px solid #181818;font-size:6.4pt;line-height:1;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}.tag-row.shade,.tag-split span{background:#d0d0d0}.tag-title,.tag-caption{font-size:7pt}.tag-split{display:grid;grid-template-columns:28% 29% 20% 23%;padding:0}.tag-split>*{display:flex;height:100%;min-width:0;align-items:center;justify-content:center;border-right:1px solid #181818;font-size:5.8pt;overflow:hidden}.tag-split>*:last-child{border-right:0}.tag-split strong{background:#fff}.tag-footer{border-bottom:0;background:#eb0a1e;color:#fff;font-size:6.5pt}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><main class="print-label-grid">${content}</main><script>window.onload=()=>window.print()<\/script></body></html>`);popup.document.close()}
function registryLockDetails(key){
  if(!key||key==='new')return null;
  if(key.startsWith('auto:')){
    const order=key.slice(5);
    return {order,label:`NRO OR ${order}`};
  }
  if(key.startsWith('manual:')){
    const id=key.slice(7),item=activeManualPartsRegistry().find(record=>record.id===id);
    return {order:`REGISTRO-SIN-TURNO:${id}`,label:item?.order?`NRO OR ${item.order}`:`${item?.plate||'Registro sin turno'}`};
  }
  return null;
}
function releaseRegistryLock(key=selectedRegistryKey){const details=registryLockDetails(key);if(details)releaseCaseLock(details.order)}
function partsRegistrySheet(){
  if(!selectedRegistryKey)return '';
  const entry=selectedRegistryKey==='new'
    ?{key:'new',automatic:false,appointmentDate:selectedRegistryDate,vin:'',plate:'',saleDate:'',partCode:'',part:'',order:'',repairDate:'',km:'',origin:'Sin turno',responsible:''}
    :registryRows().find(item=>item.key===selectedRegistryKey);
  if(!entry)return '';
  const synced=entry.automatic;
  const field=(label,name,type='text',readonly=false,required=false)=>`<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(entry[name]||'')}" ${readonly?'readonly':''} ${required?'required':''}></label>`;
  const longField=(label,name,readonly=false,required=false)=>`<label class="registry-long-field">${label}<textarea name="${name}" rows="3" wrap="soft" spellcheck="false" data-registry-part-field ${readonly?'readonly':''} ${required?'required':''}>${escapeHtml(entry[name]||'')}</textarea></label>`;
  const responsibleNames=normalizeRegistryResponsibles([...registryResponsibles,entry.responsible]);
  const responsibleField=`<label>Responsable<select name="responsible" required><option value="">Seleccionar responsable</option>${responsibleNames.map(name=>`<option value="${escapeHtml(name)}" ${entry.responsible===name?'selected':''}>${escapeHtml(name)}</option>`).join('')}</select></label>`;
  return `<div class="case-sheet-backdrop registry-backdrop" role="dialog" aria-modal="true" aria-labelledby="registrySheetTitle">
    <aside class="case-sheet registry-sheet">
      <header class="case-sheet-header">
        <div class="case-sheet-brandmark">RR</div>
        <div class="case-sheet-title">
          <span>${synced?'Turno sincronizado':'Registro manual'}</span>
          <h2 id="registrySheetTitle">${escapeHtml(entry.order||entry.sourceOrder||'Nuevo registro')}</h2>
          <p>${synced?`Caso vinculado al NRO OR ${escapeHtml(entry.sourceOrder)}. Cargá la orden y el kilometraje reales del turno.`:'Completá los datos técnicos del registro.'}</p>
        </div>
        <button class="case-sheet-close" data-close-registry aria-label="Cerrar ficha">×</button>
      </header>
      <form class="registry-form registry-form-redesign" data-registry-form="${escapeHtml(entry.key)}">
        <div class="registry-form-layout">
          <section class="registry-form-section">
            <header><div><strong>Vehículo y turno</strong><span>Identificación del caso</span></div></header>
            <div class="registry-form-grid">
              ${field('Fecha de turno','appointmentDate','date',synced,true)}
              ${field('VIN','vin','text',synced,true)}
              ${field('Patente','plate','text',synced,true)}
              ${field('Fecha de venta','saleDate','date',synced,true)}
            </div>
          </section>
          <section class="registry-form-section registry-parts-section">
            <header><div><strong>Repuesto</strong><span>Códigos y descripciones completas</span></div>${synced?'<button type="button" class="registry-section-edit" data-registry-enable-parts>Editar</button>':'<span class="registry-section-edit-state">Edición directa</span>'}</header>
            <div class="registry-parts-stack">
              ${longField('Código de repuesto','partCode',synced,true)}
              ${longField('Repuesto','part',synced,true)}
            </div>
          </section>
          <section class="registry-form-section">
            <header><div><strong>Cierre del registro</strong><span>Datos reales de la reparación</span></div></header>
            <div class="registry-form-grid registry-closing-grid">
              ${field('N.º de orden del turno','order','text',false,true)}
              ${field('Fecha de reparación','repairDate','date',false,true)}
              ${field('Kilometraje de ingreso','km','number',false,true)}
              ${responsibleField}
            </div>
          </section>
        </div>
        <footer class="registry-form-footer">${!synced&&entry.key!=='new'?`<button type="button" class="registry-delete-button" data-delete-registry="${escapeHtml(entry.key)}">Eliminar</button>`:'<span></span>'}<div><button type="button" class="secondary-button" data-close-registry>Cancelar</button><button type="submit" class="primary-button">Guardar registro</button></div></footer>
      </form>
    </aside>
  </div>`
}
function partsRegistryView(){const items=registryRows().filter(item=>item.appointmentDate===selectedRegistryDate),tabs=`<nav class="registry-subnav" aria-label="Secciones de registro de repuestos"><button data-registry-mode="records" class="${registryMode==='records'?'active':''}">Registros</button><button data-registry-mode="labels" class="${registryMode==='labels'?'active':''}">Etiquetas</button><button data-registry-mode="deposit" class="${registryMode==='deposit'?'active':''}">Depósito</button></nav>`;if(registryMode==='labels')return `${heading('Etiquetas de repuestos','Preparación de etiquetas para identificación e impresión.','CONTROL DE REPUESTOS')}${tabs}<div class="label-operations"><div class="label-print-info"><strong>4 etiquetas</strong><span>Hoja A4 en formato 2 x 2</span></div><button class="primary-button" id="printRegistryLabels">Imprimir</button></div><section class="label-preview-grid">${registryLabelOrders.map((order,index)=>registryLabelMarkup(registryLabelRecord(order),index)).join('')}</section>`;if(registryMode==='deposit')return `${heading('Depósito','Ubicación y estado de los repuestos reparados.','CONTROL DE REPUESTOS')}${tabs}${partsDepositView()}`;return `${heading('Registro de repuestos','Historial técnico de turnos y cargas manuales.','CONTROL DE REPUESTOS')}${tabs}<div class="registry-operations"><div class="registry-day-picker"><span class="registry-control-label">Fecha</span><div class="registry-date-controls"><button data-registry-shift="-1" aria-label="Día anterior">‹</button><input id="registryDateFilter" type="date" value="${escapeHtml(selectedRegistryDate)}" aria-label="Fecha de registro"><button data-registry-shift="1" aria-label="Día siguiente">›</button><button class="registry-today" data-registry-today>Hoy</button></div></div><div class="registry-result-count" aria-live="polite"><strong>${items.length}</strong><span>${items.length===1?'registro':'registros'}</span></div><button class="primary-button registry-add-button" id="addRegistryRecord">Nuevo registro</button></div><section class="panel registry-panel">${items.length?`<div class="table-wrap"><table class="data-table registry-table"><thead><tr><th>FECHA TURNO</th><th>SUCURSAL</th><th>VIN</th><th>PATENTE</th><th>FECHA VENTA</th><th>CÓDIGO</th><th>REPUESTO</th><th>N.º ORDEN</th><th>FECHA REPARACIÓN</th><th>KM</th><th>ORIGEN</th><th>RESPONSABLE</th><th>ACCIÓN</th></tr></thead><tbody>${items.map(item=>`<tr><td>${fmtDate(item.appointmentDate)}</td><td><span class="branch-chip">${escapeHtml(item.branch||'Santa Fe')}</span></td><td>${escapeHtml(item.vin||'Pendiente')}</td><td><strong>${escapeHtml(item.plate||'-')}</strong></td><td class="${isToyota10SaleDate(item.saleDate)?'registry-toyota10-value':''}">${fmtDate(item.saleDate)}</td><td>${escapeHtml(item.partCode||'-')}</td><td class="part-description">${escapeHtml(item.part||'-')}</td><td class="order-cell"><strong>${escapeHtml(item.order||'-')}</strong></td><td>${fmtDate(item.repairDate)}</td><td class="${isToyota10Km(item.km)?'registry-toyota10-value':''}">${item.km?`${escapeHtml(item.km)} km`:'-'}</td><td>${escapeHtml(item.origin||'Pendiente')}</td><td>${escapeHtml(item.responsible||'Pendiente')}</td><td><button class="registry-edit-button" data-registry-key="${escapeHtml(item.key)}">Editar</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state registry-empty"><span class="empty-icon">□</span><h3>Sin registros para este día</h3><p>Cambiá la fecha o agregá un registro.</p></div>`}</section>${partsRegistrySheet()}`}
function managementView(){const c=managedOrder?branchVisibleCases(cases).find(item=>item.order===managedOrder):null;return `${heading('Gestión de casos','Buscá por NRO OR o patente y aplicá una resolución protegida.')}<section class="management-search"><label for="managementQuery">NRO OR o patente</label><div><input id="managementQuery" value="" placeholder="Ej. OR-2487 o AF 482 QZ"><button class="primary-button" id="managementFind">Buscar caso</button></div><p id="managementError"></p></section>${c?`<section class="management-card"><div class="management-identity"><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'SIN ESTADO')}</span><h2>${escapeHtml(c.order)}</h2><p>${escapeHtml(c.plate)} | ${escapeHtml(c.client)}</p></div><div class="management-data"><span><small>Repuesto</small><strong>${escapeHtml(c.part)}</strong></span><span><small>Arribo</small><strong>${c.arrived?'Confirmado':'Pendiente'}</strong></span><span><small>Turno</small><strong>${c.appointmentDate?`${fmtDate(c.appointmentDate)} ${escapeHtml(c.time)}`:'Sin turno'}</strong></span></div><div class="resolution-actions"><button class="resolution-button" data-resolution="REPROGRAMAR" data-order="${escapeHtml(c.order)}">Reprogramar<small>Devuelve el caso a Sin turnos</small></button><button class="resolution-button danger" data-resolution="DADO DE BAJA" data-order="${escapeHtml(c.order)}">Dar de baja<small>Libera el repuesto asociado</small></button><button class="resolution-button" data-resolution="REALIZADO" data-order="${escapeHtml(c.order)}">Marcar realizado<small>Cierra la reparación ahora</small></button><button class="text-button clear-resolution" data-resolution="RESTABLECER" data-order="${escapeHtml(c.order)}">Restablecer circuito automático</button></div></section>`:''}`}
function settingsView(){
  const usernames=Object.keys(APPLICATION_USERS),selected=APPLICATION_USERS[selectedPermissionUser]||APPLICATION_USERS[usernames[0]],permissions=permissionsForUser(selected.username),editableViews=new Set(['database','reminders','parts','appointments','today-appointments','parts-registry','missing-parts','released','vor','settings']),accessCount=views.filter(view=>permissions[view.id]?.access).length,modifyCount=views.filter(view=>editableViews.has(view.id)&&permissions[view.id]?.modify).length,visibleCaseCount=branchVisibleCases(cases).length,visibleManualCount=activeManualPartsRegistry().filter(item=>canViewOtherBranches()||(item.branch||'Santa Fe')===(currentApplicationUser()?.branch||'Santa Fe')).length;
  const panel=(name)=>settingsPanel===name?'':' hidden';
  const menu=(name,label,description,icon)=>`<button type="button" class="settings-nav-item${settingsPanel===name?' active':''}" data-settings-panel="${name}" aria-controls="settings-panel-${name}" aria-expanded="${settingsPanel===name}"><span class="settings-nav-icon" aria-hidden="true">${icon}</span><span><strong>${label}</strong><small>${description}</small></span><span class="settings-nav-arrow" aria-hidden="true">›</span></button>`;
  return `${heading('Configuración','Administrá usuarios, accesos y herramientas del sistema.','SISTEMA')}
    <div class="settings-layout">
      <nav class="settings-nav" aria-label="Secciones de Configuración">
        <div class="settings-nav-intro"><span class="action-kicker">PANEL DE CONTROL</span><p>Elegí una sección para mostrar solo sus opciones.</p></div>
        <div class="settings-nav-list">
          ${menu('email','Destinatarios de pedidos','Correos de repuestos','@')}
          ${menu('registry','Responsables','Registro de repuestos','RR')}
          ${menu('permissions','Accesos por usuario','Permisos actuales','AC')}
          ${menu('users','Administrar usuarios','Altas y bajas','US')}
          ${menu('data','Control de datos','Información almacenada','BD')}
        </div>
      </nav>
      <div class="settings-panels">
    <section id="settings-panel-email" class="settings-panel parts-email-settings" aria-labelledby="partsEmailSettingsTitle"${panel('email')}>
      <header>
        <div><span class="action-kicker">Solicitud de repuestos</span><h2 id="partsEmailSettingsTitle">Destinatarios del pedido</h2><p>Estos correos se usarán al presionar <strong>Pedir</strong> en la sección Repuestos.</p></div>
        <span class="parts-email-status"><i aria-hidden="true"></i>${partsOrderEmailSettings.to.length?'Configuración activa':'Configuración pendiente'}</span>
      </header>
      <form id="partsOrderEmailSettingsForm" class="parts-email-settings-form">
        <label><span>DESTINATARIOS <b>OBLIGATORIO</b></span><textarea name="to" rows="3" placeholder="repuestos@empresa.com; compras@empresa.com" required>${escapeHtml(partsOrderEmailSettings.to.join('; '))}</textarea><small>Quienes deben gestionar el pedido. Separá varios correos con punto y coma o coma.</small></label>
        <label><span>CON COPIA (CC)</span><textarea name="cc" rows="3" placeholder="garantias@empresa.com; seguimiento@empresa.com">${escapeHtml(partsOrderEmailSettings.cc.join('; '))}</textarea><small>Personas que recibirán una copia informativa del pedido.</small></label>
        <p class="parts-email-settings-error" role="alert" aria-live="assertive"></p>
        <footer><div><strong>${partsOrderEmailSettings.to.length}</strong> destinatario${partsOrderEmailSettings.to.length===1?'':'s'} · <strong>${partsOrderEmailSettings.cc.length}</strong> copia${partsOrderEmailSettings.cc.length===1?'':'s'}</div><button class="primary-button" type="submit">Guardar destinatarios</button></footer>
      </form>
    </section>
    <section id="settings-panel-users" class="settings-panel user-directory-panel" aria-labelledby="usersTitle"${panel('users')}>
      <header><div><span class="action-kicker">Directorio interno</span><h2 id="usersTitle">Administrar usuarios</h2><p>Activá, editá o agregá perfiles y asignales una sucursal.</p></div><span class="parts-email-status"><i aria-hidden="true"></i>${usernames.filter(username=>APPLICATION_USERS[username].active!==false).length} activos</span></header>
      <div class="user-directory-form">
        <div class="user-directory-list">${usernames.map(username=>{const user=APPLICATION_USERS[username],active=user.active!==false;return `<article class="user-directory-row ${active?'is-active':'is-inactive'}"><span class="user-directory-status" aria-label="${active?'Activo':'Inactivo'}">${active?'✓':'—'}</span><div class="user-directory-identity"><strong>${escapeHtml(user.displayName)}</strong><small>${escapeHtml(username)} <i></i> ${escapeHtml(user.role)} <i></i> ${escapeHtml(user.branch||'Santa Fe')}</small></div><div class="user-directory-actions"><button type="button" data-edit-user="${escapeHtml(username)}">Editar</button><button type="button" data-toggle-user="${escapeHtml(username)}">${active?'Desactivar':'Activar'}</button></div></article>`}).join('')}</div>
        ${selectedDirectoryUser?`<div class="user-directory-modal-backdrop" data-user-modal-backdrop>
        <section class="user-directory-editor" role="dialog" aria-modal="true" aria-labelledby="userEditorTitle" aria-live="polite">
          <div class="user-directory-editor-heading"><div><span class="action-kicker">${selectedDirectoryUser==='new'?'Nuevo perfil':'Edición de perfil'}</span><h3 id="userEditorTitle">${selectedDirectoryUser==='new'?'Agregar usuario':'Editá los datos del usuario seleccionado'}</h3></div><span>${selectedDirectoryUser&&selectedDirectoryUser!=='new'?'Usuario: '+escapeHtml(selectedDirectoryUser):'Completá los campos para crear un usuario'}</span><button type="button" class="user-directory-modal-close" id="closeUserEdit" aria-label="Cerrar ventana">×</button></div>
          <form id="userDirectoryEditForm" class="user-directory-edit-grid">
            <label><span>NOMBRE VISIBLE</span><input name="displayName" required maxlength="80" value="${escapeHtml(selectedDirectoryUser&&selectedDirectoryUser!=='new'?APPLICATION_USERS[selectedDirectoryUser]?.displayName||'':'')}"></label>
            <label><span>USUARIO</span><input name="username" required maxlength="32" pattern="[a-zA-Z0-9._-]{3,32}" value="${escapeHtml(selectedDirectoryUser&&selectedDirectoryUser!=='new'?selectedDirectoryUser:'')}" ${selectedDirectoryUser&&selectedDirectoryUser!=='new'?'readonly':''}></label>
            <label><span>ROL</span><input name="role" required maxlength="60" value="${escapeHtml(selectedDirectoryUser&&selectedDirectoryUser!=='new'?APPLICATION_USERS[selectedDirectoryUser]?.role||'Operador':'Operador')}"></label>
            <label><span>SUCURSAL</span><select name="branch" required><option value="">Seleccionar sucursal</option>${USER_BRANCHES.map(branch=>`<option value="${escapeHtml(branch)}" ${(selectedDirectoryUser&&selectedDirectoryUser!=='new'?APPLICATION_USERS[selectedDirectoryUser]?.branch:'Santa Fe')===branch?'selected':''}>${escapeHtml(branch)}</option>`).join('')}</select></label>
            <p class="user-directory-branch-note"><strong>Historial por sucursal</strong> Los casos ya registrados conservan su sucursal original. El cambio se aplicará únicamente a los nuevos registros de este usuario.</p>
            <footer><button type="button" class="secondary-button" id="cancelUserEdit">Cancelar</button><button type="submit" class="primary-button">Guardar usuario</button></footer>
          </form>
        </section>
        </div>`:''}
        <footer><span>Los usuarios desactivados no pueden iniciar sesión; sus registros históricos se conservan.</span><button class="primary-button" type="button" id="addUserDirectory">＋ Agregar usuario</button></footer>
      </div>
    </section>
    <section id="settings-panel-registry" class="settings-panel registry-responsibles-settings" aria-labelledby="registryResponsiblesTitle"${panel('registry')}>
      <header>
        <div><span class="action-kicker">Registro de repuestos</span><h2 id="registryResponsiblesTitle">Responsables disponibles</h2><p>Editá los nombres que aparecen al completar un registro. La lista se comparte entre computadoras.</p></div>
        <span class="registry-responsibles-count"><strong>${registryResponsibles.length}</strong> responsables</span>
      </header>
      <form id="registryResponsiblesForm" class="registry-responsibles-form">
        <div class="registry-responsibles-list" data-responsible-list>
          ${registryResponsibles.map((name,index)=>`<div class="registry-responsible-row"><span>${String(index+1).padStart(2,'0')}</span><label><span class="sr-only">Nombre del responsable ${index+1}</span><input name="responsible" maxlength="80" value="${escapeHtml(name)}" required></label><button type="button" data-remove-responsible aria-label="Quitar ${escapeHtml(name)}">Quitar</button></div>`).join('')}
        </div>
        <p class="registry-responsibles-error" role="alert" aria-live="assertive"></p>
        <footer><button class="secondary-button" type="button" id="addRegistryResponsible">＋ Agregar responsable</button><div><span>Quitar un nombre de esta lista no modifica los registros históricos.</span><button class="primary-button" type="submit">Guardar responsables</button></div></footer>
      </form>
    </section>
    <section id="settings-panel-permissions" class="settings-panel permissions-admin" aria-labelledby="permissionsTitle"${panel('permissions')}>
      <header class="permissions-heading">
        <div><span class="action-kicker">Trabajo estandarizado</span><h2 id="permissionsTitle">Control de acceso por usuario</h2><p>Seleccioná un perfil, asigná el alcance necesario y guardá una única versión autorizada.</p></div>
        <label class="permissions-user-select"><span>USUARIO</span><select id="permissionUserSelect">${usernames.map(username=>{const user=APPLICATION_USERS[username];return `<option value="${escapeHtml(username)}" ${username===selected.username?'selected':''}>${escapeHtml(user.displayName)} · ${escapeHtml(user.role)}</option>`}).join('')}</select></label>
      </header>
      <div class="permissions-workspace">
        <aside class="permissions-profile" aria-label="Perfil seleccionado">
          <div class="permissions-user-summary">
            <span class="permissions-avatar">${escapeHtml(selected.initials)}</span><div><strong>${escapeHtml(selected.displayName)}</strong><small>${escapeHtml(selected.role)} · ${escapeHtml(selected.username)}</small></div>
            <dl><div><dt>SECCIONES VISIBLES</dt><dd>${accessCount}<small>de ${views.length}</small></dd></div><div><dt>CON MODIFICACIÓN</dt><dd>${modifyCount}</dd></div></dl>
          </div>
          <label class="branch-visibility-control"><input type="checkbox" data-permission-branches ${canViewOtherBranches(selected)?'checked':''}><span><strong>Ver otras sucursales</strong><small>${escapeHtml(selected.branch||'Santa Fe')} · acceso a información de todas las sucursales</small></span><i aria-hidden="true"></i></label>
          <div class="permissions-standard-work"><span>SECUENCIA DE CONTROL</span><ol><li><b>01</b> Seleccionar usuario</li><li><b>02</b> Definir acceso y modificación</li><li><b>03</b> Guardar el perfil</li></ol></div>
        </aside>
        <div class="permissions-matrix">
          <div class="permissions-table" role="table" aria-label="Permisos de ${escapeHtml(selected.displayName)}">
            <div class="permission-row permission-table-head" role="row"><span>SECCIÓN</span><span>ACCESO</span><span>MODIFICACIÓN</span></div>
            ${views.map(view=>{const permission=permissions[view.id],editable=editableViews.has(view.id);return `<div class="permission-row" role="row" data-permission-row="${view.id}"><div class="permission-section"><span class="permission-folder">${escapeHtml(view.icon)}</span><div><strong>${escapeHtml(view.label)}</strong><small>${escapeHtml(view.group||'')}</small></div></div><label class="permission-control"><input type="checkbox" data-permission-access="${view.id}" ${permission.access?'checked':''}><span aria-hidden="true"></span><b>${permission.access?'Permitido':'Sin acceso'}</b></label>${editable?`<label class="permission-control"><input type="checkbox" data-permission-modify="${view.id}" ${permission.modify?'checked':''} ${permission.access?'':'disabled'}><span aria-hidden="true"></span><b>${permission.modify?'Puede modificar':'Solo consulta'}</b></label>`:`<div class="permission-readonly"><span>Solo consulta</span><small>Esta sección no registra cambios</small></div>`}</div>`}).join('')}
          </div>
          <footer class="permissions-actions"><p>Los cambios se aplican al próximo ingreso y en la siguiente navegación del usuario.</p><button class="secondary-button" type="button" id="resetUserPermissions">Restablecer perfil</button><button class="primary-button" type="button" id="saveUserPermissions">Guardar permisos</button></footer>
        </div>
      </div>
    </section>
    <section id="settings-panel-data" class="settings-panel settings-data-control" aria-labelledby="dataControlTitle"${panel('data')}>
      <header><div><span class="action-kicker">Calidad en la fuente</span><h2 id="dataControlTitle">Control de datos</h2><p>Verificá el volumen registrado antes de realizar tareas de mantenimiento.</p></div></header>
      <div class="settings-grid"><article class="settings-card"><span class="settings-icon">BD</span><div><h2>Información almacenada</h2><p><strong>${visibleCaseCount}</strong> casos operativos y <strong>${visibleManualCount}</strong> registros manuales disponibles.</p></div></article><article class="settings-danger"><div><span class="action-kicker">Acción irreversible</span><h2>Eliminar todos los datos ingresados</h2><p>Usar únicamente para reiniciar la plataforma o eliminar cargas de prueba verificadas.</p></div><button class="danger-button" id="clearAllData">Eliminar todos los datos</button></article></div>
    </section>
      </div>
    </div>`
}
function filtered(items){let scoped=currentView==='database'?filterByToyota10(filterByVor(items,databaseVorFilter),databaseToyota10Filter):items;if(currentView==='database'&&databaseBranchFilter!=='all')scoped=scoped.filter(c=>(c.branch||'Santa Fe')===databaseBranchFilter);const q=query.trim().toLowerCase();return q?scoped.filter(c=>[c.order,c.plate,c.client,c.part].some(v=>String(v||'').toLowerCase().includes(q))):scoped}
function heading(title,subtitle,eyebrow='OPERACIÓN DIARIA'){return `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div></div>`}
function dashboard(){const scoped=branchVisibleCases(cases);const pending=scoped.filter(c=>c.status==='PENDIENTE DE REPUESTO').length,noTurn=scoped.filter(c=>c.arrived&&!c.vor&&!c.appointmentDate).length,upcoming=scoped.filter(c=>c.status==='PROGRAMADO').length,alerts=scoped.filter(c=>c.status==='TURNO SIN REPUESTO'||c.vor&&c.arrived).length,delayed=scoped.filter(c=>c.requested&&!c.arrived&&daysFrom(c.requestDate)>10).length;return `${heading('Buen día, Felipe','Lo importante del circuito, ordenado para actuar.','CENTRO DE CONTROL')}<section class="stats"><article class="stat"><div class="stat-top"><span>Repuestos pendientes</span><span class="stat-icon">◇</span></div><strong>${pending}</strong><small>${delayed} con más de 10 días</small></article><article class="stat"><div class="stat-top"><span>Sin turno asignado</span><span class="stat-icon">◷</span></div><strong>${noTurn}</strong><small class="good">Listos para contactar</small></article><article class="stat"><div class="stat-top"><span>Turnos programados</span><span class="stat-icon">□</span></div><strong>${upcoming}</strong><small>Próximos 7 días</small></article><article class="stat attention"><div class="stat-top"><span>Requieren atención</span><span class="stat-icon">△</span></div><strong>${alerts}</strong><small>VOR o turno sin repuesto</small></article></section><section class="flow-strip" aria-label="Estado del flujo"><div class="flow-step"><span>Ingreso</span><strong>${cases.length} casos activos</strong></div><div class="flow-step ${delayed?'blocked':''}"><span>Espera de repuesto</span><strong>${delayed?`${delayed} con demora`:'Flujo normal'}</strong></div><div class="flow-step"><span>Coordinación</span><strong>${noTurn} por contactar</strong></div><div class="flow-step ${alerts?'blocked':''}"><span>Bloqueos</span><strong>${alerts} requieren acción</strong></div></section><div class="content-grid"><section class="panel"><header class="panel-header"><div><h2>Casos prioritarios</h2><p>Ordenados por urgencia y antigüedad</p></div><button class="text-button" data-go="database">Ver todos</button></header>${table(filtered([...cases].sort((a,b)=>(a.priority==='Urgente'?-2:a.priority==='Alta'?-1:0)-(b.priority==='Urgente'?-2:b.priority==='Alta'?-1:0)).slice(0,5)))}</section><aside class="panel"><header class="panel-header"><div><h2>Actividad reciente</h2><p>Actualizaciones del circuito</p></div></header><div class="activity-list"><div class="activity"><span class="activity-icon">✓</span><p><strong>Arribó un repuesto</strong><br>OR-2481 pasó a pendiente de turno<time>Hace 26 minutos</time></p></div><div class="activity"><span class="activity-icon">□</span><p><strong>Turno confirmado</strong><br>OR-2476 para ${fmtDate(iso(2))}<time>Hace 1 hora</time></p></div><div class="activity"><span class="activity-icon">△</span><p><strong>Alerta de repuesto</strong><br>OR-2468 conserva un turno activo<time>Hace 3 horas</time></p></div><div class="activity"><span class="activity-icon">⚑</span><p><strong>Caso VOR ingresado</strong><br>OR-2472 continúa sin avisar<time>Ayer</time></p></div></div></aside></div>`}
function average(values){const valid=values.filter(Number.isFinite);return valid.length?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length):0}
function dashboardV2(){const active=branchVisibleCases(cases).filter(c=>c.status!=='DADO DE BAJA'),pending=active.filter(c=>c.requested&&!c.arrived),delayed=pending.filter(c=>daysFrom(c.requestDate)>10),noTurn=active.filter(c=>c.arrived&&!c.vor&&!c.appointmentDate),missing=active.filter(c=>c.requested&&!c.arrived&&(c.appointmentDate||c.time)),vorAlert=active.filter(c=>c.vor&&c.arrived&&(c.vorStatus||'SIN AVISAR')==='SIN AVISAR'),upcoming=active.filter(c=>c.appointmentDate&&c.appointmentDate>=iso(0)&&daysUntil(c.appointmentDate)<=7),oldest=pending.length?Math.max(...pending.map(c=>daysFrom(c.requestDate))):0,avgArrival=average(active.filter(c=>c.arrivalDate).map(c=>daysBetween(c.requestDate,c.arrivalDate))),avgContact=average(active.filter(c=>c.arrivalDate&&c.firstConversation).map(c=>daysBetween(c.arrivalDate,c.firstConversation))),avgSchedule=average(active.filter(c=>c.firstConversation&&c.appointmentDate).map(c=>daysBetween(c.firstConversation,c.appointmentDate))),incomplete=active.filter(c=>!c.phone||!c.partCode||!c.part).length;const stages=[{label:'Espera de repuesto',count:pending.length,view:'parts'},{label:'Sin turno',count:noTurn.length,view:'no-appointments'},{label:'Turno sin repuesto',count:missing.length,view:'missing-parts'},{label:'VOR sin avisar',count:vorAlert.length,view:'vor'}].sort((a,b)=>b.count-a.count),bottleneck=stages[0];const actions=[...missing.map(c=>({c,reason:`Turno ${daysUntil(c.appointmentDate)<0?'vencido':`en ${daysUntil(c.appointmentDate)} días`}`,view:'missing-parts',level:'critical'})),...vorAlert.map(c=>({c,reason:'VOR sin avisar',view:'vor',level:'critical'})),...delayed.map(c=>({c,reason:`Repuesto demorado ${daysFrom(c.requestDate)} días`,view:'parts',level:'warning'})),...noTurn.map(c=>({c,reason:'Cliente pendiente de contacto',view:'no-appointments',level:'info'}))].slice(0,6);return `${heading('Centro de control','Prioridades, tiempos y bloqueos del circuito actual.','OPERACIÓN DE HOY')}<section class="decision-banner"><div><span>Principal cuello de botella</span><strong>${bottleneck.label}</strong><p>${bottleneck.count} casos concentrados en esta etapa. El caso más antiguo lleva ${oldest} días.</p></div><button class="primary-button" data-go="${bottleneck.view}">Resolver ahora</button></section><section class="kpi-grid"><article class="kpi"><span>Pedido a arribo</span><strong>${avgArrival}<small> días</small></strong><p>Promedio de casos con arribo</p></article><article class="kpi"><span>Arribo a contacto</span><strong>${avgContact}<small> días</small></strong><p>Objetivo sugerido: 1 día</p></article><article class="kpi"><span>Contacto a turno</span><strong>${avgSchedule}<small> días</small></strong><p>Tiempo medio de coordinación</p></article><article class="kpi ${incomplete?'kpi-alert':''}"><span>Datos incompletos</span><strong>${incomplete}<small> casos</small></strong><p>${incomplete?'Requieren corrección':'Calidad de datos completa'}</p></article></section><section class="pulse-grid"><button data-go="parts"><span>Repuestos demorados</span><strong>${delayed.length}</strong><small>${oldest} días máximo</small></button><button data-go="no-appointments"><span>Listos para contactar</span><strong>${noTurn.length}</strong><small>Acción comercial</small></button><button data-go="appointments"><span>Turnos próximos</span><strong>${upcoming.length}</strong><small>En los próximos 7 días</small></button><button data-go="missing-parts" class="${missing.length?'critical':''}"><span>Turnos en riesgo</span><strong>${missing.length}</strong><small>Sin repuesto confirmado</small></button></section><div class="dashboard-grid"><section class="panel action-panel"><header class="panel-header"><div><h2>Atención requerida</h2><p>Ordenada por riesgo y demora</p></div><span class="queue-count">${actions.length}</span></header>${actions.length?`<div class="action-queue">${actions.map(a=>`<button data-go="${a.view}"><span class="severity ${a.level}" aria-hidden="true"></span><span><strong>${escapeHtml(a.c.order)} | ${escapeHtml(a.c.plate)}</strong><small>${escapeHtml(a.reason)}</small></span><b>Revisar</b></button>`).join('')}</div>`:`<div class="empty-state compact"><span class="empty-icon">✓</span><h3>Sin acciones pendientes</h3><p>El circuito no presenta bloqueos.</p></div>`}</section><aside class="panel stage-panel"><header class="panel-header"><div><h2>Carga por etapa</h2><p>Distribución del trabajo activo</p></div></header><div class="stage-list">${stages.map((s,i)=>`<button data-go="${s.view}"><span>${s.label}</span><strong>${s.count}</strong><i style="--size:${active.length?Math.max(8,Math.round(s.count/active.length*100)):8}%"></i></button>`).join('')}</div><div class="period-summary"><span>Solicitudes últimos 7 días<strong>${active.filter(c=>daysFrom(c.requestDate)<=7).length}</strong></span><span>Programados próximos 7 días<strong>${upcoming.length}</strong></span></div></aside></div>`}
function kpiState(value,ok,warning){if(value<=ok)return ['OK','ok'];if(value<=warning)return ['Atención','warning'];return ['Crítico','critical']}
function dashboardCard(item){return `<button class="dashboard-card ${item.level||''}" data-go="${item.view}"><span>${escapeHtml(item.label)}</span><strong>${item.value}</strong><small>${escapeHtml(item.note)}</small></button>`}
function dashboardAgendaItem(c){return `<button data-go="calendar"><strong>${escapeHtml(c.time||'Sin hora')} | ${escapeHtml(c.order)}</strong><small>${escapeHtml(c.plate)} | ${escapeHtml(c.client)} | ${escapeHtml(c.part)}</small></button>`}
function dashboardV2(){const active=branchVisibleCases(cases).filter(c=>c.status!=='DADO DE BAJA'),pending=active.filter(c=>c.requested&&!c.arrived),delayed=pending.filter(c=>daysFrom(c.requestDate)>10),noTurn=active.filter(c=>c.arrived&&!c.vor&&!isProgrammed(c)),missing=active.filter(c=>c.requested&&!c.arrived&&(c.appointmentDate||c.time)),vorAlert=active.filter(c=>c.vor&&c.arrived&&(c.vorStatus||'SIN AVISAR')==='SIN AVISAR'),programmed=active.filter(c=>isProgrammed(c)&&c.appointmentDate),todayTurns=programmed.filter(c=>c.appointmentDate===iso(0)).sort((a,b)=>String(a.time).localeCompare(String(b.time))),upcoming=programmed.filter(c=>c.appointmentDate>=iso(0)&&daysUntil(c.appointmentDate)<=7),lateTurns=programmed.filter(c=>c.appointmentDate<iso(0)&&c.status!=='REALIZADO'),conflicts=programmed.filter(c=>hasConflict(c,programmed)),incomplete=active.filter(c=>!c.phone||!c.partCode||!c.part||!c.repairTime),avgArrival=average(active.filter(c=>c.arrivalDate).map(c=>daysBetween(c.requestDate,c.arrivalDate))),avgContact=average(active.filter(c=>c.arrivalDate&&c.firstConversation).map(c=>daysBetween(c.arrivalDate,c.firstConversation))),avgSchedule=average(active.filter(c=>c.firstConversation&&c.appointmentDate).map(c=>daysBetween(c.firstConversation,c.appointmentDate))),oldest=pending.length?Math.max(...pending.map(c=>daysFrom(c.requestDate))):0;const k1=kpiState(avgArrival,7,12),k2=kpiState(avgContact,1,3),k3=kpiState(avgSchedule,3,6),k4=kpiState(lateTurns.length+conflicts.length,0,1);const stages=[{label:'Pedido de repuesto',count:active.filter(c=>c.requested).length,view:'parts'},{label:'Repuesto pendiente',count:pending.length,view:'parts'},{label:'Arribado sin turno',count:noTurn.length,view:'no-appointments'},{label:'Programado',count:programmed.length,view:'calendar'},{label:'Realizado',count:active.filter(c=>c.status==='REALIZADO').length,view:'appointments'}];const bottleneck=[{label:'Espera de repuesto',count:pending.length,view:'parts',action:'revisar pedidos demorados'},{label:'Sin turno',count:noTurn.length,view:'no-appointments',action:'contactar clientes'},{label:'Turnos en riesgo',count:missing.length,view:'missing-parts',action:'confirmar repuestos'},{label:'VOR sin avisar',count:vorAlert.length,view:'vor',action:'avisar casos VOR'}].sort((a,b)=>b.count-a.count)[0];const actions=[...lateTurns.map(c=>({c,reason:'Turno vencido sin cierre',view:'calendar',level:'critical'})),...conflicts.map(c=>({c,reason:'Conflicto de calendario',view:'calendar',level:'critical'})),...missing.map(c=>({c,reason:`Turno ${daysUntil(c.appointmentDate)<0?'vencido':`en ${daysUntil(c.appointmentDate)} días`} sin repuesto`,view:'missing-parts',level:'critical'})),...vorAlert.map(c=>({c,reason:'VOR sin avisar',view:'vor',level:'critical'})),...delayed.map(c=>({c,reason:`Repuesto demorado ${daysFrom(c.requestDate)} días`,view:'parts',level:'warning'})),...noTurn.map(c=>({c,reason:'Arribado sin turno',view:'no-appointments',level:'info'})),...incomplete.map(c=>({c,reason:'Datos incompletos',view:'management',level:'warning'}))].slice(0,7);const weekDays=Array.from({length:7},(_,i)=>iso(i)),capacity=weekDays.map(day=>{const dayItems=programmed.filter(c=>c.appointmentDate===day);return {day,count:dayItems.length,state:dayCapacity(dayItems)}}),quick=[{label:'Calendario',value:todayTurns.length,note:'turnos de hoy',view:'calendar'},{label:'Sin turno',value:noTurn.length,note:'clientes por contactar',view:'no-appointments',level:noTurn.length?'warning':''},{label:'Repuestos demorados',value:delayed.length,note:`máximo ${oldest} días`,view:'parts',level:delayed.length?'critical':''},{label:'VOR',value:vorAlert.length,note:'sin avisar',view:'vor',level:vorAlert.length?'critical':''},{label:'Buscar caso',value:'⌕',note:'gestión protegida',view:'management'}];return `${heading('Centro de control','Agenda, riesgos y próximas acciones del circuito actual.','RESUMEN OPERATIVO')}<section class="critical-strip ${actions.some(a=>a.level==='critical')?'show':''}"><strong>${actions.filter(a=>a.level==='critical').length}</strong><span>alertas críticas activas</span><button class="primary-button" data-go="${actions.find(a=>a.level==='critical')?.view||'calendar'}">Revisar ahora</button></section><section class="summary-top"><section class="panel agenda-panel"><header class="panel-header"><div><h2>Agenda de hoy</h2><p>${todayTurns.length?`${todayTurns.length} turnos programados`:'No hay turnos para hoy'}</p></div><button class="text-button" data-go="calendar">Ver calendario</button></header><div class="agenda-list">${todayTurns.length?todayTurns.map(dashboardAgendaItem).join(''):`<div class="empty-state compact"><span class="empty-icon">□</span><h3>Día sin turnos</h3><p>La agenda aparece cuando se confirma PROGRAMADO.</p></div>`}</div></section><aside class="decision-banner"><div><span>Principal cuello de botella</span><strong>${bottleneck.label}</strong><p>${bottleneck.count} casos. Acción sugerida: ${bottleneck.action}.</p></div><button class="primary-button" data-go="${bottleneck.view}">Resolver</button></aside></section><section class="kpi-grid dashboard-kpis"><article class="kpi ${k1[1]}"><span>Pedido a arribo</span><strong>${avgArrival}<small> días</small></strong><p>${k1[0]}</p></article><article class="kpi ${k2[1]}"><span>Arribo a contacto</span><strong>${avgContact}<small> días</small></strong><p>${k2[0]}</p></article><article class="kpi ${k3[1]}"><span>Contacto a turno</span><strong>${avgSchedule}<small> días</small></strong><p>${k3[0]}</p></article><article class="kpi ${k4[1]}"><span>Agenda en riesgo</span><strong>${lateTurns.length+conflicts.length}<small> casos</small></strong><p>${k4[0]}</p></article></section><section class="dashboard-card-grid">${quick.map(dashboardCard).join('')}</section><div class="dashboard-grid"><section class="panel action-panel"><header class="panel-header"><div><h2>Qué hago ahora</h2><p>Prioridad automática por riesgo, demora y calidad de datos</p></div><span class="queue-count">${actions.length}</span></header>${actions.length?`<div class="action-queue">${actions.map(a=>`<button data-go="${a.view}"><span class="severity ${a.level}" aria-hidden="true"></span><span><strong>${escapeHtml(a.c.order)} | ${escapeHtml(a.c.plate)}</strong><small>${escapeHtml(a.reason)}</small></span><b>Revisar</b></button>`).join('')}</div>`:`<div class="empty-state compact"><span class="empty-icon">✓</span><h3>Sin acciones pendientes</h3><p>El circuito no presenta bloqueos.</p></div>`}</section><aside class="panel"><header class="panel-header"><div><h2>Capacidad semanal</h2><p>Carga de taller por día</p></div></header><div class="capacity-week">${capacity.map(d=>`<button data-go="calendar" class="${d.state}"><span>${fmtDate(d.day)}</span><strong>${d.count}</strong><small>${d.state}</small></button>`).join('')}</div></aside></div><section class="panel flow-panel"><header class="panel-header"><div><h2>Flujo operativo</h2><p>Acumulación por etapa del proceso</p></div></header><div class="flow-board">${stages.map(s=>`<button data-go="${s.view}"><span>${s.label}</span><strong>${s.count}</strong><i style="--size:${active.length?Math.max(6,Math.round(s.count/active.length*100)):6}%"></i></button>`).join('')}</div></section>`}
function demandDays(c){return summaryMode==='turns'?daysFrom(c.arrivalDate):daysFrom(c.requestDate)}
function demandBaseDate(c){return summaryMode==='turns'?c.arrivalDate:c.requestDate}
function demandRow(c){return `<tr><td class="order-cell"><strong>${escapeHtml(c.order)}</strong><small>${fmtDate(demandBaseDate(c))}</small></td><td>${escapeHtml(c.plate)}</td><td>${escapeHtml(c.client)}</td><td class="priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</td><td><strong class="days-value">${demandDays(c)}</strong><small class="days-label"> días</small></td><td><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'SIN ESTADO')}</span></td></tr>`}
function demandTable(title,range,items,tone=''){return `<section class="panel demand-panel ${tone}"><header class="panel-header"><div><h2>${title}</h2><p>${range}</p></div><span class="queue-count">${items.length}</span></header>${items.length?`<div class="table-wrap demand-table-scroll"><table class="data-table demand-table"><thead><tr><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>PRIORIDAD</th><th>DÍAS</th><th>ESTADO</th></tr></thead><tbody>${items.map(demandRow).join('')}</tbody></table></div>`:`<div class="empty-state compact"><span class="empty-icon">✓</span><h3>Sin casos</h3><p>No hay casos en este rango.</p></div>`}</section>`}
function dashboardV2(){const base=branchVisibleCases(cases).filter(c=>c.status!=='DADO DE BAJA'&&(summaryMode==='turns'?c.arrived&&c.arrivalDate&&!c.vor&&!isProgrammed(c):c.requested&&!c.arrived)).sort((a,b)=>demandDays(b)-demandDays(a));const ranges=[{title:'0 a 7 días',range:summaryMode==='turns'?'Desde arribo reciente':'Desde pedido reciente',items:base.filter(c=>demandDays(c)>=0&&demandDays(c)<=7),tone:'fresh'},{title:'8 a 14 días',range:'Seguimiento normal',items:base.filter(c=>demandDays(c)>=8&&demandDays(c)<=14),tone:'watch'},{title:'15 a 21 días',range:'Demanda demorada',items:base.filter(c=>demandDays(c)>=15&&demandDays(c)<=21),tone:'risk'},{title:'22+ días',range:'Atención prioritaria',items:base.filter(c=>demandDays(c)>=22),tone:'critical'}];return `${heading('Demanda diaria de solicitudes',summaryMode==='turns'?'Turnos no programados agrupados por días hábiles desde el arribo.':'Repuestos no arribados agrupados por días hábiles desde que se pidieron.','RESUMEN')}<div class="section-toolbar summary-toolbar"><div class="segmented-filter" id="summaryMode"><button data-summary-mode="parts" class="${summaryMode==='parts'?'active':''}">Repuestos</button><button data-summary-mode="turns" class="${summaryMode==='turns'?'active':''}">Turnos</button></div><span class="date-chip">${base.length} casos</span></div>${summaryMode==='turns'?turnsCharts(base):''}<div class="demand-grid">${ranges.map(r=>demandTable(r.title,r.range,r.items,r.tone)).join('')}</div>`}
function viewTable(items){if(currentView==='database')return databaseTable(items);if(currentView==='parts')return partsTable(items);if(currentView==='appointments')return turnsTable(items);if(currentView==='no-appointments')return turnsTable(items,true);if(currentView==='vor')return vorTable(items);if(currentView==='missing-parts')return missingPartsTable(items);if(currentView==='released')return releasedTable(items);return table(items)}
function sortParts(items){
  const priorityWeight={Urgente:0,Alta:1,Normal:2};
  const compareText=(a,b)=>String(a||'').localeCompare(String(b||''),'es',{numeric:true,sensitivity:'base'});
  const compareDate=(a,b)=>String(a||'').localeCompare(String(b||''));
  const compareDays=(a,b)=>{
    const aDays=a.arrived?daysBetween(a.requestDate,a.arrivalDate):daysFrom(a.requestDate);
    const bDays=b.arrived?daysBetween(b.requestDate,b.arrivalDate):daysFrom(b.requestDate);
    return aDays-bDays;
  };
  const comparators={
    'days-desc':(a,b)=>compareDays(b,a)||compareText(a.order,b.order),
    'days-asc':(a,b)=>compareDays(a,b)||compareText(a.order,b.order),
    'date-desc':(a,b)=>compareDate(b.requestDate,a.requestDate)||compareText(b.order,a.order),
    'date-asc':(a,b)=>compareDate(a.requestDate,b.requestDate)||compareText(a.order,b.order),
    'order-asc':(a,b)=>compareText(a.order,b.order),
    'order-desc':(a,b)=>compareText(b.order,a.order),
    'priority':(a,b)=>(priorityWeight[a.priority]??3)-(priorityWeight[b.priority]??3)||compareDays(b,a),
    'client':(a,b)=>compareText(a.client,b.client)||compareText(a.order,b.order)
  };
  return [...items].sort(comparators[partsSort]||comparators['days-desc']);
}
function filterParts(items){const filteredItems=partsFilter==='without-arrival'?items.filter(c=>!c.arrived):partsFilter==='with-arrival'?items.filter(c=>c.arrived):items;return sortParts(filterByToyota10(filteredItems,partsToyota10Filter))}
function sortTurns(items){
  const priorityWeight={Urgente:0,Alta:1,Normal:2};
  const compareText=(a,b)=>String(a||'').localeCompare(String(b||''),'es',{numeric:true,sensitivity:'base'});
  const compareDays=(a,b)=>turnArrivalDays(a)-turnArrivalDays(b);
  const comparators={
    'days-desc':(a,b)=>compareDays(b,a)||compareText(a.order,b.order),
    'days-asc':(a,b)=>compareDays(a,b)||compareText(a.order,b.order),
    'arrival-desc':(a,b)=>compareText(b.arrivalDate,a.arrivalDate)||compareText(a.order,b.order),
    'arrival-asc':(a,b)=>compareText(a.arrivalDate,b.arrivalDate)||compareText(a.order,b.order),
    'priority':(a,b)=>(priorityWeight[a.priority]??3)-(priorityWeight[b.priority]??3)||compareDays(b,a),
  };
  return [...items].sort(comparators[turnsSort]||comparators['days-desc']);
}
function filterTurns(items){const filteredItems=turnFilter==='without'?items.filter(c=>!isProgrammed(c)):turnFilter==='with'?items.filter(isProgrammed):items;return sortTurns(filterByToyota10(filteredItems,turnsToyota10Filter))}
function filterVor(items){if(vorFilter==='not-notified')return items.filter(c=>normalizedVorStatus(c)==='NO AVISADO');if(vorFilter==='notified')return items.filter(c=>normalizedVorStatus(c)==='AVISADO');if(vorFilter==='done')return items.filter(c=>normalizedVorStatus(c)==='REALIZADO');return items}
function filterByVor(items,mode){if(mode==='with')return items.filter(c=>c.vor);if(mode==='without')return items.filter(c=>!c.vor);return items}
function filterByToyota10(items,mode){if(mode==='with')return items.filter(isToyota10Case);if(mode==='without')return items.filter(c=>!isToyota10Case(c));return items}
function listView(){if(currentView==='management')return managementView();if(currentView==='calendar')return calendarView();if(currentView==='today-appointments')return todayAppointmentsView();if(currentView==='parts-registry')return partsRegistryView();if(currentView==='reminders')return remindersView();if(currentView==='history')return historyView();if(currentView==='settings')return settingsView();const v=views.find(x=>x.id===currentView),baseItems=filtered(getViewCases(currentView)),items=currentView==='appointments'?filterTurns(baseItems):currentView==='parts'?filterParts(baseItems):currentView==='vor'?filterVor(baseItems):baseItems;const subtitles={database:'Registro maestro y fuente principal de información.',parts:'Control de solicitudes, demoras y arribos de piezas.',appointments:'Todos los casos con repuesto arribado, programados o pendientes.',calendar:'Vista operativa de turnos programados.','missing-parts':'Turnos activos cuya pieza aún no está disponible.',released:'Casos dados de baja con motivo operativo registrado.',vor:'Casos prioritarios con repuesto arribado.'};return `${heading(v.label,subtitles[currentView])}${currentView==='database'?databaseStateKpis(baseItems)+databaseVorKpis(baseItems):''}<div class="section-toolbar">${currentView==='parts'?`<div class="segmented-filter" id="partsFilter"><button data-parts-view="all" class="${partsFilter==='all'?'active':''}">Todos</button><button data-parts-view="without-arrival" class="${partsFilter==='without-arrival'?'active':''}">Sin arribo</button><button data-parts-view="with-arrival" class="${partsFilter==='with-arrival'?'active':''}">Con arribo</button></div><button class="primary-button report-button" id="generatePartsPdf">Generar PDF</button>`:''}${currentView==='appointments'?`<div class="segmented-filter" id="turnFilter"><button data-turn-view="all" class="${turnFilter==='all'?'active':''}">Todos</button><button data-turn-view="without" class="${turnFilter==='without'?'active':''}">Sin turno</button><button data-turn-view="with" class="${turnFilter==='with'?'active':''}">Con turno</button></div><button class="primary-button report-button" id="generateTurnsPdf">Generar PDF</button>`:''}${currentView==='vor'?`<div class="segmented-filter" id="vorFilter"><button data-vor-view="all" class="${vorFilter==='all'?'active':''}">Todos</button><button data-vor-view="not-notified" class="${vorFilter==='not-notified'?'active':''}">No avisado</button><button data-vor-view="notified" class="${vorFilter==='notified'?'active':''}">Avisado</button><button data-vor-view="done" class="${vorFilter==='done'?'active':''}">Realizado</button></div>`:''}<select class="filter-select" id="priorityFilter"><option value="">Todas las prioridades</option><option>Urgente</option><option>Alta</option><option>Normal</option></select><span class="date-chip">${items.length} casos</span></div><section class="panel" id="caseTable">${viewTable(items)}</section>${currentView==='database'?databaseCaseSheet():''}`}
const renderSummaryWithoutVorScope=dashboardV2;
dashboardV2=function(){const allCases=cases;cases=filterByToyota10(filterByVor(cases,summaryVorFilter),summaryToyota10Filter);try{const html=renderSummaryWithoutVorScope();const controls=`<label class="vor-filter-control" for="summaryVorFilter"><span>VOR</span><select id="summaryVorFilter"><option value="all" ${summaryVorFilter==='all'?'selected':''}>Todos</option><option value="with" ${summaryVorFilter==='with'?'selected':''}>Con VOR</option><option value="without" ${summaryVorFilter==='without'?'selected':''}>Sin VOR</option></select></label><label class="vor-filter-control toyota10-filter-control" for="summaryToyota10Filter"><span>T10</span><select id="summaryToyota10Filter"><option value="all" ${summaryToyota10Filter==='all'?'selected':''}>Todos</option><option value="with" ${summaryToyota10Filter==='with'?'selected':''}>Con Toyota 10</option><option value="without" ${summaryToyota10Filter==='without'?'selected':''}>Sin Toyota 10</option></select></label>`;return html.replace('<span class="date-chip">',controls+'<span class="date-chip">')}finally{cases=allCases}}
const renderListWithoutVorScope=listView;
listView=function(){if(currentView!=='database')return renderListWithoutVorScope();const allCases=cases;cases=filterByToyota10(filterByVor(cases,databaseVorFilter),databaseToyota10Filter);try{const html=renderListWithoutVorScope();const controls=`<label class="vor-filter-control compact" for="databaseVorFilter"><span>VOR</span><select id="databaseVorFilter"><option value="all" ${databaseVorFilter==='all'?'selected':''}>Todos</option><option value="with" ${databaseVorFilter==='with'?'selected':''}>Con VOR</option><option value="without" ${databaseVorFilter==='without'?'selected':''}>Sin VOR</option></select></label><label class="vor-filter-control compact toyota10-filter-control" for="databaseToyota10Filter"><span>T10</span><select id="databaseToyota10Filter"><option value="all" ${databaseToyota10Filter==='all'?'selected':''}>Todos</option><option value="with" ${databaseToyota10Filter==='with'?'selected':''}>Con Toyota 10</option><option value="without" ${databaseToyota10Filter==='without'?'selected':''}>Sin Toyota 10</option></select></label>`;const branchOptions=USER_BRANCHES.filter(branch=>canViewOtherBranches()||branch===(currentApplicationUser()?.branch||'Santa Fe')),activeBranch=branchOptions.includes(databaseBranchFilter)?databaseBranchFilter:'all';databaseBranchFilter=activeBranch;const branchControl=`<label class="vor-filter-control compact branch-filter-control" for="databaseBranchFilter"><span>SUCURSAL</span><select id="databaseBranchFilter"><option value="all" ${activeBranch==='all'?'selected':''}>Todas</option>${branchOptions.map(branch=>`<option value="${escapeHtml(branch)}" ${activeBranch===branch?'selected':''}>${escapeHtml(branch)}</option>`).join('')}</select></label>`;return html.replace('<select class="filter-select" id="priorityFilter">',branchControl+controls+'<select class="filter-select" id="priorityFilter">')}finally{cases=allCases}}
const renderListWithMasterFilters=listView;
listView=function(){let html=renderListWithMasterFilters();if(currentView!=='parts'&&currentView!=='appointments')return html;const isParts=currentView==='parts',filterId=isParts?'partsToyota10Filter':'turnsToyota10Filter',mode=isParts?partsToyota10Filter:turnsToyota10Filter,controls=`<label class="vor-filter-control compact toyota10-filter-control" for="${filterId}"><span>T10</span><select id="${filterId}"><option value="all" ${mode==='all'?'selected':''}>Todos</option><option value="with" ${mode==='with'?'selected':''}>Con Toyota 10</option><option value="without" ${mode==='without'?'selected':''}>Sin Toyota 10</option></select></label>`,sortControl=isParts?`<label class="vor-filter-control compact operational-filter-control" for="partsSortSelect"><span>ORDENAR</span><select id="partsSortSelect"><option value="days-desc" ${partsSort==='days-desc'?'selected':''}>Más días primero</option><option value="days-asc" ${partsSort==='days-asc'?'selected':''}>Menos días primero</option><option value="date-desc" ${partsSort==='date-desc'?'selected':''}>Fecha más reciente</option><option value="date-asc" ${partsSort==='date-asc'?'selected':''}>Fecha más antigua</option><option value="order-asc" ${partsSort==='order-asc'?'selected':''}>NRO OR ascendente</option><option value="order-desc" ${partsSort==='order-desc'?'selected':''}>NRO OR descendente</option><option value="priority" ${partsSort==='priority'?'selected':''}>Prioridad</option><option value="client" ${partsSort==='client'?'selected':''}>Cliente A-Z</option></select></label>`:`<label class="vor-filter-control compact operational-filter-control" for="turnsSortSelect"><span>ORDENAR</span><select id="turnsSortSelect"><option value="days-desc" ${turnsSort==='days-desc'?'selected':''}>Días de arribo: mayor a menor</option><option value="days-asc" ${turnsSort==='days-asc'?'selected':''}>Días de arribo: menor a mayor</option><option value="priority" ${turnsSort==='priority'?'selected':''}>Prioridad</option><option value="arrival-desc" ${turnsSort==='arrival-desc'?'selected':''}>Ingreso más reciente</option><option value="arrival-asc" ${turnsSort==='arrival-asc'?'selected':''}>Ingreso más antiguo</option></select></label>`;if(isParts){const oldFilter=`<div class="segmented-filter" id="partsFilter"><button data-parts-view="all" class="${partsFilter==='all'?'active':''}">Todos</button><button data-parts-view="without-arrival" class="${partsFilter==='without-arrival'?'active':''}">Sin arribo</button><button data-parts-view="with-arrival" class="${partsFilter==='with-arrival'?'active':''}">Con arribo</button></div>`;const newFilter=`<label class="vor-filter-control compact operational-filter-control" for="partsFilterSelect"><span>ARRIBO</span><select id="partsFilterSelect"><option value="all" ${partsFilter==='all'?'selected':''}>Todos</option><option value="without-arrival" ${partsFilter==='without-arrival'?'selected':''}>Sin arribo</option><option value="with-arrival" ${partsFilter==='with-arrival'?'selected':''}>Con arribo</option></select></label>`;html=html.replace(oldFilter,newFilter)}else{const oldFilter=`<div class="segmented-filter" id="turnFilter"><button data-turn-view="all" class="${turnFilter==='all'?'active':''}">Todos</button><button data-turn-view="without" class="${turnFilter==='without'?'active':''}">Sin turno</button><button data-turn-view="with" class="${turnFilter==='with'?'active':''}">Con turno</button></div>`;const newFilter=`<label class="vor-filter-control compact operational-filter-control" for="turnFilterSelect"><span>TURNO</span><select id="turnFilterSelect"><option value="all" ${turnFilter==='all'?'selected':''}>Todos</option><option value="without" ${turnFilter==='without'?'selected':''}>Sin turno</option><option value="with" ${turnFilter==='with'?'selected':''}>Con turno</option></select></label>`;html=html.replace(oldFilter,newFilter)}return html.replace('<select class="filter-select" id="priorityFilter">',controls+sortControl+'<select class="filter-select" id="priorityFilter">')}
function bindRowActions(){document.querySelectorAll('.row-action').forEach(button=>button.onclick=()=>quickAction(button.dataset.order))}
function renderKeepingTablePosition(){
  const tablePositions=[...document.querySelectorAll('.table-wrap,.today-turn-list,.summary-range-body,.deposit-table-wrap')].map(element=>({left:element.scrollLeft,top:element.scrollTop}));
  document.activeElement?.blur?.();
  render();
  const restorePosition=()=>{
    document.scrollingElement?.scrollTo(0,0);
    page?.scrollTo(0,0);
    document.querySelectorAll('.table-wrap,.today-turn-list,.summary-range-body,.deposit-table-wrap').forEach((element,index)=>{
      const position=tablePositions[index];
      if(position)element.scrollTo(position.left,position.top);
    });
  };
  requestAnimationFrame(()=>requestAnimationFrame(restorePosition));
  setTimeout(restorePosition,80);
}
async function notifyPartsOrder(record){
  if(!NEW_CASE_NOTIFICATION_ENDPOINT)throw new Error('El servicio de correo no está configurado.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),NEW_CASE_NOTIFICATION_TIMEOUT);
  try{
    const response=await fetch(NEW_CASE_NOTIFICATION_ENDPOINT,{
      method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
      body:JSON.stringify({
        event:'parts_order_request',
        idempotencyKey:`pedido-repuesto-${record.order}-${record.partCode}`,
        recipients:partsOrderEmailSettings.to,
        cc:partsOrderEmailSettings.cc,
        requestedBy:currentApplicationUser()?.displayName||auditActor(),
        requestedAt:new Date().toISOString(),
        partOrderCase:{order:record.order,vin:record.vin,plate:record.plate,client:record.client,phone:record.phone,priority:record.priority,vor:record.vor,partCode:record.partCode,part:record.part,repairTime:record.repairTime,requestDate:record.requestDate,saleDate:record.saleDate,km:record.km,observations:record.observations,status:'PEDIDO',toyota10:record.toyota10Confirmed||isToyota10Case(record)}
      })
    });
    const responseBody=await response.text();let result={};
    try{result=responseBody?JSON.parse(responseBody):{}}catch{result={}}
    if(!response.ok||result?.ok===false)throw new Error(result?.error||responseBody?.trim()||`El servicio respondió HTTP ${response.status}.`);
    return result;
  }catch(error){if(error?.name==='AbortError')throw new Error('El envío superó el tiempo de espera. Volvé a intentarlo.');throw error}
  finally{clearTimeout(timeout)}
}
function openPartsOrderRequest(order){
  const record=cases.find(item=>item.order===order);if(!record)return;
  if(!String(record.partCode||'').trim()){toast(`${order}: cargá el código antes de pedir el repuesto`);return}
  if(record.partOrderRequestedAt){toast(`${order}: el pedido ya fue enviado el ${fmtDate(record.partOrderRequestedAt)}`);return}
  if(!partsOrderEmailSettings.to.length){toast('Configurá primero los destinatarios del pedido');currentView='settings';render();setTimeout(()=>document.querySelector('#partsOrderEmailSettingsForm textarea')?.focus(),0);return}
  document.querySelector('.parts-order-request-backdrop')?.remove();
  const backdrop=document.createElement('div');backdrop.className='parts-order-request-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','partsOrderRequestTitle');
  const addressChips=list=>list.map(address=>`<span>${escapeHtml(address)}</span>`).join('');
  backdrop.innerHTML=`<section class="parts-order-request-dialog"><header><div class="parts-order-request-mark" aria-hidden="true">RP</div><div><span>SOLICITUD POR CORREO</span><h2 id="partsOrderRequestTitle">Pedir repuesto</h2><p>Se enviará la ficha completa del caso con el código del repuesto.</p></div><button type="button" data-parts-order-close aria-label="Cerrar">×</button></header><div class="parts-order-request-case"><div><span>NRO OR</span><strong>${escapeHtml(record.order)}</strong></div><div><span>PATENTE</span><strong>${escapeHtml(record.plate||'-')}</strong></div><div><span>CÓDIGO</span><strong>${escapeHtml(record.partCode)}</strong></div><div><span>PRIORIDAD</span><strong>${escapeHtml(record.priority||'Normal')}</strong></div><div class="wide"><span>REPUESTO</span><strong>${escapeHtml(record.part||'Sin especificar')}</strong></div></div><section class="parts-order-recipients"><div><span>DESTINATARIOS</span><p>${addressChips(partsOrderEmailSettings.to)}</p></div>${partsOrderEmailSettings.cc.length?`<div><span>CON COPIA (CC)</span><p>${addressChips(partsOrderEmailSettings.cc)}</p></div>`:''}</section><div class="parts-order-request-impact"><strong>Al confirmar</strong><p>Se enviará la ficha técnica completa que antes acompañaba el alta del caso, ahora con el código de repuesto. El caso quedará registrado como <b>PEDIDO</b> y no podrá enviarse nuevamente.</p></div><p class="parts-order-request-error" role="alert" aria-live="assertive"></p><footer><button class="secondary-button" type="button" data-parts-order-close>Cancelar</button><button class="primary-button" type="button" data-parts-order-send>Enviar pedido</button></footer></section>`;
  document.body.appendChild(backdrop);const close=()=>backdrop.remove(),sendButton=backdrop.querySelector('[data-parts-order-send]'),errorBox=backdrop.querySelector('.parts-order-request-error');
  backdrop.querySelectorAll('[data-parts-order-close]').forEach(button=>button.onclick=close);backdrop.onclick=event=>{if(event.target===backdrop)close()};
  sendButton.onclick=async()=>{sendButton.disabled=true;sendButton.textContent='Enviando…';errorBox.textContent='';try{await notifyPartsOrder(record);record.partOrderRequestedAt=new Date().toISOString();record.partOrderRequestedBy=currentApplicationUser()?.displayName||auditActor();record.partOrderRequestedTo=[...partsOrderEmailSettings.to];record.partOrderRequestedCc=[...partsOrderEmailSettings.cc];save();close();toast(`${record.order}: pedido enviado correctamente`);renderKeepingTablePosition()}catch(error){console.error('[PEDIDO DE REPUESTO] No se pudo enviar',error);errorBox.textContent=`No se registró el pedido. ${error?.message||'No se pudo enviar el correo.'}`;sendButton.disabled=false;sendButton.textContent='Reintentar envío'}};
  sendButton.focus();
}
function updateArrival(order,arrived,date=''){if(!caseAvailableForAction(order)){renderKeepingTablePosition();return}const c=cases.find(item=>item.order===order);if(!c)return;if(arrived&&!String(c.partCode||'').trim()){toast(`${order}: cargá el código de repuesto antes de confirmar el arribo`);renderKeepingTablePosition();return}c.arrived=arrived;if(arrived){c.arrivalDate=date||c.arrivalDate||iso(0);delete c.missingSince;if(c.vor){if(!c.vorStatus)c.vorStatus='NO AVISADO';if(!c.manualStatus)c.status='SIN AVISAR';toast(`${order}: arribo confirmado`)}else{const group=plateCases(c),hasRelated=relatedCasesNotice(c).length>0;group.forEach(item=>{if(!['DADO DE BAJA','REALIZADO'].includes(String(item.status||'').toUpperCase())){item.status=automaticStatus(item);delete item.manualStatus}});toast(`${order}: arribo confirmado`);if(hasRelated)setTimeout(()=>showRelatedArrivalNotice(c),0)}}else{c.arrivalDate='';if(c.vor)delete c.vorStatus;if(c.appointmentDate||c.time){c.missingSince=c.missingSince||iso(0);if(!c.manualStatus)c.status='TURNO SIN REPUESTO';toast(`${order} pasó a Turnos sin repuestos`)}else if(!c.vor){const group=plateCases(c);group.forEach(item=>{if(!['DADO DE BAJA','REALIZADO'].includes(String(item.status||'').toUpperCase())){item.status=automaticStatus(item);delete item.manualStatus}});toast(`${order}: arribo pendiente`)}else{if(!c.manualStatus)c.status='PENDIENTE DE REPUESTO';toast(`${order}: arribo pendiente`)}}save();renderKeepingTablePosition()}
function bindPartsControls(){const openPartSheet=async order=>{if(!order)return;if(selectedPartCommentOrder!==order&&!(await acquireCaseLock(order,'Repuestos')))return;selectedPartCommentOrder=order;renderKeepingTablePosition();setTimeout(()=>document.querySelector('[data-close-part-comment]')?.focus(),0)};document.querySelectorAll('[data-part-request]:not(:disabled)').forEach(button=>button.onclick=()=>openPartsOrderRequest(button.dataset.partRequest));document.querySelectorAll('[data-part-code-form]').forEach(form=>form.onsubmit=e=>{e.preventDefault();const c=cases.find(item=>item.order===form.dataset.partCodeForm),input=form.elements.partCode;if(!c||!input)return;const code=input.value.trim().toUpperCase();if(!code){input.setCustomValidity('Ingresá el código de repuesto.');input.reportValidity();return}if(c.partOrderRequestedAt&&code!==c.partCode&&!confirm('Este repuesto ya fue pedido. Cambiar el código reabrirá el envío para solicitar nuevamente. ¿Continuar?'))return;input.setCustomValidity('');if(c.partOrderRequestedAt&&code!==c.partCode){delete c.partOrderRequestedAt;delete c.partOrderRequestedBy;delete c.partOrderRequestedTo;delete c.partOrderRequestedCc}c.partCode=code;c.updatedAt=new Date().toISOString();save();toast(`Código ${code} guardado en ${c.order}`);renderKeepingTablePosition()});document.querySelectorAll('[data-part-code-form] input').forEach(input=>input.oninput=()=>input.setCustomValidity(''));document.querySelectorAll('[data-part-order]').forEach(row=>{row.onclick=e=>{if(e.target.closest('input,label,button,select,textarea'))return;openPartSheet(row.dataset.partOrder)};row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPartSheet(row.dataset.partOrder)}}});document.querySelectorAll('[data-part-arrival]').forEach(input=>input.onchange=()=>{input.blur();updateArrival(input.dataset.partArrival,input.checked)});document.querySelectorAll('[data-part-date]').forEach(input=>input.onchange=()=>updateArrival(input.dataset.partDate,Boolean(input.value),input.value));document.querySelectorAll('[data-close-part-comment]').forEach(button=>button.onclick=()=>{releaseCaseLock(selectedPartCommentOrder);selectedPartCommentOrder='';renderKeepingTablePosition()});const backdrop=document.querySelector('.part-comment-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop){releaseCaseLock(selectedPartCommentOrder);selectedPartCommentOrder='';renderKeepingTablePosition()}}}
function normalizeTime(value){const raw=value.trim();let hour,minute;if(/^\d{1,2}$/.test(raw)){hour=Number(raw);minute=0}else if(/^\d{3,4}$/.test(raw)){const padded=raw.padStart(4,'0');hour=Number(padded.slice(0,2));minute=Number(padded.slice(2))}else if(/^\d{1,2}:\d{1,2}$/.test(raw)){const parts=raw.split(':');hour=Number(parts[0]);minute=parts[1].length===1?Number(parts[1])*10:Number(parts[1])}else{return null}if(hour>23||minute>59)return null;return `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`}
function bindTurnControls(){document.querySelectorAll('[data-turn-first]').forEach(input=>input.onchange=()=>{const c=cases.find(item=>item.order===input.dataset.turnFirst);if(!c)return;plateCases(c).forEach(item=>item.firstConversation=input.value);save();toast(`Primera conversación guardada para ${c.order}`)});document.querySelectorAll('[data-turn-comment]').forEach(input=>input.onchange=()=>{const c=cases.find(item=>item.order===input.dataset.turnComment);if(!c)return;plateCases(c).forEach(item=>item.comment=input.value.trim());save();toast(`Comentario guardado para ${c.order}`)});document.querySelectorAll('[data-turn-appointment-observations]').forEach(input=>input.onchange=()=>{const c=cases.find(item=>item.order===input.dataset.turnAppointmentObservations);if(!c)return;plateCases(c).forEach(item=>item.appointmentObservations=input.value.trim());save();toast(`Observaciones de cita guardadas para ${c.order}`)});document.querySelectorAll('[data-turn-date]').forEach(input=>input.onchange=()=>{const c=cases.find(item=>item.order===input.dataset.turnDate);if(!c)return;plateCases(c).forEach(item=>{item.appointmentDate=input.value;item.scheduled=false});save();toast(`Fecha preparada para ${c.order}. Falta confirmar PROGRAMADO`)});document.querySelectorAll('[data-turn-time]').forEach(input=>input.onchange=()=>{const c=cases.find(item=>item.order===input.dataset.turnTime);if(!c)return;const normalized=normalizeTime(input.value);if(!normalized){input.value=c.time||'';toast('Hora inválida. Usá un valor entre 00:00 y 23:59');return}plateCases(c).forEach(item=>{item.time=normalized;item.scheduled=false});input.value=normalized;save();toast(`Hora preparada para ${c.order}. Falta confirmar PROGRAMADO`)});document.querySelectorAll('[data-turn-programmed]').forEach(input=>input.onchange=()=>{const c=cases.find(item=>item.order===input.dataset.turnProgrammed);if(!c)return;if(input.checked){if(!c.appointmentDate||!c.time){input.checked=false;toast('Completá fecha y hora antes de programar');return}input.checked=false;const linked=samePlateCases(c);if(linked.length>1){showRelatedProgrammingDecision(c);return}applyTurnProgramming(c,[c])}else{plateCases(c).forEach(item=>{item.scheduled=false;item.appointmentDate='';item.time='';item.status='PENDIENTE DE TURNO'});save();toast(`Programación eliminada para ${c.order}`);render()}})}
function automaticStatus(c){return caseOperationalStatus(c)}
function refreshAutomaticStates({persist=true}={}){
  const changed=[];
  cases.forEach(c=>{
    if(c.vor||['DADO DE BAJA','REALIZADO'].includes(String(c.status||'').toUpperCase()))return;
    const next=automaticStatus(c);
    if(c.status===next)return;
    c.status=next;
    delete c.manualStatus;
    changed.push(c.order);
  });
  if(persist&&changed.length)save();
  return changed;
}
function showCaseCancellationDialog(c){
  document.querySelector('.case-cancellation-backdrop')?.remove();
  const backdrop=document.createElement('div');
  backdrop.className='case-cancellation-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','caseCancellationTitle');
  backdrop.innerHTML=`<section class="case-cancellation-dialog">
    <header><div class="case-cancellation-mark" aria-hidden="true">!</div><div><span>CONTROL DE EXCEPCIÓN</span><h2 id="caseCancellationTitle">Dar de baja el caso</h2><p>Registrá el motivo para cerrar la orden fuera del flujo normal.</p></div><button type="button" data-cancel-cancellation aria-label="Cerrar">×</button></header>
    <section class="case-cancellation-case"><div><span>NRO OR</span><strong>${escapeHtml(c.order)}</strong></div><div><span>PATENTE</span><strong>${escapeHtml(c.plate||'-')}</strong></div><div><span>CLIENTE</span><strong>${escapeHtml(c.client||'-')}</strong></div><div><span>ESTADO ACTUAL</span><strong>${escapeHtml(c.status||'SIN ESTADO')}</strong></div></section>
    <div class="case-cancellation-impact"><strong>Resultado de esta acción</strong><ul><li>El caso pasará a la sección Dados de baja.</li><li>Dejará de aparecer en las vistas operativas activas.</li><li>El motivo, usuario y fecha quedarán registrados en el historial.</li></ul></div>
    <label class="case-cancellation-reason"><span>MOTIVO DE BAJA <b>OBLIGATORIO</b></span><textarea rows="4" maxlength="500" placeholder="Describí de forma clara por qué se da de baja este caso"></textarea><div><small>Este texto será visible en la ficha y en Dados de baja.</small><output>0 / 500</output></div><em role="alert"></em></label>
    <footer><button class="secondary-button" type="button" data-cancel-cancellation>Cancelar</button><button class="case-cancellation-confirm" type="button" disabled>Confirmar baja</button></footer>
  </section>`;
  document.body.appendChild(backdrop);
  const textarea=backdrop.querySelector('textarea'),confirmButton=backdrop.querySelector('.case-cancellation-confirm'),counter=backdrop.querySelector('output'),error=backdrop.querySelector('em');
  const close=()=>{document.removeEventListener('keydown',onKeydown);backdrop.remove()};
  const onKeydown=event=>{if(event.key==='Escape')close()};
  textarea.oninput=()=>{const length=textarea.value.length,valid=Boolean(textarea.value.trim());counter.textContent=`${length} / 500`;confirmButton.disabled=!valid;if(valid)error.textContent=''};
  confirmButton.onclick=()=>{const reason=textarea.value.trim();if(!reason){error.textContent='Ingresá un motivo antes de confirmar la baja.';textarea.focus();return}c.status='DADO DE BAJA';c.manualStatus=true;c.cancelledAt=iso(0);c.cancelReason=reason;c.releasedStatus='NO AVISADO';close();save();toast(`${c.order}: DADO DE BAJA`);render()};
  backdrop.querySelectorAll('[data-cancel-cancellation]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  document.addEventListener('keydown',onKeydown);
  textarea.focus();
}
function showCaseCompletionDialog(c){
  document.querySelector('.case-completion-backdrop')?.remove();
  const now=new Date(),defaultDate=c.appointmentDate||iso(0),defaultTime=c.time||`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const backdrop=document.createElement('div');
  backdrop.className='case-completion-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','caseCompletionTitle');
  backdrop.innerHTML=`<section class="case-completion-dialog">
    <header><div class="case-completion-mark" aria-hidden="true">✓</div><div><span>CIERRE OPERATIVO</span><h2 id="caseCompletionTitle">Confirmar trabajo realizado</h2><p>Indicá la fecha y la hora reales en que se realizó el turno.</p></div><button type="button" data-cancel-completion aria-label="Cerrar">×</button></header>
    <section class="case-completion-case"><div><span>NRO OR</span><strong>${escapeHtml(c.order)}</strong></div><div><span>PATENTE</span><strong>${escapeHtml(c.plate||'-')}</strong></div><div><span>CLIENTE</span><strong>${escapeHtml(c.client||'-')}</strong></div><div><span>ESTADO ACTUAL</span><strong>${escapeHtml(c.status||'SIN ESTADO')}</strong></div></section>
    <div class="case-completion-fields"><label><span>FECHA DEL TURNO <b>OBLIGATORIA</b></span><input type="date" name="completionDate" value="${escapeHtml(defaultDate)}" required></label><label><span>HORA DEL TURNO <b>OBLIGATORIA</b></span><input type="time" name="completionTime" value="${escapeHtml(defaultTime)}" required></label></div>
    <div class="case-completion-impact"><strong>Resultado de esta acción</strong><p>El caso quedará cerrado como realizado. Si el repuesto todavía no figura arribado, se confirmará automáticamente con la fecha del turno. La fecha, la hora y el responsable quedarán registrados en la trazabilidad.</p></div>
    <p class="case-completion-error" role="alert"></p>
    <footer><button class="secondary-button" type="button" data-cancel-completion>Cancelar</button><button class="case-completion-confirm" type="button">Confirmar realizado</button></footer>
  </section>`;
  document.body.appendChild(backdrop);
  const dateInput=backdrop.querySelector('[name="completionDate"]'),timeInput=backdrop.querySelector('[name="completionTime"]'),error=backdrop.querySelector('.case-completion-error');
  const close=()=>{document.removeEventListener('keydown',onKeydown);backdrop.remove()};
  const onKeydown=event=>{if(event.key==='Escape')close()};
  backdrop.querySelector('.case-completion-confirm').onclick=()=>{const date=dateInput.value,time=normalizeTime(timeInput.value||'');if(!date||!time){error.textContent='Completá una fecha y una hora válidas para confirmar el trabajo.';(!date?dateInput:timeInput).focus();return}if(!c.arrived){c.arrived=true;c.arrivalDate=date}else if(!c.arrivalDate)c.arrivalDate=date;c.status='REALIZADO';c.manualStatus=true;c.appointmentDate=date;c.time=time;c.executionDate=date;c.executionTime=time;c.executionStatus='EJECUTADO';c.scheduled=true;if(c.vor)c.vorStatus='REALIZADO';close();save();toast(`${c.order}: REALIZADO el ${fmtDate(date)} a las ${time}`);render()};
  backdrop.querySelectorAll('[data-cancel-completion]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  document.addEventListener('keydown',onKeydown);
  dateInput.focus();
}
function applyResolution(order,resolution){const c=cases.find(item=>item.order===order);if(!c)return;if(resolution==='REALIZADO'){showCaseCompletionDialog(c);return}else if(resolution==='DADO DE BAJA'){showCaseCancellationDialog(c);return}else if(resolution==='REPROGRAMAR'){c.status='PENDIENTE DE TURNO';c.manualStatus=false;c.appointmentDate='';c.time='';c.scheduled=false;delete c.missingSince}else{c.manualStatus=false;c.status=automaticStatus(c);delete c.cancelledAt;delete c.cancelReason;delete c.releasedStatus;if(c.vor&&c.status==='SIN AVISAR')c.vorStatus='NO AVISADO'}save();toast(`${c.order}: ${resolution==='RESTABLECER'?'circuito restablecido':resolution}`);render()}
function resolveTodayAppointment(order,result){const c=cases.find(item=>item.order===order);if(!c)return;const group=plateCases(c),originalTime=c.time||'';group.forEach(item=>{item.executionDate=selectedExecutionDate;item.executionTime=originalTime;item.executionStatus=result;item.manualStatus=false;if(result==='EJECUTADO'){item.status='REALIZADO';item.scheduled=true}else{item.executionHistory=Array.isArray(item.executionHistory)?item.executionHistory:[];if(!item.executionHistory.some(entry=>entry.date===selectedExecutionDate&&entry.status==='NO EJECUTADO'))item.executionHistory.push({date:selectedExecutionDate,time:originalTime,status:'NO EJECUTADO'});item.status='PENDIENTE DE TURNO';item.scheduled=false;item.appointmentDate='';item.time='';delete item.missingSince}});toast(result==='EJECUTADO'?`${c.plate}: ${group.length} orden(es) realizadas`:`${c.plate}: turno no ejecutado, grupo enviado a reprogramar`);save();render()}
function confirmExecutionHistoryReview(order,result){return new Promise(resolve=>{const c=cases.find(item=>item.order===order);if(!c){resolve(false);return}document.querySelector('.execution-review-backdrop')?.remove();const executed=result==='EJECUTADO',backdrop=document.createElement('div');backdrop.className='toyota10-review-backdrop execution-review-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','executionReviewTitle');backdrop.innerHTML=`<section class="toyota10-review-dialog execution-review-dialog"><header><div class="toyota10-reminder-heading"><span class="toyota10-caution-icon" aria-hidden="true"><img src="assets/caution-triangle.png" alt=""></span><div><span>VALIDACIÓN OPERATIVA</span><h2 id="executionReviewTitle">Confirmar ${executed?'turno ejecutado':'turno no ejecutado'}</h2><p>Antes de cambiar el resultado, verificá el historial completo del caso.</p></div></div><button type="button" data-execution-review-cancel aria-label="Cerrar">×</button></header><div class="toyota10-review-summary"><div><span>NRO OR</span><strong>${escapeHtml(c.order)}</strong></div><div><span>PATENTE</span><strong>${escapeHtml(c.plate)}</strong></div><div><span>RESULTADO</span><strong>${executed?'Ejecutado':'No ejecutado'}</strong></div></div><fieldset><legend>Control obligatorio</legend><label><input type="checkbox" data-execution-history-check><span><strong>Revisé el historial del caso</strong><small>Confirmo que consulté los antecedentes, observaciones y movimientos antes de registrar el resultado.</small></span></label></fieldset><p class="toyota10-review-error" role="alert"></p><footer><button class="secondary-button" type="button" data-execution-review-cancel>Cancelar</button><button class="primary-button" type="button" data-execution-review-confirm disabled>Confirmar resultado</button></footer></section>`;document.body.appendChild(backdrop);const check=backdrop.querySelector('[data-execution-history-check]'),confirmButton=backdrop.querySelector('[data-execution-review-confirm]'),close=value=>{backdrop.remove();resolve(value)};check.onchange=()=>{confirmButton.disabled=!check.checked};backdrop.querySelectorAll('[data-execution-review-cancel]').forEach(button=>button.onclick=()=>close(false));confirmButton.onclick=()=>{if(!check.checked){backdrop.querySelector('.toyota10-review-error').textContent='Marcá la revisión del historial para continuar.';return}close(true)};backdrop.onclick=event=>{if(event.target===backdrop)close(false)};check.focus()})}
function deleteCase(order){if(amiunRecoveryMode){toast('Modo recuperación: eliminar casos está bloqueado hasta restablecer la sincronización');return}const index=cases.findIndex(c=>c.order===order);if(index<0)return;if(!caseAvailableForAction(order))return;if(!confirm(`¿Eliminar definitivamente el caso ${order}? El caso no podrá recuperarse, pero la eliminación quedará registrada en Historial.`))return;recordDeletedCaseAudit(cases[index]);releaseCaseLock(order);cases.splice(index,1);if(managedOrder===order)managedOrder='';if(selectedCalendarOrder===order)selectedCalendarOrder='';if(selectedTurnOrder===order)selectedTurnOrder='';if(selectedMissingOrder===order)selectedMissingOrder='';if(selectedPartCommentOrder===order)selectedPartCommentOrder='';selectedDatabaseOrder='';save();deleteCaseFromSupabase(order);toast(`${order}: caso eliminado y registrado en Historial`);render()}
function showManualRegistryDeleteDialog(key){
  if(!key?.startsWith('manual:'))return;
  const id=key.slice(7),item=activeManualPartsRegistry().find(record=>record.id===id);
  if(!item)return;
  document.querySelector('.registry-delete-backdrop')?.remove();
  const order=item.order||'Sin N.º de orden',backdrop=document.createElement('div');
  backdrop.className='registry-delete-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','registryDeleteTitle');
  backdrop.innerHTML=`<section class="registry-delete-dialog"><header><span aria-hidden="true">!</span><div><small>REGISTRO SIN TURNO</small><h2 id="registryDeleteTitle">Eliminar registro manual</h2><p>Esta acción quitará el registro de todas las computadoras.</p></div><button type="button" data-registry-delete-close aria-label="Cerrar">×</button></header><dl><div><dt>N.º DE ORDEN</dt><dd>${escapeHtml(order)}</dd></div><div><dt>PATENTE</dt><dd>${escapeHtml(item.plate||'-')}</dd></div><div><dt>REPUESTO</dt><dd>${escapeHtml(item.part||'Sin especificar')}</dd></div></dl><div class="registry-delete-warning"><strong>Confirmación requerida</strong><p>Solo se eliminará este registro manual. Los casos y registros vinculados a turnos no serán modificados.</p></div><footer><button type="button" class="secondary-button" data-registry-delete-close>Cancelar</button><button type="button" class="registry-delete-confirm" data-registry-delete-confirm>Eliminar registro</button></footer></section>`;
  document.body.appendChild(backdrop);
  const close=()=>backdrop.remove();
  backdrop.querySelectorAll('[data-registry-delete-close]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  backdrop.querySelector('[data-registry-delete-confirm]').onclick=()=>{
    const deletedAt=new Date().toISOString();
    Object.assign(item,{deletedAt,updatedAt:deletedAt});
    releaseRegistryLock(key);
    selectedRegistryKey='';
    saveRegistry();
    close();
    toast(`${order}: registro manual eliminado`);
    render();
  };
  backdrop.querySelector('[data-registry-delete-confirm]')?.focus();
}
function clearAllData(){
  if(amiunRecoveryMode){toast('Modo recuperación: eliminar datos está bloqueado hasta restablecer la sincronización');return}
  if(!cases.length&&!activeManualPartsRegistry().length){toast('No hay datos para eliminar');return}
  document.querySelector('.clear-all-data-backdrop')?.remove();
  const caseCount=cases.length,registryCount=activeManualPartsRegistry().length;
  const backdrop=document.createElement('div');
  backdrop.className='case-cancellation-backdrop clear-all-data-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','clearAllDataTitle');
  backdrop.innerHTML=`<section class="case-cancellation-dialog clear-all-data-dialog"><header><div class="case-cancellation-mark" aria-hidden="true">!</div><div><span>ACCIÓN IRREVERSIBLE</span><h2 id="clearAllDataTitle">Eliminar todos los datos</h2><p>Esta acción vaciará la información operativa de la plataforma.</p></div><button type="button" data-clear-all-close aria-label="Cerrar">×</button></header><section class="case-cancellation-case"><div><span>CASOS OPERATIVOS</span><strong>${caseCount}</strong></div><div><span>REGISTROS MANUALES</span><strong>${registryCount}</strong></div><div><span>BASE COMPARTIDA</span><strong>${amiunSupabaseClient?'También se vaciará':'No conectada en local'}</strong></div><div><span>HISTORIAL</span><strong>Se conserva</strong></div></section><div class="case-cancellation-impact"><strong>Antes de continuar</strong><ul><li>Los casos y registros manuales no podrán recuperarse desde la aplicación.</li><li>La evidencia de eliminación quedará disponible en Historial.</li><li>Los datos ficticios locales no volverán a cargarse al actualizar.</li></ul></div><label class="case-cancellation-reason clear-all-confirmation"><span>ESCRIBÍ BORRAR PARA CONFIRMAR <b>OBLIGATORIO</b></span><input type="text" name="clearConfirmation" autocomplete="off" spellcheck="false" placeholder="BORRAR"><em role="alert"></em></label><footer><button class="secondary-button" type="button" data-clear-all-close>Cancelar</button><button class="case-cancellation-confirm" type="button" data-clear-all-confirm disabled>Eliminar definitivamente</button></footer></section>`;
  document.body.appendChild(backdrop);
  const input=backdrop.querySelector('[name="clearConfirmation"]');
  const confirmButton=backdrop.querySelector('[data-clear-all-confirm]');
  const error=backdrop.querySelector('.clear-all-confirmation em');
  const close=()=>backdrop.remove();
  const update=()=>{
    const valid=input.value.trim().toUpperCase()==='BORRAR';
    confirmButton.disabled=!valid;
    error.textContent=input.value&&!valid?'La palabra de confirmación debe ser BORRAR.':'';
  };
  input.oninput=update;
  backdrop.querySelectorAll('[data-clear-all-close]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  backdrop.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();close()}};
  confirmButton.onclick=async()=>{
    if(input.value.trim().toUpperCase()!=='BORRAR'){update();input.focus();return}
    confirmButton.disabled=true;
    confirmButton.textContent='Eliminando…';
    error.textContent='';
    const remoteCleared=!amiunSupabaseClient||await clearCasesInSupabase();
    if(!remoteCleared){
      error.textContent='No se pudo vaciar la base compartida. No se eliminó ningún dato local.';
      confirmButton.disabled=false;
      confirmButton.textContent='Reintentar eliminación';
      return;
    }
    cases.forEach(record=>recordDeletedCaseAudit(record,'Eliminación masiva'));
    releaseCaseLock();
    cases=[];
    manualPartsRegistry=[];
    managedOrder='';
    selectedCalendarOrder='';
    selectedDatabaseOrder='';
    selectedTurnOrder='';
    selectedMissingOrder='';
    selectedPartCommentOrder='';
    selectedRegistryKey='';
    editingDatabaseOrder='';
    query='';
    if(AMIUN_LOCAL_DEMO_MODE)localStorage.setItem(AMIUN_LOCAL_DEMO_CLEARED_KEY,'1');
    save();
    saveRegistry(true);
    close();
    toast('Datos eliminados; la evidencia quedó registrada en Historial');
    render();
  };
  input.focus();
}
async function updateDatabaseCase(order,form){
  const c=cases.find(item=>item.order===order);
  if(!c)return;
  const fd=new FormData(form),previous={...c,auditHistory:Array.isArray(c.auditHistory)?[...c.auditHistory]:[]};
  const nextOrder=String(fd.get('order')||'').trim().toUpperCase();
  if(!nextOrder){toast('Ingresá el NRO OR del caso');form.elements.order.focus();return}
  if(nextOrder!==order&&cases.some(item=>item!==c&&String(item.order).trim().toUpperCase()===nextOrder)){toast(`Ya existe un caso con el NRO OR ${nextOrder}`);form.elements.order.focus();return}
  const foreignLock=nextOrder!==order?caseLockFor(nextOrder):null;
  if(foreignLock&&foreignLock.tabId!==caseLockTabId){showCaseLockNotice(nextOrder,foreignLock);return}
  c.order=nextOrder;
  c.vin=String(fd.get('vin')||'').trim().toUpperCase();
  c.plate=fd.get('plate').trim().toUpperCase();
  c.client=fd.get('client').trim();
  c.phone=fd.get('phone').trim();
  c.priority=fd.get('priority');
  c.saleDate=fd.get('saleDate');
  c.km=fd.get('km').trim();
  c.vor=fd.get('vor')==='on';
  c.part=fd.get('part').trim()||'Sin especificar';
  c.repairTime=fd.get('repairTime').trim();
  c.observations=fd.get('observations').trim();
  c.updatedAt=iso(0);
  if(!c.manualStatus)c.status=automaticStatus(c);
  if(nextOrder!==order){
    const changes=Object.keys(c).filter(key=>!AUDIT_IGNORED_FIELDS.has(key)&&JSON.stringify(previous[key])!==JSON.stringify(c[key])).map(key=>({key,field:AUDIT_FIELD_LABELS[key]||key,before:auditValue(previous[key]),after:auditValue(c[key])}));
    c.auditHistory=[...previous.auditHistory,{id:`AUD-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:new Date().toISOString(),user:auditActor(),action:'Datos del caso actualizados',changes:manualAuditChanges(changes)}];
    const renamed=await renameCaseInSupabase(order,c);
    if(!renamed){Object.keys(c).forEach(key=>delete c[key]);Object.assign(c,previous);toast(`No se pudo cambiar el NRO OR ${order}`);renderKeepingTablePosition();return}
    localStorage.setItem('warranty-cases',JSON.stringify(cases));
    releaseCaseLock(order);
    selectedDatabaseOrder=nextOrder;
    await acquireCaseLock(nextOrder,'Base de datos');
  }else save();
  editingDatabaseOrder='';
  toast(`${nextOrder}: datos actualizados`);
  renderKeepingTablePosition();
}
function injectSeparateCoordinationDetails(){document.querySelectorAll('[data-turn-order]').forEach(row=>{const c=cases.find(item=>item.order===row.dataset.turnOrder),cell=row.querySelector('.plate-cell');if(!c?.separateScheduleReason||!cell||cell.querySelector('.separate-marker'))return;cell.insertAdjacentHTML('beforeend','<span class="separate-marker" title="Esta orden fue programada por separado">SEPARADO</span>')});const turnCase=selectedTurnOrder?branchVisibleCases(cases).find(item=>item.order===selectedTurnOrder):null,turnSheet=document.querySelector('.turn-sheet');if(turnCase?.separateScheduleReason&&turnSheet){const editSection=turnSheet.querySelector('.turn-edit-section');if(editSection&&!turnSheet.querySelector('.coordination-decision-section')){const section=document.createElement('section');section.className='case-section coordination-decision-section';section.innerHTML=`<header><span>02</span><div><h3>Decisión de coordinación</h3><p>Excepción registrada para esta patente</p></div></header><div class="coordination-decision-content"><div><span>TIPO DE DECISIÓN</span><strong>Programación separada</strong></div><div><span>FECHA DE DECISIÓN</span><strong>${fmtDate(turnCase.separateScheduleAt)}</strong></div><div class="wide"><span>MOTIVO</span><strong>${escapeHtml(turnCase.separateScheduleReason)}</strong></div></div>`;editSection.parentNode.insertBefore(section,editSection);const number=editSection.querySelector('header > span');if(number)number.textContent='03'}}const databaseCase=selectedDatabaseOrder?branchVisibleCases(cases).find(item=>item.order===selectedDatabaseOrder):null,databaseSheet=document.querySelector('.case-sheet:not(.turn-sheet)');if(databaseCase?.separateScheduleReason&&databaseSheet){const coordinationGrid=databaseSheet.querySelector('.coordination-section .case-detail-grid');if(coordinationGrid&&!coordinationGrid.querySelector('.separate-reason-detail'))coordinationGrid.insertAdjacentHTML('beforeend',`<div class="case-detail separate-reason-detail"><dt>Tipo de coordinación</dt><dd>Programación separada</dd></div><div class="case-detail separate-reason-detail"><dt>Fecha de decisión</dt><dd>${fmtDate(databaseCase.separateScheduleAt)}</dd></div><div class="case-detail wide separate-reason-detail"><dt>Motivo de programación separada</dt><dd>${escapeHtml(databaseCase.separateScheduleReason)}</dd></div>`);const timeline=databaseSheet.querySelector('.trace-section .case-timeline');if(timeline&&!timeline.querySelector('.separate-timeline-event'))timeline.insertAdjacentHTML('beforeend',`<li class="complete separate-timeline-event"><i aria-hidden="true"></i><div><strong>Programación separada</strong><span>${fmtDate(databaseCase.separateScheduleAt)} · ${escapeHtml(databaseCase.separateScheduleReason)}</span></div></li>`)}}
function bindSpecialViews(){document.querySelectorAll('[data-vor-notify]').forEach(button=>button.onclick=()=>openVorWorkshopNotification(button.dataset.vorNotify));document.querySelectorAll('[data-released-report]').forEach(button=>button.onclick=openReleasedPartsReport);document.querySelectorAll('[data-released-notify]').forEach(button=>button.onclick=openReleasedPartsNotification);document.querySelectorAll('[data-vor-status]').forEach(select=>select.onchange=()=>{const c=cases.find(item=>item.order===select.dataset.vorStatus);if(!c)return;c.vorStatus=select.value;if(select.value==='REALIZADO'){const now=new Date();c.status='REALIZADO';c.manualStatus=true;c.appointmentDate=c.appointmentDate||iso(0);c.time=c.time||`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;c.scheduled=true}else{c.status=select.value==='AVISADO'?'AVISADO':'SIN AVISAR';c.manualStatus=false;c.scheduled=false}save();toast(`Estado VOR actualizado para ${c.order}: ${select.value}`);render()});document.querySelectorAll('[data-released-status]').forEach(select=>select.onchange=()=>{const c=cases.find(item=>item.order===select.dataset.releasedStatus);if(!c)return;c.releasedStatus=select.value==='AVISADO'?'AVISADO':'NO AVISADO';save();toast(`${c.order}: ${c.releasedStatus}`);renderKeepingTablePosition()});document.querySelectorAll('[data-missing-reason]').forEach(input=>input.onchange=()=>{const c=cases.find(item=>item.order===input.dataset.missingReason);if(!c)return;c.missingReason=input.value.trim();save();toast(`Motivo guardado para ${c.order}`)});document.querySelectorAll('[data-missing-arrival]').forEach(input=>input.onchange=()=>{if(input.checked)updateArrival(input.dataset.missingArrival,true)});const find=document.getElementById('managementFind');if(find)find.onclick=()=>{const value=document.getElementById('managementQuery').value.trim().toLowerCase();const found=branchVisibleCases(cases).find(c=>c.order.toLowerCase()===value||c.plate.toLowerCase()===value);if(!found){document.getElementById('managementError').textContent='No encontramos un caso con ese NRO OR o patente.';return}managedOrder=found.order;render()};document.querySelectorAll('[data-resolution]').forEach(button=>button.onclick=()=>applyResolution(button.dataset.order,button.dataset.resolution));const managementInput=document.getElementById('managementQuery');if(managementInput)managementInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();find.click()}}}
function bindDatabaseSheet(){const open=async row=>{const order=row.dataset.databaseOrder;if(!(await acquireCaseLock(order,'Base de datos')))return;selectedDatabaseOrder=order;editingDatabaseOrder='';renderKeepingTablePosition();setTimeout(()=>document.querySelector('[data-close-sheet]')?.focus(),0)};document.querySelectorAll('[data-database-order]').forEach(row=>{row.onclick=()=>open(row);row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(row)}}});const close=document.querySelector('[data-close-sheet]');if(close)close.onclick=()=>{releaseCaseLock(selectedDatabaseOrder);selectedDatabaseOrder='';editingDatabaseOrder='';renderKeepingTablePosition()};const backdrop=document.querySelector('.case-sheet-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop){releaseCaseLock(selectedDatabaseOrder);selectedDatabaseOrder='';editingDatabaseOrder='';renderKeepingTablePosition()}};document.querySelectorAll('[data-case-pdf]').forEach(button=>button.onclick=()=>printDatabaseCase(button.dataset.casePdf));document.querySelectorAll('[data-delete-case]').forEach(button=>button.onclick=()=>deleteCase(button.dataset.deleteCase));document.querySelectorAll('[data-db-edit-open]').forEach(button=>button.onclick=()=>{editingDatabaseOrder=button.dataset.dbEditOpen;renderKeepingTablePosition()});document.querySelectorAll('[data-db-edit-cancel]').forEach(button=>button.onclick=()=>{editingDatabaseOrder='';renderKeepingTablePosition()});document.querySelectorAll('[data-db-edit-form]').forEach(form=>form.onsubmit=e=>{e.preventDefault();updateDatabaseCase(form.dataset.dbEditForm,form)})}
function bindTurnSheet(){const open=async row=>{const order=row.dataset.turnOrder;if(!(await acquireCaseLock(order,'Turnos')))return;selectedTurnOrder=order;renderKeepingTablePosition();setTimeout(()=>document.querySelector('[data-close-turn-sheet]')?.focus(),0)};document.querySelectorAll('[data-related-turns]').forEach(button=>button.onclick=e=>{e.stopPropagation();const c=cases.find(item=>item.order===button.dataset.relatedTurns);if(c)showRelatedCasesOverview(c)});document.querySelectorAll('[data-turn-order]').forEach(row=>{row.onclick=()=>open(row);row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(row)}}});const close=document.querySelector('[data-close-turn-sheet]');if(close)close.onclick=()=>{releaseCaseLock(selectedTurnOrder);selectedTurnOrder='';renderKeepingTablePosition()};const backdrop=document.querySelector('.turn-sheet-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop){releaseCaseLock(selectedTurnOrder);selectedTurnOrder='';renderKeepingTablePosition()}}}
function bindMissingSheet(){const open=async row=>{const order=row.dataset.missingOrder;if(!(await acquireCaseLock(order,'Turnos sin repuestos')))return;selectedMissingOrder=order;renderKeepingTablePosition();setTimeout(()=>document.querySelector('[data-close-missing-sheet]')?.focus(),0)};document.querySelectorAll('[data-missing-order]').forEach(row=>{row.onclick=e=>{if(e.target.closest('input,label,button,select,textarea'))return;open(row)};row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(row)}}});const close=document.querySelector('[data-close-missing-sheet]');if(close)close.onclick=()=>{releaseCaseLock(selectedMissingOrder);selectedMissingOrder='';renderKeepingTablePosition()};const backdrop=document.querySelector('.missing-sheet-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop){releaseCaseLock(selectedMissingOrder);selectedMissingOrder='';renderKeepingTablePosition()}}}
function bindTableRowSelection(){document.querySelectorAll('.data-table tbody tr').forEach(row=>{row.addEventListener('click',()=>{const table=row.closest('.data-table');if(!table)return;table.querySelectorAll('tr.selected-row').forEach(item=>item.classList.remove('selected-row'));row.classList.add('selected-row')});row.addEventListener('focusin',()=>{const table=row.closest('.data-table');if(!table)return;table.querySelectorAll('tr.selected-row').forEach(item=>item.classList.remove('selected-row'));row.classList.add('selected-row')})})}
function isToyota10Case(c){
  if(!c)return false;
  const digits=String(c.km??'').replace(/\D/g,''),km=digits?Number(digits):NaN;
  const sale=c.saleDate?dateOnly(c.saleDate):null,current=new Date(today),maximumAge=new Date(today);
  current.setHours(0,0,0,0);
  maximumAge.setHours(0,0,0,0);
  maximumAge.setFullYear(maximumAge.getFullYear()-10);
  const saleWithinLimit=Boolean(sale&&!Number.isNaN(sale.getTime())&&sale>=maximumAge&&sale<=current);
  const kmWithinLimit=Number.isFinite(km)&&km>=0&&km<=200000;
  return saleWithinLimit&&kmWithinLimit&&(isToyota10SaleDate(c.saleDate)||isToyota10Km(c.km));
}
cases.forEach(c=>{
  if(c.toyota10Confirmed&&!isToyota10Case(c))c.toyota10Confirmed=false;
});
function highlightToyota10Fields(){
  const fields=document.querySelectorAll('.case-sheet .case-detail');
  fields.forEach(field=>{
    field.classList.remove('toyota10-highlight');
    field.removeAttribute('title');
  });
  const order=selectedDatabaseOrder||selectedTurnOrder||selectedMissingOrder;
  const c=order?cases.find(item=>item.order===order):null;
  if(!isToyota10Case(c))return;
  fields.forEach(field=>{
    const label=field.querySelector('dt')?.textContent.trim();
    const triggersToyota10=label==='Fecha de venta'
      ?isToyota10SaleDate(c.saleDate)
      :label==='Kilometraje'
        ?isToyota10Km(c.km)
        :false;
    if(triggersToyota10){
      field.classList.add('toyota10-highlight');
      field.setAttribute('title','Este dato activa la condición Toyota 10');
    }
  });
}
function showToyota10ServiceBookReminder(reference=''){document.querySelector('.toyota10-service-reminder')?.remove();const backdrop=document.createElement('div');backdrop.className='toyota10-review-backdrop toyota10-service-reminder';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','toyota10ServiceTitle');backdrop.innerHTML=`<section class="toyota10-review-dialog"><header><div class="toyota10-reminder-heading"><span class="toyota10-caution-icon" aria-hidden="true"><img src="assets/caution-triangle.png" alt=""></span><div><span>RECORDATORIO TOYOTA 10</span><h2 id="toyota10ServiceTitle">Llevar la libreta de servicios a Garantías</h2><p>El registro ${escapeHtml(reference||'Toyota 10')} fue guardado. Antes de finalizar la recepción, entregá la libreta de servicios del vehículo al área de Garantías.</p></div></div><button type="button" data-close-toyota10-service aria-label="Cerrar">×</button></header><div class="toyota10-review-summary"><div><span>DOCUMENTACIÓN</span><strong>Libreta de servicios</strong></div><div><span>DESTINO</span><strong>Área de Garantías</strong></div><div><span>COBERTURA</span><strong>Toyota 10</strong></div></div><footer><button class="primary-button" type="button" data-close-toyota10-service>Entendido</button></footer></section>`;document.body.appendChild(backdrop);const close=()=>backdrop.remove();backdrop.querySelectorAll('[data-close-toyota10-service]').forEach(button=>button.onclick=close);backdrop.onclick=event=>{if(event.target===backdrop)close()};backdrop.querySelector('[data-close-toyota10-service]')?.focus()}
function bindSettings(){
  const switchSettingsPanel=name=>{
    settingsPanel=name;
    document.querySelectorAll('[data-settings-panel]').forEach(button=>{
      const active=button.dataset.settingsPanel===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-expanded',String(active));
    });
    document.querySelectorAll('.settings-panel').forEach(panel=>{panel.hidden=panel.id!==`settings-panel-${name}`});
  };
  document.querySelectorAll('[data-settings-panel]').forEach(button=>button.onclick=()=>switchSettingsPanel(button.dataset.settingsPanel));
  const clear=document.getElementById('clearAllData');if(clear)clear.onclick=clearAllData;
  const emailForm=document.getElementById('partsOrderEmailSettingsForm');if(emailForm)emailForm.onsubmit=async event=>{event.preventDefault();if(!canModifyView('settings')){toast('Tu perfil permite consultar Configuración, pero no modificar destinatarios.');return}const data=new FormData(emailForm),rawTo=splitEmailAddresses(data.get('to')),rawCc=splitEmailAddresses(data.get('cc')),invalid=[...rawTo,...rawCc].filter(address=>!validEmailAddress(address)),error=emailForm.querySelector('.parts-email-settings-error'),button=emailForm.querySelector('[type="submit"]');if(!rawTo.length){error.textContent='Ingresá al menos un destinatario para los pedidos de repuestos.';emailForm.elements.to.focus();return}if(invalid.length){error.textContent=`Revisá ${invalid.join(', ')}: no parece un correo válido.`;return}partsOrderEmailSettings=normalizePartsOrderEmailSettings({to:rawTo,cc:rawCc});error.textContent='';button.disabled=true;button.textContent='Guardando…';const shared=await pushPartsOrderEmailSettings();toast(shared?'Destinatarios de pedidos guardados':'Destinatarios guardados en este navegador; no se pudieron compartir');render()};
  const responsibleForm=document.getElementById('registryResponsiblesForm'),responsibleList=responsibleForm?.querySelector('[data-responsible-list]'),responsibleError=responsibleForm?.querySelector('.registry-responsibles-error');
  const renumberResponsibleRows=()=>responsibleList?.querySelectorAll('.registry-responsible-row').forEach((row,index)=>{row.querySelector(':scope > span').textContent=String(index+1).padStart(2,'0');const input=row.querySelector('input');input.setAttribute('aria-label',`Nombre del responsable ${index+1}`)});
  const bindResponsibleRemove=button=>button.onclick=()=>{if(responsibleList.querySelectorAll('.registry-responsible-row').length===1){responsibleError.textContent='Debe quedar al menos un responsable disponible.';return}button.closest('.registry-responsible-row').remove();responsibleError.textContent='';renumberResponsibleRows()};
  responsibleList?.querySelectorAll('[data-remove-responsible]').forEach(bindResponsibleRemove);
  const addResponsible=document.getElementById('addRegistryResponsible');if(addResponsible)addResponsible.onclick=()=>{const row=document.createElement('div');row.className='registry-responsible-row';const number=document.createElement('span'),label=document.createElement('label'),input=document.createElement('input'),remove=document.createElement('button');input.name='responsible';input.maxLength=80;input.required=true;input.placeholder='Nombre y apellido';remove.type='button';remove.dataset.removeResponsible='';remove.textContent='Quitar';label.append(input);row.append(number,label,remove);responsibleList.append(row);bindResponsibleRemove(remove);renumberResponsibleRows();input.focus()};
  if(responsibleForm)responsibleForm.onsubmit=async event=>{event.preventDefault();if(!canModifyView('settings')){toast('Tu perfil permite consultar Configuración, pero no modificar responsables.');return}const raw=new FormData(responsibleForm).getAll('responsible'),normalized=normalizeRegistryResponsibles(raw);if(!normalized.length){responsibleError.textContent='Agregá al menos un responsable antes de guardar.';responsibleForm.querySelector('input')?.focus();return}responsibleError.textContent='';const button=responsibleForm.querySelector('[type="submit"]');button.disabled=true;button.textContent='Guardando…';registryResponsibles=normalized;const shared=await pushRegistryResponsibles();toast(shared?'Responsables guardados y compartidos':'Responsables guardados en este navegador; no se pudieron compartir');render()};
  const userSelect=document.getElementById('permissionUserSelect');if(userSelect)userSelect.onchange=()=>{selectedPermissionUser=userSelect.value;render()};
  document.querySelectorAll('[data-toggle-user]').forEach(button=>button.onclick=()=>{const username=button.dataset.toggleUser;if(username===currentApplicationUser()?.username){toast('No podés desactivar tu propio usuario.');return}APPLICATION_USERS[username].active=APPLICATION_USERS[username].active===false;persistUserDirectory();render()});
  document.querySelectorAll('[data-edit-user]').forEach(button=>button.onclick=()=>{selectedDirectoryUser=button.dataset.editUser;render()});
  const addUser=document.getElementById('addUserDirectory');if(addUser)addUser.onclick=()=>{if(!canModifyView('settings')){toast('No tenés permiso para administrar usuarios.');return}selectedDirectoryUser='new';render()};
  const cancelUserEdit=document.getElementById('cancelUserEdit');if(cancelUserEdit)cancelUserEdit.onclick=()=>{selectedDirectoryUser='';render()};
  const closeUserEdit=document.getElementById('closeUserEdit'),userModalBackdrop=document.querySelector('[data-user-modal-backdrop]');const closeUserModal=()=>{selectedDirectoryUser='';render()};if(closeUserEdit)closeUserEdit.onclick=closeUserModal;if(userModalBackdrop)userModalBackdrop.onclick=event=>{if(event.target===userModalBackdrop)closeUserModal()};
  document.onkeydown=userModalBackdrop?event=>{if(event.key==='Escape')closeUserModal()}:null;
  const userEditForm=document.getElementById('userDirectoryEditForm');if(userEditForm)userEditForm.onsubmit=event=>{event.preventDefault();if(!canModifyView('settings')){toast('No tenés permiso para administrar usuarios.');return}const data=new FormData(userEditForm),username=String(data.get('username')||'').trim().toLowerCase(),displayName=String(data.get('displayName')||'').trim(),role=String(data.get('role')||'').trim(),branch=String(data.get('branch')||'').trim();if(!/^[a-z0-9._-]{3,32}$/.test(username)||!displayName||!role||!USER_BRANCHES.includes(branch)){toast('Completá nombre, usuario, rol y sucursal.');return}if(selectedDirectoryUser==='new'&&APPLICATION_USERS[username]){toast('Ese usuario ya existe.');return}if(selectedDirectoryUser!=='new'&&username!==selectedDirectoryUser){toast('El nombre de usuario no se puede cambiar.');return}const initials=displayName.split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase();if(selectedDirectoryUser==='new')APPLICATION_USERS[username]={username,displayName,role,branch,initials,passwordHash:PARTS_LOGIN_HASH,allowedViews:null,active:true};else Object.assign(APPLICATION_USERS[username],{displayName,role,branch,initials});persistUserDirectory();selectedDirectoryUser='';toast(`Usuario ${displayName} guardado`);render()};
  document.querySelectorAll('[data-permission-access]').forEach(input=>input.onchange=()=>{const row=input.closest('[data-permission-row]'),modify=row?.querySelector('[data-permission-modify]'),label=input.closest('label')?.querySelector('b');if(label)label.textContent=input.checked?'Permitido':'Sin acceso';if(modify){modify.disabled=!input.checked;if(!input.checked){modify.checked=false;const modifyLabel=modify.closest('label')?.querySelector('b');if(modifyLabel)modifyLabel.textContent='Solo consulta'}}});
  document.querySelectorAll('[data-permission-modify]').forEach(input=>input.onchange=()=>{const label=input.closest('label')?.querySelector('b');if(label)label.textContent=input.checked?'Puede modificar':'Solo consulta'});
  const saveButton=document.getElementById('saveUserPermissions');if(saveButton)saveButton.onclick=()=>savePermissionsFromSettings();
  const resetButton=document.getElementById('resetUserPermissions');if(resetButton)resetButton.onclick=()=>resetPermissionsFromSettings();
}
function bindTodayAppointments(){document.querySelectorAll('[data-today-result]').forEach(button=>button.onclick=async()=>{const confirmed=await confirmExecutionHistoryReview(button.dataset.order,button.dataset.todayResult);if(confirmed)resolveTodayAppointment(button.dataset.order,button.dataset.todayResult)});const dateInput=document.getElementById('executionDateFilter');if(dateInput)dateInput.onchange=()=>{if(!dateInput.value)return;selectedExecutionDate=dateInput.value;render()};document.querySelectorAll('[data-execution-shift]').forEach(button=>button.onclick=()=>{const date=dateOnly(selectedExecutionDate);date.setDate(date.getDate()+Number(button.dataset.executionShift));selectedExecutionDate=date.toISOString().slice(0,10);render()});const todayButton=document.querySelector('[data-execution-today]');if(todayButton)todayButton.onclick=()=>{selectedExecutionDate=iso(0);render()}}
function bindPartsRegistry(){document.querySelectorAll('[data-registry-mode]').forEach(button=>button.onclick=()=>{releaseRegistryLock();registryMode=button.dataset.registryMode;selectedRegistryKey='';render()});const depositSearch=document.getElementById('depositQuery'),depositState=document.getElementById('depositStatusFilter'),depositFrom=document.getElementById('depositDateFrom'),depositTo=document.getElementById('depositDateTo'),clearDeposit=document.getElementById('clearDepositFilters');if(depositSearch){depositSearch.onchange=()=>{depositQuery=depositSearch.value.trim();render()};depositSearch.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();depositQuery=depositSearch.value.trim();render()}}}if(depositState)depositState.onchange=()=>{depositStatusFilter=depositState.value;render()};if(depositFrom)depositFrom.onchange=()=>{depositDateFrom=depositFrom.value;if(depositDateTo&&depositDateFrom>depositDateTo){depositDateTo=depositDateFrom;toast('Se ajustó la fecha hasta para mantener un rango válido')}render()};if(depositTo)depositTo.onchange=()=>{depositDateTo=depositTo.value;if(depositDateFrom&&depositDateTo<depositDateFrom){depositDateFrom=depositDateTo;toast('Se ajustó la fecha desde para mantener un rango válido')}render()};if(clearDeposit)clearDeposit.onclick=()=>{depositQuery='';depositStatusFilter='';depositDateFrom='';depositDateTo='';render()};document.querySelectorAll('[data-deposit-status]').forEach(select=>select.onchange=()=>{const key=select.dataset.depositStatus;if(key.startsWith('auto:')){const c=cases.find(item=>item.order===key.slice(5));if(!c)return;c.depositStatus=select.value;save()}else{const item=manualPartsRegistry.find(record=>record.id===key.slice(7));if(!item)return;item.depositStatus=select.value;item.updatedAt=new Date().toISOString();saveRegistry()}toast(`Estado de depósito actualizado a ${select.value.toLowerCase()}`);render()});const updateLabel=index=>{const input=document.querySelector(`[data-label-order="${index}"]`);if(!input)return;registryLabelOrders[index]=input.value.trim().toUpperCase();render()};document.querySelectorAll('[data-label-search]').forEach(button=>button.onclick=()=>updateLabel(Number(button.dataset.labelSearch)));document.querySelectorAll('[data-label-order]').forEach(input=>input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();updateLabel(Number(input.dataset.labelOrder))}});const printButton=document.getElementById('printRegistryLabels');if(printButton)printButton.onclick=()=>{document.querySelectorAll('[data-label-order]').forEach(input=>{registryLabelOrders[Number(input.dataset.labelOrder)]=input.value.trim().toUpperCase()});printRegistryLabels()};const dateInput=document.getElementById('registryDateFilter');if(dateInput)dateInput.onchange=()=>{if(!dateInput.value)return;releaseRegistryLock();selectedRegistryDate=dateInput.value;selectedRegistryKey='';render()};document.querySelectorAll('[data-registry-shift]').forEach(button=>button.onclick=()=>{const date=dateOnly(selectedRegistryDate);date.setDate(date.getDate()+Number(button.dataset.registryShift));releaseRegistryLock();selectedRegistryDate=date.toISOString().slice(0,10);selectedRegistryKey='';render()});const todayButton=document.querySelector('[data-registry-today]');if(todayButton)todayButton.onclick=()=>{releaseRegistryLock();selectedRegistryDate=iso(0);selectedRegistryKey='';render()};const add=document.getElementById('addRegistryRecord');if(add)add.onclick=()=>{selectedRegistryKey='new';render()};document.querySelectorAll('[data-registry-key]').forEach(button=>button.onclick=async()=>{const key=button.dataset.registryKey,details=registryLockDetails(key);if(details&&!(await acquireCaseLock(details.order,'Registro de repuestos',details.label)))return;selectedRegistryKey=key;render()});document.querySelectorAll('[data-close-registry]').forEach(button=>button.onclick=()=>{releaseRegistryLock();selectedRegistryKey='';render()});const backdrop=document.querySelector('.registry-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop){releaseRegistryLock();selectedRegistryKey='';render()}};const form=document.querySelector('[data-registry-form]');if(form)form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form),key=form.dataset.registryForm,data={appointmentDate:fd.get('appointmentDate'),vin:fd.get('vin').trim().toUpperCase(),plate:fd.get('plate').trim().toUpperCase(),saleDate:fd.get('saleDate'),partCode:fd.get('partCode').trim(),part:fd.get('part').trim(),order:fd.get('order').trim().toUpperCase(),repairDate:fd.get('repairDate'),km:fd.get('km').trim(),origin:key.startsWith('auto:')?'Con turno':'Sin turno',branch:key==='new'?(currentApplicationUser()?.branch||'Santa Fe'):(manualPartsRegistry.find(record=>record.id===key.slice(7))?.branch||currentApplicationUser()?.branch||'Santa Fe')},sourceCase=key.startsWith('auto:')?cases.find(item=>item.order===key.slice(5)):null,toyota10=Boolean((sourceCase&&(sourceCase.toyota10Confirmed||isToyota10Case(sourceCase)))||isToyota10Case(data)),updatedAt=new Date().toISOString();if(key.startsWith('auto:')){const c=sourceCase;if(!c)return;c.vin=data.vin;c.partCode=data.partCode;c.part=data.part;c.registryOrder=data.order;c.repairDate=data.repairDate;c.arrivalKm=data.km;save()}else if(key==='new'){manualPartsRegistry.push({...data,id:`RR-${Date.now()}`,depositStatus:'',toyota10,updatedAt});saveRegistry()}else{const item=manualPartsRegistry.find(record=>record.id===key.slice(7));if(!item)return;Object.assign(item,data,{toyota10,updatedAt});saveRegistry()}selectedRegistryDate=data.appointmentDate;releaseRegistryLock(key);selectedRegistryKey='';toast(key.startsWith('auto:')?'Caso actualizado en toda la plataforma':'Registro de repuesto guardado');render();if(toyota10)setTimeout(()=>showToyota10ServiceBookReminder(data.order||data.plate),0)}}
const bindPartsRegistryBase=bindPartsRegistry;
function formatRegistrySaleDates(){
  if(currentView!=='parts-registry'||registryMode!=='records') return;
  const items=registryRows().filter(item=>item.appointmentDate===selectedRegistryDate);
  document.querySelectorAll('.registry-table tbody tr').forEach((row,index)=>{
    const saleDateCell=row.cells[3];
    const repairDateCell=row.cells[7];
    if(saleDateCell) saleDateCell.textContent=fmtSaleDate(items[index]?.saleDate);
    if(repairDateCell) repairDateCell.textContent=fmtSaleDate(items[index]?.repairDate);
  });
}
function showToyota10ServiceBookNotice(record){
  const kmValue=record?.km||record?.arrivalKm;
  if(!record||(!isToyota10SaleDate(record.saleDate)&&!isToyota10Km(kmValue)))return;
  setTimeout(()=>{
    document.querySelector('.toyota10-service-book-backdrop')?.remove();
    const backdrop=document.createElement('div');
    backdrop.className='toyota10-review-backdrop toyota10-service-book-backdrop';
    backdrop.setAttribute('role','dialog');
    backdrop.setAttribute('aria-modal','true');
    backdrop.setAttribute('aria-labelledby','toyota10ServiceBookTitle');
    backdrop.innerHTML=`<section class="toyota10-review-dialog"><header><div class="toyota10-reminder-heading"><span class="toyota10-caution-icon" aria-hidden="true"><img src="assets/caution-triangle.png" alt=""></span><div><span>RECORDATORIO TOYOTA 10</span><h2 id="toyota10ServiceBookTitle">Llevar la libreta de servicios a Garantías</h2><p>El registro ${escapeHtml(record.order||record.sourceOrder||'-')} fue guardado. Antes de finalizar la recepción, entregá la libreta de servicios del vehículo al área de Garantías.</p></div></div><button type="button" data-toyota10-service-close aria-label="Cerrar">×</button></header><div class="toyota10-review-summary"><div><span>DOCUMENTACIÓN</span><strong>Libreta de servicios</strong></div><div><span>DESTINO</span><strong>Área de Garantías</strong></div><div><span>COBERTURA</span><strong>Toyota 10</strong></div></div><footer><button class="primary-button" type="button" data-toyota10-service-close>Entendido</button></footer></section>`;
    document.body.appendChild(backdrop);
    const close=()=>backdrop.remove();
    backdrop.querySelectorAll('[data-toyota10-service-close]').forEach(button=>button.onclick=close);
    backdrop.onclick=event=>{if(event.target===backdrop)close()};
    backdrop.querySelector('[data-toyota10-service-close]')?.focus();
  },0)
}
bindPartsRegistry=function(){bindPartsRegistryBase();formatRegistrySaleDates();const deleteButton=document.querySelector('[data-delete-registry]');if(deleteButton)deleteButton.onclick=()=>showManualRegistryDeleteDialog(deleteButton.dataset.deleteRegistry);const partsEditButton=document.querySelector('[data-registry-enable-parts]');if(partsEditButton)partsEditButton.onclick=()=>{const section=partsEditButton.closest('.registry-parts-section');section?.querySelectorAll('[data-registry-part-field]').forEach(field=>{field.readOnly=false});section?.classList.add('is-editing');partsEditButton.textContent='Edición habilitada';partsEditButton.disabled=true;section?.querySelector('[data-registry-part-field]')?.focus()};const form=document.querySelector('[data-registry-form]');if(!form)return;form.addEventListener('submit',()=>{const key=form.dataset.registryForm,responsible=String(new FormData(form).get('responsible')||'').trim();queueMicrotask(()=>{let toyota10Record=null;if(key.startsWith('auto:')){const item=cases.find(record=>record.order===key.slice(5));if(item){item.registryResponsible=responsible;save();toyota10Record=item}}else if(key==='new'){const item=manualPartsRegistry.at(-1);if(item){item.responsible=responsible;item.updatedAt=new Date().toISOString();saveRegistry();toyota10Record=item}}else{const item=manualPartsRegistry.find(record=>record.id===key.slice(7));if(item){item.responsible=responsible;item.updatedAt=new Date().toISOString();saveRegistry();toyota10Record=item}}const refreshedToyota10Record=toyota10Record?registryRows().find(record=>record.key===key)||toyota10Record:null;if(currentView==='parts-registry')render();showToyota10ServiceBookNotice(refreshedToyota10Record)})})}
function pdfSafe(value){const winAnsi={'á':'\\341','é':'\\351','í':'\\355','ó':'\\363','ú':'\\372','ñ':'\\361','ü':'\\374','Á':'\\301','É':'\\311','Í':'\\315','Ó':'\\323','Ú':'\\332','Ñ':'\\321','Ü':'\\334','º':'\\272','°':'\\260','¿':'\\277','¡':'\\241'};return String(value??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\r?\n/g,' ').replace(/[^\x20-\x7E]/g,char=>winAnsi[char]||'?')}
function reportDate(date=new Date()){return new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(date)}
function reportDateTime(date=new Date()){return `${reportDate(date)} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
function sortPendingParts(a,b){const rank={Urgente:1,Alta:2,Media:3,Baja:4};return (rank[a.priority]||99)-(rank[b.priority]||99)||String(a.requestDate).localeCompare(String(b.requestDate))||String(a.order).localeCompare(String(b.order))}
function wrapPdfText(text,maxChars){const words=String(text||'-').split(/\s+/),lines=[];let line='';words.forEach(word=>{if((line+' '+word).trim().length>maxChars){if(line)lines.push(line);line=word}else line=(line+' '+word).trim()});if(line)lines.push(line);return lines.length?lines:['-']}
function pdfDoc(pages){const objects=['<< /Type /Catalog /Pages 2 0 R >>'];const kids=[];objects.push('');pages.forEach((content,index)=>{const pageObj=3+index*2,streamObj=pageObj+1;kids.push(`${pageObj} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${streamObj} 0 R >>`);objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)});objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:'application/pdf'})}
function makePdfPageBuilder(){let content='';return {text:(x,y,text,size=10,bold=false,color='0 0 0')=>{content+=`BT ${color} rg /${bold?'F2':'F1'} ${size} Tf ${x} ${y} Td (${pdfSafe(text)}) Tj ET\n`},rect:(x,y,w,h,color='1 1 1',stroke='0.85 0.85 0.85')=>{content+=`${color} rg ${stroke} RG ${x} ${y} ${w} ${h} re B\n`},line:(x1,y1,x2,y2,color='0.92 0.04 0.08',width=1.2)=>{content+=`${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`},circle:(x,y,r,color='0.92 0.04 0.08',width=28)=>{content+=`${color} RG ${width} w ${x-r} ${y} m ${x-r} ${y+r*.55} ${x-r*.55} ${y+r} ${x} ${y+r} c ${x+r*.55} ${y+r} ${x+r} ${y+r*.55} ${x+r} ${y} c ${x+r} ${y-r*.55} ${x+r*.55} ${y-r} ${x} ${y-r} c ${x-r*.55} ${y-r} ${x-r} ${y-r*.55} ${x-r} ${y} c S\n`},raw:()=>content}}
function buildPartsPdf(){
 const now=new Date(),valid=branchVisibleCases(cases).filter(c=>c.requested&&c.order&&c.requestDate&&c.status!=='DADO DE BAJA'),pending=valid.filter(c=>!c.arrived).sort(sortPendingParts),arrived=valid.filter(c=>c.arrived),byMonth={};
 pending.forEach(c=>{const d=new Date(c.requestDate+'T12:00:00'),key=new Intl.DateTimeFormat('es-AR',{month:'2-digit',year:'2-digit'}).format(d);byMonth[key]=(byMonth[key]||0)+1});
 const monthRows=Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])),pages=[],red='0.921 0.039 0.118',black='0.102 0.102 0.102',graphite='0.176 0.196 0.224',dark='0.294 0.333 0.388',mid='0.42 0.447 0.502',light='0.898 0.906 0.922',soft='0.969 0.973 0.980',alert='0.996 0.945 0.949';
 const cols=[34,119,166,245,400,485,604],widths=[85,47,79,155,85,119,204],headers=['Fecha pedido','Días','N.º OR','Cliente','Prioridad','Código','Descripción'];
 const urgentCount=pending.filter(c=>c.priority==='Urgente').length,oldestDays=pending.length?Math.max(...pending.map(c=>daysFrom(c.requestDate))):0;
 const drawHeader=(page,continuation=false)=>{
  page.text(34,558,'TOYOTA',16,true,black);page.line(101,548,101,570,red,2.2);page.text(113,558,'AMIUN',16,true,black);
  page.text(298,562,continuation?'Reporte de Repuestos Pendientes':'Reporte de Repuestos Pendientes',18,true,black);
  page.text(331,544,continuation?'Continuación del detalle':`Corte operativo al ${reportDate(now)}`,9,false,mid);
  page.rect(704,539,104,36,'1 1 1',light);page.text(716,562,'EMITIDO',7,true,mid);page.text(716,549,`${reportDate(now)}  ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,8,true,black);
  page.line(34,523,808,523,red,1.6);
 };
 const drawTableHeader=(page,y)=>{
  headers.forEach((h,i)=>{page.rect(cols[i],y,widths[i],25,graphite,graphite);page.text(cols[i]+6,y+9,h,9,true,'1 1 1')});
  return y-25;
 };
 const drawFooter=(page,pageNumber)=>{
  page.line(34,24,808,24,light,.7);page.text(34,11,'AMIUN TOYOTA | Postventa y Garantías',7,false,mid);page.text(734,11,`Página ${pageNumber}`,7,false,mid);
 };
 let page=makePdfPageBuilder();drawHeader(page);
 page.text(34,499,'RESUMEN EJECUTIVO',8,true,mid);page.text(34,483,'Situación de abastecimiento',15,true,black);
 const cardY=414,cardW=148;
 [['PEDIDOS',valid.length,'Registros válidos'],['SIN ARRIBO',pending.length,'Requieren seguimiento'],['CON ARRIBO',arrived.length,'Arribos confirmados']].forEach(([label,value,note],i)=>{const x=34+i*(cardW+12);page.rect(x,cardY,cardW,54,'1 1 1',light);page.line(x,cardY,x,cardY+54,i===1&&pending.length?red:dark,3);page.text(x+14,cardY+37,label,8,true,mid);page.text(x+14,cardY+14,String(value),22,true,i===1&&pending.length?red:black);page.text(x+46,cardY+16,note,7,false,mid)});
 page.rect(514,402,294,81,'1 1 1',light);page.text(530,466,'PENDIENTES SIN ARRIBO POR MES',9,true,black);page.text(753,466,`Total ${pending.length}`,8,true,mid);
 if(!pending.length){page.text(548,432,'No hay pendientes sin arribo para graficar por mes',8,false,dark)}
 else{
  page.circle(563,432,21,red,12);page.text(557,435,String(pending.length),12,true,black);page.text(543,424,'SIN ARRIBO',6,false,mid);
  monthRows.slice(0,4).forEach(([month,count],i)=>{const pct=(count/pending.length*100).toFixed(1),y=446-i*13;page.rect(608,y-2,6,6,i?'0.42 0.447 0.502':red,i?'0.42 0.447 0.502':red);page.text(621,y,`${month} | ${count} casos | ${pct}%`,7.5,false,dark)});
 }
 page.rect(34,376,774,20,soft,light);page.text(46,383,'FOCO DE GESTIÓN',7,true,red);page.text(129,383,`${urgentCount} urgentes sin arribo`,8,true,black);page.text(273,383,`Mayor antigüedad: ${oldestDays} días hábiles`,8,true,black);page.text(496,383,pending.length?'Acción: priorizar casos urgentes y más antiguos':'Situación controlada: sin pendientes',8,true,pending.length?red:dark);
 page.text(34,351,'DETALLE DE REPUESTOS SIN ARRIBO',12,true,black);page.text(34,337,'Ordenado por prioridad y antigüedad. Los casos críticos aparecen primero.',8,false,mid);page.line(34,328,808,328,red,1.4);
 let y=298;y=drawTableHeader(page,y);
 if(!pending.length){page.rect(34,y-28,774,28,'1 1 1',light);page.text(386,y-17,'Sin registros',9,true,dark);drawFooter(page,1);pages.push(page.raw());return pdfDoc(pages)}
 pending.forEach((c,index)=>{
  const row=[reportDate(new Date(c.requestDate+'T12:00:00')),`${daysFrom(c.requestDate)}`,c.order,c.client||'-',(c.priority||'-').toUpperCase(),c.partCode||'-',(c.part||'-').toUpperCase()];
  const wrapped=[wrapPdfText(row[0],13),wrapPdfText(row[1],4),wrapPdfText(row[2],11),wrapPdfText(row[3],24),wrapPdfText(row[4],12),wrapPdfText(row[5],18),wrapPdfText(row[6],30)],height=Math.max(28,...wrapped.map(lines=>lines.length*9+12));
  if(y-height<34){drawFooter(page,pages.length+1);pages.push(page.raw());page=makePdfPageBuilder();drawHeader(page,true);page.text(34,495,'DETALLE DE REPUESTOS SIN ARRIBO',12,true,black);page.line(34,483,808,483,red,1.4);y=drawTableHeader(page,448)}
  const urgent=c.priority==='Urgente',fill=urgent?alert:(index%2?soft:'1 1 1');
  cols.forEach((x,i)=>page.rect(x,y-height,widths[i],height,fill,'0.86 0.87 0.9'));
  if(urgent)page.rect(34,y-height,3,height,red,red);
  wrapped.forEach((lines,i)=>lines.forEach((line,li)=>page.text(cols[i]+6,y-16-li*9,line,8,i===2||i===4,i===4&&urgent?red:black)));
  y-=height;
 });
 drawFooter(page,pages.length+1);pages.push(page.raw());return pdfDoc(pages)
}
function reportBranchLabel(){return canViewOtherBranches()?'Todas las sucursales':(currentApplicationUser()?.branch||'Santa Fe')}
function reportBranchCaption(){return `Sucursal: ${reportBranchLabel()}`}
function buildPartsPrintHtml(){
 const now=new Date(),valid=branchVisibleCases(cases).filter(c=>c.requested&&c.order&&c.requestDate&&c.status!=='DADO DE BAJA'),pending=valid.filter(c=>!c.arrived).sort(sortPendingParts),byMonth={};
 pending.forEach(c=>{const date=new Date(c.requestDate+'T12:00:00'),key=new Intl.DateTimeFormat('es-AR',{month:'2-digit',year:'2-digit'}).format(date);byMonth[key]=(byMonth[key]||0)+1});
 const months=Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])),total=Math.max(1,pending.length),ages=pending.map(c=>daysFrom(c.requestDate));
 const urgentCount=pending.filter(c=>c.priority==='Urgente').length,delayedCount=ages.filter(days=>days>=15).length,oldestDays=ages.length?Math.max(...ages):0,averageDays=ages.length?Math.round(ages.reduce((sum,days)=>sum+days,0)/ages.length):0,incompleteCount=pending.filter(c=>!c.partCode||!c.part||c.part.toLowerCase()==='sin especificar').length,logoUrl=new URL('assets/logo-amiun.png',location.href).href;
 const ageBuckets=[{label:'0 a 7 días',count:ages.filter(d=>d<=7).length,className:'recent'},{label:'8 a 14 días',count:ages.filter(d=>d>=8&&d<=14).length,className:'follow'},{label:'15 a 21 días',count:ages.filter(d=>d>=15&&d<=21).length,className:'delayed'},{label:'22+ días',count:ages.filter(d=>d>=22).length,className:'critical'}],maxBucket=Math.max(1,...ageBuckets.map(bucket=>bucket.count));
 const conditionFor=days=>days>=22?['Crítico','critical']:days>=15?['Demorado','delayed']:days>=8?['Seguimiento','follow']:['Reciente','recent'];
 const actionText=urgentCount?`Priorizar ${urgentCount} ${urgentCount===1?'caso urgente':'casos urgentes'} y revisar los pedidos más antiguos`:delayedCount?`Gestionar ${delayedCount} ${delayedCount===1?'caso demorado':'casos demorados'} con 15 días o más`:incompleteCount?`Completar información técnica en ${incompleteCount} ${incompleteCount===1?'orden':'órdenes'}`:pending.length?'Mantener seguimiento preventivo; no existen casos demorados':'Sin pendientes que requieran intervención';
 const rows=pending.map(c=>{const days=daysFrom(c.requestDate),conditionClass=conditionFor(days)[1],missingCode=!c.partCode,missingPart=!c.part||c.part.toLowerCase()==='sin especificar';return `<tr class="${c.priority==='Urgente'||conditionClass==='critical'?'urgent-row':''}">
  <td class="date-cell">${reportDate(new Date(c.requestDate+'T12:00:00'))}</td>
  <td class="number-cell ${days>=15?'late-days':''}">${days}</td>
   <td class="order-cell">${escapeHtml(c.order)}</td>
  <td>${escapeHtml(c.client||'-')}</td>
  <td><span class="priority priority-${escapeHtml((c.priority||'').toLowerCase())}">${escapeHtml((c.priority||'-').toUpperCase())}</span></td>
  <td class="${missingCode?'missing-data':''}">${escapeHtml(c.partCode||'Sin código')}</td>
  <td class="${missingPart?'missing-data':''}">${escapeHtml(c.part||'Sin descripción')}</td>
 </tr>`}).join('');
 const monthRows=months.map(([month,count])=>`<li><span>${escapeHtml(month)}</span><strong>${count}</strong><small>${(count/total*100).toFixed(1)}%</small></li>`).join('');
 const ageRows=ageBuckets.map(bucket=>`<div class="age-item"><div><span>${bucket.label}</span><strong>${bucket.count}</strong></div><i><b class="${bucket.className}" style="width:${Math.max(bucket.count?6:0,Math.round(bucket.count/maxBucket*100))}%"></b></i></div>`).join('');
 return `<!doctype html>
<html lang="es">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
 <title>REPORTE_REPUESTOS_PENDIENTES_${now.getFullYear()}_${String(now.getMonth()+1).padStart(2,'0')}_${String(now.getDate()).padStart(2,'0')}</title>
 <style>
  :root{--toyota:#EB0A1E;--ink:#17191C;--graphite:#30343A;--muted:#68707D;--line:#DDE0E4;--soft:#F4F5F6;--paper:#FFF}
  *{box-sizing:border-box}
  html{background:#E9EAEC}
  body{margin:0;color:var(--ink);background:var(--paper);font-family:Arial,Helvetica,sans-serif;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .print-toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;background:#17191C}
  .print-toolbar button{border:1px solid #4B5057;background:#25282D;color:#FFF;padding:9px 16px;font:700 13px Arial;cursor:pointer}
  .print-toolbar .primary{border-color:var(--toyota);background:var(--toyota)}
  .report{width:min(1120px,calc(100% - 32px));min-height:210mm;margin:20px auto;padding:12mm 13mm 10mm;background:#FFF;box-shadow:0 12px 40px rgba(17,24,39,.14)}
  .report-header{display:grid;grid-template-columns:190px 1fr 165px;align-items:center;gap:20px;padding-bottom:12px;border-bottom:2px solid var(--toyota)}
  .brand img{display:block;width:154px;height:40px;object-fit:contain;object-position:left center}
  .title{text-align:center}
  .title h1{margin:0;font-size:22pt;line-height:1.05;letter-spacing:-.45px}
  .title p{margin:6px 0 0;color:var(--muted);font-size:9.5pt}
  .issued{justify-self:end;min-width:150px;padding:9px 12px;border:1px solid var(--line);border-left:3px solid var(--toyota)}
  .issued span{display:block;color:var(--muted);font-size:7.5pt;font-weight:700;letter-spacing:.8px}
  .issued strong{display:block;margin-top:4px;font-size:9pt}
  .executive{margin-top:16px}
  .section-label{margin:0;color:var(--muted);font-size:7.5pt;font-weight:700;letter-spacing:1.1px}
  .executive h2{margin:3px 0 12px;font-size:15pt;letter-spacing:-.2px}
  .summary-row{display:grid;grid-template-columns:minmax(190px,.58fr) minmax(0,2.42fr);gap:10px;align-items:stretch}
  .metrics{display:grid;grid-template-columns:1fr;border:1px solid var(--line)}
  .metric{position:relative;min-height:64px;padding:13px 12px;border-right:1px solid var(--line)}
  .metric:last-child{border-right:0}
  .metric::before{content:"";position:absolute;left:0;top:0;width:100%;height:3px;background:var(--graphite)}
  .metric.alert::before{background:var(--toyota)}
  .metric span{display:block;min-height:18px;color:var(--muted);font-size:6.8pt;font-weight:700;letter-spacing:.55px}
  .metric strong{display:block;margin-top:2px;font-size:19pt;line-height:1}
  .metric small{display:block;margin-top:4px;color:var(--muted);font-size:6.5pt;line-height:1.2}
  .analysis-grid{display:grid;grid-template-columns:1fr;min-width:0}
  .analysis-panel{display:flex;flex-direction:column;justify-content:center;padding:11px 13px;border:1px solid var(--line);background:var(--soft)}
  .analysis-panel h3{margin:0 0 8px;font-size:8.5pt}
  .age-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .age-item div{display:flex;justify-content:space-between;gap:8px;font-size:7pt}
  .age-item strong{font-size:8pt}
  .age-item i{display:block;height:5px;margin-top:6px;background:#DDE0E4}
  .age-item b{display:block;height:100%;background:#6B7280}
  .age-item b.delayed,.age-item b.critical{background:var(--toyota)}
  .month-list{display:grid;grid-template-columns:repeat(2,1fr);gap:0 14px;margin:0;padding:0;list-style:none}
  .month-list li{display:grid;grid-template-columns:1fr auto auto;gap:9px;padding:4px 0;border-bottom:1px solid var(--line);font-size:7pt}
  .month-list strong{font-size:7.5pt}.month-list small{min-width:34px;color:var(--muted);text-align:right}
  .empty-chart{grid-column:1/-1;align-self:center;color:var(--muted);font-size:8pt;line-height:1.4}
  .management-strip{display:grid;grid-template-columns:125px 1fr 2.6fr;margin-top:10px;border:1px solid var(--line);background:#FAFAFA}
  .management-strip div{padding:8px 11px;border-right:1px solid var(--line)}
  .management-strip div:last-child{border-right:0}
  .management-strip span{display:block;color:var(--muted);font-size:6.6pt;font-weight:700;letter-spacing:.6px}
  .management-strip strong{display:block;margin-top:3px;font-size:8.5pt}
  .management-strip .action{border-left:3px solid var(--toyota)}
  .management-strip .action strong{color:var(--toyota)}
  .detail{margin-top:18px}
  .detail-heading{display:flex;align-items:end;justify-content:space-between;padding-bottom:7px;border-bottom:2px solid var(--toyota)}
  .detail-heading h2{margin:0;font-size:13pt}
  .detail-heading p{margin:0;color:var(--muted);font-size:7.5pt}
  table{width:100%;margin-top:7px;border-collapse:collapse;table-layout:fixed}
  col:nth-child(1){width:12%}col:nth-child(2){width:7%}col:nth-child(3){width:13%}col:nth-child(4){width:18%}col:nth-child(5){width:12%}col:nth-child(6){width:16%}col:nth-child(7){width:22%}
  thead{display:table-header-group}
  th{padding:8px 7px;background:var(--graphite);color:#FFF;font-size:8pt;line-height:1.15;text-align:left;letter-spacing:.25px}
  td{padding:7px;border-bottom:1px solid var(--line);font-size:8pt;line-height:1.25;vertical-align:top;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
  tbody tr:nth-child(even){background:#F8F9FA}
  tbody tr{break-inside:avoid;page-break-inside:avoid}
  .urgent-row{background:#FFF5F6!important;box-shadow:inset 3px 0 var(--toyota)}
  .number-cell,.date-cell{text-align:center}.order-cell{font-weight:700}
  .late-days{color:var(--toyota);font-weight:700}
  .priority{font-size:7.2pt;font-weight:700}.priority-urgente{color:var(--toyota)}
  .missing-data{color:#8A5200;font-weight:700}
  .empty-row td{padding:24px;text-align:center;color:var(--muted)}
  .report-footer{display:flex;justify-content:space-between;margin-top:12px;padding-top:7px;border-top:1px solid var(--line);color:var(--muted);font-size:6.8pt}
  /* A4 vertical: el resumen se reorganiza y la tabla conserva todas sus columnas. */
  .report{width:min(790px,calc(100% - 24px));min-height:297mm;padding:11mm 12mm 9mm}
  .report-header{grid-template-columns:135px 1fr 125px;gap:12px}
  .brand img{width:122px;height:34px}.title h1{font-size:18pt}.title p{font-size:8pt}
  .issued{min-width:0;padding:7px 8px}.issued span{font-size:6.5pt}.issued strong{font-size:7.5pt}
  .summary-row{grid-template-columns:minmax(160px,.55fr) minmax(0,2.45fr)}
  .metrics{grid-template-columns:1fr}
  .management-strip{grid-template-columns:1fr 1fr}
  .management-strip .action{grid-column:1/-1;border-top:1px solid var(--line)}
  th{padding:8px 5px;font-size:8.2pt}td{padding:8px 5px;font-size:8.3pt;line-height:1.3}
  .priority{font-size:7.8pt}
  @page{size:A4 portrait;margin:12mm 13mm}
  @media print{
   html,body{background:#FFF}
   .print-toolbar{display:none!important}
   .report{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}
   .report-header,.summary-row,.metrics,.analysis-grid,.management-strip,.detail-heading{break-inside:avoid;page-break-inside:avoid}
   .detail{margin-top:14px}
   .report-footer{position:fixed;left:0;right:0;bottom:-7mm}
  }
 </style>
</head>
<body>
 <nav class="print-toolbar" aria-label="Acciones de impresión">
  <button onclick="window.close()">Cerrar</button>
  <button class="primary" onclick="window.print()">Guardar como PDF / Imprimir</button>
 </nav>
 <main class="report">
  <header class="report-header">
   <div class="brand"><img src="${escapeHtml(logoUrl)}" alt="Toyota Amiun"></div>
   <div class="title"><h1>Repuestos Pendientes de Arribo</h1><p>Seguimiento operativo de solicitudes sin arribo confirmado al ${reportDate(now)} · ${escapeHtml(reportBranchCaption())}</p></div>
   <div class="issued"><span>EMITIDO</span><strong>${reportDateTime(now)}</strong></div>
  </header>
  <section class="executive">
   <div class="summary-row">
    <div class="metrics">
     <article class="metric alert"><span>TOTAL PENDIENTE</span><strong>${pending.length}</strong><small>Sin arribo confirmado</small></article>
    </div>
    <div class="analysis-grid">
     <article class="analysis-panel">
      <h3>Distribución por antigüedad</h3>
      <div class="age-grid">${ageRows}</div>
     </article>
    </div>
   </div>
  </section>
  <section class="detail">
   <div class="detail-heading"><h2>Detalle de repuestos sin arribo</h2><p>Ordenado por prioridad, antigüedad y N.º OR</p></div>
   <table>
    <colgroup><col><col><col><col><col><col><col></colgroup>
    <thead><tr><th>Fecha pedido</th><th>Días</th><th>N.º OR</th><th>Cliente</th><th>Prioridad</th><th>Código</th><th>Descripción</th></tr></thead>
    <tbody>${rows||'<tr class="empty-row"><td colspan="7">Sin registros pendientes de arribo</td></tr>'}</tbody>
   </table>
  </section>
  <footer class="report-footer"><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Documento de gestión interna</span></footer>
 </main>
</body>
</html>`}
function buildTurnsPrintHtml(){
 const now=new Date(),pending=branchVisibleCases(cases).filter(c=>c.status!=='DADO DE BAJA'&&c.status!=='REALIZADO'&&c.arrived&&c.arrivalDate&&!c.vor&&!isProgrammed(c)&&c.order).sort((a,b)=>(a.priority==='Urgente'?0:a.priority==='Alta'?1:2)-(b.priority==='Urgente'?0:b.priority==='Alta'?1:2)||String(a.arrivalDate).localeCompare(String(b.arrivalDate))||String(a.order).localeCompare(String(b.order))),ages=pending.map(c=>daysFrom(c.arrivalDate));
 const urgentCount=pending.filter(c=>c.priority==='Urgente').length,withoutConversation=pending.filter(c=>!c.firstConversation).length,contacted=pending.length-withoutConversation,delayedCount=ages.filter(days=>days>=15).length,oldestDays=ages.length?Math.max(...ages):0,cancelCandidates=ages.filter(days=>days>60).length,logoUrl=new URL('assets/logo-amiun.png',location.href).href;
 const buckets=[{label:'0 a 7 días',count:ages.filter(d=>d<=7).length,tone:'recent'},{label:'8 a 14 días',count:ages.filter(d=>d>=8&&d<=14).length,tone:'follow'},{label:'15 a 21 días',count:ages.filter(d=>d>=15&&d<=21).length,tone:'delayed'},{label:'22+ días',count:ages.filter(d=>d>=22).length,tone:'critical'}],maxBucket=Math.max(1,...buckets.map(bucket=>bucket.count));
 const conditionFor=days=>days>=22?['Crítico','critical']:days>=15?['Demorado','delayed']:days>=8?['Seguimiento','follow']:['Reciente','recent'];
 const actionText=cancelCandidates?`Revisar ${cancelCandidates} ${cancelCandidates===1?'caso con más de 60 días para dar de baja':'casos con más de 60 días para dar de baja'}`:urgentCount?`Priorizar ${urgentCount} ${urgentCount===1?'caso urgente':'casos urgentes'} para contacto y programación`:withoutConversation?`Contactar ${withoutConversation} ${withoutConversation===1?'cliente sin primera conversación':'clientes sin primera conversación'}`:contacted?`Programar ${contacted} ${contacted===1?'caso ya contactado':'casos ya contactados'} sin turno confirmado`:'Sin casos pendientes de programación';
 const ageRows=buckets.map(bucket=>`<div class="age-item"><div><span>${bucket.label}</span><strong>${bucket.count}</strong></div><i><b class="${bucket.tone}" style="width:${Math.max(bucket.count?6:0,Math.round(bucket.count/maxBucket*100))}%"></b></i></div>`).join('');
 const rows=pending.map(c=>{const days=daysFrom(c.arrivalDate),tone=conditionFor(days)[1];return `<tr class="${c.priority==='Urgente'||tone==='critical'?'urgent-row':''}">
 <td class="date-cell">${reportDate(new Date(c.arrivalDate+'T12:00:00'))}</td>
 <td class="number-cell ${days>=15?'late-days':''}">${days}</td>
 <td class="order-cell">${escapeHtml(c.order)}</td>
  <td>${escapeHtml(c.client||'-')}</td>
  <td>${escapeHtml(c.phone||'Sin teléfono')}</td>
  <td><span class="priority priority-${escapeHtml((c.priority||'').toLowerCase())}">${escapeHtml((c.priority||'-').toUpperCase())}</span></td>
 <td>${escapeHtml(c.part||'Sin especificar')}</td>
 <td class="date-cell">${c.firstConversation?reportDate(new Date(c.firstConversation+'T12:00:00')):'Sin contacto'}</td>
 </tr>`}).join('');
 return `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>REPORTE_TURNOS_NO_PROGRAMADOS_${now.getFullYear()}_${String(now.getMonth()+1).padStart(2,'0')}_${String(now.getDate()).padStart(2,'0')}</title>
 <style>
 :root{--toyota:#EB0A1E;--ink:#17191C;--graphite:#30343A;--muted:#68707D;--line:#DDE0E4;--soft:#F4F5F6}
 *{box-sizing:border-box}html{background:#E9EAEC}body{margin:0;background:#FFF;color:var(--ink);font-family:Arial,Helvetica,sans-serif;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;background:#17191C}.toolbar button{border:1px solid #4B5057;background:#25282D;color:#FFF;padding:9px 16px;font:700 13px Arial;cursor:pointer}.toolbar .primary{border-color:var(--toyota);background:var(--toyota)}
 .report{width:min(1120px,calc(100% - 32px));min-height:210mm;margin:20px auto;padding:12mm 13mm 10mm;background:#FFF;box-shadow:0 12px 40px rgba(17,24,39,.14)}
 header{display:grid;grid-template-columns:190px 1fr 165px;align-items:center;gap:20px;padding-bottom:12px;border-bottom:2px solid var(--toyota)}.brand img{display:block;width:154px;height:40px;object-fit:contain;object-position:left}.title{text-align:center}.title h1{margin:0;font-size:22pt;line-height:1.05;letter-spacing:-.45px}.title p{margin:6px 0 0;color:var(--muted);font-size:9pt}.issued{justify-self:end;min-width:150px;padding:9px 12px;border:1px solid var(--line);border-left:3px solid var(--toyota)}.issued span{display:block;color:var(--muted);font-size:7pt;font-weight:700;letter-spacing:.8px}.issued strong{display:block;margin-top:4px;font-size:9pt}
 .executive{margin-top:16px}.section-label{margin:0;color:var(--muted);font-size:7.5pt;font-weight:700;letter-spacing:1px}.executive h2{margin:3px 0 12px;font-size:15pt}.metrics{display:grid;grid-template-columns:repeat(6,1fr);border:1px solid var(--line)}.metric{position:relative;min-height:64px;padding:13px 12px;border-right:1px solid var(--line)}.metric:last-child{border-right:0}.metric:before{content:"";position:absolute;inset:0 0 auto;height:3px;background:var(--graphite)}.metric.alert:before{background:var(--toyota)}.metric span{display:block;min-height:18px;color:var(--muted);font-size:6.7pt;font-weight:700;letter-spacing:.5px}.metric strong{display:block;margin-top:2px;font-size:19pt;line-height:1}.metric small{display:block;margin-top:4px;color:var(--muted);font-size:6.4pt}
 .analysis{display:grid;grid-template-columns:1.55fr 1fr;gap:10px;margin-top:10px}.panel{padding:11px 13px;border:1px solid var(--line);background:var(--soft)}.panel h3{margin:0 0 8px;font-size:8.5pt}.age-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.age-item div{display:flex;justify-content:space-between;font-size:7pt}.age-item i{display:block;height:5px;margin-top:6px;background:#DDE0E4}.age-item b{display:block;height:100%;background:#6B7280}.age-item b.delayed,.age-item b.critical{background:var(--toyota)}
 .contact-flow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px}.contact-flow div{padding:8px 10px;background:#FFF;border:1px solid var(--line)}.contact-flow span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.contact-flow strong{display:block;margin-top:2px;font-size:15pt}.contact-flow i{width:16px;height:1px;background:var(--toyota)}
 .management{display:grid;grid-template-columns:125px 1fr 2.6fr;margin-top:10px;border:1px solid var(--line);background:#FAFAFA}.management div{padding:8px 11px;border-right:1px solid var(--line)}.management div:last-child{border-right:0}.management span{display:block;color:var(--muted);font-size:6.6pt;font-weight:700;letter-spacing:.6px}.management strong{display:block;margin-top:3px;font-size:8.5pt}.management .action{border-left:3px solid var(--toyota)}.management .action strong{color:var(--toyota)}
 .detail{margin-top:18px}.detail-heading{display:flex;align-items:end;justify-content:space-between;padding-bottom:7px;border-bottom:2px solid var(--toyota)}.detail-heading h2{margin:0;font-size:13pt}.detail-heading p{margin:0;color:var(--muted);font-size:7.5pt}
 table{width:100%;margin-top:7px;border-collapse:collapse;table-layout:fixed}col:nth-child(1){width:13%}col:nth-child(2){width:5%}col:nth-child(3){width:14%}col:nth-child(4){width:15%}col:nth-child(5){width:14%}col:nth-child(6){width:10%}col:nth-child(7){width:18%}col:nth-child(8){width:11%}thead{display:table-header-group}th{padding:8px 5px;background:var(--graphite);color:#FFF;font-size:8pt;line-height:1.15;text-align:left;vertical-align:middle;overflow-wrap:normal;word-break:normal}td{padding:8px 5px;border-bottom:1px solid var(--line);font-size:8.4pt;line-height:1.28;vertical-align:middle;overflow-wrap:anywhere;word-break:normal}tbody tr:nth-child(even){background:#F8F9FA}tbody tr{break-inside:avoid;page-break-inside:avoid}.urgent-row{background:#FFF5F6!important;box-shadow:inset 3px 0 var(--toyota)}.number-cell,.date-cell{text-align:center;white-space:nowrap}.order-cell{font-weight:700;white-space:nowrap;overflow-wrap:normal}td:nth-child(5){white-space:nowrap}.late-days,.priority-urgente{color:var(--toyota);font-weight:700}.priority{font-size:8pt;font-weight:700;white-space:nowrap}.empty td{padding:24px;text-align:center;color:var(--muted)}
 footer{display:flex;justify-content:space-between;margin-top:12px;padding-top:7px;border-top:1px solid var(--line);color:var(--muted);font-size:6.8pt}
 /* A4 vertical: resumen en dos filas y detalle compacto sin eliminar datos. */
 .report{width:min(790px,calc(100% - 24px));min-height:297mm;padding:11mm 12mm 9mm}
 header{grid-template-columns:135px 1fr 125px;gap:12px}
 .brand img{width:122px;height:34px}.title h1{font-size:17pt}.title p{font-size:8pt}
 .issued{min-width:0;padding:7px 8px}.issued span{font-size:6.5pt}.issued strong{font-size:7.5pt}
 .metrics{grid-template-columns:repeat(3,1fr)}.metric:nth-child(3){border-right:0}.metric:nth-child(-n+3){border-bottom:1px solid var(--line)}
 .analysis{grid-template-columns:1fr}.management{grid-template-columns:1fr 1fr}.management .action{grid-column:1/-1;border-top:1px solid var(--line)}
 th{padding:9px 5px;font-size:8.3pt;line-height:1.15}td{padding:9px 5px;font-size:8.7pt;line-height:1.3}
 .priority{font-size:8.2pt}
 @page{size:A4 portrait;margin:12mm 13mm}@media print{html,body{background:#FFF}.toolbar{display:none!important}.report{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}header,.metrics,.analysis,.management,.detail-heading{break-inside:avoid;page-break-inside:avoid}footer{position:static;margin-top:12px}}
 </style></head><body>
 <nav class="toolbar"><button onclick="window.close()">Cerrar</button><button class="primary" onclick="window.print()">Guardar como PDF / Imprimir</button></nav>
 <main class="report">
  <header><div class="brand"><img src="${escapeHtml(logoUrl)}" alt="Toyota Amiun"></div><div class="title"><h1>Turnos Pendientes de Programación</h1><p>Casos con repuesto arribado y sin turno confirmado al ${reportDate(now)} · ${escapeHtml(reportBranchCaption())}</p></div><div class="issued"><span>EMITIDO</span><strong>${reportDateTime(now)}</strong></div></header>
  <section class="executive"><p class="section-label">RESUMEN EJECUTIVO</p><h2>Gestión de contacto y programación</h2>
   <div class="metrics">
    <article class="metric alert"><span>SIN PROGRAMAR</span><strong>${pending.length}</strong><small>Requieren coordinación</small></article>
    <article class="metric ${urgentCount?'alert':''}"><span>URGENTES</span><strong>${urgentCount}</strong><small>Atención inmediata</small></article>
    <article class="metric ${cancelCandidates?'alert':''}"><span>DAR DE BAJA</span><strong>${cancelCandidates}</strong><small>Más de 60 días de arribo</small></article>
   </div>
   <div class="analysis"><article class="panel"><h3>Antigüedad desde el arribo</h3><div class="age-grid">${ageRows}</div></article><article class="panel"><h3>Avance de contacto</h3><div class="contact-flow"><div><span>SIN CONTACTO</span><strong>${withoutConversation}</strong></div><i></i><div><span>CONTACTADOS SIN TURNO</span><strong>${contacted}</strong></div></div></article></div>
  </section>
  <section class="detail"><div class="detail-heading"><h2>Detalle de turnos no programados</h2><p>Ordenado por prioridad, antigüedad y N.º OR</p></div>
   <table><colgroup>${'<col>'.repeat(8)}</colgroup><thead><tr><th>Ingreso repuesto</th><th>Días</th><th>N.º OR</th><th>Cliente</th><th>Teléfono</th><th>Prioridad</th><th>Repuesto</th><th>Primer contacto</th></tr></thead><tbody>${rows||'<tr class="empty"><td colspan="8">Sin turnos pendientes de programación</td></tr>'}</tbody></table>
  </section>
  <footer><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Documento de gestión interna</span></footer>
 </main></body></html>`}
function showPdfConfirmation(url,filename){document.querySelector('.pdf-confirmation')?.remove();const box=document.createElement('div');box.className='pdf-confirmation';box.innerHTML=`<div><strong>PDF generado</strong><span>${escapeHtml(filename)}</span></div><button data-pdf-open>Abrir PDF</button><button data-pdf-copy>Copiar enlace</button><button data-pdf-view>Ver archivo</button><button data-pdf-close>×</button>`;document.body.appendChild(box);box.querySelector('[data-pdf-open]').onclick=()=>window.open(url,'_blank');box.querySelector('[data-pdf-view]').onclick=()=>window.open(url,'_blank');box.querySelector('[data-pdf-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(url);toast('Enlace del PDF copiado')}catch{toast('No se pudo copiar el enlace')}};box.querySelector('[data-pdf-close]').onclick=()=>box.remove()}
function depositReportItems(){const needle=depositQuery.trim().toLowerCase();return registryRows().filter(item=>item.repairDate&&(!needle||[item.order,item.partCode,item.part].some(value=>String(value||'').toLowerCase().includes(needle)))&&(!depositStatusFilter||(depositStatusFilter==='SIN CLASIFICAR'?!item.depositStatus:item.depositStatus===depositStatusFilter))&&(!depositDateFrom||item.repairDate>=depositDateFrom)&&(!depositDateTo||item.repairDate<=depositDateTo)).map(item=>({...item,reportStatus:item.depositStatus||'SIN CLASIFICAR'}))}
function depositOver60Items(reference=selectedRegistryDate){const cutoff=dateKey(dateOnly(reference||iso(0))),excluded=new Set(['TIRADA','TIRADO','ENVIADO A TOYOTA']);return registryRows().filter(item=>{if(!item.repairDate)return false;const status=String(item.depositStatus||'').trim().toUpperCase();return Math.max(0,businessDaysBetween(item.repairDate,cutoff))>60&&!excluded.has(status)}).map(item=>({...item,reportStatus:item.depositStatus||'SIN CLASIFICAR',reportDays:Math.max(0,businessDaysBetween(item.repairDate,cutoff))})).sort((a,b)=>b.reportDays-a.reportDays||String(a.order||'').localeCompare(String(b.order||'')))}
function buildDepositPrintHtml(){
 const now=new Date(),items=depositReportItems(),statuses=['DEPÓSITO INF','DEPÓSITO SUP','PÉRDIDA','TIRADA','ENVIADO A TOYOTA','SIN CLASIFICAR'],logoUrl=new URL('assets/logo-amiun.png',location.href).href,stored=items.filter(item=>['DEPÓSITO INF','DEPÓSITO SUP'].includes(item.reportStatus)).length,risk=items.filter(item=>['PÉRDIDA','TIRADA'].includes(item.reportStatus)).length,oldest=items.length?Math.max(...items.map(item=>daysFrom(item.repairDate))):0;
 const cards=statuses.map(status=>"<article class='metric "+(['PÉRDIDA','TIRADA','SIN CLASIFICAR'].includes(status)?'alert':'')+"'><span>"+status+"</span><strong>"+items.filter(item=>item.reportStatus===status).length+"</strong></article>").join('');
 const sections=statuses.map(status=>{const list=items.filter(item=>item.reportStatus===status).sort((a,b)=>daysFrom(b.repairDate)-daysFrom(a.repairDate)||String(a.order).localeCompare(String(b.order))),rows=list.map(item=>"<tr><td>"+reportDate(dateOnly(item.repairDate))+"</td><td class='"+(daysFrom(item.repairDate)>30?'late':'')+"'>"+daysFrom(item.repairDate)+"</td><td class='order'>"+escapeHtml(item.order||'-')+"</td><td>"+escapeHtml(item.partCode||'-')+"</td><td>"+escapeHtml(item.part||'Sin especificar')+"</td></tr>").join('');return "<section class='status-block'><header><h2>"+status+"</h2><strong>"+list.length+" registro"+(list.length===1?'':'s')+"</strong></header><table><colgroup><col><col><col><col><col></colgroup><thead><tr><th>Fecha reparación</th><th>Días</th><th>N.º de orden</th><th>Código</th><th>Repuesto</th></tr></thead><tbody>"+(rows||"<tr><td class='empty' colspan='5'>Sin registros en este estado</td></tr>")+"</tbody></table></section>"}).join('');
 const period=depositDateFrom||depositDateTo?((depositDateFrom?reportDate(dateOnly(depositDateFrom)):'Inicio')+" al "+(depositDateTo?reportDate(dateOnly(depositDateTo)):'Actualidad')):'Todos los registros';
 const css=":root{--red:#EB0A1E;--ink:#17191C;--gray:#4B5563;--muted:#6B7280;--line:#DDE0E4;--soft:#F5F6F7;--amber:#9A5B00}*{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;background:var(--ink)}.toolbar button{padding:8px 13px;border:1px solid #555;background:#292C31;color:#FFF;font-weight:700}.toolbar .primary{background:var(--red);border-color:var(--red)}.report{width:min(790px,calc(100% - 24px));margin:16px auto;padding:10mm 11mm;background:#FFF}.report-header{display:grid;grid-template-columns:145px 1fr 135px;align-items:center;gap:12px;padding-bottom:10px;border-bottom:2px solid var(--red)}.brand img{width:130px;height:34px;object-fit:contain}.title{text-align:center}.title h1{margin:0;font-size:19pt}.title p{margin:5px 0 0;color:var(--muted);font-size:8.5pt}.issued{padding:7px 9px;border:1px solid var(--line);border-left:3px solid var(--red)}.issued span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.issued strong{display:block;margin-top:3px;font-size:8pt}.summary-label{margin:14px 0 3px;color:var(--muted);font-size:7pt;font-weight:700;letter-spacing:1px}.summary-title{margin:0 0 9px;font-size:15pt}.overview{display:grid;grid-template-columns:1fr 1fr 1fr;margin-bottom:8px;border:1px solid var(--line);background:var(--soft)}.overview div{padding:9px;border-right:1px solid var(--line)}.overview div:last-child{border:0}.overview span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.overview strong{display:block;margin-top:3px;font-size:13pt}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.metric{position:relative;min-height:58px;padding:10px;border:1px solid var(--line)}.metric:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:var(--gray)}.metric.alert:before{background:var(--red)}.metric span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.metric strong{display:block;margin-top:5px;font-size:19pt}.status-block{margin-top:14px;break-inside:auto}.status-block>header{display:flex;align-items:center;justify-content:space-between;padding-bottom:5px;border-bottom:2px solid var(--red)}.status-block h2{margin:0;font-size:12pt}.status-block header strong{font-size:7.5pt}table{width:100%;margin-top:6px;border-collapse:collapse;table-layout:fixed}col:nth-child(1){width:16%}col:nth-child(2){width:8%}col:nth-child(3){width:18%}col:nth-child(4){width:22%}col:nth-child(5){width:36%}th{padding:6px;background:var(--gray);color:#FFF;font-size:7pt;text-align:center}td{padding:6px;border-bottom:1px solid var(--line);font-size:8pt;text-align:center;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#F8F9FA}.order{font-weight:700}.late{color:var(--red);font-weight:700}.empty{padding:15px;color:var(--muted)}.report-footer{display:flex;justify-content:space-between;margin-top:14px;padding-top:6px;border-top:1px solid var(--line);color:var(--muted);font-size:6.5pt}@page{size:A4 portrait;margin:11mm}@media print{.toolbar{display:none}.report{width:auto;margin:0;padding:0}.report-header,.overview,.metrics,.status-block>header,thead,tr{break-inside:avoid}.report-footer{position:static}}";
 return "<!doctype html><html lang='es'><head><meta charset='UTF-8'><title>REPORTE_DEPOSITO_"+dateKey(now)+"</title><style>"+css+"</style></head><body><nav class='toolbar'><button onclick='window.close()'>Cerrar</button><button class='primary' onclick='window.print()'>Guardar como PDF / Imprimir</button></nav><main class='report'><header class='report-header'><div class='brand'><img src='"+escapeHtml(logoUrl)+"'></div><div class='title'><h1>Control de Repuestos en Depósito</h1><p>"+escapeHtml(period)+"</p></div><div class='issued'><span>EMITIDO</span><strong>"+reportDateTime(now)+"</strong></div></header><p class='summary-label'>RESUMEN DE INVENTARIO</p><h2 class='summary-title'>Ubicación y condición de repuestos</h2><section class='overview'><div><span>TOTAL ANALIZADO</span><strong>"+items.length+"</strong></div><div><span>EN DEPÓSITO</span><strong>"+stored+"</strong></div><div><span>MAYOR ANTIGÜEDAD</span><strong>"+oldest+" días</strong></div></section><section class='metrics'>"+cards+"</section>"+sections+"<footer class='report-footer'><span>AMIUN TOYOTA | Postventa y Garantías</span><span>"+risk+" registros en pérdida o tirada · Documento interno</span></footer></main></body></html>";
}
function injectDepositReportControls(){if(currentView!=='parts-registry'||registryMode!=='deposit')return;const button=document.getElementById('generateDepositPdf');if(button)button.onclick=showDepositReportDialog}
function prepareBrowserPrintHtml(html){return html.replace('</head>',`<style>
table{margin-left:auto!important;margin-right:auto!important}
table th,table td{text-align:center!important;vertical-align:middle!important}
@page{size:A4 portrait!important;margin:0!important}
@media print{html,body{margin:0!important}.toolbar{display:none!important}.report{width:auto!important;max-width:none!important;min-height:0!important;margin:0!important;padding:11mm 13mm!important;box-shadow:none!important}table th,table td{text-align:center!important;vertical-align:middle!important}}
</style></head>`)}
function generateDepositPdf(){const preview=window.open('','_blank');if(!preview){toast('El navegador bloqueó la vista previa de impresión');return}const html=prepareBrowserPrintHtml(buildDepositPrintHtml().replace('</style>','.overview{display:none!important}</style>'));preview.document.open();preview.document.write(html);preview.document.close();preview.focus();toast('Reporte de depósito generado con los filtros actuales')}
function depositOperationalReportCss(){return `:root{--red:#EB0A1E;--ink:#17191C;--gray:#4B5563;--muted:#6B7280;--line:#DDE0E4;--soft:#F5F6F7;--green:#237B4B;--amber:#9A5B00}*{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;background:var(--ink)}.toolbar button{padding:8px 13px;border:1px solid #555;background:#292C31;color:#FFF;font-weight:700}.toolbar .primary{background:var(--red);border-color:var(--red)}.report{width:min(790px,calc(100% - 24px));margin:16px auto;padding:10mm 11mm;background:#FFF}.report-header{display:grid;grid-template-columns:145px 1fr 135px;align-items:center;gap:12px;padding-bottom:10px;border-bottom:2px solid var(--red)}.brand img{width:130px;height:34px;object-fit:contain}.title{text-align:center}.title h1{margin:0;font-size:18pt}.title p{margin:5px 0 0;color:var(--muted);font-size:8.5pt}.issued{padding:7px 9px;border:1px solid var(--line);border-left:3px solid var(--red)}.issued span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.issued strong{display:block;margin-top:3px;font-size:8pt}.section-label{margin:14px 0 3px;color:var(--muted);font-size:7pt;font-weight:700;letter-spacing:1px}.section-title{margin:0 0 9px;font-size:15pt}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}.metric{position:relative;min-height:62px;padding:10px;border:1px solid var(--line)}.metric:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:var(--gray)}.metric.alert:before{background:var(--red)}.metric.good:before{background:var(--green)}.metric span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.metric strong{display:block;margin-top:5px;font-size:19pt}.detail-heading{display:flex;align-items:end;justify-content:space-between;padding-bottom:6px;border-bottom:2px solid var(--red)}.detail-heading h2{margin:0;font-size:13pt}.detail-heading p{margin:0;color:var(--muted);font-size:7pt}table{width:100%;margin-top:7px;border-collapse:collapse;table-layout:fixed}th{padding:7px 5px;background:var(--gray);color:#FFF;font-size:7pt;text-align:center}td{padding:7px 5px;border-bottom:1px solid var(--line);font-size:8pt;text-align:center;overflow-wrap:anywhere;word-break:break-word}tbody tr:nth-child(even){background:#F8F9FA}.order{font-weight:700}.status{font-size:6.5pt;font-weight:700}.pending{color:var(--red)}.daily-summary{margin-bottom:13px}.daily-summary th,.daily-summary td{font-size:7.5pt}.empty{padding:18px!important;color:var(--muted)}.report-footer{display:flex;justify-content:space-between;margin-top:14px;padding-top:6px;border-top:1px solid var(--line);color:var(--muted);font-size:6.5pt}@page{size:A4 portrait;margin:11mm}@media print{.toolbar{display:none}.report{width:auto;margin:0;padding:0}.report-header,.metrics,.detail-heading,thead,tr{break-inside:avoid}}`}
function depositReportShell(title,subtitle,body,filename){const now=new Date(),logoUrl=new URL('assets/logo-amiun.png',location.href).href;return `<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>${escapeHtml(filename)}</title><style>${depositOperationalReportCss()}</style></head><body><nav class="toolbar"><button onclick="window.close()">Cerrar</button><button class="primary" onclick="window.print()">Guardar como PDF / Imprimir</button></nav><main class="report"><header class="report-header"><div class="brand"><img src="${escapeHtml(logoUrl)}"></div><div class="title"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)} · ${escapeHtml(reportBranchCaption())}</p></div><div class="issued"><span>EMITIDO</span><strong>${reportDateTime(now)}</strong></div></header>${body}<footer class="report-footer"><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Documento de gestión interna</span></footer></main></body></html>`}
function buildDepositDailyPrintHtml(reference=selectedRegistryDate){const date=dateKey(dateOnly(reference)),items=registryRows().filter(item=>item.repairDate===date).sort((a,b)=>String(a.order).localeCompare(String(b.order))),located=items.filter(item=>['DEPÓSITO INF','DEPÓSITO SUP'].includes(item.depositStatus)).length,unclassified=items.filter(item=>!item.depositStatus).length,rows=items.map(item=>`<tr><td class="order">${escapeHtml(item.order||'-')}</td><td>${escapeHtml(item.partCode||'-')}</td><td>${escapeHtml(item.part||'Sin especificar')}</td><td><span class="status ${item.depositStatus?'':'pending'}">${escapeHtml(item.depositStatus||'SIN CLASIFICAR')}</span></td><td>${escapeHtml(item.responsible||'Sin responsable')}</td></tr>`).join(''),body=`<p class="section-label">CONTROL DIARIO</p><h2 class="section-title">Ingresos registrados en el depósito</h2><section class="metrics"><article class="metric"><span>INGRESADOS</span><strong>${items.length}</strong></article><article class="metric good"><span>UBICADOS</span><strong>${located}</strong></article><article class="metric ${unclassified?'alert':''}"><span>SIN CLASIFICAR</span><strong>${unclassified}</strong></article></section><div class="detail-heading"><h2>Detalle de ingresos</h2><p>Estado actual de cada repuesto</p></div><table><colgroup><col style="width:15%"><col style="width:20%"><col style="width:29%"><col style="width:18%"><col style="width:18%"></colgroup><thead><tr><th>N.º de orden</th><th>Código</th><th>Repuesto</th><th>Ubicación / estado</th><th>Responsable</th></tr></thead><tbody>${rows||'<tr><td class="empty" colspan="5">Sin ingresos registrados en esta fecha</td></tr>'}</tbody></table>`;return depositReportShell('Ingresos Diarios al Depósito',`Fecha operativa: ${reportDate(dateOnly(date))}`,body,`INGRESOS_DEPOSITO_${date}`)}
function buildDepositWeeklyPrintHtml(reference=selectedRegistryDate){const range=weeklyTurnRange(reference),keys=range.days.map(dateKey),items=registryRows().filter(item=>item.repairDate&&keys.includes(item.repairDate)).sort((a,b)=>a.repairDate.localeCompare(b.repairDate)||String(a.order).localeCompare(String(b.order))),located=items.filter(item=>['DEPÓSITO INF','DEPÓSITO SUP'].includes(item.depositStatus)).length,sent=items.filter(item=>item.depositStatus==='ENVIADO A TOYOTA').length,disposed=items.filter(item=>['PÉRDIDA','TIRADA'].includes(item.depositStatus)).length,unclassified=items.filter(item=>!item.depositStatus).length,dayNames=['Lunes','Martes','Miércoles','Jueves','Viernes'],dailyRows=keys.map((key,index)=>{const list=items.filter(item=>item.repairDate===key);return `<tr><td>${dayNames[index]}</td><td>${reportDate(dateOnly(key))}</td><td>${list.length}</td><td>${list.filter(item=>['DEPÓSITO INF','DEPÓSITO SUP'].includes(item.depositStatus)).length}</td><td>${list.filter(item=>item.depositStatus==='ENVIADO A TOYOTA').length}</td><td>${list.filter(item=>!item.depositStatus).length}</td></tr>`}).join(''),detailRows=items.map(item=>`<tr><td>${reportDate(dateOnly(item.repairDate))}</td><td class="order">${escapeHtml(item.order||'-')}</td><td>${escapeHtml(item.partCode||'-')}</td><td>${escapeHtml(item.part||'Sin especificar')}</td><td><span class="status ${item.depositStatus?'':'pending'}">${escapeHtml(item.depositStatus||'SIN CLASIFICAR')}</span></td><td>${escapeHtml(item.responsible||'Sin responsable')}</td></tr>`).join(''),body=`<p class="section-label">CONTROL SEMANAL</p><h2 class="section-title">Movimientos e inventario recibido</h2><section class="metrics"><article class="metric"><span>INGRESADOS</span><strong>${items.length}</strong></article><article class="metric good"><span>UBICADOS</span><strong>${located}</strong></article><article class="metric"><span>ENVIADOS A TOYOTA</span><strong>${sent}</strong></article><article class="metric ${disposed?'alert':''}"><span>PÉRDIDA / TIRADA</span><strong>${disposed}</strong></article><article class="metric ${unclassified?'alert':''}"><span>SIN CLASIFICAR</span><strong>${unclassified}</strong></article><article class="metric"><span>DÍAS OPERATIVOS</span><strong>5</strong></article></section><div class="detail-heading"><h2>Resumen por día</h2><p>Lunes a viernes</p></div><table class="daily-summary"><thead><tr><th>Día</th><th>Fecha</th><th>Ingresados</th><th>Ubicados</th><th>Enviados</th><th>Sin clasificar</th></tr></thead><tbody>${dailyRows}</tbody></table><div class="detail-heading"><h2>Detalle semanal</h2><p>Estado actual de los movimientos</p></div><table><colgroup><col style="width:12%"><col style="width:14%"><col style="width:17%"><col style="width:25%"><col style="width:17%"><col style="width:15%"></colgroup><thead><tr><th>Fecha</th><th>N.º de orden</th><th>Código</th><th>Repuesto</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>${detailRows||'<tr><td class="empty" colspan="6">Sin movimientos registrados en esta semana</td></tr>'}</tbody></table>`;return depositReportShell('Informe Semanal de Movimientos',`${reportDate(range.monday)} al ${reportDate(range.friday)}`,body,`MOVIMIENTOS_DEPOSITO_${dateKey(range.monday)}_${dateKey(range.friday)}`)}
function buildDepositOver60PrintHtml(reference=selectedRegistryDate){const cutoff=dateOnly(reference||iso(0)),items=depositOver60Items(reference),oldest=items.length?Math.max(...items.map(item=>item.reportDays)):0,rows=items.map(item=>`<tr><td>${reportDate(dateOnly(item.repairDate))}</td><td class="late">${item.reportDays}</td><td class="order">${escapeHtml(item.order||'-')}</td><td>${escapeHtml(item.partCode||'-')}</td><td>${escapeHtml(item.part||'Sin especificar')}</td><td><span class="status ${item.reportStatus==='SIN CLASIFICAR'?'pending':''}">${escapeHtml(item.reportStatus)}</span></td><td>${escapeHtml(item.responsible||'Sin responsable')}</td></tr>`).join(''),body=`<p class="section-label">SEGUIMIENTO DE DEPÓSITO</p><h2 class="section-title">Repuestos con más de 60 días</h2><section class="metrics"><article class="metric ${items.length?'alert':''}"><span>CASOS DETECTADOS</span><strong>${items.length}</strong></article><article class="metric"><span>MAYOR ANTIGÜEDAD</span><strong>${oldest} días</strong></article><article class="metric good"><span>CRITERIO</span><strong>&gt; 60 días</strong></article></section><div class="detail-heading"><h2>Detalle de seguimiento</h2><p>No incluye TIRADA, TIRADO ni ENVIADO A TOYOTA</p></div><table><colgroup><col style="width:12%"><col style="width:9%"><col style="width:14%"><col style="width:16%"><col style="width:25%"><col style="width:13%"><col style="width:11%"></colgroup><thead><tr><th>Fecha reparación</th><th>Días</th><th>N.º de orden</th><th>Código</th><th>Repuesto</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>${rows||'<tr><td class="empty" colspan="7">No hay repuestos que cumplan este criterio</td></tr>'}</tbody></table>`;return depositReportShell('Repuestos con más de 60 días',`Corte: ${reportDate(cutoff)}`,body,`DEPOSITO_MAS_DE_60_DIAS_${dateKey(cutoff)}`)}
function openDepositOperationalReport(type,reference){if(!['daily','weekly','over60'].includes(type)){toast('El reporte seleccionado no está disponible');return}const preview=window.open('','_blank');if(!preview){toast('El navegador bloqueó la vista previa de impresión');return}const html=type==='daily'?buildDepositDailyPrintHtml(reference):type==='weekly'?buildDepositWeeklyPrintHtml(reference):buildDepositOver60PrintHtml(reference);preview.document.open();preview.document.write(prepareBrowserPrintHtml(html));preview.document.close();preview.focus();toast(type==='daily'?'Reporte de ingresos diarios generado':type==='weekly'?'Informe semanal generado':'Reporte de más de 60 días generado')}
function showDepositReportDialog(){
 document.querySelector('.deposit-report-backdrop')?.remove();
 const backdrop=document.createElement('div');
 backdrop.className='weekly-report-backdrop deposit-report-backdrop';
 backdrop.setAttribute('role','dialog');
 backdrop.setAttribute('aria-modal','true');
 backdrop.setAttribute('aria-labelledby','depositReportDialogTitle');
 backdrop.innerHTML=`<section class="weekly-report-dialog deposit-report-dialog">
  <header class="deposit-report-header">
   <div>
    <span>CONTROL DE DEPÓSITO</span>
    <h2 id="depositReportDialogTitle">Generar reporte</h2>
    <p>Seleccioná el alcance y la fecha que querés analizar.</p>
   </div>
   <button type="button" data-close-deposit-report aria-label="Cerrar">×</button>
  </header>
  <div class="deposit-report-body">
   <fieldset class="deposit-report-options">
    <legend>TIPO DE REPORTE</legend>
    <label class="deposit-report-option">
     <input type="radio" name="depositReportType" value="daily" checked>
     <span class="deposit-report-option-card">
      <span class="deposit-report-option-copy"><strong>Ingresos diarios</strong><small>Repuestos incorporados en la fecha seleccionada.</small></span>
      <span class="deposit-report-option-mark" aria-hidden="true">✓</span>
     </span>
    </label>
    <label class="deposit-report-option">
     <input type="radio" name="depositReportType" value="weekly">
     <span class="deposit-report-option-card">
      <span class="deposit-report-option-copy"><strong>Movimientos semanales</strong><small>Actividad consolidada de lunes a viernes.</small></span>
      <span class="deposit-report-option-mark" aria-hidden="true">✓</span>
     </span>
    </label>
    <label class="deposit-report-option">
     <input type="radio" name="depositReportType" value="over60">
     <span class="deposit-report-option-card">
      <span class="deposit-report-option-copy"><strong>Más de 60 días pendientes</strong><small>Repuestos con más de 60 días, excluyendo TIRADA y ENVIADO A TOYOTA.</small></span>
      <span class="deposit-report-option-mark" aria-hidden="true">✓</span>
     </span>
    </label>
   </fieldset>
   <section class="deposit-report-config" aria-label="Configuración del reporte">
    <label class="deposit-report-date"><span>FECHA DE REFERENCIA</span><input data-deposit-report-date type="date" value="${escapeHtml(selectedRegistryDate||iso(0))}"></label>
    <div class="deposit-report-period"><span>PERÍODO RESULTANTE</span><strong data-deposit-report-period></strong><small data-deposit-report-caption></small></div>
   </section>
  </div>
  <footer><button class="secondary-button" type="button" data-close-deposit-report>Cancelar</button><button class="primary-button" type="button" data-confirm-deposit-report>Generar reporte</button></footer>
 </section>`;
 document.body.appendChild(backdrop);
 const input=backdrop.querySelector('[data-deposit-report-date]'),period=backdrop.querySelector('[data-deposit-report-period]'),caption=backdrop.querySelector('[data-deposit-report-caption]'),selectedType=()=>backdrop.querySelector('[name="depositReportType"]:checked')?.value||'daily',update=()=>{const type=selectedType(),reference=input.value||iso(0);period.textContent=type==='daily'?reportDate(dateOnly(reference)):type==='weekly'?`${reportDate(weeklyTurnRange(reference).monday)} al ${reportDate(weeklyTurnRange(reference).friday)}`:`Corte: ${reportDate(dateOnly(reference))}`;caption.textContent=type==='daily'?'Corte de un día':type==='weekly'?'Semana operativa de 5 días':'Más de 60 días; excluye TIRADA y ENVIADO A TOYOTA'},close=()=>backdrop.remove();
 backdrop.querySelectorAll('[name="depositReportType"]').forEach(radio=>radio.onchange=update);
 input.onchange=update;
 backdrop.querySelectorAll('[data-close-deposit-report]').forEach(button=>button.onclick=close);
 backdrop.querySelector('[data-confirm-deposit-report]').onclick=()=>{const type=selectedType(),reference=input.value||iso(0);close();openDepositOperationalReport(type,reference)};
 backdrop.onclick=event=>{if(event.target===backdrop)close()};
 backdrop.onkeydown=event=>{if(event.key==='Escape')close()};
 update();
 input.focus();
}
function executionWeekData(reference=executionReportDate){
 const range=weeklyTurnRange(reference),keys=range.days.map(dateKey),dayNames=['Lunes','Martes','Miércoles','Jueves','Viernes'],scheduled=[];
 branchVisibleCases(cases).forEach(c=>{
  const history=Array.isArray(c.executionHistory)?c.executionHistory:[];
  history.forEach(entry=>{if(entry.date&&keys.includes(entry.date))scheduled.push({case:c,date:entry.date,time:entry.time||'',result:entry.status||'NO EJECUTADO',rescheduledDate:entry.rescheduledDate||''})});
  if(c.executionDate&&keys.includes(c.executionDate)&&c.executionStatus==='EJECUTADO')scheduled.push({case:c,date:c.executionDate,time:c.executionTime||c.time||'',result:'EJECUTADO',rescheduledDate:''});
  if(c.executionDate&&keys.includes(c.executionDate)&&c.executionStatus==='NO EJECUTADO'&&!history.some(entry=>entry.date===c.executionDate&&entry.status==='NO EJECUTADO'))scheduled.push({case:c,date:c.executionDate,time:c.executionTime||'',result:'NO EJECUTADO',rescheduledDate:c.appointmentDate&&c.appointmentDate!==c.executionDate?c.appointmentDate:''});
  if(c.appointmentDate&&keys.includes(c.appointmentDate)&&!c.executionDate&&isProgrammed(c))scheduled.push({case:c,date:c.appointmentDate,time:c.time||'',result:'PENDIENTE',rescheduledDate:''});
 });
 const withoutTurn=activeManualPartsRegistry().filter(item=>canViewOtherBranches()||(item.branch||'Santa Fe')===(currentApplicationUser()?.branch||'Santa Fe')).filter(item=>(item.origin||'Sin turno').toLowerCase()==='sin turno'&&keys.includes(item.repairDate||item.appointmentDate)).map(item=>({date:item.repairDate||item.appointmentDate,plate:item.plate||'',part:item.part||'',order:item.order||'',origin:'SIN TURNO'}));
 const withTurn=scheduled.filter(entry=>entry.result==='EJECUTADO').map(entry=>{const registry=registryRows().find(item=>item.automatic&&item.sourceOrder===entry.case.order);return {date:entry.date,plate:entry.case.plate,part:entry.case.part,order:registry?.order||entry.case.registryOrder||entry.case.order,origin:'CON TURNO'}});
 const daily=keys.map((key,index)=>{const dayScheduled=scheduled.filter(entry=>entry.date===key),executed=dayScheduled.filter(entry=>entry.result==='EJECUTADO').length,missed=dayScheduled.filter(entry=>entry.result==='NO EJECUTADO').length,pending=dayScheduled.filter(entry=>entry.result==='PENDIENTE').length,noTurn=withoutTurn.filter(entry=>entry.date===key).length;return {key,name:dayNames[index],programmed:dayScheduled.length,executed,missed,pending,noTurn,totalReal:executed+noTurn,compliance:dayScheduled.length?Math.round(executed/dayScheduled.length*100):0}});
 return {range,keys,scheduled,withoutTurn,executed:[...withTurn,...withoutTurn].sort((a,b)=>a.date.localeCompare(b.date)||a.plate.localeCompare(b.plate)).slice(0,40),missed:scheduled.filter(entry=>entry.result==='NO EJECUTADO'),daily};
}
function buildExecutionWeeklyPrintHtml(reference=executionReportDate){
 const now=new Date(),data=executionWeekData(reference),sum=key=>data.daily.reduce((total,day)=>total+day[key],0),programmed=sum('programmed'),executed=sum('executed'),missed=sum('missed'),pending=sum('pending'),withoutTurn=sum('noTurn'),totalReal=sum('totalReal'),logoUrl=new URL('assets/logo-amiun.png',location.href).href,max=Math.max(1,...data.daily.flatMap(day=>[day.programmed,day.executed,day.totalReal]));
 const chart=(realKey,title)=>"<article class='chart'><h3>"+title+"</h3>"+data.daily.map(day=>"<div class='chart-row'><span>"+day.name.slice(0,3).toUpperCase()+"</span><div><i class='planned' style='width:"+Math.round(day.programmed/max*100)+"%'></i><i class='real' style='width:"+Math.round(day[realKey]/max*100)+"%'></i></div><b>"+day.programmed+" / "+day[realKey]+"</b></div>").join('')+"<footer><span><i class='planned'></i>Programadas</span><span><i class='real'></i>"+(realKey==='executed'?'Ejecutadas':'Total real')+"</span></footer></article>";
 const dailyRows=data.daily.map(day=>"<tr><td>"+day.name+"</td><td>"+day.programmed+"</td><td>"+day.executed+"</td><td>"+day.missed+"</td><td>"+day.pending+"</td><td>"+day.noTurn+"</td><td>"+day.totalReal+"</td><td>"+day.compliance+"%</td></tr>").join('');
 const totalCompliance=programmed?Math.round(executed/programmed*100):0;
 const executedRows=data.executed.map(item=>"<tr><td>"+reportDate(dateOnly(item.date))+"</td><td>"+escapeHtml(item.plate||'-')+"</td><td>"+escapeHtml(item.part||'Sin especificar')+"</td><td><span class='origin'>"+item.origin+"</span></td><td>"+escapeHtml(item.order||'-')+"</td></tr>").join('');
 const rescheduled=data.missed.filter(entry=>entry.rescheduledDate),notRescheduled=data.missed.filter(entry=>!entry.rescheduledDate);
 const missedRows=list=>list.slice(0,40).map(entry=>"<tr><td>"+reportDate(dateOnly(entry.date))+"</td><td>"+escapeHtml(entry.case.client||'-')+"</td><td>"+escapeHtml(entry.case.plate||'-')+"</td><td>"+escapeHtml(entry.case.part||'Sin especificar')+"</td><td>"+(entry.rescheduledDate?reportDate(dateOnly(entry.rescheduledDate)):'Sin reprogramar')+"</td></tr>").join('');
 const css=":root{--red:#EB0A1E;--ink:#17191C;--gray:#4B5563;--muted:#6B7280;--line:#DDE0E4;--soft:#F5F6F7;--green:#237B4B}*{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:Arial,Helvetica,sans-serif;font-size:9pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;background:var(--ink)}.toolbar button{padding:8px 13px;border:1px solid #555;background:#292C31;color:#FFF;font-weight:700}.toolbar .primary{background:var(--red);border-color:var(--red)}.report{width:min(790px,calc(100% - 24px));margin:16px auto;padding:10mm 11mm;background:#FFF}.report-header{display:grid;grid-template-columns:145px 1fr 135px;align-items:center;gap:12px;padding-bottom:10px;border-bottom:2px solid var(--red)}.brand img{width:130px;height:34px;object-fit:contain}.title{text-align:center}.title h1{margin:0;font-size:19pt}.title p{margin:5px 0 0;color:var(--muted);font-size:8.5pt}.issued{padding:7px 9px;border:1px solid var(--line);border-left:3px solid var(--red)}.issued span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.issued strong{display:block;margin-top:3px;font-size:8pt}.section-label{margin:14px 0 3px;color:var(--muted);font-size:7pt;font-weight:700;letter-spacing:1px}h2{margin:0 0 9px;font-size:15pt}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.metric{position:relative;min-height:67px;padding:11px;border:1px solid var(--line)}.metric:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:var(--gray)}.metric.alert:before{background:var(--red)}.metric span{display:block;color:var(--muted);font-size:7pt;font-weight:700}.metric strong{display:block;margin-top:5px;font-size:21pt}.metric small{display:block;color:var(--muted);font-size:6.5pt}.charts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.chart{padding:10px;border:1px solid var(--line);background:var(--soft)}.chart h3{margin:0 0 7px;font-size:9pt}.chart-row{display:grid;grid-template-columns:28px 1fr 38px;align-items:center;gap:6px;margin:5px 0}.chart-row span,.chart-row b{font-size:6.5pt}.chart-row div{display:grid;gap:2px}.chart-row i{display:block;height:5px}.planned{background:#A4A9B0}.real{background:var(--red)}.chart footer{display:flex;gap:12px;margin-top:7px;font-size:6pt}.chart footer i{display:inline-block;width:9px;height:5px;margin-right:4px}.page-break{break-before:page;page-break-before:always}.detail-title{display:flex;justify-content:space-between;align-items:end;padding-bottom:6px;border-bottom:2px solid var(--red)}.detail-title h2{margin:0}.detail-title p{margin:0;color:var(--muted);font-size:7pt}table{width:100%;margin-top:7px;border-collapse:collapse;table-layout:fixed}th{padding:6px;background:var(--gray);color:#FFF;font-size:7pt;text-align:center}td{padding:6px;border-bottom:1px solid var(--line);font-size:7.5pt;text-align:center;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#F8F9FA}.total-row{font-weight:700;background:#ECEEF1!important}.origin{font-size:6pt;font-weight:700}.subsection{margin-top:14px}.subsection h3{margin:0;padding-bottom:5px;border-bottom:1px solid var(--red);font-size:10pt}.empty{padding:18px!important;color:var(--muted)}.report-footer{display:flex;justify-content:space-between;margin-top:12px;padding-top:6px;border-top:1px solid var(--line);color:var(--muted);font-size:6.5pt}@page{size:A4 portrait;margin:11mm}@media print{.toolbar{display:none}.report{width:auto;margin:0;padding:0}.report-header,.metrics,.charts,.detail-title,.subsection h3,thead{break-inside:avoid}.report-footer{position:static}}";
 return "<!doctype html><html lang='es'><head><meta charset='UTF-8'><title>REPORTE_SEMANAL_ASISTENCIA_"+dateKey(data.range.monday)+"_"+dateKey(data.range.friday)+"</title><style>"+css+"</style></head><body><nav class='toolbar'><button onclick='window.close()'>Cerrar</button><button class='primary' onclick='window.print()'>Guardar como PDF / Imprimir</button></nav><main class='report'><header class='report-header'><div class='brand'><img src='"+escapeHtml(logoUrl)+"'></div><div class='title'><h1>Reporte Semanal de Asistencia</h1><p>"+reportDate(data.range.monday)+" al "+reportDate(data.range.friday)+" · "+escapeHtml(reportBranchCaption())+" · Actualizado "+reportDate(now)+"</p></div><div class='issued'><span>EMITIDO</span><strong>"+reportDateTime(now)+"</strong></div></header><p class='section-label'>RESUMEN EJECUTIVO</p><h2>Desempeño semanal de atención</h2><section class='metrics'><article class='metric'><span>PROGRAMADAS</span><strong>"+programmed+"</strong><small>Agenda semanal</small></article><article class='metric'><span>REALIZADAS</span><strong>"+executed+"</strong><small>Con turno</small></article><article class='metric'><span>TOTAL REAL</span><strong>"+totalReal+"</strong><small>Con y sin turno</small></article><article class='metric "+(missed?'alert':'')+"'><span>NO EJECUTADAS</span><strong>"+missed+"</strong><small>Requieren análisis</small></article><article class='metric "+(pending?'alert':'')+"'><span>PENDIENTES</span><strong>"+pending+"</strong><small>Sin resultado</small></article><article class='metric'><span>SIN TURNO</span><strong>"+withoutTurn+"</strong><small>Atenciones adicionales</small></article></section><section class='charts'>"+chart('executed','Programadas vs. ejecutadas')+chart('totalReal','Programadas vs. total real')+"</section><footer class='report-footer'><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Documento de gestión interna</span></footer><section class='page-break'><div class='detail-title'><h2>Indicadores por día</h2><p>Lunes a viernes</p></div><table><thead><tr><th>Día</th><th>Programadas</th><th>Ejecutadas</th><th>No ejecutadas</th><th>Pendientes</th><th>Sin turno</th><th>Total real</th><th>Cumplimiento</th></tr></thead><tbody>"+dailyRows+"<tr class='total-row'><td>TOTAL</td><td>"+programmed+"</td><td>"+executed+"</td><td>"+missed+"</td><td>"+pending+"</td><td>"+withoutTurn+"</td><td>"+totalReal+"</td><td>"+totalCompliance+"%</td></tr></tbody></table><section class='subsection'><h3>Trabajos ejecutados</h3><table><thead><tr><th>Día</th><th>Patente</th><th>Repuesto / trabajo</th><th>Origen</th><th>N.º de orden</th></tr></thead><tbody>"+(executedRows||"<tr><td class='empty' colspan='5'>Sin trabajos ejecutados</td></tr>")+"</tbody></table></section><section class='subsection'><h3>No ejecutadas reprogramadas</h3><table><thead><tr><th>Día original</th><th>Cliente</th><th>Patente</th><th>Repuesto</th><th>Nueva fecha</th></tr></thead><tbody>"+(missedRows(rescheduled)||"<tr><td class='empty' colspan='5'>Sin turnos reprogramados</td></tr>")+"</tbody></table></section><section class='subsection'><h3>No ejecutadas sin reprogramación</h3><table><thead><tr><th>Día original</th><th>Cliente</th><th>Patente</th><th>Repuesto</th><th>Situación</th></tr></thead><tbody>"+(missedRows(notRescheduled)||"<tr><td class='empty' colspan='5'>Sin turnos pendientes de reprogramación</td></tr>")+"</tbody></table></section><footer class='report-footer'><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Hasta 40 registros por tabla</span></footer></section></main></body></html>";
}
function injectExecutionWeeklyReportControls(){if(currentView!=='today-appointments'||document.getElementById('generateExecutionWeeklyPdf'))return;const datebar=document.querySelector('.execution-datebar');if(!datebar)return;datebar.insertAdjacentHTML('beforeend',"<div class='execution-weekly-controls'><label class='execution-week-picker'><span>SEMANA</span><input id='executionReportDate' type='date' value='"+escapeHtml(executionReportDate)+"'></label><button class='primary-button' id='generateExecutionWeeklyPdf' type='button'>Generar reporte semanal</button></div>");const input=document.getElementById('executionReportDate'),button=document.getElementById('generateExecutionWeeklyPdf');input.onchange=()=>{executionReportDate=input.value||iso(0)};button.onclick=generateExecutionWeeklyPdf}
function generateExecutionWeeklyPdf(){const preview=window.open('','_blank');if(!preview){toast('El navegador bloqueó la vista previa de impresión');return}preview.document.open();preview.document.write(prepareBrowserPrintHtml(buildExecutionWeeklyPrintHtml(executionReportDate)));preview.document.close();preview.focus();const range=weeklyTurnRange(executionReportDate);toast('Reporte de asistencia: '+reportDate(range.monday)+' al '+reportDate(range.friday))}
function weeklyTurnRange(reference=weeklyReportDate){const selected=dateOnly(reference||iso(0)),offset=(selected.getDay()+6)%7,monday=new Date(selected);monday.setDate(selected.getDate()-offset);const days=Array.from({length:5},(_,index)=>{const date=new Date(monday);date.setDate(monday.getDate()+index);return date});return {monday,friday:days[4],days}}
function buildWeeklyTurnsPrintHtml(reference=weeklyReportDate){
 const now=new Date(),range=weeklyTurnRange(reference),dayNames=['Lunes','Martes','Miércoles','Jueves','Viernes'],keys=range.days.map(dateKey);
  const items=branchVisibleCases(cases).filter(c=>c.status!=='DADO DE BAJA'&&c.appointmentDate&&keys.includes(c.appointmentDate)&&(isProgrammed(c)||c.status==='REALIZADO')).sort((a,b)=>String(a.appointmentDate).localeCompare(String(b.appointmentDate))||String(a.time||'').localeCompare(String(b.time||''))||String(a.order).localeCompare(String(b.order)));
 const byDay=keys.map(key=>items.filter(c=>c.appointmentDate===key)),total=items.length,urgent=items.filter(c=>c.priority==='Urgente').length,completed=items.filter(c=>c.status==='REALIZADO'||c.executionStatus==='EJECUTADO').length,uniqueVehicles=new Set(items.map(c=>plateKey(c.plate)).filter(Boolean)).size;
 const conflicts=items.filter(c=>items.filter(item=>item.appointmentDate===c.appointmentDate&&item.time===c.time).length>1).length,busiestIndex=byDay.reduce((best,list,index)=>list.length>byDay[best].length?index:best,0),logoUrl=new URL('assets/logo-amiun.png',location.href).href;
 const daySections=byDay.map((list,index)=>{
  const rows=list.map(c=>"<tr class='"+(c.priority==='Urgente'?'urgent':'')+"'><td class='time'>"+escapeHtml(c.time||'Sin hora')+"</td><td class='order'>"+escapeHtml(c.order)+"</td><td>"+escapeHtml(c.plate||'-')+"</td><td>"+escapeHtml(c.client||'-')+"</td><td>"+escapeHtml(c.partCode||'-')+"</td><td>"+escapeHtml(c.part||'Sin especificar')+"</td></tr>").join('');
  return "<section class='day-block'><header><div><span>"+dayNames[index].toUpperCase()+"</span><strong>"+reportDate(range.days[index])+"</strong></div><b>"+list.length+" turno"+(list.length===1?'':'s')+"</b></header>"+(list.length?"<table><colgroup><col><col><col><col><col><col></colgroup><thead><tr><th>Hora</th><th>N.º OR</th><th>Patente</th><th>Cliente</th><th>Código</th><th>Repuesto</th></tr></thead><tbody>"+rows+"</tbody></table>":"<p>Sin turnos programados</p>")+"</section>";
 }).join('');
 const focus=conflicts?'Revisar coincidencias horarias antes de confirmar la agenda':urgent?'Priorizar la preparación de los casos urgentes':'Confirmar repuestos y capacidad antes del inicio de la semana';
 const css=":root{--red:#EB0A1E;--ink:#17191C;--graphite:#30343A;--muted:#68707D;--line:#DDE0E4;--soft:#F5F6F7;--green:#237B4B}*{box-sizing:border-box}html{background:#E9EAEC}body{margin:0;background:#FFF;color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;background:var(--ink)}.toolbar button{padding:9px 15px;border:1px solid #4B5057;background:#25282D;color:#FFF;font:700 12px Arial;cursor:pointer}.toolbar .primary{border-color:var(--red);background:var(--red)}.report{width:min(1120px,calc(100% - 32px));min-height:210mm;margin:20px auto;padding:11mm 12mm 9mm;background:#FFF;box-shadow:0 12px 40px rgba(17,24,39,.14)}.report-header{display:grid;grid-template-columns:180px 1fr 165px;align-items:center;gap:18px;padding-bottom:11px;border-bottom:2px solid var(--red)}.brand img{display:block;width:150px;height:38px;object-fit:contain;object-position:left}.title{text-align:center}.title h1{margin:0;font-size:21pt}.title p{margin:5px 0 0;color:var(--muted);font-size:9pt}.issued{justify-self:end;padding:8px 11px;border:1px solid var(--line);border-left:3px solid var(--red)}.issued span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.issued strong{display:block;margin-top:4px;font-size:8.5pt}.summary{margin-top:14px}.summary-label{margin:0;color:var(--muted);font-size:7pt;font-weight:700;letter-spacing:1px}.summary h2{margin:3px 0 10px;font-size:14pt}.metrics{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid var(--line)}.metric{position:relative;min-height:58px;padding:10px 11px;border-right:1px solid var(--line)}.metric:last-child{border:0}.metric:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:var(--graphite)}.metric.alert:before{background:var(--red)}.metric span{display:block;color:var(--muted);font-size:6.5pt;font-weight:700}.metric strong{display:block;margin-top:5px;font-size:18pt}.metric small{display:block;margin-top:3px;color:var(--muted);font-size:6pt}.focus{display:grid;grid-template-columns:1fr 1fr 2fr;margin-top:8px;border:1px solid var(--line);background:var(--soft)}.focus div{padding:7px 10px;border-right:1px solid var(--line)}.focus div:last-child{border:0;border-left:3px solid var(--red)}.focus span{display:block;color:var(--muted);font-size:6pt;font-weight:700}.focus strong{display:block;margin-top:3px;font-size:8pt}.agenda{margin-top:14px}.agenda-heading{display:flex;justify-content:space-between;align-items:end;padding-bottom:6px;border-bottom:2px solid var(--red)}.agenda-heading h2{margin:0;font-size:13pt}.agenda-heading p{margin:0;color:var(--muted);font-size:7pt}.day-block{margin-top:9px;border:1px solid var(--line);break-inside:avoid}.day-block>header{display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:var(--soft);border-left:4px solid var(--graphite)}.day-block>header span{display:inline-block;min-width:72px;font-size:7pt;font-weight:800}.day-block>header strong{font-size:7.5pt}.day-block>header b{font-size:7pt}.day-block>p{margin:0;padding:13px;text-align:center;color:var(--muted);font-size:7.5pt}table{width:100%;border-collapse:collapse;table-layout:fixed}col:nth-child(1){width:7%}col:nth-child(2){width:10%}col:nth-child(3){width:10%}col:nth-child(4){width:16%}col:nth-child(5){width:10%}col:nth-child(6){width:25%}col:nth-child(7){width:9%}col:nth-child(8){width:13%}th{padding:5px;background:var(--graphite);color:#FFF;font-size:6.2pt;text-align:left}td{padding:5px;border-top:1px solid var(--line);font-size:6.3pt;line-height:1.18;vertical-align:top;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#FAFAFA}tr.urgent{background:#FFF2F3!important;box-shadow:inset 3px 0 var(--red)}.time,.order{font-weight:700}.priority,.status{display:inline-block;padding:2px 4px;font-size:5.4pt;font-weight:700}.urgent-priority{background:#FDECEE;color:var(--red)}.status.scheduled{background:#EAF0F6;color:#3F5F80}.status.done{background:#E7F4EC;color:var(--green)}.report-footer{display:flex;justify-content:space-between;margin-top:10px;padding-top:6px;border-top:1px solid var(--line);color:var(--muted);font-size:6.5pt}@page{size:A4 landscape;margin:11mm 12mm}@media print{html,body{background:#FFF}.toolbar{display:none}.report{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}.report-header,.metrics,.focus,.agenda-heading,.day-block{break-inside:avoid}.report-footer{position:fixed;left:0;right:0;bottom:-6mm}}";
 return "<!doctype html><html lang='es'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>AGENDA_SEMANAL_TURNOS_"+dateKey(range.monday)+"_"+dateKey(range.friday)+"</title><style>"+css+"</style></head><body><nav class='toolbar'><button onclick='window.close()'>Cerrar</button><button class='primary' onclick='window.print()'>Guardar como PDF / Imprimir</button></nav><main class='report'><header class='report-header'><div class='brand'><img src='"+escapeHtml(logoUrl)+"' alt='Toyota Amiun'></div><div class='title'><h1>Agenda Semanal de Turnos</h1><p>Semana laboral del "+reportDate(range.monday)+" al "+reportDate(range.friday)+" · "+escapeHtml(reportBranchCaption())+"</p></div><div class='issued'><span>EMITIDO</span><strong>"+reportDateTime(now)+"</strong></div></header><section class='summary'><p class='summary-label'>PLANIFICACIÓN SEMANAL</p><h2>Carga operativa de taller</h2><div class='metrics'><article class='metric'><span>TURNOS</span><strong>"+total+"</strong><small>Total semanal</small></article><article class='metric'><span>VEHÍCULOS</span><strong>"+uniqueVehicles+"</strong><small>Patentes únicas</small></article><article class='metric "+(urgent?'alert':'')+"'><span>URGENTES</span><strong>"+urgent+"</strong><small>Prioridad inmediata</small></article><article class='metric "+(conflicts?'alert':'')+"'><span>COINCIDENCIAS</span><strong>"+conflicts+"</strong><small>Misma fecha y hora</small></article><article class='metric'><span>REALIZADOS</span><strong>"+completed+"</strong><small>Cierre registrado</small></article></div><div class='focus'><div><span>DÍA DE MAYOR CARGA</span><strong>"+(total?dayNames[busiestIndex]+' · '+byDay[busiestIndex].length+' turnos':'Sin turnos')+"</strong></div><div><span>DÍAS CON ACTIVIDAD</span><strong>"+byDay.filter(list=>list.length).length+" de 5</strong></div><div><span>FOCO DE GESTIÓN</span><strong>"+focus+"</strong></div></div></section><section class='agenda'><div class='agenda-heading'><h2>Detalle diario de turnos</h2><p>Ordenado por día, hora y N.º OR</p></div>"+daySections+"</section><footer class='report-footer'><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Documento de planificación interna</span></footer></main></body></html>";
}
function injectWeeklyReportControls(){if(currentView!=='appointments'||document.getElementById('generateWeeklyTurnsPdf'))return;const toolbar=document.querySelector('.section-toolbar'),pendingButton=document.getElementById('generateTurnsPdf');if(!toolbar||!pendingButton)return;pendingButton.textContent='Pendientes PDF';pendingButton.insertAdjacentHTML('afterend',"<button class='secondary-button report-button weekly-report-button' id='generateWeeklyTurnsPdf' type='button'>Reporte semanal</button>")}
function showWeeklyReportDialog(){document.querySelector('.weekly-report-backdrop')?.remove();const backdrop=document.createElement('div');backdrop.className='weekly-report-backdrop';backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','weeklyReportDialogTitle');backdrop.innerHTML=`<section class="weekly-report-dialog"><header><div><span>AGENDA DE TURNOS</span><h2 id="weeklyReportDialogTitle">Seleccionar semana</h2><p>Elegí cualquier día. El reporte tomará automáticamente de lunes a viernes.</p></div><button type="button" data-close-weekly-report aria-label="Cerrar">×</button></header><div class="weekly-report-selection"><label for="weeklyReportDialogDate">Día de referencia<input id="weeklyReportDialogDate" type="date" value="${escapeHtml(weeklyReportDate)}"></label><div><span>PERÍODO DEL REPORTE</span><strong data-weekly-period></strong></div></div><footer><button class="secondary-button" type="button" data-close-weekly-report>Cancelar</button><button class="primary-button" type="button" data-confirm-weekly-report>Generar reporte</button></footer></section>`;document.body.appendChild(backdrop);const input=backdrop.querySelector('#weeklyReportDialogDate'),period=backdrop.querySelector('[data-weekly-period]'),updatePeriod=()=>{weeklyReportDate=input.value||iso(0);const range=weeklyTurnRange(weeklyReportDate);period.textContent=`${reportDate(range.monday)} al ${reportDate(range.friday)}`},close=()=>backdrop.remove();updatePeriod();input.onchange=updatePeriod;backdrop.querySelectorAll('[data-close-weekly-report]').forEach(button=>button.onclick=close);backdrop.querySelector('[data-confirm-weekly-report]').onclick=()=>{updatePeriod();close();generateWeeklyTurnsPdf()};backdrop.onclick=event=>{if(event.target===backdrop)close()};input.focus()}
function weeklyPortraitStyles(){return "@page{size:A4 portrait;margin:12mm 13mm}.report{width:min(780px,calc(100% - 28px));padding:11mm 12mm 9mm}.report-header{grid-template-columns:135px 1fr 128px;gap:12px}.brand img{width:122px;height:34px}.title h1{font-size:18pt}.title p{font-size:9.5pt}.issued{min-width:0;padding:7px 8px}.issued span{font-size:7pt}.issued strong{font-size:8pt}.summary{margin-top:12px}.summary h2{font-size:15pt}.metrics{grid-template-columns:repeat(5,1fr)}.metric{min-height:66px;padding:11px 9px}.metric span{font-size:7.2pt}.metric strong{font-size:20pt}.metric small{font-size:6.8pt;line-height:1.2}.focus{grid-template-columns:1fr 1fr}.focus div{padding:9px 10px}.focus div:last-child{grid-column:1/-1;border-top:1px solid var(--line);border-left:3px solid var(--red)}.focus span{font-size:7pt}.focus strong{font-size:9pt}.agenda-heading h2{font-size:14pt}.agenda-heading p{font-size:8pt}.day-block{margin-top:10px;break-inside:auto}.day-block>header{padding:8px 10px}.day-block>header span{font-size:8pt}.day-block>header strong,.day-block>header b{font-size:8.5pt}.day-block table,.day-block tbody{display:block}.day-block thead{display:none}.day-block tbody tr{display:grid;grid-template-columns:70px 86px 96px minmax(0,1fr);background:#FFF!important;break-inside:avoid;page-break-inside:avoid}.day-block tbody tr+tr{border-top:1px solid var(--line)}.day-block td{display:block;min-width:0;padding:7px 8px;border:0;font-size:8.5pt;line-height:1.28;overflow-wrap:anywhere}.day-block td:before{display:block;margin-bottom:3px;color:var(--muted);font-size:6.5pt;font-weight:700;letter-spacing:.35px}.day-block td:nth-child(1):before{content:'HORA'}.day-block td:nth-child(2):before{content:'N.º OR'}.day-block td:nth-child(3):before{content:'PATENTE'}.day-block td:nth-child(4):before{content:'CLIENTE'}.day-block td:nth-child(5):before{content:'PRIORIDAD'}.day-block td:nth-child(6):before{content:'REPUESTO'}.day-block td:nth-child(7):before{content:'TIEMPO'}.day-block td:nth-child(8):before{content:'ESTADO'}.priority,.status{font-size:7pt;padding:3px 5px}.day-block>p{font-size:9pt;padding:15px}.report-footer{font-size:7.5pt}@media print{.report{width:auto;padding:0}.report-header,.metrics,.focus,.agenda-heading{break-inside:avoid}.day-block{break-inside:auto}.day-block>header{break-after:avoid}.report-footer{position:static;margin-top:12px}}"}
function weeklyDailyTableStyles(){return ".day-block table{display:table;width:100%;table-layout:fixed}.day-block thead{display:table-header-group}.day-block tbody{display:table-row-group}.day-block tbody tr{display:table-row;background:#FFF!important;break-inside:avoid;page-break-inside:avoid}.day-block tbody tr:nth-child(even){background:#F8F9FA!important}.day-block tbody tr.urgent{background:#FFF2F3!important}.day-block th{display:table-cell;padding:6px 5px;font-size:7.2pt;line-height:1.15;vertical-align:middle}.day-block td{display:table-cell;padding:7px 5px;font-size:7.7pt;line-height:1.25;vertical-align:top;border-top:1px solid var(--line)}.day-block td:before{display:none!important;content:none!important}.day-block col:nth-child(1){width:9%}.day-block col:nth-child(2){width:12%}.day-block col:nth-child(3){width:12%}.day-block col:nth-child(4){width:19%}.day-block col:nth-child(5){width:16%}.day-block col:nth-child(6){width:32%}.day-block>header{break-after:avoid;page-break-after:avoid}.day-block thead{break-after:avoid;page-break-after:avoid}"}
function generateWeeklyTurnsPdf(){const preview=window.open('','_blank');if(!preview){toast('El navegador bloqueó la vista previa de impresión');return}const report=buildWeeklyTurnsPrintHtml(weeklyReportDate).replace(/<section class='summary'>[\s\S]*?<\/section><section class='agenda'>/,"<section class='agenda'>"),html=prepareBrowserPrintHtml(report.replace('</style>',weeklyPortraitStyles()+weeklyDailyTableStyles()+'</style>'));preview.document.open();preview.document.write(html);preview.document.close();preview.focus();const range=weeklyTurnRange(weeklyReportDate);toast('Reporte semanal vertical: '+reportDate(range.monday)+' al '+reportDate(range.friday))}
function generatePartsPendingPdf(){const preview=window.open('','_blank');if(!preview){toast('El navegador bloqueó la vista previa de impresión');return}preview.document.open();preview.document.write(prepareBrowserPrintHtml(buildPartsPrintHtml()));preview.document.close();preview.focus();toast('Vista previa del reporte abierta')}
function generateTurnsPendingPdf(){const preview=window.open('','_blank');if(!preview){toast('El navegador bloqueó la vista previa de impresión');return}preview.document.open();preview.document.write(prepareBrowserPrintHtml(buildTurnsPrintHtml()));preview.document.close();preview.focus();toast('Vista previa del reporte de turnos abierta')}
function bindReportControls(){const partsButton=document.getElementById('generatePartsPdf'),turnsButton=document.getElementById('generateTurnsPdf'),weeklyButton=document.getElementById('generateWeeklyTurnsPdf');if(partsButton)partsButton.onclick=generatePartsPendingPdf;if(turnsButton)turnsButton.onclick=generateTurnsPendingPdf;if(weeklyButton)weeklyButton.onclick=showWeeklyReportDialog}
function bindTurnViewControls(){document.querySelectorAll('[data-turn-view]').forEach(button=>button.onclick=()=>{turnFilter=button.dataset.turnView;render()});const select=document.getElementById('turnFilterSelect');if(select)select.onchange=()=>{turnFilter=select.value;render()};const sortSelect=document.getElementById('turnsSortSelect');if(sortSelect)sortSelect.onchange=()=>{turnsSort=sortSelect.value;const priority=document.getElementById('priorityFilter')?.value||'';let items=filterTurns(filtered(getViewCases('appointments')));if(priority)items=items.filter(c=>c.priority===priority);document.getElementById('caseTable').innerHTML=turnsTable(items);bindInteractiveTables()}}
function bindPartsViewControls(){document.querySelectorAll('[data-parts-view]').forEach(button=>button.onclick=()=>{partsFilter=button.dataset.partsView;render()});const select=document.getElementById('partsFilterSelect');if(select)select.onchange=()=>{partsFilter=select.value;render()};const sortSelect=document.getElementById('partsSortSelect');if(sortSelect)sortSelect.onchange=()=>{partsSort=sortSelect.value;const priority=document.getElementById('priorityFilter')?.value||'';let items=filterParts(filtered(getViewCases('parts')));if(priority)items=items.filter(c=>c.priority===priority);document.getElementById('caseTable').innerHTML=partsTable(items);bindInteractiveTables()}}
function summaryActiveCases(){
  return filterByToyota10(
    filterByVor(branchVisibleCases(cases).filter(item=>item.status!=='DADO DE BAJA'&&item.status!=='REALIZADO'),summaryVorFilter),
    summaryToyota10Filter
  );
}
function summaryPendingParts(items){
  return items.filter(item=>item.requested&&!item.arrived&&item.requestDate);
}
function summaryPendingTurns(items){
  return items.filter(item=>item.arrived&&item.arrivalDate&&!item.vor&&!isProgrammed(item));
}
function summaryBucketData(items,dateField){
  const models=[
    {key:'fresh',label:'0 a 7 días',note:'En flujo',min:0,max:7},
    {key:'watch',label:'8 a 14 días',note:'Seguimiento',min:8,max:14},
    {key:'risk',label:'15 a 21 días',note:'Riesgo',min:15,max:21},
    {key:'critical',label:'22+ días',note:'Crítico',min:22,max:Infinity}
  ];
  return models.map(model=>({...model,items:items.filter(item=>{const age=Math.max(0,daysFrom(item[dateField]));return age>=model.min&&age<=model.max})}));
}
function summaryArea(label,shortLabel,items,dateField,mode){
  const buckets=summaryBucketData(items,dateField);
  const maximum=items.length?Math.max(...items.map(item=>Math.max(0,daysFrom(item[dateField])))):0;
  const score=buckets[3].items.length*4+buckets[2].items.length*2+buckets[1].items.length;
  return {label,shortLabel,items,dateField,mode,buckets,maximum,score};
}
function summaryFilters(total){
  return `<div class="section-toolbar summary-toolbar summary-control-bar">
    <nav class="summary-primary-tabs" aria-label="Vistas del resumen">
      <button type="button" data-summary-mode="bottlenecks" class="${summaryMode==='bottlenecks'?'active':''}">Cuellos de botella</button>
      <button type="button" data-summary-mode="parts" class="${summaryMode==='parts'?'active':''}">Repuestos</button>
      <button type="button" data-summary-mode="turns" class="${summaryMode==='turns'?'active':''}">Turnos</button>
    </nav>
    <div class="summary-filter-group">
      <label class="vor-filter-control compact" for="summaryVorFilter"><span>VOR</span><select id="summaryVorFilter"><option value="all" ${summaryVorFilter==='all'?'selected':''}>Todos</option><option value="with" ${summaryVorFilter==='with'?'selected':''}>Con VOR</option><option value="without" ${summaryVorFilter==='without'?'selected':''}>Sin VOR</option></select></label>
      <label class="vor-filter-control compact toyota10-filter-control" for="summaryToyota10Filter"><span>T10</span><select id="summaryToyota10Filter"><option value="all" ${summaryToyota10Filter==='all'?'selected':''}>Todos</option><option value="with" ${summaryToyota10Filter==='with'?'selected':''}>Con Toyota 10</option><option value="without" ${summaryToyota10Filter==='without'?'selected':''}>Sin Toyota 10</option></select></label>
      <span class="date-chip summary-case-count"><strong>${total}</strong> ${total===1?'caso visible':'casos visibles'}</span>
    </div>
  </div>`;
}
function bottleneckRangeCard(bucket,total){
  const percent=total?Math.round(bucket.items.length/total*100):0;
  return `<article class="bottleneck-range ${bucket.key}"><div><span>${bucket.label}</span><small>${bucket.note}</small></div><strong>${bucket.items.length}<small> ${bucket.items.length===1?'caso':'casos'}</small></strong><b>${percent}%</b></article>`;
}
function bottleneckLane(area){
  const segments=area.buckets.map(bucket=>{const width=area.items.length?bucket.items.length/area.items.length*100:25;return `<i class="${bucket.key}" style="width:${width}%" title="${bucket.label}: ${bucket.items.length}"></i>`}).join('');
  return `<section class="summary-bottleneck-lane">
    <header><div class="summary-area-mark">${area.shortLabel}</div><div><h2>${area.label}</h2><p>${area.items.length} ${area.items.length===1?'caso pendiente':'casos pendientes'} · máximo ${area.maximum} días hábiles</p></div><button type="button" class="text-button" data-summary-mode="${area.mode}">Ver detalle</button></header>
    <div class="bottleneck-range-grid">${area.buckets.map(bucket=>bottleneckRangeCard(bucket,area.items.length)).join('')}</div>
    <div class="summary-distribution" aria-label="Distribución de ${area.label}">${segments}</div>
  </section>`;
}
function bottleneckComparison(partsArea,turnsArea){
  const principal=partsArea.score===turnsArea.score?(partsArea.items.length>=turnsArea.items.length?partsArea:turnsArea):(partsArea.score>turnsArea.score?partsArea:turnsArea);
  const delayed=principal.buckets[2].items.length+principal.buckets[3].items.length;
  const stateKey=principal.buckets[3].items.length?'critical':principal.buckets[2].items.length?'risk':principal.buckets[1].items.length?'watch':'ok';
  const stateLabel={critical:'Crítico',risk:'Riesgo',watch:'Seguimiento',ok:'Controlado'}[stateKey];
  return `<div class="summary-comparison-grid">
    <section class="summary-focus-panel ${stateKey}"><span>CUELLO PRINCIPAL</span><div><strong>${principal.label}</strong><b>${stateLabel}</b></div><p>${delayed} ${delayed===1?'caso fuera':'casos fuera'} del flujo esperado. Máxima antigüedad: ${principal.maximum} días hábiles.</p><button type="button" class="primary-button" data-summary-mode="${principal.mode}">Ver casos</button></section>
    <section class="summary-comparison-panel"><header><div><h2>Comparación por antigüedad</h2><p>Lectura conjunta del trabajo pendiente</p></div></header><div class="table-wrap"><table class="summary-comparison-table"><thead><tr><th>ÁREA</th><th>0 a 7</th><th>8 a 14</th><th>15 a 21</th><th>22+</th><th>TOTAL</th></tr></thead><tbody>${[partsArea,turnsArea].map(area=>`<tr><th>${area.label}</th>${area.buckets.map(bucket=>`<td class="${bucket.key}">${bucket.items.length}</td>`).join('')}<td><strong>${area.items.length}</strong></td></tr>`).join('')}</tbody></table></div></section>
  </div>`;
}
function bottleneckDashboard(partsArea,turnsArea){
  const critical=partsArea.buckets[3].items.length+turnsArea.buckets[3].items.length;
  const risk=partsArea.buckets[2].items.length+turnsArea.buckets[2].items.length;
  const principal=partsArea.score===turnsArea.score?(partsArea.items.length>=turnsArea.items.length?partsArea:turnsArea):(partsArea.score>turnsArea.score?partsArea:turnsArea);
  return `<section class="summary-bottleneck-kpis">
    <article><span>REPUESTOS SIN ARRIBO</span><strong>${partsArea.items.length}</strong><small>requieren seguimiento</small></article>
    <article><span>TURNOS SIN PROGRAMAR</span><strong>${turnsArea.items.length}</strong><small>clientes por coordinar</small></article>
    <article class="${critical?'critical':''}"><span>CASOS CRÍTICOS</span><strong>${critical}</strong><small>${risk} adicionales en riesgo</small></article>
    <article class="principal"><span>CUELLO PRINCIPAL</span><strong>${principal.label}</strong><small>${principal.maximum} días de antigüedad máxima</small></article>
  </section><div class="summary-bottleneck-grid">${bottleneckLane(partsArea)}${bottleneckLane(turnsArea)}</div><div class="summary-range-legend"><span class="fresh">0 a 7 · En flujo</span><span class="watch">8 a 14 · Seguimiento</span><span class="risk">15 a 21 · Riesgo</span><span class="critical">22+ · Acción inmediata</span></div>${bottleneckComparison(partsArea,turnsArea)}`;
}
dashboardV2=function(){
  const scoped=summaryActiveCases();
  const pendingParts=summaryPendingParts(scoped).sort((a,b)=>daysFrom(b.requestDate)-daysFrom(a.requestDate));
  const pendingTurns=summaryPendingTurns(scoped).sort((a,b)=>daysFrom(b.arrivalDate)-daysFrom(a.arrivalDate));
  const partsArea=summaryArea('Repuestos','RP',pendingParts,'requestDate','parts');
  const turnsArea=summaryArea('Turnos','TU',pendingTurns,'arrivalDate','turns');
  if(summaryMode==='bottlenecks'){
    const total=pendingParts.length+pendingTurns.length;
    return `${heading('Control de cuellos de botella','Repuestos sin arribo y turnos sin programar, clasificados por antigüedad.','RESUMEN OPERATIVO')}${summaryFilters(total)}${bottleneckDashboard(partsArea,turnsArea)}`;
  }
  const base=summaryMode==='turns'?pendingTurns:pendingParts;
  const area=summaryMode==='turns'?turnsArea:partsArea;
  const ranges=area.buckets.map(bucket=>({title:bucket.label,range:bucket.note==='En flujo'?(summaryMode==='turns'?'Desde arribo reciente':'Desde pedido reciente'):bucket.note,items:bucket.items,tone:bucket.key}));
  const subtitle=summaryMode==='turns'?'Turnos no programados agrupados por días hábiles desde el arribo.':'Repuestos no arribados agrupados por días hábiles desde que se pidieron.';
  return `${heading(summaryMode==='turns'?'Turnos pendientes de coordinación':'Repuestos pendientes de arribo',subtitle,'RESUMEN OPERATIVO')}${summaryFilters(base.length)}${summaryMode==='turns'?turnsCharts(base):''}<div class="demand-grid">${ranges.map(range=>demandTable(range.title,range.range,range.items,range.tone)).join('')}</div>`;
};

const renderListWithVorButtons=listView;
listView=function(){
  let html=renderListWithVorButtons();
  if(currentView!=='vor') return html;
  const oldFilter=`<div class="segmented-filter" id="vorFilter"><button data-vor-view="all" class="${vorFilter==='all'?'active':''}">Todos</button><button data-vor-view="not-notified" class="${vorFilter==='not-notified'?'active':''}">No avisado</button><button data-vor-view="notified" class="${vorFilter==='notified'?'active':''}">Avisado</button><button data-vor-view="done" class="${vorFilter==='done'?'active':''}">Realizado</button></div>`;
  const newFilter=`<label class="vor-filter-control compact operational-filter-control" for="vorFilterSelect"><span>ESTADO</span><select id="vorFilterSelect"><option value="all" ${vorFilter==='all'?'selected':''}>Todos</option><option value="not-notified" ${vorFilter==='not-notified'?'selected':''}>No avisado</option><option value="notified" ${vorFilter==='notified'?'selected':''}>Avisado</option><option value="done" ${vorFilter==='done'?'selected':''}>Realizado</option></select></label>`;
  html=html.replace(oldFilter,newFilter);
  html=html.replace('<th>VOR</th><th>OBSERVACIONES</th>','');
  return html.replace(/<td><span class="vor-value active">SÍ<\/span><\/td><td class="turn-text">[\s\S]*?<\/td>/g,'');
};
function bindVorViewControls(){
  const select=document.getElementById('vorFilterSelect');
  if(select) select.onchange=()=>{vorFilter=select.value;render()};
  document.querySelectorAll('[data-vor-view]').forEach(button=>button.onclick=()=>{vorFilter=button.dataset.vorView;render()});
}
function bindSummaryControls(){document.querySelectorAll('[data-summary-mode]').forEach(button=>button.onclick=()=>{summaryMode=button.dataset.summaryMode;render()});const summaryVor=document.getElementById('summaryVorFilter');if(summaryVor)summaryVor.onchange=()=>{summaryVorFilter=summaryVor.value;render()};const databaseVor=document.getElementById('databaseVorFilter');if(databaseVor)databaseVor.onchange=()=>{databaseVorFilter=databaseVor.value;render()};const databaseBranch=document.getElementById('databaseBranchFilter');if(databaseBranch)databaseBranch.onchange=()=>{databaseBranchFilter=databaseBranch.value;render()};const summaryToyota10=document.getElementById('summaryToyota10Filter');if(summaryToyota10)summaryToyota10.onchange=()=>{summaryToyota10Filter=summaryToyota10.value;render()};const databaseToyota10=document.getElementById('databaseToyota10Filter');if(databaseToyota10)databaseToyota10.onchange=()=>{databaseToyota10Filter=databaseToyota10.value;render()};const partsToyota10=document.getElementById('partsToyota10Filter');if(partsToyota10)partsToyota10.onchange=()=>{partsToyota10Filter=partsToyota10.value;render()};const turnsToyota10=document.getElementById('turnsToyota10Filter');if(turnsToyota10)turnsToyota10.onchange=()=>{turnsToyota10Filter=turnsToyota10.value;render()}}
function bindDatabasePagination(){document.querySelectorAll('[data-database-page]').forEach(button=>button.onclick=()=>{databasePage=Math.max(1,databasePage+(button.dataset.databasePage==='next'?1:-1));render()})}
function bindCalendarControls(){document.querySelectorAll('[data-calendar-view]').forEach(button=>button.onclick=()=>{calendarMode=button.dataset.calendarView;render()});document.querySelectorAll('[data-calendar-shift]').forEach(button=>button.onclick=()=>{const step=calendarMode==='month'?31:calendarMode==='day'?1:7;calendarOffset+=Number(button.dataset.calendarShift)*step;render()});document.querySelectorAll('[data-calendar-order]').forEach(el=>el.onclick=()=>{selectedCalendarOrder=el.dataset.calendarOrder;render()});document.querySelectorAll('[data-calendar-day]').forEach(button=>button.onclick=()=>{const target=new Date(button.dataset.calendarDay+'T00:00:00');calendarOffset=Math.round((target-new Date(iso(0)+'T00:00:00'))/86400000);calendarMode='day';render()});const todayButton=document.querySelector('[data-calendar-today]');if(todayButton)todayButton.onclick=()=>{calendarOffset=0;render()};const priority=document.getElementById('calendarPriority');if(priority)priority.onchange=()=>{calendarPriority=priority.value;selectedCalendarOrder='';render()}}
function auditTimestamp(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(date);
}
function auditEntries(){
  const activeEntries=branchVisibleCases(cases).flatMap(record=>(Array.isArray(record.auditHistory)?record.auditHistory:[])
    .map((entry,index)=>({...entry,changes:manualAuditChanges(entry.changes||[]),historyId:String(entry.id||`${record.order}-${entry.at||'sin-fecha'}-${index}`),order:record.order,plate:record.plate,client:record.client,branch:record.branch||'Santa Fe',currentStatus:record.status}))
    .filter(entry=>String(entry.user||'').trim().toLowerCase()!=='sistema')
    .filter(entry=>entry.action==='Caso creado'||entry.changes.length));
  const deletedEntries=deletedCaseAudit.filter(entry=>canViewOtherBranches()||(entry.branch||'Santa Fe')===(currentApplicationUser()?.branch||'Santa Fe')).map((entry,index)=>({...entry,deleted:true,changes:entry.changes||[],historyId:String(entry.id||`deleted-${entry.order}-${entry.at||index}`),currentStatus:'ELIMINADO',branch:entry.branch||'Santa Fe'}));
  return [...activeEntries,...deletedEntries].sort((a,b)=>String(b.at).localeCompare(String(a.at)));
}
function auditType(entry){
  if(entry.deleted)return 'ELIMINACIÓN';
  const changes=entry.changes||[],keys=changes.map(change=>change.key),values=changes.flatMap(change=>[change.before,change.after]).map(value=>String(value||'').toUpperCase());
  if(values.some(value=>['DADO DE BAJA','REPROGRAMAR','TURNO SIN REPUESTO','NO EJECUTADO','PÉRDIDA','TIRADA'].includes(value)))return 'EXCEPCIÓN';
  if(keys.some(key=>['arrived','arrivalDate','partCode','part','depositStatus'].includes(key)))return 'REPUESTO';
  if(keys.some(key=>['appointmentDate','time','scheduled','firstConversation','executionStatus','executionDate','executionTime'].includes(key)))return 'PROGRAMACIÓN';
  if(keys.includes('status')||keys.includes('vorStatus'))return 'ESTADO';
  return 'DATOS';
}
function auditLevel(entry){const type=auditType(entry);return ['EXCEPCIÓN','ELIMINACIÓN'].includes(type)?'critical':['ESTADO','PROGRAMACIÓN'].includes(type)?'watch':'normal'}
function historyFieldLabel(value){
  const labels={deleted:'Eliminación definitiva',manualStatus:'Resultado confirmado manualmente',missingSince:'Inicio del período sin repuesto',appointmentDate:'Fecha del turno',time:'Hora del turno',scheduled:'Turno programado',status:'Estado del caso',arrived:'Arribo confirmado',arrivalDate:'Fecha de arribo',firstConversation:'Primera conversación',comment:'Comentario',vorStatus:'Estado VOR',executionStatus:'Resultado del turno',executionDate:'Fecha de ejecución',executionTime:'Hora de ejecución'};
  return labels[value]||value||'Dato actualizado';
}
function historyDisplayValue(key,value){
  const text=String(value??'').trim();
  if(!text||text==='Sin dato')return 'Sin dato';
  if(['executionDate','appointmentDate','arrivalDate','missingSince','firstConversation'].includes(key)&&/^\d{4}-\d{2}-\d{2}$/.test(text)){
    const [year,month,day]=text.split('-');
    return `${day}/${month}/${year}`;
  }
  return text;
}
function historyDayKey(value){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'sin-fecha':`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function historyDayLabel(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Fecha no disponible';
  const todayKey=historyDayKey(new Date()),yesterday=new Date();
  yesterday.setDate(yesterday.getDate()-1);
  if(historyDayKey(date)===todayKey)return 'Hoy';
  if(historyDayKey(date)===historyDayKey(yesterday))return 'Ayer';
  return new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(date).replace(/^./,letter=>letter.toUpperCase());
}
function historyTimeLabel(value){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'--:--':new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit'}).format(date);
}
function historyResponsibleRole(entry){
  const account=Object.values(typeof APPLICATION_USERS==='undefined'?{}:APPLICATION_USERS).find(user=>String(user.displayName||user.username).toLowerCase()===String(entry.user||'').toLowerCase());
  return account?.role||'Usuario del sistema';
}
function historyMovementSummary(entry){
  if(entry.deleted)return 'Eliminó definitivamente el caso; la evidencia quedó conservada.';
  const changes=entry.changes||[];
  if(!changes.length)return 'Registró el caso en el sistema.';
  const first=changes[0],key=first.key||first.field,label=historyFieldLabel(key),before=historyDisplayValue(key,first.before),after=historyDisplayValue(key,first.after),extra=changes.length>1?` · ${changes.length-1} ${changes.length===2?'cambio adicional':'cambios adicionales'}`:'';
  return `${label}: ${before} → ${after}${extra}`;
}
function historySourceLabel(entry){
  const type=auditType(entry);
  return type==='PROGRAMACIÓN'?'Turnos':type==='REPUESTO'?'Repuestos':type==='ELIMINACIÓN'?'Base de datos':type==='EXCEPCIÓN'?'Gestión del caso':type==='ESTADO'?'Estado del caso':'Ficha del caso';
}
function historyGroupsMarkup(items){
  const groups=[];
  items.forEach(entry=>{const key=historyDayKey(entry.at),last=groups[groups.length-1];if(last?.key===key)last.items.push(entry);else groups.push({key,label:historyDayLabel(entry.at),items:[entry]})});
  return groups.map(group=>`<section class="history-day-group"><header><div><span>${escapeHtml(group.label)}</span><small>${group.key==='sin-fecha'?'':escapeHtml(group.key.split('-').reverse().join('/'))}</small></div><strong>${group.items.length} ${group.items.length===1?'movimiento':'movimientos'}</strong></header><div class="history-day-list">${group.items.map(entry=>{const type=auditType(entry),level=auditLevel(entry);return `<button type="button" class="history-log-row history-${level}" data-history-detail="${escapeHtml(entry.historyId)}"><time>${escapeHtml(historyTimeLabel(entry.at))}</time><span class="history-log-symbol" aria-hidden="true">${type==='ELIMINACIÓN'?'×':type==='REPUESTO'?'RP':type==='PROGRAMACIÓN'?'TU':type==='EXCEPCIÓN'?'!':'•'}</span><span class="history-log-action"><strong>${escapeHtml(entry.action||'Actualización')}</strong><small>${escapeHtml(historyMovementSummary(entry))}</small></span><span class="history-log-case"><small>CASO</small><strong>${escapeHtml(entry.order||'-')}</strong><span>${escapeHtml(entry.plate||'-')} · ${escapeHtml(entry.client||'-')} · ${escapeHtml(entry.branch||'Santa Fe')}</span></span><span class="history-log-user"><small>RESPONSABLE</small><strong>${escapeHtml(entry.user||'Sistema')}</strong><span>${escapeHtml(historyResponsibleRole(entry))}</span></span><span class="history-type ${level}">${escapeHtml(type)}</span><span class="history-log-arrow" aria-hidden="true">›</span></button>`}).join('')}</div></section>`).join('');
}
function openHistoryDetail(historyId){
  const entry=auditEntries().find(item=>item.historyId===historyId);
  if(!entry)return;
  document.querySelector('.history-modal-backdrop')?.remove();
  const level=auditLevel(entry),type=auditType(entry),backdrop=document.createElement('div');
  backdrop.className='history-modal-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','historyModalTitle');
  backdrop.innerHTML=`<article class="history-modal"><header><span class="history-modal-mark" aria-hidden="true">HT</span><div><span class="history-type ${level}">${escapeHtml(type)}</span><h2 id="historyModalTitle">${escapeHtml(entry.action||'Actualización del caso')}</h2><p>${escapeHtml(auditTimestamp(entry.at))} · ${escapeHtml(historySourceLabel(entry))}</p></div><button type="button" class="history-modal-close" data-history-close aria-label="Cerrar">×</button></header><section class="history-modal-summary"><strong>Acción registrada</strong><p>${escapeHtml(historyMovementSummary(entry))}</p></section><section class="history-modal-identity"><div><small>NRO OR</small><strong>${escapeHtml(entry.order||'-')}</strong></div><div><small>PATENTE</small><strong>${escapeHtml(entry.plate||'-')}</strong></div><div><small>CLIENTE</small><strong>${escapeHtml(entry.client||'-')}</strong></div><div><small>SUCURSAL</small><strong>${escapeHtml(entry.branch||'Santa Fe')}</strong></div><div><small>RESPONSABLE</small><strong>${escapeHtml(entry.user||'Sistema')}</strong><span>${escapeHtml(historyResponsibleRole(entry))}</span></div><div><small>SECCIÓN DE ORIGEN</small><strong>${escapeHtml(historySourceLabel(entry))}</strong></div><div><small>ESTADO ACTUAL</small><span class="badge ${badgeClass(entry.currentStatus)}">${escapeHtml(entry.currentStatus||'SIN ESTADO')}</span></div></section><section class="history-modal-changes"><header><div><span>DETALLE DE LA ACCIÓN</span><h3>${entry.changes?.length?`${entry.changes.length} ${entry.changes.length===1?'dato modificado':'datos modificados'}`:'Registro inicial'}</h3></div></header>${entry.changes?.length?entry.changes.map(change=>{const key=change.key||change.field;return `<div class="history-modal-change"><strong>${escapeHtml(historyFieldLabel(key))}</strong><div><span><small>ANTES</small><b>${escapeHtml(historyDisplayValue(key,change.before))}</b></span><i aria-hidden="true">→</i><span><small>DESPUÉS</small><b>${escapeHtml(historyDisplayValue(key,change.after))}</b></span></div></div>`}).join(''):`<p class="history-no-changes">Este movimiento corresponde al alta inicial del caso y no tiene un valor anterior para comparar.</p>`}</section><footer>${entry.deleted?`<p class="history-deleted-note">Caso eliminado definitivamente. El registro de auditoría se conserva.</p>`:`<button class="secondary-button" type="button" data-history-open="${escapeHtml(entry.order)}">Abrir ficha del caso</button>`}<button class="primary-button" type="button" data-history-close>Entendido</button></footer></article>`;
  document.body.appendChild(backdrop);
  const close=()=>backdrop.remove();
  backdrop.querySelectorAll('[data-history-close]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  backdrop.querySelector('[data-history-open]')?.addEventListener('click',async event=>{const order=event.currentTarget.dataset.historyOpen;if(!branchVisibleCases(cases).some(item=>item.order===order)){toast('El caso fue eliminado o no está disponible para tu sucursal');return}if(!(await acquireCaseLock(order,'Historial')))return;close();selectedDatabaseOrder=order;currentView='database';render()});
  backdrop.querySelector('[data-history-close]')?.focus();
}
function historyView(){
  const all=auditEntries(),needle=historyQuery.trim().toLowerCase(),actions=[...new Set(all.map(entry=>entry.action).filter(Boolean))].sort(),branchOptions=USER_BRANCHES.filter(branch=>canViewOtherBranches()||branch===(currentApplicationUser()?.branch||'Santa Fe')),activeBranch=branchOptions.includes(historyBranchFilter)?historyBranchFilter:'all';
  if(activeBranch!==historyBranchFilter)historyBranchFilter='all';
  const items=all.filter(entry=>(!needle||[entry.order,entry.plate,entry.client,entry.user,entry.action,entry.branch,historyMovementSummary(entry)].some(value=>String(value||'').toLowerCase().includes(needle)))&&(!historyActionFilter||entry.action===historyActionFilter)&&(!historyTypeFilter||auditType(entry)===historyTypeFilter)&&(activeBranch==='all'||(entry.branch||'Santa Fe')===activeBranch)),today=all.filter(entry=>historyDayKey(entry.at)===historyDayKey(new Date())).length,critical=all.filter(entry=>auditLevel(entry)==='critical').length,changedCases=new Set(all.map(entry=>entry.order)).size;
  return `${heading('Historial y trazabilidad','Registro claro de las acciones realizadas por cada usuario.','BITÁCORA OPERATIVA')}<section class="history-command-bar" aria-label="Resumen del historial"><div><span>MOVIMIENTOS DE HOY</span><strong>${today}</strong></div><div class="${critical?'attention':''}"><span>ACCIONES CRÍTICAS</span><strong>${critical}</strong></div><div><span>CASOS CON TRAZABILIDAD</span><strong>${changedCases}</strong></div><p><strong>Lectura operativa</strong><span>Cada fila representa una decisión manual. Tocá un movimiento para consultar su ficha completa.</span></p></section><form class="history-toolbar" id="historyFilterForm"><label><span>BUSCAR MOVIMIENTO</span><input id="historyQuery" value="${escapeHtml(historyQuery)}" placeholder="Orden, patente, cliente o responsable"></label><label><span>SUCURSAL</span><select id="historyBranchFilter"><option value="all" ${activeBranch==='all'?'selected':''}>Todas</option>${branchOptions.map(branch=>`<option value="${escapeHtml(branch)}" ${activeBranch===branch?'selected':''}>${escapeHtml(branch)}</option>`).join('')}</select></label><label><span>TIPO DE ACCIÓN</span><select id="historyTypeFilter"><option value="">Todos los tipos</option>${['ELIMINACIÓN','EXCEPCIÓN','REPUESTO','PROGRAMACIÓN','ESTADO','DATOS'].map(type=>`<option ${historyTypeFilter===type?'selected':''}>${type}</option>`).join('')}</select></label><label><span>ACCIÓN REALIZADA</span><select id="historyActionFilter"><option value="">Todas las acciones</option>${actions.map(action=>`<option ${historyActionFilter===action?'selected':''}>${escapeHtml(action)}</option>`).join('')}</select></label><button class="secondary-button" type="button" id="clearHistoryFilters">Limpiar</button><div class="history-result"><strong>${items.length}</strong><span>${items.length===1?'resultado':'resultados'}</span></div></form><section class="history-log">${items.length?historyGroupsMarkup(items):`<div class="panel empty-state"><span class="empty-icon">□</span><h3>Sin movimientos registrados</h3><p>${all.length?'No hay resultados para los filtros aplicados.':'Las próximas acciones manuales aparecerán aquí con usuario, fecha y hora.'}</p></div>`}</section>`;
}
function bindHistoryView(){
  const form=document.getElementById('historyFilterForm'),search=document.getElementById('historyQuery'),branch=document.getElementById('historyBranchFilter'),type=document.getElementById('historyTypeFilter'),action=document.getElementById('historyActionFilter'),clear=document.getElementById('clearHistoryFilters');
  if(form)form.onsubmit=event=>{event.preventDefault();historyQuery=search.value.trim();render()};
  if(search)search.onchange=()=>{historyQuery=search.value.trim();render()};
  if(branch)branch.onchange=()=>{historyBranchFilter=branch.value;render()};
  if(type)type.onchange=()=>{historyTypeFilter=type.value;render()};
  if(action)action.onchange=()=>{historyActionFilter=action.value;render()};
  if(clear)clear.onclick=()=>{historyQuery='';historyBranchFilter='all';historyTypeFilter='';historyActionFilter='';render()};
  document.querySelectorAll('[data-history-detail]').forEach(button=>button.onclick=()=>openHistoryDetail(button.dataset.historyDetail));
}
function auditHistoryMarkup(records){
  const entries=records.flatMap(record=>(Array.isArray(record.auditHistory)?record.auditHistory:[]).map(entry=>({...entry,order:record.order,branch:record.branch||'Santa Fe'}))).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  return `<section class="case-section audit-history-section"><header><span>05</span><div><h3>Historial y trazabilidad</h3><p>Registro auditable de modificaciones del caso</p></div></header><details class="audit-history" open><summary><span>Historial completo</span><strong>${entries.length} ${entries.length===1?'movimiento':'movimientos'}</strong></summary>${entries.length?`<ol>${entries.map(entry=>`<li><div class="audit-event-heading"><span>${escapeHtml(entry.action||'Actualización')}</span><time>${escapeHtml(auditTimestamp(entry.at))}</time></div><div class="audit-event-meta"><strong>${escapeHtml(entry.user||'Sistema')}</strong><small>Sucursal ${escapeHtml(entry.branch||'Santa Fe')}</small>${records.length>1?`<small>NRO OR ${escapeHtml(entry.order)}</small>`:''}</div>${entry.changes?.length?`<dl>${entry.changes.map(change=>`<div><dt>${escapeHtml(change.field)}</dt><dd><s>${escapeHtml(change.before)}</s><b aria-hidden="true">→</b><strong>${escapeHtml(change.after)}</strong></dd></div>`).join('')}</dl>`:`<p class="audit-created-note">Registro inicial del caso.</p>`}</li>`).join('')}</ol>`:`<div class="audit-empty"><strong>Sin modificaciones registradas</strong><span>Los próximos cambios quedarán guardados aquí con usuario, fecha y hora.</span></div>`}</details></section>`;
}
function injectCaseAuditHistory(){
  const databaseCase=selectedDatabaseOrder?branchVisibleCases(cases).find(item=>item.order===selectedDatabaseOrder):null;
  const databaseBody=document.querySelector('.case-sheet:not(.turn-sheet) .case-sheet-body');
  if(databaseCase&&databaseBody&&!databaseBody.querySelector('.audit-history-section'))databaseBody.insertAdjacentHTML('beforeend',auditHistoryMarkup([databaseCase]));
  const turnCase=selectedTurnOrder?branchVisibleCases(cases).find(item=>item.order===selectedTurnOrder):null;
  const turnBody=document.querySelector('.turn-sheet .turn-sheet-body');
  if(turnCase&&turnBody&&!turnBody.querySelector('.audit-history-section'))turnBody.insertAdjacentHTML('beforeend',auditHistoryMarkup(plateCases(turnCase)));
}
function safelyBind(name,binder){try{binder()}catch(error){console.error(`[Interfaz] No se pudo activar ${name}`,error)}}
function bindGoNavigation(){document.querySelectorAll('[data-go]').forEach(button=>{if(button.dataset.go==='calendar'){button.dataset.go='appointments';const label=button.querySelector('span');if(label?.textContent.trim()==='Calendario')label.textContent='Turnos';if(button.textContent.trim()==='Ver calendario')button.textContent='Ver turnos'}button.onclick=()=>{if(button.dataset.go==='no-appointments'){turnFilter='without';navigateToView('appointments')}else navigateToView(button.dataset.go)}})}
function bindInteractiveTables(){[['accesos internos',bindGoNavigation],['acciones',bindRowActions],['repuestos',bindPartsControls],['turnos',bindTurnControls],['recordatorios',bindReminders],['vistas especiales',bindSpecialViews],['controles de reporte semanal',injectWeeklyReportControls],['reportes',bindReportControls],['filtros de turnos',bindTurnViewControls],['filtros de repuestos',bindPartsViewControls],['filtros VOR',bindVorViewControls],['resumen',bindSummaryControls],['calendario',bindCalendarControls],['ficha de base de datos',bindDatabaseSheet],['paginación de base de datos',bindDatabasePagination],['ficha de turnos',bindTurnSheet],['ficha sin repuestos',bindMissingSheet],['selección de filas',bindTableRowSelection],['configuración',bindSettings],['reporte de ejecución semanal',injectExecutionWeeklyReportControls],['ejecución de turnos',bindTodayAppointments],['reporte de depósito',injectDepositReportControls],['registro de repuestos',bindPartsRegistry],['decisiones de coordinación',injectSeparateCoordinationDetails],['identificación Toyota 10',highlightToyota10Fields]].forEach(([name,binder])=>safelyBind(name,binder))}
const bindInteractiveTablesCore=bindInteractiveTables;
bindInteractiveTables=function(){bindInteractiveTablesCore();safelyBind('sección de historial',bindHistoryView)};
function render(){if(currentView==='management')currentView='database';renderNav();const view=views.find(v=>v.id===currentView),group=['dashboard','database','reminders'].includes(currentView)?'General':['parts','appointments','calendar','today-appointments','parts-registry'].includes(currentView)?'Operación':currentView==='settings'?'Sistema':'Excepciones';document.getElementById('breadcrumb').textContent=`Garantías / ${group}`;document.getElementById('currentSection').textContent=view?.label||'Resumen';document.getElementById('newCaseButton').hidden=currentView==='database'||currentView==='reminders'||currentView==='settings'||currentView==='today-appointments'||currentView==='parts-registry';page.innerHTML=currentView==='dashboard'?dashboardV2():listView();document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{if(b.dataset.go==='no-appointments'){currentView='appointments';turnFilter='without'}else{currentView=b.dataset.go}render()});bindInteractiveTables();renderPendingResultAlerts();const pf=document.getElementById('priorityFilter');if(pf)pf.onchange=()=>{let base=filtered(getViewCases(currentView));if(currentView==='appointments')base=filterTurns(base);if(currentView==='parts')base=filterParts(base);if(currentView==='vor')base=filterVor(base);const items=pf.value?base.filter(c=>c.priority===pf.value):base;document.getElementById('caseTable').innerHTML=viewTable(items);bindInteractiveTables()}}
const renderCore=render;
render=function(){try{return renderCore()}catch(error){console.error('[Interfaz] Error al mostrar la sección',currentView,error);renderNav();page.innerHTML=`<section class="panel interface-error"><h2>No se pudo mostrar esta sección</h2><p>La navegación continúa disponible. Podés volver a intentar sin perder los datos.</p><button class="primary-button" id="retryInterface" type="button">Reintentar</button></section>`;document.getElementById('retryInterface')?.addEventListener('click',()=>render());}}
const renderWithHistoryContext=render;
render=function(){const result=renderWithHistoryContext();if(currentView==='history'){document.getElementById('breadcrumb').textContent='Garantías / Sistema';document.getElementById('currentSection').textContent='Historial';document.getElementById('newCaseButton').hidden=true}return result};
const renderWithDeletionAuditCopy=render;
render=function(){const result=renderWithDeletionAuditCopy();document.querySelectorAll('.case-danger-zone span').forEach(element=>{if(element.textContent.includes('no conserva historial'))element.textContent='La ficha no podrá recuperarse; la eliminación quedará registrada en Historial.'});return result};
function quickAction(order){const c=cases.find(x=>x.order===order);if(!c)return;const next=c.arrived&&!c.appointmentDate?'PROGRAMADO':c.requested&&!c.arrived?'PENDIENTE DE TURNO':c.status; if(c.requested&&!c.arrived){c.arrived=true;c.arrivalDate=iso(0);if(c.vor)c.vorStatus='NO AVISADO';c.status=c.vor?'SIN AVISAR':'PENDIENTE DE TURNO';toast(`Arribo confirmado para ${order}`)}else if(c.arrived&&!c.appointmentDate&&!c.vor){c.appointmentDate=iso(3);c.time='09:00';c.status=next;toast(`Turno sugerido para ${order}`)}else{toast(`${order}: ${c.status}`)}save();render()}
function toast(message,duration=2600){const el=document.getElementById('toast');el.textContent=message;el.classList.toggle('detailed',message.includes('\n'));el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>{el.classList.remove('show');el.classList.remove('detailed')},duration)}
const modal=document.getElementById('modalBackdrop');
const openModal=()=>{
  const shell=document.querySelector('.app-shell');
  document.body.classList.add('case-entry-open');
  shell?.setAttribute('aria-hidden','true');
  if(shell)shell.inert=true;
  modal.hidden=false;
  setTimeout(()=>document.querySelector('[name="order"]')?.focus(),0);
};
const closeModal=()=>{
  const wasOpen=!modal.hidden,form=document.getElementById('caseForm'),shell=document.querySelector('.app-shell');
  modal.hidden=true;
  document.body.classList.remove('case-entry-open');
  shell?.removeAttribute('aria-hidden');
  if(shell)shell.inert=false;
  form.reset();
  form.querySelectorAll('[required]').forEach(field=>field.setCustomValidity(''));
  document.getElementById('formError').textContent='';
  flushDeferredRemoteRender();
  if(wasOpen)document.getElementById('newCaseButton')?.focus();
};
const themeToggle=document.getElementById('themeToggle');
function applyTheme(theme){document.body.dataset.theme=theme;themeToggle.textContent=theme==='dark'?'☀':'☾';themeToggle.setAttribute('aria-label',theme==='dark'?'Cambiar a modo día':'Cambiar a modo noche');localStorage.setItem('warranty-theme',theme)}
applyTheme(localStorage.getItem('warranty-theme')||'light');
themeToggle.onclick=()=>applyTheme(document.body.dataset.theme==='dark'?'light':'dark');
const appShell=document.querySelector('.app-shell'),menuButton=document.getElementById('menuButton');
const loginScreen=document.getElementById('loginScreen'),loginForm=document.getElementById('loginForm'),loginUsername=document.getElementById('loginUsername'),loginPassword=document.getElementById('loginPassword'),loginError=document.getElementById('loginError'),toggleLoginPassword=document.getElementById('toggleLoginPassword'),logoutButton=document.getElementById('logoutButton');
const INITIAL_LOGIN_USER='fneyra',INITIAL_LOGIN_HASH='03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',PARTS_LOGIN_HASH='03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',AUTH_SESSION_KEY='amiun-auth-session';
const APPLICATION_USERS={
  fneyra:{username:'fneyra',displayName:'Fneyra',role:'Garantías',initials:'FN',passwordHash:INITIAL_LOGIN_HASH,allowedViews:null},
  tdeodatti:{username:'tdeodatti',displayName:'TDeodatti',role:'Garantías',initials:'TD',passwordHash:PARTS_LOGIN_HASH,allowedViews:null},
  orusso:{username:'orusso',displayName:'ORusso',role:'Gerencial',initials:'OR',passwordHash:PARTS_LOGIN_HASH,allowedViews:null},
  cgavazzi:{username:'cgavazzi',displayName:'CGavazzi',role:'Postventa',initials:'CG',passwordHash:PARTS_LOGIN_HASH,allowedViews:null},
  npoletti:{username:'npoletti',displayName:'NPoletti',role:'Postventa',initials:'NP',passwordHash:PARTS_LOGIN_HASH,allowedViews:null},
  fmagdalena:{username:'fmagdalena',displayName:'FMagdalena',role:'Repuestos',initials:'FM',passwordHash:PARTS_LOGIN_HASH,allowedViews:['parts','missing-parts']},
  mmontejo:{username:'mmontejo',displayName:'MMontejo',role:'Repuestos',initials:'MM',passwordHash:PARTS_LOGIN_HASH,allowedViews:['parts','missing-parts']},
  ffranconi:{username:'ffranconi',displayName:'FFranconi',role:'Repuestos',initials:'FF',passwordHash:PARTS_LOGIN_HASH,allowedViews:['parts','missing-parts']},
  fjorge:{username:'fjorge',displayName:'FJorge',role:'Repuestos',initials:'FJ',passwordHash:PARTS_LOGIN_HASH,allowedViews:['parts','missing-parts']},
  lsanchez:{username:'lsanchez',displayName:'LSanchez',role:'Repuestos',initials:'LS',passwordHash:PARTS_LOGIN_HASH,allowedViews:['parts','missing-parts']},
  ndominguez:{username:'ndominguez',displayName:'NDominguez',role:'Citas',initials:'ND',passwordHash:PARTS_LOGIN_HASH,allowedViews:['dashboard','database','appointments']},
  arojas:{username:'arojas',displayName:'ARojas',role:'Citas',initials:'AR',passwordHash:PARTS_LOGIN_HASH,allowedViews:['dashboard','database','appointments']},
  mecanicos:{username:'mecanicos',displayName:'Mecánicos',role:'Registro de repuestos',initials:'MC',passwordHash:PARTS_LOGIN_HASH,allowedViews:['parts-registry']}
};
const USER_PERMISSIONS_KEY='amiun-user-permissions-v1';
const USER_DIRECTORY_KEY='amiun-user-directory-v1';
const USER_BRANCH_MIGRATION_KEY='amiun-user-branch-santa-fe-v1';
const USER_BRANCHES=['Reconquista','Rafaela','Santa Fe'];
function loadUserDirectory(){try{const stored=JSON.parse(localStorage.getItem(USER_DIRECTORY_KEY)||'{}');Object.entries(stored||{}).forEach(([username,data])=>{if(APPLICATION_USERS[username])Object.assign(APPLICATION_USERS[username],data);});if(!localStorage.getItem(USER_BRANCH_MIGRATION_KEY)){Object.values(APPLICATION_USERS).forEach(user=>{user.branch='Santa Fe'});localStorage.setItem(USER_BRANCH_MIGRATION_KEY,'done');}Object.values(APPLICATION_USERS).forEach(user=>{if(!user.branch)user.branch='Santa Fe'});persistUserDirectory()}catch(error){console.warn('[Usuarios] No se pudo leer el directorio',error)}}
function persistUserDirectory(){const data=Object.fromEntries(Object.entries(APPLICATION_USERS).map(([username,user])=>[username,{active:user.active!==false,displayName:user.displayName,role:user.role,initials:user.initials,branch:user.branch||''}]));localStorage.setItem(USER_DIRECTORY_KEY,JSON.stringify(data))}
let selectedPermissionUser='fneyra';
let selectedDirectoryUser='';
function defaultPermissionsForUser(username){
  const user=APPLICATION_USERS[username],allowed=Array.isArray(user?.allowedViews)?user.allowedViews:null;
  return Object.fromEntries(views.map(view=>{const access=!allowed||allowed.includes(view.id)||view.id==='reminders',readOnly=['dashboard','history'].includes(view.id);return [view.id,{access,modify:access&&!readOnly}]}));
}
function loadUserPermissions(){try{const parsed=JSON.parse(localStorage.getItem(USER_PERMISSIONS_KEY)||'{}');return parsed&&typeof parsed==='object'?parsed:{}}catch(error){console.warn('[Permisos] No se pudo leer la configuración guardada',error);return {}}}
let USER_PERMISSION_MATRIX=loadUserPermissions();
loadUserDirectory();
function permissionsForUser(username){const defaults=defaultPermissionsForUser(username),stored=USER_PERMISSION_MATRIX[username]||{};return Object.fromEntries(views.map(view=>{const value=stored[view.id]||{};return [view.id,{access:typeof value.access==='boolean'?value.access:defaults[view.id].access,modify:typeof value.modify==='boolean'?value.modify:defaults[view.id].modify}]}))}
function persistUserPermissions(){localStorage.setItem(USER_PERMISSIONS_KEY,JSON.stringify(USER_PERMISSION_MATRIX))}
function savePermissionsFromSettings(){
  if(!canModifyView('settings')){toast('Tu perfil permite consultar Configuración, pero no modificar permisos.');return}
  const username=selectedPermissionUser,user=currentApplicationUser(),next={};
  views.forEach(view=>{const access=document.querySelector(`[data-permission-access="${view.id}"]`)?.checked??false,modify=document.querySelector(`[data-permission-modify="${view.id}"]`)?.checked??false;next[view.id]={access,modify:access&&modify}});
  next.crossBranch=Boolean(document.querySelector('[data-permission-branches]')?.checked);
  if(!Object.values(next).some(permission=>permission.access)){toast('El usuario debe conservar acceso al menos a una sección.');return}
  if(user?.username===username&&!next.settings.access){toast('No podés quitarte tu propio acceso a Configuración.');return}
  USER_PERMISSION_MATRIX[username]=next;persistUserPermissions();toast(`Permisos de ${APPLICATION_USERS[username].displayName} actualizados`);render();
}
function resetPermissionsFromSettings(){
  if(!canModifyView('settings')){toast('No tenés permiso para restablecer perfiles.');return}
  delete USER_PERMISSION_MATRIX[selectedPermissionUser];persistUserPermissions();toast(`Perfil de ${APPLICATION_USERS[selectedPermissionUser].displayName} restablecido`);render();
}
function currentApplicationUser(){return APPLICATION_USERS[sessionStorage.getItem(AUTH_SESSION_KEY)]||null}
function canAccessView(view,user=currentApplicationUser()){return !user||Boolean(permissionsForUser(user.username)[view]?.access)}
function canModifyView(view,user=currentApplicationUser()){return !user||Boolean(permissionsForUser(user.username)[view]?.modify)}
function defaultViewForCurrentUser(user=currentApplicationUser()){if(!user)return 'dashboard';return views.find(view=>canAccessView(view.id,user))?.id||'dashboard'}
const MUTATION_CONTROL_SELECTOR=[
  '#clearAllData','#addRegistryRecord','#newReminderButton','.row-action','[data-arrive-related]','[data-db-edit-open]','[data-db-edit-form]','[data-delete-case]','[data-delete-registry]','[data-deposit-status]','[data-execution-review-confirm]','[data-missing-arrival]','[data-missing-reason]','[data-part-arrival]','[data-part-code-form]','[data-part-date]','[data-program-all]','[data-program-separate]','[data-registry-enable-parts]','[data-registry-form]','[data-registry-key]','[data-released-status]','[data-released-notify]','[data-reminder-action]','[data-reminder-form]','[data-resolution]','[data-today-result]','[data-turn-comment]','[data-turn-appointment-observations]','[data-turn-date]','[data-turn-first]','[data-turn-programmed]','[data-turn-time]','[data-vor-status]','[data-vor-notify]','[data-permission-access]','[data-permission-modify]','[data-permission-branches]','#saveUserPermissions','#resetUserPermissions'
].join(',');
function applyModificationAccess(){
  const allowed=canModifyView(currentView),existing=page.querySelector('.view-readonly-notice');
  if(existing)existing.remove();
  page.classList.toggle('view-readonly',!allowed);
  if(!allowed)page.querySelectorAll(MUTATION_CONTROL_SELECTOR).forEach(control=>{control.setAttribute('aria-disabled','true');control.classList.add('permission-disabled');if(control.matches('input,select,textarea,button'))control.disabled=true;control.querySelectorAll?.('input,select,textarea,button').forEach(field=>field.disabled=true)});
}
function blockUnauthorizedMutation(event){
  const target=event.target.closest?.(MUTATION_CONTROL_SELECTOR);if(!target||canModifyView(currentView))return;
  event.preventDefault();event.stopImmediatePropagation();toast('No tenés permiso para modificar esta sección.');
}
document.addEventListener('click',blockUnauthorizedMutation,true);
document.addEventListener('change',blockUnauthorizedMutation,true);
document.addEventListener('submit',blockUnauthorizedMutation,true);
function updateSessionIdentity(user=currentApplicationUser()){
  if(!user)return;
  const avatar=logoutButton.querySelector('.avatar'),name=logoutButton.querySelector('strong'),role=logoutButton.querySelector('small');
  if(avatar)avatar.textContent=user.initials;
  if(name)name.textContent=user.displayName;
  if(role)role.textContent=user.role;
  logoutButton.title=`Cerrar sesión de ${user.displayName}`;
  logoutButton.setAttribute('aria-label',`Cerrar sesión de ${user.displayName}`);
}
const renderWithAccessControl=render;
render=function(){
  const user=currentApplicationUser();
  if(user?.active===false){lockApplication();return ''}
  if(user&&!canAccessView(currentView,user))currentView=defaultViewForCurrentUser(user);
  const result=renderWithAccessControl();
  updateSessionIdentity(user);
  document.getElementById('newCaseButton').hidden=!canModifyView('database',user)||document.getElementById('newCaseButton').hidden;
  document.getElementById('pendingAlertControl').hidden=!canAccessView('today-appointments',user)&&!canAccessView('parts-registry',user)&&!canAccessView('reminders',user)&&!canAccessView('parts',user);
  applyModificationAccess();
  return result;
};
let deferredRemoteRenderPending=false;
function hasProtectedDraft(){
  if(!modal.hidden)return true;
  return Boolean(document.querySelector('[data-registry-form], [data-reminder-form], [data-db-edit-form]'));
}
function renderAfterRemoteSync(){
  if(hasProtectedDraft()){
    deferredRemoteRenderPending=true;
    return false;
  }
  render();
  return true;
}
function flushDeferredRemoteRender(){
  if(!deferredRemoteRenderPending||hasProtectedDraft())return false;
  deferredRemoteRenderPending=false;
  render();
  return true;
}
const renderWithRemotePendingReset=render;
render=function(){
  deferredRemoteRenderPending=false;
  return renderWithRemotePendingReset();
};
let loginAttempts=0,loginBlockedUntil=0;
function finishApplicationBoot(){document.documentElement.classList.remove('app-booting');document.getElementById('appBootScreen')?.setAttribute('hidden','')}
async function credentialHash(value){const data=new TextEncoder().encode(value),digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
function unlockApplication(username){const user=APPLICATION_USERS[username];if(!user||user.active===false){lockApplication();return}sessionStorage.setItem(AUTH_SESSION_KEY,user.username);if(!canAccessView(currentView,user))currentView=defaultViewForCurrentUser(user);loginScreen.hidden=true;appShell.hidden=false;document.body.classList.remove('auth-locked');loginError.textContent='';loginForm.reset();updateSessionIdentity(user);startSharedCasesSync();render();finishApplicationBoot();setTimeout(()=>{document.getElementById('globalSearch')?.focus();checkDueReminderAlerts()},0)}
function lockApplication(){sessionStorage.removeItem(AUTH_SESSION_KEY);updateAmiunRestAuthorization(null);appShell.hidden=true;loginScreen.hidden=false;document.body.classList.add('auth-locked');loginForm.reset();loginError.textContent='';toggleLoginPassword.textContent='Mostrar';toggleLoginPassword.setAttribute('aria-label','Mostrar contraseña');loginPassword.type='password';finishApplicationBoot();setTimeout(()=>loginUsername.focus(),0)}
toggleLoginPassword.onclick=()=>{const reveal=loginPassword.type==='password';loginPassword.type=reveal?'text':'password';toggleLoginPassword.textContent=reveal?'Ocultar':'Mostrar';toggleLoginPassword.setAttribute('aria-label',reveal?'Ocultar contraseña':'Mostrar contraseña')};
async function authenticateApplicationUser(username,password){
  const user=APPLICATION_USERS[username];
  if(!user||user.active===false)return {user:null,error:null};
  if(!amiunSupabaseClient){
    const passwordHash=await credentialHash(password);
    return {user:passwordHash===user.passwordHash?user:null,error:null};
  }
  const response=await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/rpc/authenticate_app_user`,{
    method:'POST',
    headers:{...amiunSupabaseRestHeaders,'X-Amiun-Session':''},
    body:JSON.stringify({p_username:username,p_password:password})
  });
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.token)return {user:null,error:new Error(data?.message||'invalid credentials')};
  updateAmiunRestAuthorization(data.token);
  return {user,error:null};
}
loginForm.onsubmit=async event=>{event.preventDefault();const submit=loginForm.querySelector('[type="submit"]'),now=Date.now();if(now<loginBlockedUntil){loginError.textContent=`Demasiados intentos. Esperá ${Math.ceil((loginBlockedUntil-now)/1000)} segundos.`;return}submit.disabled=true;loginError.textContent='Verificando acceso…';try{const username=loginUsername.value.trim().toLowerCase(),{user,error}=await authenticateApplicationUser(username,loginPassword.value);if(user){loginAttempts=0;unlockApplication(user.username);return}loginAttempts+=1;loginPassword.value='';if(loginAttempts>=5){loginBlockedUntil=Date.now()+30000;loginAttempts=0;loginError.textContent='Acceso bloqueado durante 30 segundos por intentos fallidos.'}else{loginError.textContent=error?.message?.toLowerCase().includes('invalid login credentials')?`Usuario o contraseña incorrectos. Intento ${loginAttempts} de 5.`:`No se pudo validar el acceso. Intento ${loginAttempts} de 5.`;loginPassword.focus()}}catch(error){console.error('[Acceso] No se pudo validar la credencial',error);loginError.textContent='No se pudo validar el acceso. Volvé a intentarlo.'}finally{submit.disabled=false}};
logoutButton.onclick=async()=>{releaseCaseLock();if(amiunSupabaseClient&&amiunCustomSessionToken){await fetch(`${AMIUN_SUPABASE_URL}/rest/v1/rpc/logout_app_user`,{method:'POST',headers:amiunSupabaseRestHeaders}).catch(()=>{})}lockApplication()};
const storedSessionUser=sessionStorage.getItem(AUTH_SESSION_KEY);
if(APPLICATION_USERS[storedSessionUser]&&amiunSupabaseClient&&amiunCustomSessionToken){
  fetch(`${AMIUN_SUPABASE_URL}/rest/v1/rpc/get_app_session_user`,{headers:amiunSupabaseRestHeaders}).then(response=>response.ok?response.json():null).then(data=>{if(data?.username===storedSessionUser)unlockApplication(storedSessionUser);else lockApplication()}).catch(()=>lockApplication());
}else if(APPLICATION_USERS[storedSessionUser])unlockApplication(storedSessionUser);else lockApplication();
function applySidebarState(collapsed){appShell.classList.toggle('sidebar-collapsed',collapsed);menuButton.setAttribute('aria-label',collapsed?'Expandir menú':'Compactar menú');menuButton.setAttribute('aria-expanded',String(!collapsed));menuButton.title=collapsed?'Expandir menú':'Compactar menú';localStorage.setItem('warranty-sidebar-collapsed',collapsed?'1':'0')}
applySidebarState(localStorage.getItem('warranty-sidebar-collapsed')==='1');
document.getElementById('newCaseButton').onclick=openModal;document.getElementById('closeModal').onclick=closeModal;document.getElementById('cancelModal').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()};menuButton.onclick=()=>{if(window.matchMedia('(max-width: 760px)').matches){document.getElementById('sidebar').classList.toggle('open')}else{applySidebarState(!appShell.classList.contains('sidebar-collapsed'))}};
document.getElementById('globalSearch').oninput=e=>{query=e.target.value;render()};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('globalSearch').focus()}if(e.key==='Escape'){if(editingDatabaseOrder){editingDatabaseOrder='';renderKeepingTablePosition()}else if(selectedDatabaseOrder){releaseCaseLock(selectedDatabaseOrder);selectedDatabaseOrder='';renderKeepingTablePosition()}else if(selectedTurnOrder){releaseCaseLock(selectedTurnOrder);selectedTurnOrder='';renderKeepingTablePosition()}else if(selectedMissingOrder){releaseCaseLock(selectedMissingOrder);selectedMissingOrder='';renderKeepingTablePosition()}else if(selectedPartCommentOrder){releaseCaseLock(selectedPartCommentOrder);selectedPartCommentOrder='';renderKeepingTablePosition()}else if(selectedRegistryKey){releaseRegistryLock(selectedRegistryKey);selectedRegistryKey='';renderKeepingTablePosition()}else closeModal()}});
document.addEventListener('click',event=>{if(pendingResultsOpen&&!event.target.closest('#pendingAlertControl')){pendingResultsOpen=false;renderPendingResultAlerts()}});
function confirmToyota10Review(record){
  return new Promise(resolve=>{
    document.querySelector('.toyota10-review-backdrop')?.remove();
    const backdrop=document.createElement('div');
    backdrop.className='toyota10-review-backdrop';
    backdrop.setAttribute('role','dialog');
    backdrop.setAttribute('aria-modal','true');
    backdrop.setAttribute('aria-labelledby','toyota10ReviewTitle');
    backdrop.innerHTML=`<section class="toyota10-review-dialog"><header><div class="toyota10-reminder-heading"><span class="toyota10-caution-icon" aria-hidden="true"><img src="assets/caution-triangle.png" alt=""></span><div><span>CONTROL DE COBERTURA</span><h2 id="toyota10ReviewTitle">Confirmación Toyota 10</h2><p>El vehículo cumple características de Toyota 10. Revisá los controles antes de registrar el caso.</p></div></div><button type="button" data-toyota10-cancel aria-label="Cerrar">×</button></header><div class="toyota10-review-summary"><div><span>FECHA DE VENTA</span><strong>${fmtSaleDate(record.saleDate)}</strong></div><div><span>KILOMETRAJE</span><strong>${fmtKm(record.km)}</strong></div><div><span>REPUESTO</span><strong>${escapeHtml(record.part)}</strong></div></div><fieldset><legend>Validaciones obligatorias</legend><label><input type="checkbox" data-toyota10-check><span><strong>Servicios oficiales revisados</strong><small>Confirmé el historial de servicios requerido para Toyota 10.</small></span></label><label><input type="checkbox" data-toyota10-check><span><strong>Fecha de venta verificada</strong><small>Confirmé que la fecha registrada corresponde al vehículo.</small></span></label><label><input type="checkbox" data-toyota10-check><span><strong>Repuesto incluido en la cobertura</strong><small>Verifiqué que la reparación solicitada está contemplada por Toyota 10.</small></span></label></fieldset><p class="toyota10-review-error" role="alert"></p><footer><button class="secondary-button" type="button" data-toyota10-cancel>Volver al formulario</button><button class="primary-button" type="button" data-toyota10-confirm disabled>Confirmar y guardar</button></footer></section>`;
    document.body.appendChild(backdrop);

    const checks=[...backdrop.querySelectorAll('[data-toyota10-check]')];
    const confirmButton=backdrop.querySelector('[data-toyota10-confirm]');
    const firstCheck=backdrop.querySelector('[data-toyota10-check]');
    const underlyingModal=document.getElementById('modalBackdrop');
    underlyingModal?.setAttribute('aria-hidden','true');
    underlyingModal?.setAttribute('inert','');

    const close=result=>{
      backdrop.remove();
      underlyingModal?.removeAttribute('aria-hidden');
      underlyingModal?.removeAttribute('inert');
      if(!result)setTimeout(()=>document.querySelector('#caseForm button[type="submit"]')?.focus(),0);
      resolve(result);
    };

    checks.forEach(input=>input.onchange=()=>{
      confirmButton.disabled=!checks.every(item=>item.checked);
    });
    backdrop.querySelectorAll('[data-toyota10-cancel]').forEach(button=>button.onclick=()=>close(false));
    confirmButton.onclick=()=>{
      if(!checks.every(item=>item.checked)){
        backdrop.querySelector('.toyota10-review-error').textContent='Confirmá las tres validaciones para continuar.';
        return;
      }
      close(true);
    };
    backdrop.onclick=event=>{if(event.target===backdrop)close(false)};
    backdrop.onkeydown=event=>{
      if(event.key==='Escape'){
        event.preventDefault();
        event.stopPropagation();
        close(false);
        return;
      }
      if(event.key!=='Tab')return;
      const focusable=[...backdrop.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
    };
    firstCheck?.focus();
  });
}
async function notifyVorArrival(record){
  if(!NEW_CASE_NOTIFICATION_ENDPOINT)throw new Error('El servicio de avisos no está configurado.');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),NEW_CASE_NOTIFICATION_TIMEOUT);
  try{
    const response=await fetch(NEW_CASE_NOTIFICATION_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal:controller.signal,
      body:JSON.stringify({
        event:'vor_arrival_notification',
        idempotencyKey:`vor-arribo-${record.order}-${record.arrivalDate||iso(0)}`,
        notifiedBy:currentApplicationUser()?.displayName||auditActor(),
        notifiedAt:new Date().toISOString(),
        case:{
          order:record.order,
          vin:record.vin,
          plate:record.plate,
          client:record.client,
          phone:record.phone,
          priority:record.priority,
          arrivalDate:record.arrivalDate,
          partCode:record.partCode,
          part:record.part,
          repairTime:record.repairTime,
          observations:record.observations,
          vor:true
        }
      })
    });
    if(!response.ok){
      const body=await response.json().catch(()=>({}));
      throw new Error(body.error||`El servicio respondió HTTP ${response.status}.`);
    }
    return true;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('El envío superó el tiempo de espera. Volvé a intentarlo.');
    throw error;
  }finally{
    clearTimeout(timeout);
  }
}
function openVorWorkshopNotification(order){
  const record=cases.find(item=>item.order===order);
  if(!record||!record.vor||!record.arrived){toast('El caso VOR debe tener el repuesto arribado para avisar al taller.');return}
  if(normalizedVorStatus(record)!=='NO AVISADO'){toast('Este caso ya fue avisado al jefe de taller.');return}
  document.querySelector('.vor-notify-backdrop')?.remove();
  const backdrop=document.createElement('div');
  backdrop.className='vor-notify-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','vorNotifyTitle');
  backdrop.innerHTML=`<section class="vor-notify-dialog">
    <header class="vor-notify-header"><div class="vor-notify-heading"><span aria-hidden="true">VOR</span><div><small>COMUNICACIÓN OPERATIVA · REPUESTOS → JEFE DE TALLER</small><h2 id="vorNotifyTitle">Repuesto recibido para vehículo en taller</h2><p>Este aviso confirma la disponibilidad en sucursal y solicita programar el reemplazo.</p></div></div><button type="button" data-vor-notify-close aria-label="Cerrar">×</button></header>
    <div class="vor-notify-flow" aria-label="Flujo del aviso"><div class="complete"><span>01</span><small>REPUESTOS</small><strong>Arribo confirmado</strong></div><i aria-hidden="true">→</i><div class="complete"><span>02</span><small>VEHÍCULO</small><strong>Permanece en taller</strong></div><i aria-hidden="true">→</i><div class="action"><span>03</span><small>JEFE DE TALLER</small><strong>Programar reemplazo</strong></div></div>
    <div class="vor-notify-section-title"><div><small>FICHA DE INTERVENCIÓN</small><h3>Datos para coordinar el trabajo</h3></div><strong>ACCIÓN REQUERIDA</strong></div>
    <div class="vor-notify-summary"><div><span>NRO OR</span><strong>${escapeHtml(record.order)}</strong></div><div><span>PATENTE</span><strong>${escapeHtml(record.plate||'Sin patente')}</strong></div><div><span>CLIENTE</span><strong>${escapeHtml(record.client||'Sin cliente')}</strong></div><div><span>ARRIBO A SUCURSAL</span><strong>${fmtDate(record.arrivalDate)}</strong></div><div class="vor-notify-part"><span>REPUESTO DISPONIBLE</span><strong>${escapeHtml(record.part||'Sin especificar')}</strong><small>Código: ${escapeHtml(record.partCode||'Sin código')}</small></div><div class="vor-notify-work"><span>SITUACIÓN OPERATIVA</span><strong>Vehículo en taller</strong><small>El repuesto está disponible para realizar el reemplazo.</small></div></div>
    <div class="vor-notify-rule"><div aria-hidden="true">!</div><div><strong>Responsabilidad transferida al Taller</strong><p>Al enviar, el jefe de taller recibirá la ficha para programar el reemplazo. El caso cambiará de <b>NO AVISADO</b> a <b>AVISADO</b> solamente si el correo es aceptado.</p></div></div>
    <p class="vor-notify-error" role="alert" aria-live="assertive"></p>
    <footer><span>Destino: <strong>Jefe de Taller</strong></span><div><button class="secondary-button" type="button" data-vor-notify-close>Cancelar</button><button class="primary-button" type="button" data-vor-notify-send>Enviar aviso y solicitar programación</button></div></footer>
  </section>`;
  document.body.appendChild(backdrop);
  const sendButton=backdrop.querySelector('[data-vor-notify-send]');
  const errorBox=backdrop.querySelector('.vor-notify-error');
  const close=()=>backdrop.remove();
  backdrop.querySelectorAll('[data-vor-notify-close]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  sendButton.onclick=async()=>{
    sendButton.disabled=true;
    sendButton.textContent='Enviando aviso…';
    errorBox.textContent='';
    try{
      await notifyVorArrival(record);
      record.vorStatus='AVISADO';
      record.status='AVISADO';
      record.manualStatus=false;
      record.vorNotifiedAt=new Date().toISOString();
      record.vorNotifiedBy=currentApplicationUser()?.displayName||auditActor();
      save();
      close();
      toast(`Aviso enviado. ${record.order} quedó marcado como AVISADO.`);
      renderKeepingTablePosition();
    }catch(error){
      console.error('[VOR] No se pudo avisar al jefe de taller',error);
      errorBox.textContent=`No se modificó el estado. ${error?.message||'No se pudo enviar el correo.'}`;
      sendButton.disabled=false;
      sendButton.textContent='Reintentar aviso';
    }
  };
  sendButton.focus();
}
async function notifyReleasedParts(records){
  if(!NEW_CASE_NOTIFICATION_ENDPOINT)throw new Error('El servicio de correo no está configurado.');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),NEW_CASE_NOTIFICATION_TIMEOUT);
  try{
    const stableKey=records.map(record=>`${record.order}-${record.cancelledAt||''}`).sort().join('_').slice(0,180);
    const response=await fetch(NEW_CASE_NOTIFICATION_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal:controller.signal,
      body:JSON.stringify({
        event:'released_parts_notification',
        idempotencyKey:`repuestos-dados-baja-${stableKey}`,
        notifiedBy:currentApplicationUser()?.displayName||auditActor(),
        notifiedAt:new Date().toISOString(),
        cases:records.map(record=>({
          order:record.order,
          plate:record.plate,
          client:record.client,
          priority:record.priority,
          partCode:record.partCode,
          part:record.part,
          cancelledAt:record.cancelledAt,
          cancelReason:record.cancelReason,
          observations:record.observations
        }))
      })
    });
    const responseBody=await response.text();
    let result={};
    try{result=responseBody?JSON.parse(responseBody):{}}catch{result={}}
    if(!response.ok||result?.ok===false){
      const serviceMessage=result?.error||responseBody?.trim();
      throw new Error(serviceMessage||`El servicio respondió HTTP ${response.status}.`);
    }
    return result;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('El envío superó el tiempo de espera. Volvé a intentarlo.');
    throw error;
  }finally{
    clearTimeout(timeout);
  }
}
function openReleasedPartsReport(){
  const records=branchVisibleCases(cases).filter(record=>record.status==='DADO DE BAJA'&&normalizedReleasedStatus(record)==='NO AVISADO').sort((a,b)=>{
    const priority={URGENTE:0,ALTA:1,MEDIA:2,BAJA:3};
    return (priority[String(a.priority||'').toUpperCase()]??9)-(priority[String(b.priority||'').toUpperCase()]??9)||String(a.cancelledAt||'').localeCompare(String(b.cancelledAt||''))||String(a.order||'').localeCompare(String(b.order||''));
  });
  if(!records.length){toast('No hay casos dados de baja pendientes de aviso.');return}
  const now=new Date(),urgentCount=records.filter(record=>['URGENTE','ALTA'].includes(String(record.priority||'').toUpperCase())).length,dates=records.map(record=>parseStoredDate(record.cancelledAt)).filter(Boolean),oldest=dates.length?new Date(Math.min(...dates.map(date=>date.getTime()))):null;
  const rows=records.map(record=>`<tr><td>${fmtDate(record.cancelledAt)}</td><td class="order">${escapeHtml(record.order||'-')}</td><td>${escapeHtml(record.plate||'-')}</td><td>${escapeHtml(record.client||'-')}</td><td>${escapeHtml(record.priority||'-')}</td><td>${escapeHtml(record.partCode||'-')}</td><td>${escapeHtml(record.part||'Sin especificar')}</td><td>${escapeHtml(record.cancelReason||'Sin motivo registrado')}</td></tr>`).join('');
  const body=`<p class="section-label">CONTROL DE BAJAS</p><h2 class="section-title">Repuestos dados de baja sin aviso</h2><section class="metrics"><article class="metric alert"><span>NO AVISADOS</span><strong>${records.length}</strong></article><article class="metric ${urgentCount?'alert':''}"><span>URGENTES / ALTA</span><strong>${urgentCount}</strong></article><article class="metric"><span>BAJA MÁS ANTIGUA</span><strong>${oldest?reportDate(oldest):'Sin fecha'}</strong></article></section><div class="detail-heading"><h2>Detalle de casos pendientes de aviso</h2><p>Ordenado por prioridad y fecha de baja</p></div><table><colgroup><col style="width:11%"><col style="width:13%"><col style="width:10%"><col style="width:15%"><col style="width:9%"><col style="width:13%"><col style="width:17%"><col style="width:20%"></colgroup><thead><tr><th>Fecha baja</th><th>N.º OR</th><th>Patente</th><th>Cliente</th><th>Prioridad</th><th>Código</th><th>Repuesto</th><th>Motivo de baja</th></tr></thead><tbody>${rows}</tbody></table>`;
  const html=depositReportShell('Reporte de casos no avisados',`Generado el ${reportDate(now)} · ${records.length} caso${records.length===1?'':'s'} pendiente${records.length===1?'':'s'}`,body,`CASOS_NO_AVISADOS_${dateKey(now)}`);
  const preview=window.open('','_blank');
  if(!preview){toast('El navegador bloqueó la vista previa de impresión');return}
  preview.document.open();preview.document.write(prepareBrowserPrintHtml(html));preview.document.close();preview.focus();
  toast(`Reporte generado. ${records.length} caso${records.length===1?'':'s'} no avisado${records.length===1?'':'s'}.`);
}

function openReleasedPartsNotification(){
  const records=branchVisibleCases(cases).filter(record=>record.status==='DADO DE BAJA'&&normalizedReleasedStatus(record)==='NO AVISADO');
  if(!records.length){toast('No hay repuestos dados de baja pendientes de aviso.');return}
  document.querySelector('.released-notify-backdrop')?.remove();
  const urgentCount=records.filter(record=>['URGENTE','ALTA'].includes(String(record.priority||'').toUpperCase())).length;
  const dates=records.map(record=>parseStoredDate(record.cancelledAt)).filter(Boolean);
  const oldest=dates.length?new Date(Math.min(...dates.map(date=>date.getTime()))):null;
  const backdrop=document.createElement('div');
  backdrop.className='released-notify-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','releasedNotifyTitle');
  backdrop.innerHTML=`<section class="released-notify-dialog">
    <header class="released-notify-header"><div><small>CONTROL DE BAJAS · AVISO CONSOLIDADO</small><h2 id="releasedNotifyTitle">Repuestos asociados a casos dados de baja</h2><p>Revisá el lote antes de solicitar su tratamiento interno.</p></div><button type="button" data-released-notify-close aria-label="Cerrar">×</button></header>
    <div class="released-notify-summary"><div><span>CASOS A INFORMAR</span><strong>${records.length}</strong></div><div><span>URGENTES / ALTA</span><strong>${urgentCount}</strong></div><div><span>BAJA MÁS ANTIGUA</span><strong>${oldest?fmtDate(oldest):'Sin fecha'}</strong></div></div>
    <div class="released-notify-body"><div class="released-notify-section-title"><div><small>VISTA PREVIA DEL ENVÍO</small><h3>Todos los casos actualmente “No avisado”</h3></div><span>${records.length} repuesto${records.length===1?'':'s'}</span></div>
      <div class="released-notify-table-wrap"><table><thead><tr><th>FECHA BAJA</th><th>NRO OR</th><th>PATENTE</th><th>CLIENTE</th><th>CÓDIGO</th><th>REPUESTO</th><th>MOTIVO</th></tr></thead><tbody>${records.map(record=>`<tr><td>${fmtDate(record.cancelledAt)}</td><td><strong>${escapeHtml(record.order)}</strong></td><td>${escapeHtml(record.plate||'-')}</td><td>${escapeHtml(record.client||'-')}</td><td>${escapeHtml(record.partCode||'-')}</td><td>${escapeHtml(record.part||'Sin especificar')}</td><td>${escapeHtml(record.cancelReason||'Sin motivo registrado')}</td></tr>`).join('')}</tbody></table></div>
      <div class="released-notify-warning"><strong>Control obligatorio</strong><p>Este aviso solicita revisar, identificar y gestionar estos repuestos según el procedimiento interno. No autoriza por sí mismo su descarte, destrucción ni envío.</p></div>
      <p class="released-notify-error" role="alert" aria-live="assertive"></p>
    </div>
    <footer><span>El estado cambiará a <strong>AVISADO</strong> únicamente si el correo es aceptado.</span><div><button class="secondary-button" type="button" data-released-notify-close>Cancelar</button><button class="primary-button" type="button" data-released-notify-send>Enviar aviso y marcar como avisados</button></div></footer>
  </section>`;
  document.body.appendChild(backdrop);
  const close=()=>backdrop.remove();
  const sendButton=backdrop.querySelector('[data-released-notify-send]');
  const errorBox=backdrop.querySelector('.released-notify-error');
  backdrop.querySelectorAll('[data-released-notify-close]').forEach(button=>button.onclick=close);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  sendButton.onclick=async()=>{
    sendButton.disabled=true;
    sendButton.textContent='Enviando lote…';
    errorBox.textContent='';
    try{
      await notifyReleasedParts(records);
      const notifiedAt=new Date().toISOString();
      const notifiedBy=currentApplicationUser()?.displayName||auditActor();
      records.forEach(snapshot=>{
        const record=cases.find(item=>item.order===snapshot.order);
        if(!record||record.status!=='DADO DE BAJA'||normalizedReleasedStatus(record)!=='NO AVISADO')return;
        record.releasedStatus='AVISADO';
        record.releasedNotifiedAt=notifiedAt;
        record.releasedNotifiedBy=notifiedBy;
      });
      save();
      close();
      toast(`Aviso enviado. ${records.length} caso${records.length===1?'':'s'} marcado${records.length===1?'':'s'} como AVISADO.`);
      renderKeepingTablePosition();
    }catch(error){
      console.error('[DADOS DE BAJA] No se pudo enviar el lote',error);
      errorBox.textContent=`No se modificó ningún estado. ${error?.message||'No se pudo enviar el correo.'}`;
      sendButton.disabled=false;
      sendButton.textContent='Reintentar envío';
    }
  };
  sendButton.focus();
}
document.getElementById('caseForm').onsubmit=async e=>{
  e.preventDefault();
  const form=e.currentTarget,error=document.getElementById('formError'),requiredFields=[...form.querySelectorAll('[required]')];
  requiredFields.forEach(field=>field.setCustomValidity(''));
  const emptyField=requiredFields.find(field=>typeof field.value==='string'&&!field.value.trim());
  if(emptyField){
    emptyField.setCustomValidity('Completá este campo para guardar el caso.');
    error.textContent='Completá todos los campos obligatorios antes de guardar.';
    emptyField.reportValidity();
    emptyField.focus();
    return;
  }
  if(!form.checkValidity()){
    error.textContent='Revisá los campos marcados antes de guardar.';
    form.reportValidity();
    return;
  }
  error.textContent='';
  const fd=new FormData(form),order=fd.get('order').trim().toUpperCase();
  if(cases.some(c=>c.order===order)){
    error.textContent='Ese NRO OR ya existe. Debe ser único.';
    form.elements.order.focus();
    return;
  }
  const record={
    order,
    branch:currentApplicationUser()?.branch||'Santa Fe',
    vin:fd.get('vin').trim().toUpperCase(),
    plate:fd.get('plate').trim().toUpperCase(),
    client:fd.get('client').trim(),
    phone:fd.get('phone').trim(),
    saleDate:fd.get('saleDate'),
    km:fd.get('km').trim(),
    priority:fd.get('priority'),
    vor:fd.get('vor')==='on',
    requested:true,
    arrived:false,
    requestDate:iso(0),
    arrivalDate:'',
    appointmentDate:'',
    time:'',
    partCode:'',
    part:fd.get('part').trim(),
    repairTime:fd.get('repairTime').trim(),
    observations:fd.get('observations').trim(),
    status:'PENDIENTE DE REPUESTO',
    createdAt:new Date().toISOString()
  };
  if(isToyota10Case(record)){
    const confirmed=await confirmToyota10Review(record);
    if(!confirmed)return;
    record.toyota10Confirmed=true;
    record.toyota10ReviewedAt=new Date().toISOString();
    record.toyota10Checks={services:true,saleDate:true,partCoverage:true};
  }
  cases.unshift(record);
  save();
  closeModal();
  render();
  toast(`Caso ${order} registrado en ${record.branch}${record.toyota10Confirmed?' · cobertura Toyota 10 confirmada':''}`);
};
document.getElementById('caseForm').addEventListener('invalid',()=>{document.getElementById('formError').textContent='Completá todos los campos obligatorios antes de guardar.'},true);
document.querySelectorAll('#caseForm [required]').forEach(field=>{const clearRequiredError=()=>field.setCustomValidity('');field.addEventListener('input',clearRequiredError);field.addEventListener('change',clearRequiredError)});
function updateTopDatetime(){const now=new Date(),dateElement=document.getElementById('topDate'),timeElement=document.getElementById('topTime');if(dateElement)dateElement.textContent=new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(now);if(timeElement)timeElement.textContent=new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(now)}
updateTopDatetime();
setInterval(()=>{updateTopDatetime();renderPendingResultAlerts()},30000);
setInterval(()=>renewCaseLock(),CASE_LOCK_HEARTBEAT);
window.addEventListener('storage',event=>{
  if(event.key===USER_DIRECTORY_KEY){
    try{
      const stored=JSON.parse(event.newValue||'{}');
      Object.entries(stored||{}).forEach(([username,data])=>{if(APPLICATION_USERS[username])Object.assign(APPLICATION_USERS[username],data)});
    }catch(error){console.warn('[Usuarios] No se pudo sincronizar el directorio',error)}
    if(currentApplicationUser()?.active===false)lockApplication();else render();
    return;
  }
  if(event.key!==CASE_LOCKS_KEY||!activeCaseLockOrder)return;
  const lock=caseLockFor(activeCaseLockOrder);
  if(!lock||lock.tabId===caseLockTabId)return;
  const order=activeCaseLockOrder;
  activeCaseLockOrder='';
  selectedDatabaseOrder='';selectedTurnOrder='';selectedMissingOrder='';selectedPartCommentOrder='';editingDatabaseOrder='';
  render();showCaseLockNotice(order,lock);
});
window.addEventListener('beforeunload',()=>releaseCaseLock());
const applyTurnProgrammingCore=applyTurnProgramming;
applyTurnProgramming=function(c,targets,reason=''){targets.forEach(item=>{const history=Array.isArray(item.executionHistory)?item.executionHistory:[],lastMissed=[...history].reverse().find(entry=>entry.status==='NO EJECUTADO'&&!entry.rescheduledDate);if(lastMissed)lastMissed.rescheduledDate=c.appointmentDate});return applyTurnProgrammingCore(c,targets,reason)};
refreshAutomaticStates();
render();
if(AMIUN_LOCAL_DEMO_MODE)void loadRecoverySnapshot();
startReminderAlertWatcher();

function printDatabaseCase(order){
  const c=branchVisibleCases(cases).find(item=>item.order===order);
  if(!c)return;
  const popup=window.open('','_blank');
  if(!popup){toast('El navegador bloqueó la ventana del PDF');return}
  const now=new Date(),logoUrl=new URL('assets/logo-amiun.png',location.href).href;
  const value=value=>escapeHtml(value||'-');
  const info=(label,data,wide=false)=>`<div class="datum ${wide?'wide':''}"><span>${escapeHtml(label)}</span><strong>${value(data)}</strong></div>`;
  const css=`@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#17191c;font-family:Arial,Helvetica,sans-serif}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{position:sticky;top:0;z-index:3;display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;background:#202226}.toolbar button{border:1px solid #d5d8dc;background:#fff;padding:9px 14px;font-weight:700}.toolbar .primary{border-color:#eb0a1e;background:#eb0a1e;color:#fff}.report{max-width:186mm;margin:0 auto}.report-header{display:grid;grid-template-columns:42mm 1fr 38mm;align-items:center;gap:8mm;padding:0 0 7mm;border-bottom:2px solid #eb0a1e}.brand img{display:block;width:37mm;height:auto}.title{text-align:center}.title h1{margin:0;font-size:20pt}.title p{margin:3px 0 0;color:#6b7280;font-size:9pt}.issued{border:1px solid #d9dde2;border-left:3px solid #eb0a1e;padding:4mm}.issued span,.eyebrow,.datum span,.metric span{display:block;color:#68707a;font-size:7pt;font-weight:700;letter-spacing:.08em}.issued strong{display:block;margin-top:2px;font-size:8.5pt}.case-head{display:flex;align-items:center;justify-content:space-between;margin:7mm 0 4mm}.case-head h2{margin:2px 0 0;font-size:21pt}.case-head p{margin:2px 0 0;color:#606872;font-size:10pt}.badges{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.badge{border:1px solid #d9dde2;padding:5px 8px;background:#f7f8fa;font-size:7.5pt;font-weight:700}.badge.status{border-color:#eb0a1e;color:#eb0a1e}.metrics{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #d9dde2;border-top:3px solid #30343a}.metric{min-height:23mm;padding:4mm;border-right:1px solid #d9dde2}.metric:last-child{border-right:0}.metric strong{display:block;margin-top:3px;font-size:17pt}.metric small{color:#6b7280;font-size:7.5pt}.flow{display:grid;grid-template-columns:repeat(4,1fr);margin:5mm 0;border:1px solid #d9dde2}.flow div{position:relative;padding:3.5mm;border-right:1px solid #d9dde2}.flow div:last-child{border-right:0}.flow span{color:#eb0a1e;font-size:7pt;font-weight:700}.flow strong,.flow small{display:block}.flow strong{margin:2px 0;font-size:9pt}.flow small{color:#6b7280;font-size:7.5pt}.flow .pending{background:#f7f8fa}.sections{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.section{break-inside:avoid;border:1px solid #d9dde2}.section.wide{grid-column:1/-1}.section header{padding:3mm 4mm;border-bottom:1px solid #d9dde2;border-top:3px solid #eb0a1e}.section h3{margin:0;font-size:11pt}.section header p{margin:2px 0 0;color:#6b7280;font-size:7.5pt}.data-grid{display:grid;grid-template-columns:1fr 1fr}.datum{min-height:16mm;padding:3mm 4mm;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}.datum:nth-child(even){border-right:0}.datum.wide{grid-column:1/-1;border-right:0}.datum strong{display:block;margin-top:3px;font-size:9pt;line-height:1.35;overflow-wrap:anywhere}.footer{display:flex;justify-content:space-between;margin-top:6mm;padding-top:3mm;border-top:1px solid #d9dde2;color:#6b7280;font-size:7pt}@media print{.toolbar{display:none}.report{max-width:none}}`;
  const html=`<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>FICHA_${value(c.order)}_${reportDate(now).replaceAll('/','_')}</title><style>${css}</style></head><body><nav class="toolbar"><button onclick="window.close()">Cerrar</button><button class="primary" onclick="window.print()">Guardar como PDF / Imprimir</button></nav><main class="report"><header class="report-header"><div class="brand"><img src="${value(logoUrl)}" alt="Toyota Amiun"></div><div class="title"><h1>Ficha operativa del caso</h1><p>Registro maestro de Garantías · Sucursal: ${value(c.branch||'Santa Fe')}</p></div><div class="issued"><span>EMITIDO</span><strong>${reportDateTime(now)}</strong></div></header><section class="case-head"><div><span class="eyebrow">ORDEN DE REPARACIÓN</span><h2>${value(c.order)}</h2><p>${value(c.plate)} · ${value(c.client)}</p></div><div class="badges"><span class="badge status">${value(c.status||'SIN ESTADO')}</span><span class="badge">PRIORIDAD ${value(c.priority).toUpperCase()}</span>${c.vor?`<span class="badge">VOR · ${value(c.vorStatus||'NO AVISADO')}</span>`:''}${isToyota10Case(c)?'<span class="badge">TOYOTA 10</span>':''}</div></section><div class="sections"><section class="section"><header><h3>Vehículo y cliente</h3><p>Identificación y contacto</p></header><div class="data-grid">${info('VIN',c.vin||'-',true)}${info('Cliente',c.client,true)}${info('Patente',c.plate)}${info('Teléfono',c.phone||'-')}${info('Fecha de venta',fmtSaleDate(c.saleDate))}${info('Kilometraje',fmtKm(c.km))}</div></section><section class="section"><header><h3>Repuesto y reparación</h3><p>Disponibilidad y contenido técnico</p></header><div class="data-grid">${info('Fecha del pedido',fmtDate(c.requestDate))}${info('Estado del arribo',c.arrived?'Confirmado':'Pendiente')}${info('Código',c.partCode||'-',true)}${info('Descripción',c.part||'Sin especificar',true)}${info('Tiempo de reparación',c.repairTime||'-')}${info('Fecha de arribo',fmtDate(c.arrivalDate))}</div></section><section class="section wide"><header><h3>Coordinación y seguimiento</h3><p>Información operativa registrada</p></header><div class="data-grid">${info('Primera conversación',fmtDate(c.firstConversation))}${info('Programado',isProgrammed(c)?'Sí':'No')}${info('Fecha del turno',fmtDate(c.appointmentDate))}${info('Hora',c.time||'-')}${info('Comentario de seguimiento',c.comment||'Sin comentarios registrados',true)}${info('Observaciones',c.observations||'Sin observaciones registradas',true)}${c.cancelReason?info('Motivo de baja',c.cancelReason,true):''}</div></section></div><footer class="footer"><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Documento interno · Solo lectura</span></footer></main></body></html>`;
  popup.document.open();popup.document.write(html);popup.document.close();
}

/* TPS database case sheet: visual control first, details second. */
function databaseCaseSheet(){
  const c=selectedDatabaseOrder?branchVisibleCases(cases).find(item=>item.order===selectedDatabaseOrder):null;
  if(!c)return '';
  const field=(label,value,wide=false,extra='')=>`<div class="case-detail ${wide?'wide':''} ${extra}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value||'-')}</dd></div>`;
  const related=plateCases(c).filter(item=>item.order!==c.order&&item.status!=='DADO DE BAJA');
  const toyota10=isToyota10Case(c);
  const requestDays=c.requestDate?(c.arrived&&c.arrivalDate?daysBetween(c.requestDate,c.arrivalDate):daysFrom(c.requestDate)):0;
  const arrivalDays=c.arrivalDate?daysFrom(c.arrivalDate):0;
  const isClosed=['REALIZADO','DADO DE BAJA'].includes(c.status);
  const nextAction=c.status==='PENDIENTE DE REPUESTO'?'Dar seguimiento al pedido y confirmar disponibilidad':c.status==='PENDIENTE DE TURNO'?'Contactar al cliente y acordar el turno':c.status==='TURNO SIN REPUESTO'?'Resolver el faltante antes de mantener el turno':c.status==='REPROGRAMAR'?'Volver a contactar y definir una nueva fecha':c.status==='PROGRAMADO'?'Preparar recepción, repuesto y capacidad del taller':c.status==='SIN AVISAR'?'Avisar y dar seguimiento al caso VOR':c.status==='AVISADO'?'Mantener seguimiento prioritario del caso VOR':c.status==='REALIZADO'?'Proceso completado; verificar el cierre documental':c.status==='DADO DE BAJA'?'Caso cerrado; conservar motivo y trazabilidad':'Revisar la condición actual del caso';
  const flow=[
    {label:'Pedido',date:c.requestDate,done:Boolean(c.requestDate)},
    {label:'Arribo',date:c.arrivalDate,done:Boolean(c.arrived&&c.arrivalDate)},
    {label:'Coordinación',date:c.appointmentDate,done:Boolean(isProgrammed(c))},
    {label:'Cierre',date:c.status==='DADO DE BAJA'?c.cancelledAt:c.appointmentDate,done:isClosed}
  ];
  const currentFlow=Math.max(0,flow.findIndex(item=>!item.done));
  const completedFlow=flow.filter(item=>item.done).length;
  const flowProgress=Math.min(completedFlow,3)/3*100;
  const deviations=[];
  if(c.requested&&!c.arrived)deviations.push({tone:'warning',title:'Repuesto pendiente',text:`${requestDays} días hábiles desde el pedido`});
  if(c.appointmentDate&&!c.arrived)deviations.push({tone:'critical',title:'Turno sin repuesto',text:`Turno ${fmtDate(c.appointmentDate)} · ${escapeHtml(c.time||'sin hora')}`});
  if(c.vor&&c.vorStatus!=='REALIZADO')deviations.push({tone:'critical',title:'Seguimiento VOR',text:c.vorStatus||'NO AVISADO'});
  if(related.length)deviations.push({tone:'info',title:`${related.length+1} órdenes para la patente`,text:related.map(item=>item.order).join(' · ')});
  if(c.separateScheduleReason)deviations.push({tone:'warning',title:'Coordinación separada',text:c.separateScheduleReason});
  return `<div class="case-sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="caseSheetTitle"><aside class="case-sheet tps-case-sheet">
    <header class="case-sheet-header">
      <div class="case-sheet-brandmark" aria-hidden="true">OR</div>
      <div class="case-sheet-title"><span>CONTROL OPERATIVO DEL CASO</span><h2 id="caseSheetTitle">${escapeHtml(c.order)}</h2><p><strong>${escapeHtml(c.plate)}</strong><i></i>${escapeHtml(c.client)}</p></div>
      <div class="case-sheet-reference"><span>Base de datos</span><strong>Registro maestro</strong></div>
      <button class="text-button case-sheet-pdf" type="button" data-case-pdf="${escapeHtml(c.order)}">Descargar PDF</button>
      <button class="case-sheet-close" data-close-sheet aria-label="Cerrar ficha">×</button>
    </header>
    <section class="case-command tps-command">
      <div class="case-command-state"><span class="badge ${badgeClass(c.status)}">${escapeHtml(c.status||'SIN ESTADO')}</span><span class="priority-mark ${escapeHtml(c.priority.toLowerCase())}">Prioridad ${escapeHtml(c.priority)}</span>${c.vor?`<span class="vor-mark">VOR · ${escapeHtml(c.vorStatus||'NO AVISADO')}</span>`:''}${toyota10?'<span class="tps-coverage-mark">TOYOTA 10</span>':''}</div>
      <div class="case-next-action"><span>PRÓXIMA ACCIÓN</span><strong>${escapeHtml(nextAction)}</strong></div>
    </section>
    ${editingDatabaseOrder===c.order?databaseEditPanel(c):''}
    <section class="case-metrics tps-case-metrics" aria-label="Indicadores del caso">
      <article class="${!c.arrived&&requestDays>10?'attention':''}"><span>Espera del repuesto</span><strong>${requestDays}</strong><small>días hábiles; se detiene al arribar</small></article>
      <article class="${c.arrived&&!isProgrammed(c)&&arrivalDays>7?'attention':''}"><span>Desde el arribo</span><strong>${c.arrivalDate?arrivalDays:'-'}</strong><small>${c.arrivalDate?'días hábiles hasta hoy':'arribo pendiente'}</small></article>
      <article><span>Turno vigente</span><strong class="metric-date">${c.appointmentDate?fmtDate(c.appointmentDate):'-'}</strong><small>${escapeHtml(c.time||'sin programar')}</small></article>
    </section>
    <section class="case-process-block tps-flow-block">
      <div class="tps-block-heading"><div><span>FLUJO ESTÁNDAR</span><strong>Avance del caso</strong></div><small>${completedFlow} de ${flow.length} etapas completas</small></div>
      <nav class="case-process" aria-label="Avance del proceso" style="--flow-progress:${flowProgress}%">${flow.map((item,index)=>`<div class="${item.done?'complete':index===currentFlow?'current':''}"><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(item.label)}</strong><small>${item.done?fmtDate(item.date):index===currentFlow?'Etapa actual':'Pendiente'}</small><i></i></div>`).join('')}</nav>
    </section>
    <div class="case-sheet-body tps-case-body">
      <section class="case-section identity-section">
        <header><span>01</span><div><h3>Vehículo y cliente</h3><p>Identificación para tomar contacto</p></div></header>
        <dl class="case-detail-grid">${field('VIN',c.vin||'-',true)}${field('Cliente',c.client,true)}${field('Patente',c.plate)}${field('Teléfono',c.phone||'-')}${field('Fecha de venta',fmtDate(c.saleDate))}${field('Kilometraje',fmtKm(c.km))}</dl>
      </section>
      <section class="case-section parts-section">
        <header><span>02</span><div><h3>Repuesto y reparación</h3><p>Disponibilidad y contenido técnico</p></div></header>
        <dl class="case-detail-grid">${field('Fecha del pedido',fmtDate(c.requestDate))}${field('Estado del arribo',c.arrived?'Confirmado':'Pendiente',false,c.arrived?'is-ok':'needs-attention')}${field('Código',c.partCode||'-',true)}${field('Descripción',c.part||'Sin especificar',true)}${field('Tiempo de reparación',c.repairTime||'-')}${field('Fecha de arribo',fmtDate(c.arrivalDate))}</dl>
      </section>
      <section class="case-section coordination-section">
        <header><span>03</span><div><h3>Coordinación</h3><p>Contacto, turno y criterio operativo</p></div></header>
        <dl class="case-detail-grid tps-coordination-grid">${field('Primera conversación',fmtDate(c.firstConversation))}${field('Fecha del turno',fmtDate(c.appointmentDate))}${field('Hora',c.time||'-')}${field('Programado',isProgrammed(c)?'Sí':'No')}${field('Comentario de seguimiento',c.comment||'Sin comentarios registrados',true)}${field('Observaciones',c.observations||'Sin observaciones registradas',true)}${c.cancelReason?field('Motivo de baja',c.cancelReason,true,'needs-attention'):''}</dl>
      </section>
    </div>
    <footer class="case-sheet-actions tps-case-actions">
      <div class="case-actions-heading"><div><span class="action-kicker">DECISIÓN DEL USUARIO</span><h3>Acciones del caso</h3><p>Las acciones actualizan el registro maestro y las vistas relacionadas.</p></div><div class="case-heading-actions"><button class="text-button" data-db-edit-open="${escapeHtml(c.order)}">Editar información</button><button class="text-button clear-resolution" data-resolution="RESTABLECER" data-order="${escapeHtml(c.order)}">Restablecer estado</button></div></div>
      <div class="sheet-actions"><button class="case-action secondary" data-resolution="REPROGRAMAR" data-order="${escapeHtml(c.order)}"><span>01</span><strong>Reprogramar</strong><small>Devuelve el caso a coordinación</small></button><button class="case-action primary" data-resolution="REALIZADO" data-order="${escapeHtml(c.order)}"><span>02</span><strong>Marcar realizado</strong><small>Confirma el cierre operativo</small></button><button class="case-action warning" data-resolution="DADO DE BAJA" data-order="${escapeHtml(c.order)}"><span>03</span><strong>Dar de baja</strong><small>Solicita motivo y conserva historial</small></button></div>
      <div class="case-danger-zone"><div><strong>Corrección de carga</strong><span>Usar únicamente si el registro fue creado por error.</span></div><button data-delete-case="${escapeHtml(c.order)}">Eliminar caso</button></div>
    </footer>
  </aside></div>`;
}

/* Standardized TPS print sheet for the master case. */
printDatabaseCase=function(order){
  const c=branchVisibleCases(cases).find(item=>item.order===order);
  if(!c)return;
  const popup=window.open('','_blank');
  if(!popup){toast('El navegador bloqueó la ventana del PDF');return}
  const now=new Date(),logoUrl=new URL('assets/logo-amiun.png',location.href).href;
  const safe=value=>escapeHtml(value||'-');
  const datum=(label,value,wide=false,extra='')=>`<div class="datum ${wide?'wide':''} ${extra}"><span>${escapeHtml(label)}</span><strong>${safe(value)}</strong></div>`;
  const isClosed=['REALIZADO','DADO DE BAJA'].includes(c.status);
  const flow=[{label:'Pedido',date:c.requestDate,done:Boolean(c.requestDate)},{label:'Arribo',date:c.arrivalDate,done:Boolean(c.arrived&&c.arrivalDate)},{label:'Coordinación',date:c.appointmentDate,done:Boolean(isProgrammed(c))},{label:'Cierre',date:c.status==='DADO DE BAJA'?c.cancelledAt:(c.executionDate||c.appointmentDate),done:isClosed}];
  const completed=flow.filter(item=>item.done).length,current=Math.max(0,flow.findIndex(item=>!item.done)),printProgress=Math.min(completed,3)/3*100;
  const css=`@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#121315;font-family:Arial,Helvetica,sans-serif}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;background:#202226}.toolbar button{min-height:36px;border:1px solid #cfd3d8;background:#fff;padding:0 14px;font-weight:700}.toolbar .primary{border-color:#eb0a1e;background:#eb0a1e;color:#fff}.sheet{width:190mm;margin:0 auto;border-top:3px solid #eb0a1e}.case-header{display:grid;grid-template-columns:16mm 1fr 43mm 38mm;align-items:center;gap:5mm;padding:5mm 0;border-bottom:1px solid #d9dde2}.or-mark{display:grid;place-items:center;width:16mm;height:16mm;background:#17191c;color:#fff;font-size:14pt;font-weight:800}.case-title>span,.reference span,.block-title>span,.datum span,.flow-heading span{display:block;color:#626a75;font-size:6.8pt;font-weight:800;letter-spacing:.09em}.case-title>span{color:#eb0a1e}.case-title h1{margin:2px 0 1px;font-size:20pt;line-height:1}.case-title p{margin:0;font-size:9pt}.case-title i{display:inline-block;height:11px;margin:0 7px;border-left:1px solid #cfd3d8}.reference{text-align:center}.reference strong{display:block;margin-top:3px;font-size:9pt}.issued{border-left:3px solid #eb0a1e;padding:2.5mm 0 2.5mm 3mm}.issued span{display:block;color:#626a75;font-size:6.5pt;font-weight:800;letter-spacing:.08em}.issued strong{display:block;margin-top:2px;font-size:8pt}.flow-block{padding:4mm 1mm 5mm;border-bottom:1px solid #d9dde2}.flow-heading{display:flex;align-items:end;justify-content:space-between}.flow-heading strong{display:block;margin-top:2px;font-size:11pt}.flow-heading small{color:#626a75;font-size:7.5pt}.flow{position:relative;display:grid;grid-template-columns:repeat(4,1fr);margin-top:4mm}.flow:before,.flow:after{content:"";position:absolute;top:1.7mm;left:0;height:1.4px}.flow:before{right:0;background:#d4d8dd}.flow:after{z-index:1;width:var(--print-progress);background:#df3030}.step{position:relative;z-index:2;padding-top:6mm;text-align:center}.step:first-child{text-align:left}.step:last-child{text-align:right}.step i{position:absolute;top:0;left:50%;width:4mm;height:4mm;transform:translateX(-50%);border:1.5px solid #cfd3d8;background:#fff}.step:first-child i{left:0;transform:none}.step:last-child i{right:0;left:auto;transform:none}.step.done i{border-color:#df3030;background:#df3030}.step span,.step strong,.step small{display:block}.step span{color:#626a75;font-size:6.8pt}.step strong{margin:2px 0;font-size:9pt}.step small{color:#626a75;font-size:7pt}.step.current strong{color:#eb0a1e}.content{display:grid;grid-template-columns:1fr 1fr;gap:4mm;padding-top:5mm}.block{break-inside:avoid;border:1px solid #d7dade}.block.wide{grid-column:1/-1}.block header{display:grid;grid-template-columns:12mm 1fr;align-items:center;min-height:15mm;border-bottom:1px solid #c9cdd2;background:#e9ebee}.block-number{display:grid;height:100%;place-items:center;color:#eb0a1e;font-size:8pt;font-weight:800;border-right:1px solid #c9cdd2}.block-title{padding:2mm 3mm}.block-title h2{margin:0;font-size:11pt}.block-title p{margin:2px 0 0;color:#626a75;font-size:7pt}.data-grid{display:grid;grid-template-columns:1fr 1fr}.datum{min-height:13mm;padding:2.5mm 3mm;border-right:1px solid #e2e5e8;border-bottom:1px solid #e2e5e8}.datum:nth-child(even){border-right:0}.datum.wide{grid-column:1/-1;border-right:0}.datum strong{display:block;margin-top:2px;font-size:8.5pt;line-height:1.25;overflow-wrap:anywhere}.datum.ok{border-left:3px solid #58b76a;background:#f1f8f2}.datum.attention{border-left:3px solid #eb0a1e;background:#fff5f5}.coord-grid{grid-template-columns:repeat(4,1fr)}.coord-grid .datum{border-right:1px solid #e2e5e8}.coord-grid .datum:nth-child(even){border-right:1px solid #e2e5e8}.coord-grid .datum:nth-child(4n){border-right:0}.coord-grid .wide{grid-column:span 2}.footer{display:flex;justify-content:space-between;margin-top:4mm;padding-top:2.5mm;border-top:1px solid #d7dade;color:#68707a;font-size:6.8pt}@media print{.toolbar{display:none}.sheet{width:auto}}`;
  const html=`<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>FICHA_${safe(c.order)}_${reportDate(now).replaceAll('/','_')}</title><style>${css}</style></head><body><nav class="toolbar"><button onclick="window.close()">Cerrar</button><button class="primary" onclick="window.print()">Guardar como PDF / Imprimir</button></nav><main class="sheet"><header class="case-header"><div class="or-mark">OR</div><div class="case-title"><span>CONTROL OPERATIVO DEL CASO</span><h1>${safe(c.order)}</h1><p><strong>${safe(c.plate)}</strong><i></i>${safe(c.client)}</p></div><div class="reference"><span>BASE DE DATOS</span><strong>Registro maestro · Sucursal: ${safe(c.branch||'Santa Fe')}</strong></div><div class="issued"><span>EMITIDO</span><strong>${reportDateTime(now)}</strong></div></header><section class="flow-block"><div class="flow-heading"><div><span>FLUJO ESTÁNDAR</span><strong>Avance del caso</strong></div><small>${completed} de 4 etapas completas</small></div><div class="flow" style="--print-progress:${printProgress}%">${flow.map((item,index)=>`<div class="step ${item.done?'done':index===current?'current':''}"><i></i><span>${String(index+1).padStart(2,'0')}</span><strong>${safe(item.label)}</strong><small>${item.done?fmtDate(item.date):index===current?'Etapa actual':'Pendiente'}</small></div>`).join('')}</div></section><div class="content"><section class="block"><header><span class="block-number">01</span><div class="block-title"><h2>Vehículo y cliente</h2><p>Identificación para tomar contacto</p></div></header><div class="data-grid">${datum('VIN',c.vin||'-',true)}${datum('Cliente',c.client,true)}${datum('Patente',c.plate)}${datum('Teléfono',c.phone||'-')}${datum('Fecha de venta',fmtSaleDate(c.saleDate))}${datum('Kilometraje',fmtKm(c.km))}</div></section><section class="block"><header><span class="block-number">02</span><div class="block-title"><h2>Repuesto y reparación</h2><p>Disponibilidad y contenido técnico</p></div></header><div class="data-grid">${datum('Fecha del pedido',fmtDate(c.requestDate))}${datum('Estado del arribo',c.arrived?'Confirmado':'Pendiente',false,c.arrived?'ok':'attention')}${datum('Código',c.partCode||'-',true)}${datum('Descripción',c.part||'Sin especificar',true)}${datum('Tiempo de reparación',c.repairTime||'-')}${datum('Fecha de arribo',fmtDate(c.arrivalDate))}</div></section><section class="block wide"><header><span class="block-number">03</span><div class="block-title"><h2>Coordinación</h2><p>Contacto, turno y criterio operativo</p></div></header><div class="data-grid coord-grid">${datum('Primera conversación',fmtDate(c.firstConversation))}${datum('Fecha del turno',fmtDate(c.appointmentDate))}${datum('Hora',c.time||'-')}${datum('Programado',isProgrammed(c)?'Sí':'No')}${datum('Comentario de seguimiento',c.comment||'Sin comentarios registrados',true)}${datum('Observaciones',c.observations||'Sin observaciones registradas',true)}${c.cancelReason?datum('Motivo de baja',c.cancelReason,true,'attention'):''}</div></section></div><footer class="footer"><span>AMIUN TOYOTA | Postventa y Garantías</span><span>Ficha de consulta interna · ${safe(c.order)}</span></footer></main></body></html>`;
  popup.document.open();popup.document.write(html);popup.document.close();
};

const todayAppointmentsViewWithLongDate=todayAppointmentsView;
todayAppointmentsView=function(){
  const longDate=new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateOnly(selectedExecutionDate));
  return todayAppointmentsViewWithLongDate().replace(escapeHtml(longDate),escapeHtml(fmtDate(selectedExecutionDate)));
};











                                                                                                            
                                                                                                            // Vista previa compatible c
