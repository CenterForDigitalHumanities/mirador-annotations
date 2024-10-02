/** */
export default class TinyAdapter {
  /** */
  constructor(canvasId, endpointUrl = 'https://tinydev.rerum.io') {
    this.canvasId = canvasId;
    this.endpointUrl = endpointUrl;
    this.emptyAnnoPage = {
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      creator: 'Tiny Mirador',
      forCanvas: this.canvasId,
      items: [],
      type: 'AnnotationPage',
    };
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
    let knownAnnoPage = await this.all() || this.emptyAnnoPage;
    if (!annotation) return knownAnnoPage;
    // eslint-disable-next-line no-param-reassign
    annotation.creator = 'Tiny Mirador';
    const createdAnnotation = await fetch(`${this.endpointUrl}/create`, {
      body: JSON.stringify(annotation),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    })
      .then((resp) => resp.json())
      .then((created) => {
        // eslint-disable-next-line no-param-reassign
        delete created.new_obj_state;
        // eslint-disable-next-line no-param-reassign
        created.id = created['@id'];
        return created;
      })
      .catch((err) => undefined);
    if (createdAnnotation) knownAnnoPage.items.push(createdAnnotation);
    knownAnnoPage = knownAnnoPage['@id'] ? await this.updateAnnoPage(knownAnnoPage) : await this.createAnnoPage(knownAnnoPage);
    return knownAnnoPage;
  }

  /**
    * Update an Annotation by using the RERUM Sanbox /update endpoint.
    * Find that existing Annotation in the AnnotationPage.
    * Update the Annotation in place, and also update the AnnotationPage.
    * Since RERUM does versioning, get the resulting AnnotationPage for its new id.
    * This prepares it for sequential alterations.
    * @param annotation - An Annotation JSON object to be updated.  Contains altered keys.
    * @return The known AnnotationPage
  */
  async update(annotation) {
    let knownAnnoPage = await this.all();
    if (!annotation) return knownAnnoPage;
    const origAnnoId = annotation['@id'] ?? annotation.id;
    if (!origAnnoId) return knownAnnoPage;
    // eslint-disable-next-line no-param-reassign
    annotation.creator = 'Tiny Mirador';
    const updatedAnnotation = await fetch(`${this.endpointUrl}/update/`, {
      body: JSON.stringify(annotation),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'PUT',
    })
      .then((resp) => resp.json())
      .then((updated) => {
        // eslint-disable-next-line no-param-reassign
        delete updated.new_obj_state;
        // eslint-disable-next-line no-param-reassign
        updated.id = updated['@id'];
        return updated;
      })
      .catch((err) => undefined);
    if (updatedAnnotation) {
      let i = 0;
      for await (const item of knownAnnoPage.items) {
        const itemid = item.id ?? item['@id'] ?? 'unknown';
        if (itemid === origAnnoId) {
          knownAnnoPage.items[i] = updatedAnnotation;
          knownAnnoPage = await this.updateAnnoPage(knownAnnoPage);
          break;
        }
        i += 1;
      }
    }
    return knownAnnoPage;
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
    let knownAnnoPage = await this.all();
    if (!knownAnnoPage) return this.emptyAnnoPage;
    if (!annoId) return knownAnnoPage;
    // eslint-disable-next-line no-param-reassign
    const hashId = annoId.split('/').pop();
    return fetch(`${this.endpointUrl}/delete/${hashId}`, {
      method: 'DELETE',
    })
      .then(async (resp) => {
        if (resp.ok) {
          let i = 0;
          for (const item of knownAnnoPage.items) {
            const itemid = item.id ?? item['@id'] ?? 'unknown';
            if (itemid === annoId) {
              knownAnnoPage.items = knownAnnoPage.items.splice(i, 1);
              // eslint-disable-next-line no-await-in-loop
              knownAnnoPage = await this.updateAnnoPage(knownAnnoPage);
              break;
            }
            i += 1;
          }
        }
        return knownAnnoPage;
      })
      .catch((err) => knownAnnoPage);
  }

  /**
    * Get an Annotation out of the AnnotationPage 'items' array.
    * Do not alter the array.
    * @param annotation - An Annotation JSON object to be created
    * @return The Annotation object or undefined
  */
  async get(annoId) {
    if (!annoId) return undefined;
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
    let knownAnnoPage;
    const query = {
      '__rerum.history.next': { $exists: true, $size: 0 },
      creator: 'Tiny Mirador',
      forCanvas: this.canvasId,
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
        if (arr.length) {
          // eslint-disable-next-line prefer-destructuring
          knownAnnoPage = arr[0];
          knownAnnoPage.items.forEach((anno) => anno.id === anno['@id']);
        } else knownAnnoPage = undefined;
        return knownAnnoPage;
      })
      .catch((err) => err);
  }

  /**
    * Update an AnnotationPage by using the RERUM Sanbox /update endpoint.
    * @param annoPage - An AnnotationPage JSON object to be created
    * @return The known AnnotationPage
  */
  async updateAnnoPage(annoPage) {
    if (!annoPage) return undefined;
    return fetch(`${this.endpointUrl}/update`, {
      body: JSON.stringify(annoPage),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'PUT',
    })
      .then((resp) => resp.json())
      .then((updated) => {
        // eslint-disable-next-line no-param-reassign
        delete updated.new_obj_state;
        return updated;
      })
      .catch((err) => annoPage);
  }

  /**
    * Create an AnnotationPage by using the RERUM Sanbox /create endpoint.
    * @param annoPage - An AnnotationPage JSON object to be created
    * @return The known AnnotationPage
  */
  async createAnnoPage(annoPage) {
    if (!annoPage) return undefined;
    return fetch(`${this.endpointUrl}/create`, {
      body: JSON.stringify(annoPage),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    })
      .then((resp) => resp.json())
      .then((created) => {
        // eslint-disable-next-line no-param-reassign
        delete created.new_obj_state;
        return created;
      })
      .catch((err) => annoPage);
  }
}
