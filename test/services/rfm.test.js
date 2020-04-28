const assert = require('assert');
const app = require('../../src/app');

describe('\'rfm\' service', () => {
  it('registered the service', () => {
    const service = app.service('rfm');

    assert.ok(service, 'Registered the service');
  });
});
