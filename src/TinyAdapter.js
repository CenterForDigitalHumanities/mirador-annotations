/** */
export default class RerumAdapter {
  /** */
  constructor(canvasId, endpointUrl = 'https://tinydev.rerum.io') {
    this.canvasId = canvasId;
    this.endpointUrl = endpointUrl;
    this.emptyAnnoPage = {
      items: [],
      target: this.canvasId,
      type: 'AnnotationPage',
    };
    this.knownAnnoPage = undefined;
    this.checkForAnnotationPage();
  }

  /** */
  async create(annotation) {
    if (!this.knownAnnoPage) this.knownAnnoPage = await this.checkForAnnotationPage();
    const createdAnnotation = await fetch(`${this.endpointUrl}/create`, {
      body: JSON.stringify(annotation),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    })
      .then((resp) => resp.json())
      .catch((err) => null);
    if (createdAnnotation) this.knownAnnoPage.items.push(createdAnnotation);
    this.knownAnnoPage = this.knownAnnoPage['@id'] ? await this.updateAnnoPage(this.knownAnnoPage) : await this.createAnnoPage(this.knownAnnoPage);
    return this.knownAnnoPage;
  }

  /** */
  async update(annotation) {
    if (!this.knownAnnoPage) this.knownAnnoPage = await this.checkForAnnotationPage();
    if (!this.knownAnnoPage) return this.emptyAnnoPage;
    const origAnnoId = annotation['@id'] ?? annotation.id ?? 'unknown';
    if (!origAnnoId) return this.knownAnnoPage;
    const updatedAnnotation = await fetch(`${this.endpointUrl}/patch/`, {
      body: JSON.stringify(annotation),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'PATCH',
    })
      .then((resp) => resp.json())
      .catch((err) => this.knownAnnoPage);
    // Note that the Annotation Page needs to be updated.  It has changed
    if (updatedAnnotation) {
      let i = 0;
      for await (const item of this.knownAnnoPage.items) {
        const itemid = item.id ?? item['@id'] ?? 'unknown';
        if (itemid === origAnnoId) {
          this.knownAnnoPage.items[i] = updatedAnnotation;
          this.knownAnnoPage = await this.updateAnnoPage(this.knownAnnoPage);
          break;
        }
        i += 1;
      }
    }
    return this.knownAnnoPage;
  }

  /** */
  async delete(annoId) {
    if (!annoId) return this.emptyAnnoPage;
    if (!this.knownAnnoPage) this.knownAnnoPage = await this.checkForAnnotationPage();
    if (!this.knownAnnoPage) return this.emptyAnnoPage;
    return fetch(`${this.endpointUrl}/delete/${annoId}`, {
      method: 'DELETE',
    })
      .then(async (resp) => {
        if (resp.ok) {
          let i = 0;
          for (const item of this.knownAnnoPage.items) {
            const itemid = item.id ?? item['@id'] ?? 'unknown';
            if (itemid === annoId) {
              this.knownAnnoPage.items = this.knownAnnoPage.items.splice[i, 1];
              // eslint-disable-next-line no-await-in-loop
              this.knownAnnoPage = await this.updateAnnoPage(this.knownAnnoPage);
              break;
            }
            i += 1;
          }
        }
        return this.knownAnnoPage;
      })
      .catch((err) => this.knownAnnoPage);
  }

  /** */
  async get(annoId) {
    const annotationPage = await this.all();
    return annotationPage.items.find((item) => {
      const itemid = item.id ?? item['@id'] ?? 'unknown';
      return itemid === annoId;
    });
  }

  /** */
  async all() {
    const query = {
      '__rerum.history.next': { $exists: true, $size: 0 },
      target: this.canvasId,
      type: 'AnnotationPage',
    };
    return this.knownAnnoPage || fetch(`${this.endpointUrl}/query`, {
      body: JSON.stringify(query),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    })
      .then((resp) => resp.json())
      .then((arr) => arr[0])
      .catch((err) => null);
  }

  /** */
  async checkForAnnotationPage() {
    const query = {
      '__rerum.history.next': { $exists: true, $size: 0 },
      target: this.canvasId,
      type: 'AnnotationPage',
    };
    return fetch(`${this.endpointUrl}/query`, {
      body: JSON.stringify(query),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    })
      .then((resp) => resp.json())
      .then((arr) => {
        // eslint-disable-next-line prefer-destructuring
        if (arr.length) this.knownAnnoPage = arr[0];
        else this.knownAnnoPage = this.emptyAnnoPage;
        return this.knownAnnoPage;
      })
      .catch((err) => null);
  }

  /** */
  async updateAnnoPage(annoPage) {
    return fetch(`${this.endpointUrl}/patch/`, {
      body: JSON.stringify(annoPage),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'PATCH',
    })
      .then((resp) => resp.json())
      .catch((err) => annoPage);
  }

  /** */
  async createAnnoPage(annoPage) {
    return fetch(`${this.endpointUrl}/create/`, {
      body: JSON.stringify(annoPage),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    })
      .then((resp) => resp.json())
      .catch((err) => annoPage);
  }
}
