// Initializes the `alerts` service on path `/alerts`
const createService = require('./alerts.class.js');
const hooks = require('./alerts.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/alerts', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('alerts');

  service.hooks(hooks);
};
