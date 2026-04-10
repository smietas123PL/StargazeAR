import type { ConstellationData } from '../../types';

export const taurus: ConstellationData = {
  "id": "taurus",
  "name": "Byk",
  "nameEn": "Taurus",
  "abbreviation": "Tau",
  "description": "Zimowa konstelacja z Aldebaranem i gromadą Plejad na jej obrzeżu.",
  "season": [
    "jesień",
    "zima"
  ],
  "centerRa": 66.9,
  "centerDec": 19.2,
  "stars": [
    {
      "id": "elnath",
      "name": "Elnath",
      "ra": 81.573,
      "dec": 28.6049,
      "magnitude": 1.65,
      "isMain": true
    },
    {
      "id": "gamma-tauri",
      "name": "Gamma Tauri",
      "ra": 64.9483,
      "dec": 15.6299,
      "magnitude": 3.65,
      "isMain": false
    },
    {
      "id": "aldebaran",
      "name": "Aldebaran",
      "ra": 68.9802,
      "dec": 16.5153,
      "magnitude": 0.87,
      "isMain": true
    },
    {
      "id": "alcyone",
      "name": "Alcyone",
      "ra": 56.8712,
      "dec": 24.1081,
      "magnitude": 2.87,
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
    ]
  ]
};
