import type { ConstellationData } from '../../types';

export const canis_minor: ConstellationData = {
  "id": "canis-minor",
  "name": "Mały Pies",
  "nameEn": "Canis Minor",
  "abbreviation": "CMi",
  "description": "Niewielka konstelacja składająca się głównie z bardzo jasnego Procjona i Gomeisy.",
  "season": [
    "zima",
    "wiosna"
  ],
  "centerRa": 114,
  "centerDec": 5,
  "stars": [
    {
      "id": "procyon",
      "name": "Procyon",
      "ra": 114.83,
      "dec": 5.22,
      "magnitude": 0.34,
      "isMain": true
    },
    {
      "id": "gomeisa",
      "name": "Gomeisa",
      "ra": 111.79,
      "dec": 8.29,
      "magnitude": 2.89,
      "isMain": true
    }
  ],
  "lines": [
    [
      0,
      1
    ]
  ]
};
