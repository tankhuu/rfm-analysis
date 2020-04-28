# RFM Analysis

> Basic RFM Analysis Implementation with Elasticsearch and FeatherJS

## About

This project uses:
- [RFM Analysis](https://medium.com/@jackiekhuu.work/customer-segmentation-rfm-analysis-8007d62101cc) for Customer Segmentation.
- [Feathers](http://feathersjs.com). An open source web framework for building modern real-time applications.
- [Elasticsearch](https://www.elastic.co/) for storing and indexing Data.

## Prerequisites
1. NodeJS Installed
2. Elasticsearch Installed. It'll be easier with [Docker](https://www.docker.elastic.co/)
3. Logstash or any ETL tool that can ship customer and invoice data into Elasticsearch

## Getting Started

Getting up and running is as easy as 1, 2, 3, 4, 5.

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Make sure you have Elasticsearch installation and configure it in ./config/default.json
3. Use Logstash to ship data from Database into Elasticsearch. In my case I shipped data from Oracle ==> Elasticsearch. 
    Simple logstash config is in ./logtash/shipper.conf

4. Install your dependencies

    ```
    cd path/to/rfm-analysis; npm install
    ```

5. Start your app

    ```
    npm start
    ```

## Indexing RFM Data
This call will index rfm data of periods (3 months, 6 months & 12 months) from customer and invoice that we shipped from database.

### Commandline
    `curl -XPOST localhost:3030/rfm`
    
## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
