/* Demonstração de cada exercício: fotos de início e fim do movimento (Free Exercise DB, domínio público),
   em public/ex/<id>.webp. Liga o nome em português (do plano ou digitado) à demonstração.
   A ordem importa: os mais específicos vêm primeiro. */
const MAPA = [
  [/alongamento/, ''],                                         // alongamento: sem demonstração
  [/afundo|passada|avan[cç]o/, 'Dumbbell_Lunges'],
  [/agachamento com salto|salto/, 'Freehand_Jump_Squat'],
  [/goblet/, 'Goblet_Squat'],
  [/smith/, 'Smith_Machine_Squat'],
  [/agachamento/, 'Barbell_Squat'],
  [/supino inclinado/, 'Leverage_Incline_Chest_Press'],
  [/supino (reto )?(na |em )?m[aá]quina/, 'Leverage_Chest_Press'],
  [/supino/, 'Dumbbell_Bench_Press'],
  [/serrote/, 'One-Arm_Dumbbell_Row'],
  [/barra fixa|pull ?-?up/, 'Pullups'],
  [/remada baixa|remada sentad|remada no cabo/, 'Seated_Cable_Rows'],
  [/remada/, 'Bent_Over_Two-Dumbbell_Row'],
  [/eleva[cç][aã]o p[eé]lvica|ponte|gl[uú]teo/, 'Barbell_Glute_Bridge'],
  [/desenvolvimento (na |em )?m[aá]quina/, 'Leverage_Shoulder_Press'],
  [/desenvolvimento|ombro/, 'Dumbbell_Shoulder_Press'],
  [/prancha lateral/, 'Side_Bridge'],
  [/prancha/, 'Plank'],
  [/leg press/, 'Leg_Press'],
  [/puxada.*(neutra|tri[aâ]ngulo|fechada)/, 'Close-Grip_Front_Lat_Pulldown'],
  [/puxada|pulldown/, 'Wide-Grip_Lat_Pulldown'],
  [/stiff/, 'Stiff-Legged_Dumbbell_Deadlift'],
  [/eleva[cç][aã]o lateral sentad/, 'Seated_Side_Lateral_Raise'],
  [/eleva[cç][aã]o lateral/, 'Side_Lateral_Raise'],
  [/eleva[cç][aã]o frontal/, 'Front_Cable_Raise'],
  [/abdominal infra|infra|eleva[cç][aã]o de pernas/, 'Flat_Bench_Lying_Leg_Raise'],
  [/abdominal bicicleta/, 'Air_Bike'],
  [/abdominal|crunch/, 'Crunches'],
  [/bike|bicicleta/, 'Bicycling_Stationary'],
  [/passada|afundo|avan[cç]o/, 'Dumbbell_Lunges'],
  [/voador inverso|crucifixo inverso|peck deck inverso/, 'Reverse_Machine_Flyes'],
  [/crossover|cross over/, 'Cable_Crossover'],
  [/crucifixo|peck|voador/, 'Butterfly'],
  [/flexora/, 'Lying_Leg_Curls'],
  [/extensora/, 'Leg_Extensions'],
  [/abdutora/, 'Thigh_Abductor'],
  [/panturrilha/, 'Standing_Calf_Raises'],
  [/scott/, 'Preacher_Curl'],
  [/rosca.*halter/, 'Dumbbell_Bicep_Curl'],
  [/rosca/, 'Barbell_Curl'],
  [/testa/, 'Lying_Triceps_Press'],
  [/tr[ií]ceps/, 'Triceps_Pushdown_-_Rope_Attachment'],
  [/el[ií]ptico|escada/, 'Elliptical_Trainer'],
  [/mountain|escalador/, 'Mountain_Climbers'],
  [/superman/, 'Superman'],
  [/flex[aã]o/, 'Pushups'],
  [/esteira|caminhada|trote|corrida|correr/, 'Walking_Treadmill'],
];
/* demonstrações que já vêm com o app (public/ex) */
const NO_APP = new Set(['Air_Bike','Barbell_Curl','Barbell_Glute_Bridge','Barbell_Squat','Bent_Over_Two-Dumbbell_Row','Bicycling_Stationary','Butterfly','Crunches','Dumbbell_Bench_Press','Dumbbell_Lunges','Dumbbell_Shoulder_Press','Elliptical_Trainer','Flat_Bench_Lying_Leg_Raise','Freehand_Jump_Squat','Goblet_Squat','Leg_Extensions','Leg_Press','Leverage_Incline_Chest_Press','Lying_Leg_Curls','Mountain_Climbers','Plank','Pushups','Seated_Cable_Rows','Side_Bridge','Side_Lateral_Raise','Smith_Machine_Squat','Standing_Calf_Raises','Stiff-Legged_Dumbbell_Deadlift','Superman','Thigh_Abductor','Triceps_Pushdown_-_Rope_Attachment','Walking_Treadmill','Wide-Grip_Lat_Pulldown']);
const CDN = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

/* Devolve { src } (animação que vem com o app) ou { frames: [início, fim] } (fotos carregadas na hora), ou null.
   demo: id do Free Exercise DB escolhido pela IA; sem ele, tenta pelo nome em português. */
export function demoDe(nome = '', demo = '') {
  const id = demo || MAPA.find(([re]) => re.test(nome.toLowerCase()))?.[1];   // '' = sem demonstração
  if (!id) return null;
  if (NO_APP.has(id)) return { src: `./ex/${id}.webp` };
  const base = CDN + encodeURIComponent(id).replace(/%2F/g, '/');
  return { frames: [`${base}/0.jpg`, `${base}/1.jpg`] };
}

/* sugestões de nomes ao montar o treino sozinho (todos têm demonstração) */
export const SUGESTOES = [
  'Agachamento livre', 'Agachamento goblet', 'Agachamento no Smith', 'Agachamento com salto', 'Leg press 45°',
  'Cadeira extensora', 'Mesa flexora', 'Cadeira abdutora', 'Stiff com halteres', 'Passada (cada perna)',
  'Elevação pélvica', 'Panturrilha em pé', 'Supino reto com halteres', 'Supino inclinado na máquina',
  'Crucifixo na máquina', 'Flexão de braço', 'Puxada frontal', 'Remada baixa no cabo', 'Remada curvada com halteres',
  'Desenvolvimento com halteres', 'Elevação lateral', 'Rosca direta', 'Tríceps corda', 'Abdominal',
  'Abdominal infra', 'Abdominal bicicleta', 'Prancha', 'Prancha lateral', 'Mountain climber', 'Superman',
  'Esteira', 'Bike', 'Elíptico', 'Supino reto máquina', 'Desenvolvimento máquina', 'Puxada pegada neutra',
  'Remada baixa com triângulo', 'Serrote com halter', 'Barra fixa', 'Voador', 'Voador inverso', 'Rosca Scott',
  'Rosca direta com halteres', 'Tríceps testa com halteres', 'Elevação frontal com corda', 'Elevação lateral sentado',
  'Afundo no Smith', 'Cadeira flexora', 'Crossover',
];
