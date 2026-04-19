import React from 'react';

function HelloWorldPage() {
  return React.createElement(
    'div',
    {
      style: {
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
      },
    },
    React.createElement('h1', null, 'Hello World'),
    React.createElement('p', null, 'This is a custom route registered via CustomizationService.'),
    React.createElement(
      'a',
      { href: '/', style: { color: '#5acce6', marginTop: '1rem' } },
      'Back to Study List'
    )
  );
}

export default function getCustomizationModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'default',
      value: {
        'awatson1978.viewportContextMenu': {
          inheritsFrom: 'ohif.contextMenu',
          menus: [
            {
              id: 'viewportActions',
              selector: ({ nearbyToolData }) => !nearbyToolData,
              items: [
                {
                  label: 'Log Viewport Info',
                  commands: [{ commandName: 'awatson1978.logViewportData' }],
                },
                {
                  label: 'Inspect Viewport State',
                  commands: [{ commandName: 'awatson1978.inspectViewportState' }],
                },
              ],
            },
            {
              id: 'forExistingMeasurement',
              selector: ({ nearbyToolData }) => !!nearbyToolData,
              items: [
                { label: 'Delete measurement', commands: 'removeMeasurement' },
                { label: 'Add Label', commands: 'setMeasurementLabel' },
              ],
            },
          ],
        },
        'routes.customRoutes': {
          routes: {
            $push: [
              {
                path: '/hello-world',
                children: HelloWorldPage,
              },
            ],
          },
        },
      },
    },
  ];
}
