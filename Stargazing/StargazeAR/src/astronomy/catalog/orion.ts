import type { ConstellationData } from '../../types';

export const orion: ConstellationData = {
  "id": "orion",
  "name": "Orion",
  "nameEn": "Orion",
  "abbreviation": "Ori",
  "description": "Jedna z najbardziej rozpoznawalnych zimowych konstelacji z wyraźnym pasem.",
  "season": [
    "jesień",
    "zima"
  ],
  "centerRa": 83.8,
  "centerDec": -5.4,
  "stars": [
    {
      "id": "betelgeuse",
      "name": "Betelgeuse",
      "ra": 88.7929,
      "dec": 7.4029,
      "magnitude": 0.42,
      "isMain": true
    },
    {
      "id": "bellatrix",
      "name": "Bellatrix",
      "ra": 81.2828,
      "dec": 6.3355,
      "magnitude": 1.64,
      "isMain": true
    },
    {
      "id": "mintaka",
      "name": "Mintaka",
      "ra": 83.0017,
      "dec": -0.299,
      "magnitude": 2.23,
      "isMain": true
    },
    {
      "id": "alnilam",
      "name": "Alnilam",
      "ra": 84.0534,
      "dec": -1.2036,
      "magnitude": 1.69,
      "isMain": true
    },
    {
      "id": "alnitak",
      "name": "Alnitak",
      "ra": 85.1897,
      "dec": -1.946,
      "magnitude": 1.74,
      "isMain": true
    },
    {
      "id": "rigel",
      "name": "Rigel",
      "ra": 78.6345,
      "dec": -8.209,
      "magnitude": 0.13,
      "isMain": true
    },
    {
      "id": "saiph",
      "name": "Saiph",
      "ra": 86.9391,
      "dec": -9.6793,
      "magnitude": 2.06,
      "isMain": true
    }
  ],
  "lines": [
    [
      0,
      4
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
      6
    ],
    [
      2,
      5
    ],
    [
      0,
      1
    ]
  ]
};
