import type { ConstellationData } from '../../types';

export const ursa_minor: ConstellationData = {
  "id": "ursa-minor",
  "name": "Mała Niedźwiedzica",
  "nameEn": "Ursa Minor",
  "abbreviation": "UMi",
  "description": "Niewielka północna konstelacja z Gwiazdą Polarną na końcu dyszla.",
  "season": [
    "wiosna",
    "lato",
    "jesień",
    "zima"
  ],
  "centerRa": 230,
  "centerDec": 77.7,
  "stars": [
    {
      "id": "polaris",
      "name": "Polaris",
      "ra": 37.9546,
      "dec": 89.2636,
      "magnitude": 1.97,
      "isMain": true
    },
    {
      "id": "yildun",
      "name": "Yildun",
      "ra": 263.05,
      "dec": 86.58,
      "magnitude": 4.35,
      "isMain": false
    },
    {
      "id": "epsilon-umi",
      "name": "Epsilon UMi",
      "ra": 251.49,
      "dec": 82.03,
      "magnitude": 4.21,
      "isMain": false
    },
    {
      "id": "zeta-umi",
      "name": "Zeta UMi",
      "ra": 236.01,
      "dec": 77.78,
      "magnitude": 4.27,
      "isMain": false
    },
    {
      "id": "kochab",
      "name": "Kochab",
      "ra": 222.6764,
      "dec": 74.1618,
      "magnitude": 2.08,
      "isMain": true
    },
    {
      "id": "pherkad",
      "name": "Pherkad",
      "ra": 230.1821,
      "dec": 71.8455,
      "magnitude": 3.05,
      "isMain": true
    },
    {
      "id": "eta-umi",
      "name": "Eta UMi",
      "ra": 244.37,
      "dec": 75.75,
      "magnitude": 4.95,
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
      6
    ],
    [
      6,
      5
    ],
    [
      5,
      4
    ],
    [
      4,
      3
    ]
  ]
};
