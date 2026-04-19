import { SOPClassHandlerId } from './id';
import { utils } from '@ohif/core';

const SOP_CLASS_UIDS = {
  TWELVE_LEAD_ECG: '1.2.840.10008.5.1.4.1.1.9.1.1',
  GENERAL_ECG: '1.2.840.10008.5.1.4.1.1.9.1.2',
  AMBULATORY_ECG: '1.2.840.10008.5.1.4.1.1.9.1.3',
  HEMODYNAMIC_WAVEFORM: '1.2.840.10008.5.1.4.1.1.9.2.1',
  BASIC_CARDIAC_EP: '1.2.840.10008.5.1.4.1.1.9.3.1',
  ARTERIAL_PULSE_WAVEFORM: '1.2.840.10008.5.1.4.1.1.9.5.1',
  RESPIRATORY_WAVEFORM: '1.2.840.10008.5.1.4.1.1.9.6.1',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

const _getDisplaySetsFromSeries = (instances, servicesManager, extensionManager) => {
  return instances.map(instance => {
    const { Modality, SOPInstanceUID, SOPClassUID } = instance;
    const { SeriesDescription = 'ECG Waveform' } = instance;
    const { SeriesNumber, SeriesDate, SeriesInstanceUID, StudyInstanceUID } = instance;

    const displaySet = {
      Modality,
      displaySetInstanceUID: utils.guid(),
      SeriesDescription,
      SeriesNumber,
      SeriesDate,
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
      SOPClassHandlerId,
      SOPClassUID,
      referencedImages: null,
      measurements: null,
      instances: [instance],
      thumbnailSrc: null,
      isDerivedDisplaySet: true,
      isLoaded: false,
      sopClassUids,
      numImageFrames: 0,
      numInstances: 1,
      instance,
    };

    return displaySet;
  });
};

export default function getSopClassHandlerModule(params) {
  const { servicesManager, extensionManager } = params;

  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return [
    {
      name: 'ecg-dicom',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}
