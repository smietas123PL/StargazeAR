import type { ConstellationData } from '../../types';

export const pisces: ConstellationData = {
  "id": "pisces",
  "name": "Ryby",
  "nameEn": "Pisces",
  "abbreviation": "Psc",
  "description": "Zodiakalna konstelacja jesienna o kształcie dwóch połączonych wstęgą ryb.",
  "season": [
    "jesień"
  ],
  "centerRa": 7,
  "centerDec": 13,
  "stars": [
    {
      "id": "alrescha",
      "name": "Alrescha",
      "ra": 30.51,
      "dec": 2.76,
      "magnitude": 3.82,
      "isMain": true
    },
    {
      "id": "gamma-psc",
      "name": "Gamma Psc",
      "ra": 349.29,
      "dec": 3.28,
      "magnitude": 3.7,
      "isMain": false
    },
    {
      "id": "eta-psc",
      "name": "Eta Psc",
      "ra": 22.87,
      "dec": 15.35,
      "magnitude": 3.62,
      "isMain": false
    },
    {
      "id": "omega-psc",
      "name": "Omega Psc",
      "ra": 359.83,
      "dec": 6.86,
      "magnitude": 4.03,
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
    ]
  ]
};
