import dcmjs from 'dcmjs';
import { fetchDicomFile } from './fhirClient';

const { DicomMessage, DicomMetaDictionary } = dcmjs.data;

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function inspectBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const hex = Array.from(bytes.slice(0, 20), b => b.toString(16).padStart(2, '0')).join(' ');
  const hasDICM = bytes.length >= 132 &&
    bytes[128] === 0x44 && bytes[129] === 0x49 &&
    bytes[130] === 0x43 && bytes[131] === 0x4D;
  const startsWithBrace = bytes[0] === 0x7B;
  return { hex, hasDICM, startsWithBrace, size: bytes.length };
}

function naturalizeDataset(arrayBuffer, sourceUrl) {
  const info = inspectBuffer(arrayBuffer);
  console.log('[FHIR DICOM Loader] Buffer inspection:', {
    url: sourceUrl,
    size: info.size,
    first20Hex: info.hex,
    hasDICM: info.hasDICM,
    startsWithJSON: info.startsWithBrace,
  });

  // Handle FHIR Binary JSON wrapper: {"resourceType":"Binary","data":"base64..."}
  if (info.startsWithBrace) {
    console.log('[FHIR DICOM Loader] Response appears to be JSON, checking for FHIR Binary wrapper...');
    try {
      const text = new TextDecoder().decode(arrayBuffer);
      const json = JSON.parse(text);
      if (json.data) {
        console.log('[FHIR DICOM Loader] Found base64 data field, decoding...');
        arrayBuffer = base64ToArrayBuffer(json.data);
        const unwrappedInfo = inspectBuffer(arrayBuffer);
        console.log('[FHIR DICOM Loader] Unwrapped buffer:', {
          size: unwrappedInfo.size,
          first20Hex: unwrappedInfo.hex,
          hasDICM: unwrappedInfo.hasDICM,
        });
      } else {
        throw new Error('Response is JSON but has no "data" field — not a FHIR Binary resource');
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error('[FHIR DICOM Loader] Starts with { but is not valid JSON');
      }
      throw e;
    }
  }

  // Try Part 10 first, fall back to raw dataset (no preamble)
  let dicomData;
  try {
    dicomData = DicomMessage.readFile(arrayBuffer);
  } catch (e) {
    console.warn('[FHIR DICOM Loader] Part 10 parse failed, trying raw dataset...', e.message);
    try {
      dicomData = DicomMessage.readFile(arrayBuffer, {
        TransferSyntaxUID: '1.2.840.10008.1.2',
      });
    } catch (e2) {
      const errInfo = inspectBuffer(arrayBuffer);
      console.error('[FHIR DICOM Loader] All parse attempts failed:', {
        url: sourceUrl,
        size: errInfo.size,
        first20Hex: errInfo.hex,
        hasDICM: errInfo.hasDICM,
        part10Error: e.message,
        rawDatasetError: e2.message,
      });
      throw new Error(
        `Failed to parse DICOM from ${sourceUrl} (${errInfo.size} bytes, DICM=${errInfo.hasDICM}): ${e.message}`
      );
    }
  }

  const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
  dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
  return dataset;
}

export function parseDicomArrayBuffer(arrayBuffer, sourceUrl) {
  return naturalizeDataset(arrayBuffer, sourceUrl);
}

export async function loadDicomFromAttachment(attachment, serverRoot, authToken) {
  let arrayBuffer;
  let imageId;

  if (attachment.url) {
    const url = attachment.url.startsWith('http')
      ? attachment.url
      : `${serverRoot}${attachment.url}`;
    imageId = `dicomweb:${url}`;
    arrayBuffer = await fetchDicomFile(serverRoot, attachment.url, { authToken });
  } else if (attachment.data) {
    // Skip non-DICOM content types
    if (attachment.contentType && attachment.contentType !== 'application/dicom') {
      console.log('[FHIR DICOM Loader] Skipping non-DICOM attachment, contentType:', attachment.contentType);
      throw new Error(`Skipping non-DICOM attachment (contentType: ${attachment.contentType})`);
    }

    arrayBuffer = base64ToArrayBuffer(attachment.data);
    const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
    const blobUrl = URL.createObjectURL(blob);
    imageId = `dicomweb:${blobUrl}`;
  } else {
    throw new Error('DocumentReference attachment has neither url nor data');
  }

  const sourceUrl = attachment.url || '(inline base64)';
  const naturalizedDataset = naturalizeDataset(arrayBuffer, sourceUrl);

  return {
    imageId,
    metadata: naturalizedDataset,
  };
}
