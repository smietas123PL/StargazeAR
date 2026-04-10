import type { ConstellationData } from '../../types';

export const aquila: ConstellationData = {
  "id": "aquila",
  "name": "Orzeł",
  "nameEn": "Aquila",
  "abbreviation": "Aql",
  "description": "Letni gwiazdozbiór z Altairem, jednym z wierzchołków Trójkąta Letniego.",
  "season": [
    "lato"
  ],
  "centerRa": 297.7,
  "centerDec": 3.4,
  "stars": [
    {
      "id": "tarazed",
      "name": "Tarazed",
      "ra": 296.5649,
      "dec": 10.6043,
      "magnitude": 2.72,
      "isMain": true
    },
    {
      "id": "altair",
      "name": "Altair",
      "ra": 297.6958,
      "dec": 8.8797,
      "magnitude": 0.76,
      "isMain": true
    },
    {
      "id": "alshain",
      "name": "Alshain",
      "ra": 298.8283,
      "dec": 6.4052,
      "magnitude": 3.71,
      "isMain": true
    },
    {
      "id": "delta-aquilae",
      "name": "Delta Aquilae",
      "ra": 291.3746,
      "dec": 3.1083,
      "magnitude": 3.36,
      "isMain": false
    },
    {
      "id": "lambda-aquilae",
      "name": "Lambda Aquilae",
      "ra": 286.5621,
      "dec": -4.8708,
      "magnitude": 3.43,
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
      1,
      3
    ],
    [
      1,
      4
    ]
  ]
};
