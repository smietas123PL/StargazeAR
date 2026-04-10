import type { ConstellationData } from '../../types';

export const perseus: ConstellationData = {
  "id": "perseus",
  "name": "Perseusz",
  "nameEn": "Perseus",
  "abbreviation": "Per",
  "description": "Jesienna konstelacja północnego nieba z Algolem i Mirfakiem.",
  "season": [
    "jesień",
    "zima"
  ],
  "centerRa": 49.8,
  "centerDec": 45,
  "stars": [
    {
      "id": "mirfak",
      "name": "Mirfak",
      "ra": 51.0807,
      "dec": 49.8554,
      "magnitude": 1.79,
      "isMain": true
    },
    {
      "id": "algol",
      "name": "Algol",
      "ra": 47.0421,
      "dec": 40.9528,
      "magnitude": 2.12,
      "isMain": true
    },
    {
      "id": "gamma-persei",
      "name": "Gamma Persei",
      "ra": 46.1992,
      "dec": 53.5133,
      "magnitude": 2.93,
      "isMain": false
    },
    {
      "id": "delta-persei",
      "name": "Delta Persei",
      "ra": 55.7312,
      "dec": 47.7988,
      "magnitude": 3.01,
      "isMain": false
    },
    {
      "id": "epsilon-persei",
      "name": "Epsilon Persei",
      "ra": 59.4633,
      "dec": 40.0142,
      "magnitude": 2.88,
      "isMain": false
    }
  ],
  "lines": [
    [
      0,
      2
    ],
    [
      0,
      1
    ],
    [
      0,
      3
    ],
    [
      3,
      4
    ]
  ]
};
