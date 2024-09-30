import mirador from 'mirador/dist/es/src/index';
import annotationPlugins from '../../src';
import RerumAdapter from '../../src/TinyAdapter';

const endpointUrl = 'https://tinydev.rerum.io';
const config = {
  annotation: {
    adapter: (canvasId) => new RerumAdapter(canvasId, endpointUrl),
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
//https://t-pen.org/TPEN/project/7305/
mirador.viewer(config, [...annotationPlugins]);
