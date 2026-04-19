import { DicomMetadataStore } from '@ohif/core';

export default function registerHangingProtocolAttributes({ servicesManager }) {
  const { hangingProtocolService } = servicesManager.services;

  hangingProtocolService.addCustomAttribute('BodyPartExamined', 'BodyPartExamined', study => {
    const { instances } = DicomMetadataStore.getSeries(
      study.StudyInstanceUID,
      study?.series[0]?.SeriesInstanceUID
    );

    return instances[0].BodyPartExamined;
  });
}
