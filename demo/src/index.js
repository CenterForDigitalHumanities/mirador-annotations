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
    loadedManifest: 'https://iiif.harvardartmuseums.org/manifests/object/299843',
  }],
};

mirador.viewer(config, [...annotationPlugins]);
