import type { ConstellationData } from '../../types';

export const corona_borealis: ConstellationData = {
  "id": "corona-borealis",
  "name": "Korona Północna",
  "nameEn": "Corona Borealis",
  "abbreviation": "CrB",
  "description": "Wyraźny łuk gwiazd przypominający diadem, w centrum którego znajduje się Gemma (Alphecca).",
  "season": [
    "wiosna",
    "lato"
  ],
  "centerRa": 237,
  "centerDec": 26,
  "stars": [
    {
      "id": "alphecca",
      "name": "Alphecca",
      "ra": 233.67,
      "dec": 26.71,
      "magnitude": 2.22,
      "isMain": true
    },
    {
      "id": "nusakan",
      "name": "Nusakan",
      "ra": 231.95,
      "dec": 29.11,
      "magnitude": 3.66,
      "isMain": false
    },
    {
      "id": "gamma-crb",
      "name": "Gamma CrB",
      "ra": 235.68,
      "dec": 26.3,
      "magnitude": 3.81,
      "isMain": false
    },
    {
      "id": "delta-crb",
      "name": "Delta CrB",
      "ra": 237.4,
      "dec": 26.07,
      "magnitude": 4.59,
      "isMain": false
    },
    {
      "id": "epsilon-crb",
      "name": "Epsilon CrB",
      "ra": 239.39,
      "dec": 26.88,
      "magnitude": 4.14,
      "isMain": false
    },
    {
      "id": "theta-crb",
      "name": "Theta CrB",
      "ra": 233.23,
      "dec": 31.36,
      "magnitude": 4.14,
      "isMain": false
    }
  ],
  "lines": [
    [
      5,
      1
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
      3
    ],
    [
      3,
      4
    ]
  ]
};
