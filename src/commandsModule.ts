import React from 'react';
import JSZip from 'jszip';
import { Types as OhifTypes, DicomMetadataStore } from '@ohif/core';
import { callInputDialog } from '@ohif/extension-default';

function commandsModule({
  servicesManager,
  commandsManager,
  extensionManager,
}: OhifTypes.Extensions.ExtensionParams): OhifTypes.Extensions.CommandsModule {
  const {
    viewportGridService,
    toolGroupService,
    cornerstoneViewportService,
    uiNotificationService,
    uiModalService,
    measurementService,
    displaySetService,
    userAuthenticationService,
  } = servicesManager.services as AppTypes.Services;

  function ViewportStateModal({ stateData, hide }: { stateData: any; hide: () => void }) {
    return React.createElement(
      'div',
      { style: { maxHeight: '70vh', overflow: 'auto' } },
      React.createElement(
        'pre',
        {
          style: {
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            color: '#ffffff',
          },
        },
        JSON.stringify(stateData, null, 2)
      )
    );
  }

  const helpers = {
    validateActiveViewport: (
      viewportGridService: any,
      uiNotificationService: any
    ): string | null => {
      const activeViewportId = viewportGridService.getActiveViewportId();

      if (!activeViewportId) {
        console.warn('🚨 No active viewport found');
        uiNotificationService.show({
          title: 'No Active Viewport',
          message: 'Please select a viewport first',
          type: 'warning',
        });
        return null;
      }

      return activeViewportId;
    },

    buildViewportInfo: (activeViewportId: string, viewportInfo: any, cornerstoneViewport: any) => {
      return {
        id: activeViewportId,
        info: viewportInfo || null,
        element: cornerstoneViewport?.element?.tagName || 'unknown',
        renderingEngineId: cornerstoneViewport?.getRenderingEngine?.()?.id || null,
        viewportType: cornerstoneViewport?.type || 'unknown',
      };
    },

    buildCameraData: (cornerstoneViewport: any) => {
      const camera = cornerstoneViewport?.getCamera ? cornerstoneViewport.getCamera() : null;

      return camera
        ? {
            position: camera.position || null,
            focalPoint: camera.focalPoint || null,
            viewUp: camera.viewUp || null,
            zoom: cornerstoneViewport?.getZoom?.() || null,
            pan: cornerstoneViewport?.getPan?.() || null,
          }
        : null;
    },

    buildDisplaySetsData: (displaySets: any[]) => {
      return Array.isArray(displaySets)
        ? displaySets.map(ds => ({
            displaySetInstanceUID: ds?.displaySetInstanceUID || 'unknown',
            SeriesInstanceUID: ds?.SeriesInstanceUID || 'unknown',
            StudyInstanceUID: ds?.StudyInstanceUID || 'unknown',
            modality: ds?.Modality || 'unknown',
            seriesDescription: ds?.SeriesDescription || 'No description',
            numImages: ds?.numImages || ds?.images?.length || 0,
            isReconstructable: Boolean(ds?.isReconstructable),
          }))
        : [];
    },

    buildRenderingData: (cornerstoneViewport: any) => {
      return cornerstoneViewport
        ? {
            canvas: {
              width: cornerstoneViewport.canvas?.width || 0,
              height: cornerstoneViewport.canvas?.height || 0,
            },
            defaultActor:
              cornerstoneViewport.getDefaultActor?.()?.actor?.getClassName?.() || 'unknown',
            numberOfActors: cornerstoneViewport.getActors?.()?.length || 0,
          }
        : null;
    },

    buildToolsData: (toolGroupService: any) => {
      return {
        toolGroups: toolGroupService.getToolGroupIds(),
      };
    },

    buildMeasurementsData: (measurementService: any) => {
      const measurements = measurementService.getMeasurements();
      return {
        count: measurements.length,
        types: [...new Set(measurements.map((m: any) => m.label))],
      };
    },

    buildPerformanceData: () => {
      type PerformanceData = {
        memory: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
        timing: number;
      };

      const perfData = performance as unknown as PerformanceData;
      const memoryInfo = perfData?.memory;

      return {
        memory: memoryInfo
          ? {
              usedJSHeapSize: memoryInfo.usedJSHeapSize || 0,
              totalJSHeapSize: memoryInfo.totalJSHeapSize || 0,
              jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit || 0,
            }
          : 'Not available',
        timing: performance?.now ? performance.now() : Date.now(),
      } as PerformanceData;
    },

    logViewportData: (viewportData: any, activeViewportId: string) => {
      console.group('🔍 Viewport Data Analysis');
      console.log('📊 Complete Viewport State:', viewportData);
      console.log('🎯 Active Viewport ID:', activeViewportId);
      console.log('📷 Camera Settings:', viewportData.camera);
      console.log('🖼️ Display Sets:', viewportData.displaySets);
      console.log('🛠️ Tools State:', viewportData.tools);
      console.log('📏 Measurements:', viewportData.measurements);
      console.log('⚡ Performance:', viewportData.performance);
      console.groupEnd();
    },

    showSuccessNotification: (uiNotificationService: any, activeViewportId: string) => {
      uiNotificationService.show({
        title: 'Viewport Data Logged',
        message: `Check console for viewport ${activeViewportId} details`,
        type: 'success',
      });
    },

    handleViewportDataError: (error: any, uiNotificationService: any) => {
      console.error('❌ Error logging viewport data:', error);
      uiNotificationService.show({
        title: 'Error',
        message: 'Failed to log viewport data. Check console for details.',
        type: 'error',
      });
    },

    buildStateInfo: (activeViewportId: string, cornerstoneViewport: any) => {
      return {
        viewport: {
          id: activeViewportId,
          type: cornerstoneViewport?.type || 'unknown',
          element: cornerstoneViewport?.element
            ? {
                width: cornerstoneViewport.element.clientWidth || 0,
                height: cornerstoneViewport.element.clientHeight || 0,
                offsetTop: cornerstoneViewport.element.offsetTop || 0,
                offsetLeft: cornerstoneViewport.element.offsetLeft || 0,
              }
            : null,
        },
        properties: cornerstoneViewport?.getProperties
          ? cornerstoneViewport.getProperties()
          : 'Not available',
        imageData: cornerstoneViewport?.getCurrentImageIdIndex
          ? `Image index: ${cornerstoneViewport.getCurrentImageIdIndex()}`
          : 'Not available',
        actors: cornerstoneViewport?.getActors
          ? cornerstoneViewport.getActors().map((actor: any) => ({
              uid: actor?.uid || 'unknown',
              actorType: actor?.actor?.getClassName?.() || 'unknown',
            }))
          : 'Not available',
      };
    },

    logStateInfo: (stateInfo: any) => {
      console.group('🔬 Viewport State Inspector');
      console.log('State Details:', stateInfo);
      console.groupEnd();
    },

    showInspectionNotification: (uiNotificationService: any) => {
      uiNotificationService.show({
        title: 'Viewport State Inspected',
        message: 'Check console for detailed state information',
        type: 'info',
      });
    },

    handleInspectionError: (error: any) => {
      console.error('❌ Error inspecting viewport state:', error);
    },
  };

  const actions = {
    logViewportDataCommand: () => {
      try {
        const activeViewportId = helpers.validateActiveViewport(
          viewportGridService,
          uiNotificationService
        );
        if (!activeViewportId) return;

        const viewportInfo = viewportGridService.getViewportState(activeViewportId);
        const cornerstoneViewport =
          cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
        const displaySets = displaySetService.getActiveDisplaySets();

        const viewportData = {
          timestamp: new Date().toISOString(),
          viewport: helpers.buildViewportInfo(activeViewportId, viewportInfo, cornerstoneViewport),
          camera: helpers.buildCameraData(cornerstoneViewport),
          displaySets: helpers.buildDisplaySetsData(displaySets),
          rendering: helpers.buildRenderingData(cornerstoneViewport),
          tools: helpers.buildToolsData(toolGroupService),
          measurements: helpers.buildMeasurementsData(measurementService),
          performance: helpers.buildPerformanceData(),
        };

        helpers.logViewportData(viewportData, activeViewportId);
        helpers.showSuccessNotification(uiNotificationService, activeViewportId);
      } catch (error) {
        helpers.handleViewportDataError(error, uiNotificationService);
      }
    },
    inspectViewportStateCommand: () => {
      try {
        const activeViewportId = viewportGridService.getActiveViewportId();

        if (!activeViewportId) {
          console.warn('🚨 No active viewport for state inspection');
          return;
        }

        const cornerstoneViewport =
          cornerstoneViewportService.getCornerstoneViewport(activeViewportId);

        if (!cornerstoneViewport) {
          console.warn('🚨 No cornerstone viewport found');
          return;
        }

        const stateInfo = helpers.buildStateInfo(activeViewportId, cornerstoneViewport);
        helpers.logStateInfo(stateInfo);
        uiModalService.show({
          title: 'Viewport State Inspector',
          content: ViewportStateModal,
          contentProps: { stateData: stateInfo },
        });
      } catch (error) {
        helpers.handleInspectionError(error);
      }
    },
    textCallback: async ({ callback, data, eventDetails }) => {
      try {
        const { uiDialogService } = servicesManager.services;

        // Get existing text from data if it's a change operation
        const existingText = data?.data?.text || '';

        // Show simple text input dialog
        const value = await callInputDialog({
          uiDialogService,
          defaultValue: existingText,
          title: 'Enter Text',
          placeholder: 'Type your text here...',
          submitOnEnter: true,
        });

        // If user cancels or enters empty text, pass null to trigger cleanup
        if (!value || value.trim() === '') {
          callback?.(null);
          return;
        }

        // Call the callback with the trimmed text
        callback?.(value.trim());
      } catch (error) {
        console.error('❌ Error in textCallback:', error);
        // Fallback to browser prompt if dialog fails
        const value = window.prompt('Enter text:', data?.data?.text || '');
        // Handle empty text in fallback mode too
        if (!value || value.trim() === '') {
          callback?.(null);
          return;
        }
        callback?.(value.trim());
      }
    },
    downloadDicomZip: async () => {
      try {
        const activeDisplaySets = displaySetService.getActiveDisplaySets();

        if (!activeDisplaySets || activeDisplaySets.length === 0) {
          uiNotificationService.show({
            title: 'No Study Loaded',
            message: 'There is no study loaded to export.',
            type: 'warning',
          });
          return;
        }

        const StudyInstanceUID = activeDisplaySets[0].StudyInstanceUID;

        if (!StudyInstanceUID) {
          uiNotificationService.show({
            title: 'Export Error',
            message: 'Could not determine the Study Instance UID.',
            type: 'error',
          });
          return;
        }

        uiNotificationService.show({
          title: 'Preparing DICOM ZIP',
          message: 'Fetching instances and building ZIP archive...',
          type: 'info',
        });

        const study = DicomMetadataStore.getStudy(StudyInstanceUID);

        if (!study || !study.series || study.series.length === 0) {
          uiNotificationService.show({
            title: 'Export Error',
            message: 'No series found in the study metadata.',
            type: 'error',
          });
          return;
        }

        // Get the active data source to fetch image IDs
        const [dataSource] = extensionManager.getActiveDataSource();

        // Derive wadoRoot from the first available imageId
        let wadoRoot = '';

        for (const displaySet of activeDisplaySets) {
          if (displaySet.StudyInstanceUID !== StudyInstanceUID) {
            continue;
          }
          const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
          if (imageIds && imageIds.length > 0) {
            const rawUrl = imageIds[0].replace(/^[a-zA-Z]+:/, '');
            const studiesIdx = rawUrl.indexOf('/studies/');
            if (studiesIdx !== -1) {
              wadoRoot = rawUrl.substring(0, studiesIdx);
            }
            break;
          }
        }

        const authHeaders = userAuthenticationService.getAuthorizationHeader();

        const zip = new JSZip();
        let instanceCount = 0;
        let errorCount = 0;

        // --- Strategy detection: probe one instance, then apply to all ---
        const firstSeries = study.series[0];
        const firstInstance = firstSeries.instances[0];
        const storedImageId = firstInstance.imageId || firstInstance.url || '';

        type Strategy = 'blobUrl' | 'wadoRs' | 'wadoUri';
        let strategy: Strategy | null = null;
        let probeArrayBuffer: ArrayBuffer | null = null;

        let probeUrl = '';
        let probeStatus = 0;

        if (storedImageId.startsWith('wadouri:blob:')) {
          // FHIR/GridFS blob URLs — direct fetch works
          strategy = 'blobUrl';
        } else if (wadoRoot) {
          // Probe WADO-RS: test-fetch one instance at the instance-level URL
          probeUrl =
            `${wadoRoot}/studies/${StudyInstanceUID}` +
            `/series/${firstSeries.SeriesInstanceUID}` +
            `/instances/${firstInstance.SOPInstanceUID}`;
          try {
            const probeResp = await fetch(probeUrl, {
              headers: { Accept: 'application/dicom', ...authHeaders },
            });
            probeStatus = probeResp.status;
            if (probeResp.ok) {
              strategy = 'wadoRs';
              probeArrayBuffer = await probeResp.arrayBuffer();
            }
          } catch {
            // probe failed — fall through to WADO-URI
          }

          if (!strategy) {
            // Probe WADO-URI
            const wadoUri = (firstInstance as any).wadoUri || '';
            if (wadoUri) {
              const wadoUriProbeUrl =
                `${wadoUri}?requestType=WADO` +
                `&studyUID=${StudyInstanceUID}` +
                `&seriesUID=${firstSeries.SeriesInstanceUID}` +
                `&objectUID=${firstInstance.SOPInstanceUID}` +
                `&contentType=application%2Fdicom`;
              try {
                const wadoUriResp = await fetch(wadoUriProbeUrl, {
                  headers: { ...authHeaders },
                });
                if (wadoUriResp.ok) {
                  strategy = 'wadoUri';
                  probeArrayBuffer = await wadoUriResp.arrayBuffer();
                }
              } catch {
                // WADO-URI probe also failed
              }
            }
          }
        } else if (storedImageId) {
          // Non-blob stored URL (e.g., dicomweb:http://... from DocumentReference)
          strategy = 'blobUrl';
        }

        if (!strategy) {
          console.info(
            '[DICOM Export] Instance-level probe failed.',
            `URL: ${probeUrl || '(none)'}`,
            `Status: ${probeStatus || 'N/A'}`
          );
          uiNotificationService.show({
            title: 'Export Not Available',
            message:
              'This server does not provide full DICOM files. ' +
              'Static WADO servers (S3/CloudFront) only store metadata and pixel frames — the original DICOM Part 10 files are not available. ' +
              'To export DICOM, connect to a WADO-RS server (Orthanc, DCM4CHEE, etc.) or a FHIR source with full DICOM storage.',
            type: 'error',
          });
          return;
        }

        // --- Fetch all instances using the detected strategy ---
        for (const series of study.series) {
          const seriesDescription = (
            series.SeriesDescription ||
            series.SeriesNumber ||
            series.SeriesInstanceUID
          )
            .toString()
            .replace(/[/\\?%*:|"<>]/g, '_');

          for (const instance of series.instances) {
            const sopInstanceUID = instance.SOPInstanceUID;

            // Reuse the probe result for the first instance
            if (
              probeArrayBuffer &&
              instance === firstInstance
            ) {
              zip.file(`${seriesDescription}/${sopInstanceUID}.dcm`, probeArrayBuffer);
              instanceCount++;
              probeArrayBuffer = null;
              continue;
            }

            try {
              let response: Response;

              switch (strategy) {
                case 'blobUrl': {
                  const imageId = instance.imageId || instance.url || '';
                  if (!imageId) {
                    errorCount++;
                    continue;
                  }
                  const rawUrl = imageId.replace(/^[a-zA-Z]+:/, '');
                  const isBlobUrl = rawUrl.startsWith('blob:');
                  response = await fetch(rawUrl, {
                    headers: isBlobUrl ? {} : { Accept: 'application/dicom', ...authHeaders },
                  });
                  break;
                }
                case 'wadoRs': {
                  const instanceUrl =
                    `${wadoRoot}/studies/${StudyInstanceUID}` +
                    `/series/${series.SeriesInstanceUID}` +
                    `/instances/${sopInstanceUID}`;
                  response = await fetch(instanceUrl, {
                    headers: { Accept: 'application/dicom', ...authHeaders },
                  });
                  break;
                }
                case 'wadoUri': {
                  const wadoUri = (instance as any).wadoUri || (firstInstance as any).wadoUri || '';
                  const wadoUriUrl =
                    `${wadoUri}?requestType=WADO` +
                    `&studyUID=${StudyInstanceUID}` +
                    `&seriesUID=${series.SeriesInstanceUID}` +
                    `&objectUID=${sopInstanceUID}` +
                    `&contentType=application%2Fdicom`;
                  response = await fetch(wadoUriUrl, {
                    headers: { ...authHeaders },
                  });
                  break;
                }
              }

              if (!response.ok) {
                console.warn(
                  `Failed to fetch instance ${sopInstanceUID}: ${response.status}`
                );
                errorCount++;
                continue;
              }

              const arrayBuffer = await response.arrayBuffer();
              zip.file(`${seriesDescription}/${sopInstanceUID}.dcm`, arrayBuffer);
              instanceCount++;
            } catch (fetchError) {
              console.warn(`Error fetching instance ${sopInstanceUID}:`, fetchError);
              errorCount++;
            }
          }
        }

        if (instanceCount === 0) {
          uiNotificationService.show({
            title: 'Export Error',
            message: 'No DICOM instances could be fetched.',
            type: 'error',
          });
          return;
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${StudyInstanceUID}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const message =
          errorCount > 0
            ? `Downloaded ${instanceCount} instances (${errorCount} failed).`
            : `Successfully downloaded ${instanceCount} instances.`;

        uiNotificationService.show({
          title: 'DICOM ZIP Ready',
          message,
          type: errorCount > 0 ? 'warning' : 'success',
        });
      } catch (error) {
        console.error('Error creating DICOM ZIP:', error);
        uiNotificationService.show({
          title: 'Export Error',
          message: 'Failed to create DICOM ZIP. Check console for details.',
          type: 'error',
        });
      }
    },
  };

  const definitions = {
    'awatson1978.logViewportData': {
      commandFn: actions.logViewportDataCommand,
    },
    'awatson1978.inspectViewportState': {
      commandFn: actions.inspectViewportStateCommand,
    },
    'awatson1978.textCallback': {
      commandFn: actions.textCallback,
    },
    downloadDicomZip: {
      commandFn: actions.downloadDicomZip,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
}

export default commandsModule;
