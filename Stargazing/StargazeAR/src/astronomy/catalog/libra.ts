import type { ConstellationData } from '../../types';

export const libra: ConstellationData = {
  "id": "libra",
  "name": "Waga",
  "nameEn": "Libra",
  "abbreviation": "Lib",
  "description": "Zodiakalny gwiazdozbiór nieba południowego, jedyny przedstawiający przedmiot.",
  "season": [
    "wiosna",
    "lato"
  ],
  "centerRa": 227.75,
  "centerDec": -15,
  "stars": [
    {
      "id": "zubeneschamali",
      "name": "Zubeneschamali",
      "ra": 229.25,
      "dec": -9.38,
      "magnitude": 2.61,
      "isMain": true
    },
    {
      "id": "zubenelgenubi",
      "name": "Zubenelgenubi",
      "ra": 222.72,
      "dec": -16.04,
      "magnitude": 2.75,
      "isMain": true
    },
    {
      "id": "zubenelhakrabi",
      "name": "Zubenelhakrabi",
      "ra": 233.88,
      "dec": -14.79,
      "magnitude": 3.91,
      "isMain": false
    },
    {
      "id": "brachium",
      "name": "Brachium",
      "ra": 226.02,
      "dec": -25.28,
      "magnitude": 3.25,
      "isMain": true
    },
    {
      "id": "upsilon-lib",
      "name": "Upsilon Lib",
      "ra": 234.25,
      "dec": -28.14,
      "magnitude": 3.6,
      "isMain": false
    }
  ],
  "lines": [
    [
      1,
      3
    ],
    [
      1,
      0
    ],
    [
      0,
      2
    ],
    [
      2,
      4
    ]
  ]
};
