const errors = require('@feathersjs/errors');
const _ = require('underscore');

const cleanupDataSet = (dataSet) => {
  let newSet = [];

  newSet = dataSet.filter(e => (e === 0 || e));
  newSet = _.uniq(newSet);

  return newSet;
};

/**
 * Calculate the quartile position of Quantiles from a data set
 * https://en.wikipedia.org/wiki/Quantile
 * @param q - the type of quantiles (2: Median, 3: Tertiles, 4: Quartiles, 5: Quintiles)
 * @param dataset
 * @returns {Array}
 */
const calculateQuantiles = (dataset) => {
  try {
    const
      sample = dataset.sort((a, b) => (a - b)), // Order the data from smallest to largest
      n = sample.length, // Count how many observations you have in your data set.
      quantiles = [];
    let qQuantiles = [];

    // Median
    if (n < 3) {
      qQuantiles = [0.5];
    }
    // Tertiles
    if (n > 2 && n < 4) {
      qQuantiles = [0.33, 0.66];
    }
    // Quartiles
    if (n > 3 && n < 5) {
      qQuantiles = [0.25, 0.5, 0.75];
    }
    // Quintiles
    if (n >= 5) {
      qQuantiles = [0.2, 0.4, 0.6, 0.8];
    }

    qQuantiles.forEach(q => {
      const o = Math.floor(q * (n + 1)); // ith observation
      quantiles.push(sample[o]);
    });

    return quantiles;
  } catch (err) {
    throw new errors.GeneralError(`CALCULATE_QUANTILES: ${err.message}`);
  }
};


/**
 * Calculate RFM Quantiles
 * @param index
 * @param type
 * @param batches
 * @param scroll
 * @returns {{RQuantiles: Array, FQuantiles: Array, MQuantiles: Array}}
 */
const calculateRFMQuantiles = ({ recencyDataSet, frequencyDataSet, monetaryDataSet }) => {
  try {
    /* Calculate RFM Quantiles */
    let
      recencyQuantiles = calculateQuantiles(recencyDataSet), // Recency
      frequencyQuantiles = calculateQuantiles(frequencyDataSet), // Frequency
      monetaryQuantiles = calculateQuantiles(monetaryDataSet); // Monetary
    // The more recent the better recency
    // recencyQuantiles.reverse();

    return { recencyQuantiles, frequencyQuantiles, monetaryQuantiles };
  } catch ({ message }) {
    throw new errors.GeneralError(`CALCULATE_RFM_QUANTILES: ${message}`);
  }
};

/**
 * Calculate score for a value with quantitles
 * @param quantiles
 * @param value
 * @returns {number}
 */
const calculateScore = ({ quantiles, value, type }) => {
  const n = quantiles.length;

  if (type === 'reverse') {
    for (let i = 0; i < n; i++) {
      if (value <= quantiles[i]) {
        return n + 1 - i;
      }
      if(i === (n - 1) && value > quantiles[i]) {
        return 1;
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      if (value <= quantiles[i]) {
        return i + 1;
      }
      if (i === (n - 1) && value > quantiles[i]) {
        return i + 2;
      }
    }
  }
};

const segmentCustomer = ({recency_score, frequency_score, monetary_score}) => {
  const fm_score = (frequency_score + monetary_score) / 2;

  if(recency_score >= 4 && fm_score >= 4) return 'champion';
  if(recency_score >= 2 && fm_score >= 3) return 'loyal customer';
  if(recency_score >= 3 && fm_score > 1 && fm_score <= 3) return 'potential loyalist';
  if(recency_score >= 4 && fm_score <= 1) return 'new customer';
  if(recency_score >= 3 && recency_score <= 4 && fm_score <= 1) return 'promissing';
  if(recency_score >= 2 && recency_score <= 3 && fm_score >=2 && fm_score <= 3) return 'customer needing attention';
  if(recency_score >= 2 && recency_score <= 3 && fm_score <=2 ) return 'about to sleep';
  if(recency_score <= 2 && fm_score >= 2) return 'at risk';
  if(recency_score <= 1 && fm_score >= 4) return 'cant lose them';
  if(recency_score <= 2 && fm_score <= 2) return 'hibernating';
  if(recency_score <= 1 && fm_score <= 1) return 'lost';
  return 'unknown';
};

module.exports = {
  cleanupDataSet,
  calculateRFMQuantiles,
  calculateScore,
  segmentCustomer
};