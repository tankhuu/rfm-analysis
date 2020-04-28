/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const _ = require('underscore');
const moment = require('moment');
const bodybuilder = require('bodybuilder');
const {
  cleanupDataSet,
  calculateQuantiles,
  calculateRFMQuantiles,
  calculateScore,
  segmentCustomer } = require('../../helpers/rfm');

class Service {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    return [];
  }

  async get(id, params) {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async create(data, params) {
    try {
      let result = [];
      const runTime = moment();
      const prefix = 'rfm';
      const rfmQuantilesIndex = `rfm-quantiles-${runTime.format('YYYY')}`;
      const quantilesBody = [];
      const periods = [
        { name: '3months', from: 'now-3M/d', to: 'now', display: 'last 3 months' },
        { name: '6months', from: 'now-6M/d', to: 'now', display: 'last 6 months' },
        { name: '12months', from: 'now-12M/d', to: 'now', display: 'last 12 months' },
        // {name: '24months', from: 'now-24M/d', to: 'now', display: 'last 24 months'},
        // {name: '36months', from: 'now-36M/d', to: 'now', display: 'last 36 months'}
      ];
      const { paginate: { default: batch } } = this.app.get('elastic');

      const rfmData = [];

      let recencyDataSet = [];
      let frequencyDataSet = [];
      let monetaryDataSet = [];

      for (const period of periods) {
        const indexDate = runTime.format('YYYY.MM.DD');
        const { name: periodName, from, to, display } = period;
        const bulkBody = [];

        const sourceIndex = 'invoice-*';
        const aliasName = `${prefix}-${periodName}`;
        const destIndex = `${prefix}-${periodName}-${indexDate}`;
        const updateAliasBody = { actions: [] };

        const body = bodybuilder()
          .filter('range', 'trandate', { from, to: 'now' })
          .agg('terms', 'customer_id', { size: batch }, 'rfmAggs', (a) => {
            return a.agg('max', 'trandate', {}, 'recency')
              .agg('sum', 'net_amount', {}, 'monetary')
              .agg('terms', 'location.keyword', {}, 'locations');
          })
          .size(0)
          .build();
        // console.log('body: ', JSON.stringify(body));

        const rfmValuesSearch = await this.app.service('elastic').find({ index: sourceIndex, body });
        // console.log('rfmValuesSearch: ', JSON.stringify(rfmValuesSearch));
        if (!_.isEmpty(rfmValuesSearch)) {
          const { aggregations } = rfmValuesSearch[0];
          if (!_.isEmpty(aggregations)) {
            const { rfmAggs } = aggregations;
            if (!_.isEmpty(rfmAggs)) {
              const { buckets: rfmValues } = rfmAggs;
              if (!_.isEmpty(rfmValues) && Array.isArray(rfmValues)) {
                rfmValues.forEach(rfmValue => {
                  const {
                    key: customer_id,
                    doc_count: frequency,
                    monetary: { value: monetary },
                    recency: { value_as_string: lastPurchaseDate },
                    locations: { buckets } } = rfmValue;
                  const recency = runTime.diff(moment(lastPurchaseDate), 'day');
                  const locations = !_.isEmpty(buckets) ? buckets.map(loc => ({ name: loc.key, frequency: loc.doc_count })) : [];
                  // const locationNames = !_.isEmpty(buckets) ? buckets.map(loc => loc.key) : [];

                  // collect rfm data
                  rfmData.push({
                    _id: `${customer_id}.0`, recency, frequency, monetary, locations //, locationNames
                  });

                  // Collect RFM DataSet
                  recencyDataSet.push(recency);
                  frequencyDataSet.push(frequency);
                  monetaryDataSet.push(monetary);
                });
              }
            }
          }
        }

        recencyDataSet = cleanupDataSet(recencyDataSet);
        frequencyDataSet = cleanupDataSet(frequencyDataSet);
        monetaryDataSet = cleanupDataSet(monetaryDataSet);

        let {
          recencyQuantiles, frequencyQuantiles, monetaryQuantiles
        } = calculateRFMQuantiles({ recencyDataSet, frequencyDataSet, monetaryDataSet });

        // Index quantiles body
        quantilesBody.push({ index: { _index: rfmQuantilesIndex } });
        quantilesBody.push({
          period: periodName, 
          recency: Object.assign({}, recencyQuantiles), 
          frequency: Object.assign({}, frequencyQuantiles), 
          monetary: Object.assign({}, monetaryQuantiles), 
          date: new Date(runTime)
        });


        rfmData.forEach(rfmValue => {
          const { _id, recency, frequency, monetary, locations } = rfmValue;
          const frequency_score = calculateScore({ quantiles: frequencyQuantiles, value: frequency });
          const monetary_score = calculateScore({ quantiles: monetaryQuantiles, value: monetary });
          const recency_score = calculateScore({ quantiles: recencyQuantiles, value: recency, type: 'reverse' });

          // Segment customer
          const segment = segmentCustomer({ recency_score, frequency_score, monetary_score });


          bulkBody.push({ update: { _id, _index: destIndex } });
          bulkBody.push({
            doc: {
              recency, frequency, monetary, recency_score, frequency_score, monetary_score,
              segment, locations
            }
          });
        });

        const bulkResult = await this.app.service('elastic').bulk(bulkBody);
        updateAliasBody.actions.push({ add: { index: destIndex, alias: aliasName } });
        result.push({
          // bulkResult,
          recencyQuantiles, frequencyQuantiles, monetaryQuantiles
        });

        // Get current index in Alias
        const getAliasResult = await this.app.service('elastic').getAlias({ name: aliasName });
        console.log('getAliasResult: ', JSON.stringify(getAliasResult));
        if (!_.isEmpty(getAliasResult)) {
          for (const index in getAliasResult) {
            if (index !== destIndex) {
              updateAliasBody.actions.push({ remove: { index, alias: aliasName } })
            }
          }
        }
        console.log('updateAliasBody: ', JSON.stringify(updateAliasBody));
        const updateAliases = await this.app.service('elastic').updateAliases(updateAliasBody);
        console.log('updateAliases: ', updateAliases);
        result.push(updateAliases);

      }

      // bulk index rfm quantiles
      const bulkResult = await this.app.service('elastic').bulk(quantilesBody);

      return result;
    } catch (err) {
      console.log('error: ', err);
      throw new errors.GeneralError(err.message);
    }
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    return data;
  }

  async remove(id, params) {
    return { id };
  }

  setup(app, path) {
    this.app = app;
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
