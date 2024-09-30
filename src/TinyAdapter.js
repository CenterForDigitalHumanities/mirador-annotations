/** */
export default class RerumAdapter {
  /** */
  constructor(canvasId, endpointUrl = 'https://tinydev.rerum.io') {
    this.canvasId = canvasId;
    this.endpointUrl = endpointUrl;
    this.emptyAnnoPage = {
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      items: [],
      target: this.canvasId,
      type: 'AnnotationPage',
    };
    this.knownAnnoPage = undefined;
    this.all();
  }

  /**
    * Create an Annotation by using the RERUM Sanbox /create endpoint.
    * Add that Annotation into the AnnotationPage.  Update the AnnotationPage.
    * Since RERUM does versioning, get the resulting AnnotationPage for its new id.
    * This prepares it for sequential alterations.
    * If there is no existing AnnotationPage at the time of Annotation creation one must be created.
    * @param annotation - An Annotation JSON object to be created
    * @return The known AnnotationPage
  */
  async create(annotation) {
    if (!this.knownAnnoPage) this.knownAnnoPage = await this.all();
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

  /**
    * Update an Annotation by using the RERUM Sanbox /patch endpoint.
    * Find that existing Annotation in the AnnotationPage.
    * Update the Annotation in place, and also update the AnnotationPage.
    * Since RERUM does versioning, get the resulting AnnotationPage for its new id.
    * This prepares it for sequential alterations.
    * @param annotation - An Annotation JSON object to be updated, already containing it altered keys.
    * @return The known AnnotationPage
  */
  async update(annotation) {
    if (!this.knownAnnoPage) this.knownAnnoPage = await this.all();
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

  /**
    * Delete an Annotation by using the RERUM Sanbox /delete endpoint.
    * Find that existing Annotation in the AnnotationPage.
    * Remove the Annotation, and also update the AnnotationPage.
    * Since RERUM does versioning, get the resulting AnnotationPage for its new id.
    * This prepares it for sequential alterations.
    * @param annoId - An Annotation URI
    * @return The known AnnotationPage
  */
  async delete(annoId) {
    if (!annoId) return this.emptyAnnoPage;
    if (!this.knownAnnoPage) this.knownAnnoPage = await this.all();
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

  /**
    * Get an Annotation out of the AnnotationPage 'items' array.
    * Do not alter the array.
    * @param annotation - An Annotation JSON object to be created
    * @return The Annotation object or undefined
  */
  async get(annoId) {
    const annotationPage = await this.all();
    return annotationPage.items.find((item) => {
      const itemid = item.id ?? item['@id'] ?? 'unknown';
      return itemid === annoId;
    });
  }

  /**
    * Get the AnnotationPage containing all the Annotations.
    * @return The AnnotationPage or an empty AnnotationPage object.
  */
  async all() {
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

  /**
    * Update an AnnotationPage by using the RERUM Sanbox /patch endpoint.
    * @param annoPage - An AnnotationPage JSON object to be created
    * @return The known AnnotationPage
  */
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

  /**
    * Create an AnnotationPage by using the RERUM Sanbox /create endpoint.
    * @param annoPage - An AnnotationPage JSON object to be created
    * @return The known AnnotationPage
  */
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
