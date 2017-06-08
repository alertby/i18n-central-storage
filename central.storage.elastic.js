import es from 'elasticsearch';
import crypto from 'crypto';
import moment from 'moment';

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
          host: config.host
          // log: 'trace'
        });
    }

    getHashesOfMessage (message) {
        const hash = crypto.createHmac('sha256', this.config.index)
            .update(message)
            .digest('hex');

        return hash;
    }

    getDoc (message, locale) {
        const hash = this.getHashesOfMessage(message);

        const doc = {
            index: this.config.index,
            type: locale,
            id: hash
        };
        return doc;
    }

    getDocsWithHashesOfMessages (messages, locale) {
        const docs = messages.map((message) => {
            const doc = this.getDoc(message, locale);

            return doc;
        });

        return docs;
    }

    addMessage (message, locale) {

        const promise = new Promise((resolve, reject) => {
            const hash = this.getHashesOfMessage(message);

            this.client.create({
                index: this.config.index,
                type: locale,
                id: hash,
                refresh: true,
                body: {
                    message,
                    translatedAt: null,
                    publishedAt: moment().format('YYYY-MM-DDTHH:mm:ss')
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


    fetchMessages (messages, locale) {
        const promise = new Promise((resolve, reject) => {
            const docs = this.getDocsWithHashesOfMessages(messages, locale);

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


