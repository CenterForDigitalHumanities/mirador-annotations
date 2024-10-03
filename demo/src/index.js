import mirador from 'mirador/dist/es/src/index';
import annotationPlugins from '../../src';
import RerumAdapter from '../../src/RerumAdapter';
import LocalStorageAdapter from '../../src/LocalStorageAdapter';

const endpointUrl = 'https://tinydev.rerum.io';
const config = {
  annotation: {
    adapter: (canvasId) => new RerumAdapter(canvasId),
    // adapter: (canvasId) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`),
    exportLocalStorageAnnotations: false, // display annotation JSON export button
  },
  id: 'demo',
  window: {
    defaultSideBarPanel: 'annotations',
    sideBarOpenByDefault: true,
  },
  windows: [{
    loadedManifest: 'https://iiif.biblissima.fr/chateauroux/B360446201_MS0005/manifest.json',
  }],
};

// https://t-pen.org/TPEN/manifest/6495
mirador.viewer(config, [...annotationPlugins]);
