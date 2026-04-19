import { Types } from '@ohif/core';

const syncGroups = [
  {
    type: 'zoompan',
    id: 'zoompansync',
    source: true,
    target: true,
  },
  {
    type: 'voi',
    id: 'wlsync',
    source: true,
    target: true,
    options: {
      syncColormap: true,
    },
  },
];

export const chestBodyPart: Types.HangingProtocol.Protocol = {
  id: 'chestBodyPart',
  name: 'Chest Body Part',
  description: '2x2 grid layout for chest studies matched by BodyPartExamined',
  toolGroupIds: ['default'],
  protocolMatchingRules: [
    {
      attribute: 'BodyPartExamined',
      constraint: {
        contains: { value: 'CHEST' },
      },
      weight: 15,
    },
  ],
  displaySetSelectors: {
    anyDisplaySet: {
      seriesMatchingRules: [],
    },
  },
  defaultViewport: {
    viewportOptions: {
      viewportType: 'stack',
      toolGroupId: 'default',
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'defaultDisplaySetId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
  stages: [
    {
      name: 'chestBodyPart',
      id: 'chestBodyPart_2x2',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
        },
      },
      viewports: [
        {
          viewportOptions: {
            viewportId: 'chest-viewport-0',
            toolGroupId: 'default',
            syncGroups,
          },
          displaySets: [{ id: 'anyDisplaySet', matchedDisplaySetsIndex: 0 }],
        },
        {
          viewportOptions: {
            viewportId: 'chest-viewport-1',
            toolGroupId: 'default',
            syncGroups,
          },
          displaySets: [{ id: 'anyDisplaySet', matchedDisplaySetsIndex: 1 }],
        },
        {
          viewportOptions: {
            viewportId: 'chest-viewport-2',
            toolGroupId: 'default',
            syncGroups,
          },
          displaySets: [{ id: 'anyDisplaySet', matchedDisplaySetsIndex: 2 }],
        },
        {
          viewportOptions: {
            viewportId: 'chest-viewport-3',
            toolGroupId: 'default',
            syncGroups,
          },
          displaySets: [{ id: 'anyDisplaySet', matchedDisplaySetsIndex: 3 }],
        },
      ],
    },
  ],
};
