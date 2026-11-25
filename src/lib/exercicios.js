/* Demonstração de cada exercício: fotos de início e fim do movimento (Free Exercise DB, domínio público),
   em public/ex/<id>.webp. Liga o nome em português (do plano ou digitado) à demonstração.
   A ordem importa: os mais específicos vêm primeiro. */
const MAPA = [
  [/agachamento com salto|salto/, 'Freehand_Jump_Squat'],
  [/goblet/, 'Goblet_Squat'],
  [/smith/, 'Smith_Machine_Squat'],
  [/agachamento/, 'Barbell_Squat'],
  [/supino inclinado/, 'Leverage_Incline_Chest_Press'],
  [/supino/, 'Dumbbell_Bench_Press'],
  [/remada baixa|remada sentad|remada no cabo/, 'Seated_Cable_Rows'],
  [/remada/, 'Bent_Over_Two-Dumbbell_Row'],
  [/eleva[cç][aã]o p[eé]lvica|ponte|gl[uú]teo/, 'Barbell_Glute_Bridge'],
  [/desenvolvimento|ombro/, 'Dumbbell_Shoulder_Press'],
  [/prancha lateral/, 'Side_Bridge'],
  [/prancha/, 'Plank'],
  [/leg press/, 'Leg_Press'],
  [/puxada|pulldown/, 'Wide-Grip_Lat_Pulldown'],
  [/stiff/, 'Stiff-Legged_Dumbbell_Deadlift'],
  [/eleva[cç][aã]o lateral/, 'Side_Lateral_Raise'],
  [/abdominal infra|infra|eleva[cç][aã]o de pernas/, 'Flat_Bench_Lying_Leg_Raise'],
  [/abdominal bicicleta/, 'Air_Bike'],
  [/abdominal|crunch/, 'Crunches'],
  [/bike|bicicleta/, 'Bicycling_Stationary'],
  [/passada|afundo|avan[cç]o/, 'Dumbbell_Lunges'],
  [/crucifixo|peck|voador/, 'Butterfly'],
  [/flexora/, 'Lying_Leg_Curls'],
  [/extensora/, 'Leg_Extensions'],
  [/abdutora/, 'Thigh_Abductor'],
  [/panturrilha/, 'Standing_Calf_Raises'],
  [/rosca/, 'Barbell_Curl'],
  [/tr[ií]ceps/, 'Triceps_Pushdown_-_Rope_Attachment'],
  [/el[ií]ptico|escada/, 'Elliptical_Trainer'],
  [/mountain|escalador/, 'Mountain_Climbers'],
  [/superman/, 'Superman'],
  [/flex[aã]o/, 'Pushups'],
  [/esteira|caminhada|trote|corrida|correr/, 'Walking_Treadmill'],
];
const sem = (s) => s.toLowerCase();
export function demoDe(nome = '') {
  const n = sem(nome);
  const hit = MAPA.find(([re]) => re.test(n));
  return hit ? `./ex/${hit[1]}.webp` : null;
}
