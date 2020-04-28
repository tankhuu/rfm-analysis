const assert = require('assert');
const app = require('../../src/app');

describe('\'rules\' service', () => {
  it('registered the service', () => {
    const service = app.service('rules');

    assert.ok(service, 'Registered the service');
  });
});
