/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const _ = require('underscore');
const { Client } = require('@elastic/elasticsearch');

class Service {
  constructor(options) {
    this.options = options || {};
    if (!_.isEmpty(this.options)) {
      this.client = new Client({ ...options });
    }
  }

  async find(params) {
    try {
      let data = [];
      const { index, body } = params;
      const searchResult = await this.client.search({ index, body });

      if (!_.isEmpty(searchResult)) {
        const { body, statusCode, warnings } = searchResult;
        if (statusCode === 200) {
          const { hits, aggregations } = body;
          data.push({ hits, aggregations });
        } else {
          throw new errors.GeneralError(statusCode, { warnings });
        }
      }

      return data;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async get(id, params) {
    const index = 'customer-2018';
    const body = {
      "query": {
        "match": {
          "customer_code": "CUS0041397"
        }
      }
    };
    const result = await this.client.search({ index, body });
    return result;
  }

  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    return data;
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

  async bulk(data, params) {
    try {
      if(Array.isArray(data)) {
        const bulkResult = await this.client.bulk({refresh: true, body: data});
        const {statusCode} = bulkResult;
        if(statusCode === 200) {
          return bulkResult;
        } else {
          throw new errors.GeneralError('Elastic.bulk.error', statusCode);
        }
      } else {
        throw new errors.GeneralError('Elastic.bulk.error', 'data is in wrong data type!!!');
      }
    } catch(err){
      throw new errors.GeneralError('Elastic.bulk.error', err.message);
    }
  }

  async getAlias(data, params) {
    try {
      const {name} = data;
      if(!_.isEmpty(name)) {
        const getAliasResult = await this.client.indices.getAlias({name});
        console.log('alias', getAliasResult)
        const {statusCode} = getAliasResult;
        if(statusCode === 200) {
          const {body} = getAliasResult;
          return body;
        } else {
          throw new errors.GeneralError('Elastic.getAlias.error', statusCode);
        }
      }
    } catch(err){
      console.log('Elastic.getAlias.error', err.message)
      throw new errors.GeneralError('Elastic.getAlias.error', err.message);
    }
  }

  async updateAliases(data, params) {
    try {
      console.log('data: ', data);
      const result = await this.client.indices.updateAliases({body: data});
      
      console.log('updateAliases.result', result);
      return result
    } catch(err){
      console.log('updateAliases.error', err);
      throw new errors.GeneralError('Elastic Update Aliases Failed', err.message);
    }
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
