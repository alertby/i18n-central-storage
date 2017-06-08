import es from 'elasticsearch';
import crypto from 'crypto';

export default class ElasticCentralStorage {
    constructor(config) {

        if (!config.host) {
            throw Error('ElasticCentralStorage host should be specified');
        }

        if (!config.index) {
            throw Error('ElasticCentralStorage index should be specified');
        }

        this.config = config;

        this.client = new es.Client({
          host: config.host,
          log: 'trace'
        });
    }

    fetch(messages, locale) {
        const promise = new Promise((resolve, reject) => {
            const docs = messages.map((message) => {
                const hash = crypto.createHmac('sha256', this.config.index)
                       .update(message)
                       .digest('hex');

                const doc = {
                    _index: this.config.index,
                    _type: locale,
                    _id: hash
                };
                return doc;
            });


            this.client.mget({
                body: {
                    docs
                }
            }, (error, response) => {
                if (error) {
                    reject(error);
                }
                resolve(response);
            });
        });

        return promise;
    }

}


