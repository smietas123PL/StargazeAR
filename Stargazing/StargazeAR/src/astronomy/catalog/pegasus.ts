import type { ConstellationData } from '../../types';

export const pegasus: ConstellationData = {
  "id": "pegasus",
  "name": "Pegaz",
  "nameEn": "Pegasus",
  "abbreviation": "Peg",
  "description": "Znana konstelacja jesienna, w której najjaśniejsze gwiazdy tworzą Wielki Kwadrat Pegaza.",
  "season": [
    "jesień"
  ],
  "centerRa": 340,
  "centerDec": 19,
  "stars": [
    {
      "id": "markab",
      "name": "Markab",
      "ra": 346.19,
      "dec": 15.21,
      "magnitude": 2.49,
      "isMain": true
    },
    {
      "id": "scheat",
      "name": "Scheat",
      "ra": 345.94,
      "dec": 28.08,
      "magnitude": 2.44,
      "isMain": true
    },
    {
      "id": "algenib",
      "name": "Algenib",
      "ra": 3.31,
      "dec": 15.18,
      "magnitude": 2.84,
      "isMain": true
    },
    {
      "id": "enif",
      "name": "Enif",
      "ra": 326.05,
      "dec": 9.88,
      "magnitude": 2.38,
      "isMain": true
    },
    {
      "id": "matar",
      "name": "Matar",
      "ra": 340.75,
      "dec": 30.22,
      "magnitude": 2.93,
      "isMain": false
    }
  ],
  "lines": [
    [
      0,
      1
    ],
    [
      0,
      2
    ],
    [
      0,
      3
    ],
    [
      1,
      4
    ]
  ]
};
