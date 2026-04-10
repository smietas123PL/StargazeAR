import type { ConstellationData } from '../../types';

export const cygnus: ConstellationData = {
  "id": "cygnus",
  "name": "Łabędź",
  "nameEn": "Cygnus",
  "abbreviation": "Cyg",
  "description": "Letni gwiazdozbiór przecinający Drogę Mleczną i tworzący Krzyż Północy.",
  "season": [
    "lato",
    "jesień"
  ],
  "centerRa": 309.4,
  "centerDec": 42,
  "stars": [
    {
      "id": "deneb",
      "name": "Deneb",
      "ra": 310.358,
      "dec": 45.2739,
      "magnitude": 1.25,
      "isMain": true
    },
    {
      "id": "sadr",
      "name": "Sadr",
      "ra": 305.5571,
      "dec": 40.2538,
      "magnitude": 2.23,
      "isMain": true
    },
    {
      "id": "gienah",
      "name": "Gienah",
      "ra": 311.5528,
      "dec": 33.9702,
      "magnitude": 2.48,
      "isMain": true
    },
    {
      "id": "delta-cygni",
      "name": "Delta Cygni",
      "ra": 296.2437,
      "dec": 45.1329,
      "magnitude": 2.86,
      "isMain": false
    },
    {
      "id": "albireo",
      "name": "Albireo",
      "ra": 292.6803,
      "dec": 27.962,
      "magnitude": 3.05,
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
      1,
      3
    ],
    [
      1,
      4
    ]
  ]
};
