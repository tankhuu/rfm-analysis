// Initializes the `rfm` service on path `/rfm`
const createService = require('./rfm.class.js');
const hooks = require('./rfm.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/rfm', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('rfm');

  service.hooks(hooks);
};
