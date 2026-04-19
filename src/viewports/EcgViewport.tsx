import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { DicomEcg } from 'dcmjs-ecg';

function EcgViewport({ displaySets, extensionManager }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState(null);
  const [ecgInfo, setEcgInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const displaySet = displaySets?.[0];

  useEffect(() => {
    if (!displaySet) return;

    let cancelled = false;

    async function fetchAndRender() {
      try {
        setLoading(true);
        setError(null);

        // OHIF already loaded the full instance metadata during series retrieval.
        // DicomEcg accepts Record<string, unknown> (naturalized DICOM tags) directly.
        const instance = displaySet.instance;
        if (!instance) {
          throw new Error('No instance metadata available for ECG rendering.');
        }

        if (!instance.WaveformSequence) {
          throw new Error(
            'No WaveformSequence found in instance metadata. The server may not have included waveform data in the metadata response.'
          );
        }

        // If WaveformData is a BulkDataURI (not yet resolved), fetch it
        for (const waveform of instance.WaveformSequence) {
          if (waveform.WaveformData?.BulkDataURI) {
            const dataSource = extensionManager.getActiveDataSource()[0];
            const client = dataSource.retrieve.getWadoDicomWebClient();
            const bulkDataArray = await client.retrieveBulkData({
              BulkDataURI: waveform.WaveformData.BulkDataURI,
            });
            waveform.WaveformData = bulkDataArray; // Array of ArrayBuffer
          }
          if (waveform.WaveformData && !Array.isArray(waveform.WaveformData)) {
            waveform.WaveformData = [waveform.WaveformData];
          }
        }

        if (cancelled) return;

        const ecg = new DicomEcg(instance);
        const { svg, info } = ecg.render({ speed: 25, amplitude: 10 });

        setSvgContent(svg);
        setEcgInfo(info);
      } catch (err) {
        console.error('ECG Viewer: Failed to fetch/render ECG', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load ECG data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAndRender();

    return () => {
      cancelled = true;
    };
  }, [displaySet, extensionManager]);

  if (!displaySet) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        No ECG instance available
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        Loading ECG...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-2 text-lg">Error loading ECG</div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        No waveform data found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto bg-white"
      style={{ minHeight: 200 }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

EcgViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
  extensionManager: PropTypes.object.isRequired,
};

export default EcgViewport;
