import type { ConstellationData } from '../../types';

export const aquarius: ConstellationData = {
  "id": "aquarius",
  "name": "Wodnik",
  "nameEn": "Aquarius",
  "abbreviation": "Aqr",
  "description": "Rozległy gwiazdozbiór zodiakalny zawierający m.in. Sadalmelik i Sadalsuud.",
  "season": [
    "jesień"
  ],
  "centerRa": 334,
  "centerDec": -10,
  "stars": [
    {
      "id": "sadalmelik",
      "name": "Sadalmelik",
      "ra": 331.45,
      "dec": -0.32,
      "magnitude": 2.95,
      "isMain": true
    },
    {
      "id": "sadalsuud",
      "name": "Sadalsuud",
      "ra": 322.89,
      "dec": -5.57,
      "magnitude": 2.9,
      "isMain": true
    },
    {
      "id": "sadachbia",
      "name": "Sadachbia",
      "ra": 335.41,
      "dec": -1.39,
      "magnitude": 3.86,
      "isMain": false
    },
    {
      "id": "skat",
      "name": "Skat",
      "ra": 343.66,
      "dec": -15.82,
      "magnitude": 3.27,
      "isMain": true
    }
  ],
  "lines": [
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
    ]
  ]
};
