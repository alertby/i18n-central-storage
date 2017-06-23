import es from 'elasticsearch';
import crypto from 'crypto';
import moment from 'moment';


const mappings = {
    'messages': {
        '_all': {'enabled': false },
        'properties': {
            'message': {'type': 'text'},
            'translation': {'type': 'text'},
            'translatedAt': {'type': 'date'},
            'publishedAt': {'type': 'date'}
        }
    }
};

export default class ElasticCentralStorage {
    constructor(config) {
        this.config = {};

        if (!config.host) {
            throw Error('ElasticCentralStorage host should be specified');
        }

        if (!config.index) {
            throw Error('ElasticCentralStorage index should be specified');
        }

        this.config.mappings = config.mappings || mappings;

        this.config = config;

        this.client = new es.Client({
          host: config.host
          // log: 'trace'
        });

    }

    createIndexForCentralStorage () {
        const promise = new Promise((resolve, reject) => {

            this.client.indices.get({
              index: this.config.index
            }, (error, exists) => {

                if (exists.status !== 404) {
                    return resolve(exists);
                }

                return this.client.indices.create({
                    index: this.config.index,
                    body: {
                        mappings: this.config.mappings
                    }
                }, (error, response) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(response);
                });

            });
        });

        return promise;

    }

    deleteIndexForCentralStorage() {
        const promise = new Promise((resolve, reject) => {
            this.client.indices.delete({
                index: this.config.index
            }, (error) => {

               if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });

        return promise;
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
            _index: this.config.index,
            _type: locale,
            _id: hash
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

            return this.client.create({
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

                    return reject(error.message);
                }
                return resolve(response);
            });
        });

        return promise;
    }


    addMessageTranslation (message, translatedMessage, locale) {

        const promise = new Promise((resolve, reject) => {
            const hash = this.getHashesOfMessage(message);

            return this.client.update({
                index: this.config.index,
                type: locale,
                id: hash,
                refresh: true,
                body: {
                    doc: {
                        translation: translatedMessage,
                        translatedAt: moment().format('YYYY-MM-DDTHH:mm:ss')
                    }
                }
            }, (error, response) => {

                if (error) {
                    return reject(error);
                }
                return resolve(response);
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


