const alerts = require('./alerts/alerts.service.js');
const elastic = require('./elastic/elastic.service.js');
const rfm = require('./rfm/rfm.service.js');
const rules = require('./rules/rules.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(alerts);
  app.configure(elastic);
  app.configure(rfm);
  app.configure(rules);
};
