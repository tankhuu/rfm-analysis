const assert = require('assert');
const app = require('../../src/app');

describe('\'alerts\' service', () => {
  it('registered the service', () => {
    const service = app.service('alerts');

    assert.ok(service, 'Registered the service');
  });
});
