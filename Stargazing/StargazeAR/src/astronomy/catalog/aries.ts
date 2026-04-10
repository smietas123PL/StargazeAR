import type { ConstellationData } from '../../types';

export const aries: ConstellationData = {
  "id": "aries",
  "name": "Baran",
  "nameEn": "Aries",
  "abbreviation": "Ari",
  "description": "Niewielki, ale ważny gwiazdozbiór zodiakalny. Jego najjaśniejsza gwiazda to Hamal.",
  "season": [
    "jesień"
  ],
  "centerRa": 39.5,
  "centerDec": 21,
  "stars": [
    {
      "id": "hamal",
      "name": "Hamal",
      "ra": 31.79,
      "dec": 23.46,
      "magnitude": 2.01,
      "isMain": true
    },
    {
      "id": "sheratan",
      "name": "Sheratan",
      "ra": 28.66,
      "dec": 20.81,
      "magnitude": 2.64,
      "isMain": true
    },
    {
      "id": "mesarthim",
      "name": "Mesarthim",
      "ra": 28.38,
      "dec": 19.29,
      "magnitude": 3.88,
      "isMain": false
    },
    {
      "id": "botein",
      "name": "Botein",
      "ra": 47.9,
      "dec": 19.73,
      "magnitude": 4.35,
      "isMain": false
    }
  ],
  "lines": [
    [
      2,
      1
    ],
    [
      1,
      0
    ],
    [
      0,
      3
    ]
  ]
};
