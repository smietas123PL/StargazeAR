import type { ConstellationData } from '../types';

/**
 * Uproszczony katalog 15 gwiazdozbiorów dobrze znanych i widocznych z Polski.
 *
 * Współrzędne gwiazd zapisano w stopniach dziesiętnych dla epoki J2000.0.
 * Dane są celowo ograniczone do najważniejszych gwiazd potrzebnych do MVP overlayu.
 */
export const CONSTELLATIONS: ConstellationData[] = [
  {
    id: 'orion',
    name: 'Orion',
    nameEn: 'Orion',
    abbreviation: 'Ori',
    description: 'Jedna z najbardziej rozpoznawalnych zimowych konstelacji z wyraźnym pasem.',
    season: ['jesień', 'zima'],
    centerRa: 83.8,
    centerDec: -5.4,
    stars: [
      { id: 'betelgeuse', name: 'Betelgeuse', ra: 88.7929, dec: 7.4029, magnitude: 0.42, isMain: true },
      { id: 'bellatrix', name: 'Bellatrix', ra: 81.2828, dec: 6.3355, magnitude: 1.64, isMain: true },
      { id: 'mintaka', name: 'Mintaka', ra: 83.0017, dec: -0.299, magnitude: 2.23, isMain: true },
      { id: 'alnilam', name: 'Alnilam', ra: 84.0534, dec: -1.2036, magnitude: 1.69, isMain: true },
      { id: 'alnitak', name: 'Alnitak', ra: 85.1897, dec: -1.946, magnitude: 1.74, isMain: true },
      { id: 'rigel', name: 'Rigel', ra: 78.6345, dec: -8.209, magnitude: 0.13, isMain: true },
      { id: 'saiph', name: 'Saiph', ra: 86.9391, dec: -9.6793, magnitude: 2.06, isMain: true },
    ],
    lines: [
      [0, 4], // Betelgeuse (right shoulder) to Alnitak (left belt)
      [1, 2], // Bellatrix (left shoulder) to Mintaka (right belt)
      [2, 3], // Belt: Mintaka to Alnilam
      [3, 4], // Belt: Alnilam to Alnitak
      [4, 6], // Alnitak to Saiph (left knee)
      [2, 5], // Mintaka to Rigel (right knee)
      [0, 1], // Shoulder to shoulder
    ],
  },
  {
    id: 'ursa-major',
    name: 'Wielka Niedźwiedzica',
    nameEn: 'Ursa Major',
    abbreviation: 'UMa',
    description: 'Dom gwiazd Wielkiego Wozu, pomocny przy wyszukiwaniu północy.',
    season: ['wiosna'],
    centerRa: 165.5,
    centerDec: 55.4,
    stars: [
      { id: 'dubhe', name: 'Dubhe', ra: 165.932, dec: 61.7621, magnitude: 1.79, isMain: true },
      { id: 'merak', name: 'Merak', ra: 165.4603, dec: 56.3807, magnitude: 2.37, isMain: true },
      { id: 'phecda', name: 'Phecda', ra: 178.4577, dec: 53.6972, magnitude: 2.43, isMain: true },
      { id: 'megrez', name: 'Megrez', ra: 183.8565, dec: 57.0238, magnitude: 3.31, isMain: true },
      { id: 'alioth', name: 'Alioth', ra: 193.5073, dec: 55.9505, magnitude: 1.76, isMain: true },
      { id: 'mizar', name: 'Mizar', ra: 200.9814, dec: 54.9321, magnitude: 2.23, isMain: true },
      { id: 'alkaid', name: 'Alkaid', ra: 206.8852, dec: 49.309, magnitude: 1.85, isMain: true },
    ],
    lines: [
      [0, 1], // Dubhe - Merak
      [1, 2], // Merak - Phecda
      [2, 3], // Phecda - Megrez
      [3, 0], // Megrez - Dubhe (closes the bowl)
      [3, 4], // Megrez - Alioth (handle)
      [4, 5], // Alioth - Mizar
      [5, 6], // Mizar - Alkaid
    ],
  },
  {
    id: 'ursa-minor',
    name: 'Mała Niedźwiedzica',
    nameEn: 'Ursa Minor',
    abbreviation: 'UMi',
    description: 'Niewielka północna konstelacja z Gwiazdą Polarną na końcu dyszla.',
    season: ['wiosna', 'lato', 'jesień', 'zima'],
    centerRa: 230,
    centerDec: 77.7,
    stars: [
      { id: 'polaris', name: 'Polaris', ra: 37.9546, dec: 89.2636, magnitude: 1.97, isMain: true },
      { id: 'yildun', name: 'Yildun', ra: 263.05, dec: 86.58, magnitude: 4.35, isMain: false },
      { id: 'epsilon-umi', name: 'Epsilon UMi', ra: 251.49, dec: 82.03, magnitude: 4.21, isMain: false },
      { id: 'zeta-umi', name: 'Zeta UMi', ra: 236.01, dec: 77.78, magnitude: 4.27, isMain: false },
      { id: 'kochab', name: 'Kochab', ra: 222.6764, dec: 74.1618, magnitude: 2.08, isMain: true },
      { id: 'pherkad', name: 'Pherkad', ra: 230.1821, dec: 71.8455, magnitude: 3.05, isMain: true },
      { id: 'eta-umi', name: 'Eta UMi', ra: 244.37, dec: 75.75, magnitude: 4.95, isMain: false },
    ],
    lines: [
      [0, 1], // Handle: Polaris to Yildun
      [1, 2], // Handle: Yildun to Epsilon
      [2, 3], // Handle: Epsilon to Zeta (bowl joint)
      [3, 6], // Bowl top: Zeta to Eta
      [6, 5], // Bowl rim: Eta to Pherkad
      [5, 4], // Bowl front: Pherkad to Kochab
      [4, 3], // Bowl bottom: Kochab to Zeta (closes bowl)
    ],
  },
  {
    id: 'cassiopeia',
    name: 'Kasjopea',
    nameEn: 'Cassiopeia',
    abbreviation: 'Cas',
    description: 'Charakterystyczna konstelacja w kształcie litery W wysoko nad północą.',
    season: ['wiosna', 'lato', 'jesień', 'zima'],
    centerRa: 14.2,
    centerDec: 62.2,
    stars: [
      { id: 'caph', name: 'Caph', ra: 2.2945, dec: 59.1363, magnitude: 2.28, isMain: true },
      { id: 'schedar', name: 'Schedar', ra: 10.1268, dec: 56.5418, magnitude: 2.24, isMain: true },
      { id: 'tsih', name: 'Tsih', ra: 14.1772, dec: 60.7285, magnitude: 2.15, isMain: true },
      { id: 'ruchbah', name: 'Ruchbah', ra: 21.454, dec: 60.2469, magnitude: 2.68, isMain: true },
      { id: 'segin', name: 'Segin', ra: 28.5989, dec: 63.6733, magnitude: 3.35, isMain: false },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: 'leo',
    name: 'Lew',
    nameEn: 'Leo',
    abbreviation: 'Leo',
    description: 'Wiosenny gwiazdozbiór z Regulusem i wyraźnym sierpem w części przedniej.',
    season: ['wiosna'],
    centerRa: 152.1,
    centerDec: 13.2,
    stars: [
      { id: 'regulus', name: 'Regulus', ra: 152.093, dec: 11.9729, magnitude: 1.36, isMain: true },
      { id: 'algieba', name: 'Algieba', ra: 154.9931, dec: 19.8495, magnitude: 2.01, isMain: true },
      { id: 'adhafera', name: 'Adhafera', ra: 154.1726, dec: 23.4282, magnitude: 3.43, isMain: false },
      { id: 'zosma', name: 'Zosma', ra: 168.5271, dec: 20.5185, magnitude: 2.56, isMain: true },
      { id: 'denebola', name: 'Denebola', ra: 177.2649, dec: 14.5677, magnitude: 2.14, isMain: true },
    ],
    lines: [
      [0, 1], // Regulus to Algieba (bottom of sickle to middle)
      [1, 2], // Algieba to Adhafera (middle to top of sickle)
      [1, 3], // Algieba to Zosma (neck to rear flank)
      [3, 4], // Zosma to Denebola (rear flank to tail)
    ],
  },
  {
    id: 'scorpius',
    name: 'Skorpion',
    nameEn: 'Scorpius',
    abbreviation: 'Sco',
    description: 'Letnia konstelacja południowego nieba z czerwonym Antaresem w centrum.',
    season: ['lato'],
    centerRa: 253.1,
    centerDec: -26.6,
    stars: [
      { id: 'grafias', name: 'Grafias', ra: 241.3593, dec: -19.8073, magnitude: 2.62, isMain: true },
      { id: 'dschubba', name: 'Dschubba', ra: 240.0833, dec: -22.6222, magnitude: 2.29, isMain: true },
      { id: 'antares', name: 'Antares', ra: 247.3538, dec: -26.4236, magnitude: 1.06, isMain: true },
      { id: 'sargas', name: 'Sargas', ra: 264.3297, dec: -42.9886, magnitude: 1.86, isMain: true },
      { id: 'shaula', name: 'Shaula', ra: 263.4022, dec: -37.1101, magnitude: 1.62, isMain: true },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: 'taurus',
    name: 'Byk',
    nameEn: 'Taurus',
    abbreviation: 'Tau',
    description: 'Zimowa konstelacja z Aldebaranem i gromadą Plejad na jej obrzeżu.',
    season: ['jesień', 'zima'],
    centerRa: 66.9,
    centerDec: 19.2,
    stars: [
      { id: 'elnath', name: 'Elnath', ra: 81.573, dec: 28.6049, magnitude: 1.65, isMain: true },
      { id: 'gamma-tauri', name: 'Gamma Tauri', ra: 64.9483, dec: 15.6299, magnitude: 3.65, isMain: false },
      { id: 'aldebaran', name: 'Aldebaran', ra: 68.9802, dec: 16.5153, magnitude: 0.87, isMain: true },
      { id: 'alcyone', name: 'Alcyone', ra: 56.8712, dec: 24.1081, magnitude: 2.87, isMain: true },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    id: 'gemini',
    name: 'Bliźnięta',
    nameEn: 'Gemini',
    abbreviation: 'Gem',
    description: 'Jasna zimowa konstelacja z bliźniaczym duetem Castora i Polluksa.',
    season: ['zima'],
    centerRa: 113,
    centerDec: 22,
    stars: [
      { id: 'castor', name: 'Castor', ra: 113.6495, dec: 31.8933, magnitude: 1.58, isMain: true },
      { id: 'pollux', name: 'Pollux', ra: 116.329, dec: 28.0219, magnitude: 1.14, isMain: true },
      { id: 'mebsuta', name: 'Mebsuta', ra: 100.9833, dec: 25.1322, magnitude: 3.06, isMain: false },
      { id: 'alhena', name: 'Alhena', ra: 99.428, dec: 16.3952, magnitude: 1.93, isMain: true },
      { id: 'tejat', name: 'Tejat', ra: 95.7417, dec: 22.5161, magnitude: 2.87, isMain: false },
    ],
    lines: [
      [0, 2],
      [2, 3],
      [1, 4],
      [0, 1],
    ],
  },
  {
    id: 'virgo',
    name: 'Panna',
    nameEn: 'Virgo',
    abbreviation: 'Vir',
    description: 'Rozległa wiosenna konstelacja z jasną Spiką i polami gromad galaktyk.',
    season: ['wiosna'],
    centerRa: 187.6,
    centerDec: -4.2,
    stars: [
      { id: 'zavijava', name: 'Zavijava', ra: 177.6738, dec: 1.7616, magnitude: 3.38, isMain: false },
      { id: 'porrima', name: 'Porrima', ra: 190.415, dec: -1.4443, magnitude: 2.74, isMain: true },
      { id: 'zaniah', name: 'Zaniah', ra: 184.9767, dec: 0.6818, magnitude: 3.89, isMain: false },
      { id: 'vindemiatrix', name: 'Vindemiatrix', ra: 195.5442, dec: 10.9529, magnitude: 2.83, isMain: true },
      { id: 'spica', name: 'Spica', ra: 201.2982, dec: -11.1532, magnitude: 0.98, isMain: true },
    ],
    lines: [
      [0, 2], // Zavijava to Zaniah
      [2, 1], // Zaniah to Porrima (center point)
      [1, 3], // Porrima to Vindemiatrix (up)
      [1, 4], // Porrima to Spica (down to brightest star)
    ],
  },
  {
    id: 'perseus',
    name: 'Perseusz',
    nameEn: 'Perseus',
    abbreviation: 'Per',
    description: 'Jesienna konstelacja północnego nieba z Algolem i Mirfakiem.',
    season: ['jesień', 'zima'],
    centerRa: 49.8,
    centerDec: 45,
    stars: [
      { id: 'mirfak', name: 'Mirfak', ra: 51.0807, dec: 49.8554, magnitude: 1.79, isMain: true },
      { id: 'algol', name: 'Algol', ra: 47.0421, dec: 40.9528, magnitude: 2.12, isMain: true },
      { id: 'gamma-persei', name: 'Gamma Persei', ra: 46.1992, dec: 53.5133, magnitude: 2.93, isMain: false },
      { id: 'delta-persei', name: 'Delta Persei', ra: 55.7312, dec: 47.7988, magnitude: 3.01, isMain: false },
      { id: 'epsilon-persei', name: 'Epsilon Persei', ra: 59.4633, dec: 40.0142, magnitude: 2.88, isMain: false },
    ],
    lines: [
      [0, 2], // Mirfak to Gamma Persei
      [0, 1], // Mirfak to Algol
      [0, 3], // Mirfak to Delta Persei
      [3, 4], // Delta Persei to Epsilon Persei
    ],
  },
  {
    id: 'hercules',
    name: 'Herkules',
    nameEn: 'Hercules',
    abbreviation: 'Her',
    description: 'Duża letnia konstelacja znana z trapezu zwanego Kluczem Herkulesa.',
    season: ['lato'],
    centerRa: 258,
    centerDec: 27.5,
    stars: [
      { id: 'kornephoros', name: 'Kornephoros', ra: 247.555, dec: 21.487, magnitude: 2.78, isMain: true },
      { id: 'gamma-herculis', name: 'Gamma Herculis', ra: 245.4801, dec: 19.1653, magnitude: 3.75, isMain: false },
      { id: 'rasalgethi', name: 'Rasalgethi', ra: 258.6619, dec: 14.3941, magnitude: 2.74, isMain: true },
      { id: 'omega-herculis', name: 'Omega Herculis', ra: 246.354, dec: 14.0236, magnitude: 4.56, isMain: false },
      { id: 'zeta-herculis', name: 'Zeta Herculis', ra: 250.3215, dec: 31.6048, magnitude: 2.81, isMain: true },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
    ],
  },
  {
    id: 'cygnus',
    name: 'Łabędź',
    nameEn: 'Cygnus',
    abbreviation: 'Cyg',
    description: 'Letni gwiazdozbiór przecinający Drogę Mleczną i tworzący Krzyż Północy.',
    season: ['lato', 'jesień'],
    centerRa: 309.4,
    centerDec: 42,
    stars: [
      { id: 'deneb', name: 'Deneb', ra: 310.358, dec: 45.2739, magnitude: 1.25, isMain: true },
      { id: 'sadr', name: 'Sadr', ra: 305.5571, dec: 40.2538, magnitude: 2.23, isMain: true },
      { id: 'gienah', name: 'Gienah', ra: 311.5528, dec: 33.9702, magnitude: 2.48, isMain: true },
      { id: 'delta-cygni', name: 'Delta Cygni', ra: 296.2437, dec: 45.1329, magnitude: 2.86, isMain: false },
      { id: 'albireo', name: 'Albireo', ra: 292.6803, dec: 27.962, magnitude: 3.05, isMain: true },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ],
  },
  {
    id: 'aquila',
    name: 'Orzeł',
    nameEn: 'Aquila',
    abbreviation: 'Aql',
    description: 'Letni gwiazdozbiór z Altairem, jednym z wierzchołków Trójkąta Letniego.',
    season: ['lato'],
    centerRa: 297.7,
    centerDec: 3.4,
    stars: [
      { id: 'tarazed', name: 'Tarazed', ra: 296.5649, dec: 10.6043, magnitude: 2.72, isMain: true },
      { id: 'altair', name: 'Altair', ra: 297.6958, dec: 8.8797, magnitude: 0.76, isMain: true },
      { id: 'alshain', name: 'Alshain', ra: 298.8283, dec: 6.4052, magnitude: 3.71, isMain: true },
      { id: 'delta-aquilae', name: 'Delta Aquilae', ra: 291.3746, dec: 3.1083, magnitude: 3.36, isMain: false },
      { id: 'lambda-aquilae', name: 'Lambda Aquilae', ra: 286.5621, dec: -4.8708, magnitude: 3.43, isMain: false },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ],
  },
  {
    id: 'lyra',
    name: 'Lutnia',
    nameEn: 'Lyra',
    abbreviation: 'Lyr',
    description: 'Mała letnia konstelacja z Wegą, jedną z najjaśniejszych gwiazd nieba.',
    season: ['lato'],
    centerRa: 286.5,
    centerDec: 36.9,
    stars: [
      { id: 'vega', name: 'Vega', ra: 279.2347, dec: 38.799, magnitude: 0.03, isMain: true },
      { id: 'zeta-lyrae', name: 'Zeta Lyrae', ra: 281.1932, dec: 37.6129, magnitude: 4.34, isMain: false },
      { id: 'beta-lyrae', name: 'Beta Lyrae', ra: 282.52, dec: 33.3513, magnitude: 3.52, isMain: true },
      { id: 'gamma-lyrae', name: 'Gamma Lyrae', ra: 284.7359, dec: 32.6991, magnitude: 3.25, isMain: true },
      { id: 'delta2-lyrae', name: 'Delta2 Lyrae', ra: 283.6262, dec: 36.8917, magnitude: 4.22, isMain: false },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
    ],
  },
  {
    id: 'andromeda',
    name: 'Andromeda',
    nameEn: 'Andromeda',
    abbreviation: 'And',
    description: 'Jesienna konstelacja z długim łańcuchem jasnych gwiazd i Galaktyką Andromedy.',
    season: ['jesień'],
    centerRa: 17.4,
    centerDec: 38.7,
    stars: [
      { id: 'alpheratz', name: 'Alpheratz', ra: 2.0969, dec: 29.0898, magnitude: 2.07, isMain: true },
      { id: 'delta-andromedae', name: 'Delta Andromedae', ra: 9.832, dec: 30.8555, magnitude: 3.27, isMain: false },
      { id: 'mirach', name: 'Mirach', ra: 17.433, dec: 35.6289, magnitude: 2.07, isMain: true },
      { id: 'upsilon-andromedae', name: 'Upsilon Andromedae', ra: 24.1993, dec: 41.4133, magnitude: 4.09, isMain: false },
      { id: 'almach', name: 'Almach', ra: 30.975, dec: 42.3317, magnitude: 2.1, isMain: true },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
];
