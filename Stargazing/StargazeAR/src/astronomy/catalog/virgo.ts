import type { ConstellationData } from '../../types';

export const virgo: ConstellationData = {
  "id": "virgo",
  "name": "Panna",
  "nameEn": "Virgo",
  "abbreviation": "Vir",
  "description": "Rozległa wiosenna konstelacja z jasną Spiką i polami gromad galaktyk.",
  "season": [
    "wiosna"
  ],
  "centerRa": 187.6,
  "centerDec": -4.2,
  "stars": [
    {
      "id": "zavijava",
      "name": "Zavijava",
      "ra": 177.6738,
      "dec": 1.7616,
      "magnitude": 3.38,
      "isMain": false
    },
    {
      "id": "porrima",
      "name": "Porrima",
      "ra": 190.415,
      "dec": -1.4443,
      "magnitude": 2.74,
      "isMain": true
    },
    {
      "id": "zaniah",
      "name": "Zaniah",
      "ra": 184.9767,
      "dec": 0.6818,
      "magnitude": 3.89,
      "isMain": false
    },
    {
      "id": "vindemiatrix",
      "name": "Vindemiatrix",
      "ra": 195.5442,
      "dec": 10.9529,
      "magnitude": 2.83,
      "isMain": true
    },
    {
      "id": "spica",
      "name": "Spica",
      "ra": 201.2982,
      "dec": -11.1532,
      "magnitude": 0.98,
      "isMain": true
    }
  ],
  "lines": [
    [
      0,
      2
    ],
    [
      2,
      1
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
