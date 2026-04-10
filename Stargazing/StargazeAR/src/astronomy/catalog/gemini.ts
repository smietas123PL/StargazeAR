import type { ConstellationData } from '../../types';

export const gemini: ConstellationData = {
  "id": "gemini",
  "name": "Bliźnięta",
  "nameEn": "Gemini",
  "abbreviation": "Gem",
  "description": "Jasna zimowa konstelacja z bliźniaczym duetem Castora i Polluksa.",
  "season": [
    "zima"
  ],
  "centerRa": 113,
  "centerDec": 22,
  "stars": [
    {
      "id": "castor",
      "name": "Castor",
      "ra": 113.6495,
      "dec": 31.8933,
      "magnitude": 1.58,
      "isMain": true
    },
    {
      "id": "pollux",
      "name": "Pollux",
      "ra": 116.329,
      "dec": 28.0219,
      "magnitude": 1.14,
      "isMain": true
    },
    {
      "id": "mebsuta",
      "name": "Mebsuta",
      "ra": 100.9833,
      "dec": 25.1322,
      "magnitude": 3.06,
      "isMain": false
    },
    {
      "id": "alhena",
      "name": "Alhena",
      "ra": 99.428,
      "dec": 16.3952,
      "magnitude": 1.93,
      "isMain": true
    },
    {
      "id": "tejat",
      "name": "Tejat",
      "ra": 95.7417,
      "dec": 22.5161,
      "magnitude": 2.87,
      "isMain": false
    }
  ],
  "lines": [
    [
      0,
      2
    ],
    [
      2,
      3
    ],
    [
      1,
      4
    ],
    [
      0,
      1
    ]
  ]
};
