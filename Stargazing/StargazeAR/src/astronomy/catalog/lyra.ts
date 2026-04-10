import type { ConstellationData } from '../../types';

export const lyra: ConstellationData = {
  "id": "lyra",
  "name": "Lutnia",
  "nameEn": "Lyra",
  "abbreviation": "Lyr",
  "description": "Mała letnia konstelacja z Wegą, jedną z najjaśniejszych gwiazd nieba.",
  "season": [
    "lato"
  ],
  "centerRa": 286.5,
  "centerDec": 36.9,
  "stars": [
    {
      "id": "vega",
      "name": "Vega",
      "ra": 279.2347,
      "dec": 38.799,
      "magnitude": 0.03,
      "isMain": true
    },
    {
      "id": "zeta-lyrae",
      "name": "Zeta Lyrae",
      "ra": 281.1932,
      "dec": 37.6129,
      "magnitude": 4.34,
      "isMain": false
    },
    {
      "id": "beta-lyrae",
      "name": "Beta Lyrae",
      "ra": 282.52,
      "dec": 33.3513,
      "magnitude": 3.52,
      "isMain": true
    },
    {
      "id": "gamma-lyrae",
      "name": "Gamma Lyrae",
      "ra": 284.7359,
      "dec": 32.6991,
      "magnitude": 3.25,
      "isMain": true
    },
    {
      "id": "delta2-lyrae",
      "name": "Delta2 Lyrae",
      "ra": 283.6262,
      "dec": 36.8917,
      "magnitude": 4.22,
      "isMain": false
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
      3,
      4
    ],
    [
      4,
      1
    ]
  ]
};
