const assert = require('assert');
const app = require('../../src/app');

describe('\'elastic\' service', () => {
  it('registered the service', () => {
    const service = app.service('elastic');

    assert.ok(service, 'Registered the service');
  });
});
