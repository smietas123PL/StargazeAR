import type { ConstellationData } from '../../types';

export const hercules: ConstellationData = {
  "id": "hercules",
  "name": "Herkules",
  "nameEn": "Hercules",
  "abbreviation": "Her",
  "description": "Duża letnia konstelacja znana z trapezu zwanego Kluczem Herkulesa.",
  "season": [
    "lato"
  ],
  "centerRa": 258,
  "centerDec": 27.5,
  "stars": [
    {
      "id": "kornephoros",
      "name": "Kornephoros",
      "ra": 247.555,
      "dec": 21.487,
      "magnitude": 2.78,
      "isMain": true
    },
    {
      "id": "gamma-herculis",
      "name": "Gamma Herculis",
      "ra": 245.4801,
      "dec": 19.1653,
      "magnitude": 3.75,
      "isMain": false
    },
    {
      "id": "rasalgethi",
      "name": "Rasalgethi",
      "ra": 258.6619,
      "dec": 14.3941,
      "magnitude": 2.74,
      "isMain": true
    },
    {
      "id": "omega-herculis",
      "name": "Omega Herculis",
      "ra": 246.354,
      "dec": 14.0236,
      "magnitude": 4.56,
      "isMain": false
    },
    {
      "id": "zeta-herculis",
      "name": "Zeta Herculis",
      "ra": 250.3215,
      "dec": 31.6048,
      "magnitude": 2.81,
      "isMain": true
    }
  ],
  "lines": [
    [
      0,
      1
    ],
    [
      1,
      2
    ],
    [
      2,
      3
    ],
    [
      1,
      4
    ]
  ]
};
