import type { Button } from '@ohif/core/types';

function toolbarButtons() {
  const buttons: Button[] = [
    {
      id: 'awatson1978-ohif-viewer.logViewportData',
      uiType: 'ohif.toolButton',
      props: {
        icon: 'dicom-tag-browser',
        label: 'Viewport Data',
        tooltip: 'Log comprehensive viewport data to console',
        commands: {
          commandName: 'awatson1978.logViewportData',
        },
        evaluate: 'evaluate.action',
      },
    },
    {
      id: 'awatson1978-ohif-viewer.inspectViewportState',
      uiType: 'ohif.toolButton',
      props: {
        icon: 'info',
        label: 'Inspect State',
        tooltip: 'Inspect current viewport state and properties',
        commands: {
          commandName: 'awatson1978.inspectViewportState',
        },
        evaluate: 'evaluate.action',
      },
    },
    {
      id: 'Text',
      uiType: 'ohif.toolButton',
      props: {
        icon: 'info',
        label: 'Text',
        tooltip: 'Text',
        commands: {
          commandName: 'setToolActiveToolbar',
          commandOptions: {
            toolGroupIds: ['default', 'CustomTools'],
          },
        },
        evaluate: 'evaluate.cornerstoneTool',
      },
    },
  ];

  return buttons;
}

export default toolbarButtons;
