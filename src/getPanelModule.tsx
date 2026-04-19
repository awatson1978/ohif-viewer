import FhirConfigPanel from './Panels/FhirConfigPanel';

function getPanelModule({ servicesManager, commandsManager }) {
  return [
    {
      name: 'fhirConfig',
      iconName: 'tab-patient-info',
      iconLabel: 'FHIR',
      label: 'FHIR',
      component: FhirConfigPanel,
    },
  ];
}

export default getPanelModule;
