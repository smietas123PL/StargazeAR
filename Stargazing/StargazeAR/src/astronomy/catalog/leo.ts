import type { ConstellationData } from '../../types';

export const leo: ConstellationData = {
  "id": "leo",
  "name": "Lew",
  "nameEn": "Leo",
  "abbreviation": "Leo",
  "description": "Wiosenny gwiazdozbiór z Regulusem i wyraźnym sierpem w części przedniej.",
  "season": [
    "wiosna"
  ],
  "centerRa": 152.1,
  "centerDec": 13.2,
  "stars": [
    {
      "id": "regulus",
      "name": "Regulus",
      "ra": 152.093,
      "dec": 11.9729,
      "magnitude": 1.36,
      "isMain": true
    },
    {
      "id": "algieba",
      "name": "Algieba",
      "ra": 154.9931,
      "dec": 19.8495,
      "magnitude": 2.01,
      "isMain": true
    },
    {
      "id": "adhafera",
      "name": "Adhafera",
      "ra": 154.1726,
      "dec": 23.4282,
      "magnitude": 3.43,
      "isMain": false
    },
    {
      "id": "zosma",
      "name": "Zosma",
      "ra": 168.5271,
      "dec": 20.5185,
      "magnitude": 2.56,
      "isMain": true
    },
    {
      "id": "denebola",
      "name": "Denebola",
      "ra": 177.2649,
      "dec": 14.5677,
      "magnitude": 2.14,
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
      3,
      4
    ]
  ]
};
