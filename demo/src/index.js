import mirador from 'mirador/dist/es/src/index';
import annotationPlugins from '../../src';
import LocalStorageAdapter from '../../src/LocalStorageAdapter';
import RerumAdapter from '../../src/RerumAdapter';

const endpointUrl = 'https://tinydev.rerum.io';
const config = {
  annotation: {
    adapter: (canvasId) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`),
    // adapter: (canvasId) => new RerumAdapter(canvasId), // use RERUM for persistent Annotations
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

mirador.viewer(config, [...annotationPlugins]);
