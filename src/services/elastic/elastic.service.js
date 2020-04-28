// Initializes the `elastic` service on path `/elastic`
const createService = require('./elastic.class.js');
const hooks = require('./elastic.hooks');
const _ = require('underscore');

module.exports = function (app) {
  
  const paginate = app.get('paginate');
  const elasticOptions = app.get('elastic');
  const {cloud, node} = elasticOptions;

  let options = {};

  !_.isEmpty(cloud) && (options.cloud = cloud);
  !_.isEmpty(node) && (options.node = node);

  // Initialize our service with any options it requires
  app.use('/elastic', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('elastic');

  service.hooks(hooks);
};
