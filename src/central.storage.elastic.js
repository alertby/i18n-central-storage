import es from 'elasticsearch';
import crypto from 'crypto';
import moment from 'moment';
import { isPlainObject } from 'lodash';
import { getMessageKey } from './messages';


const mappings = {
    'messages': {
        '_all': {'enabled': false },
        'properties': {
            'project': {'type': 'text'},
            'message': {'type': 'text'},
            'locale': {'type': 'text'},
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

        if (!config.project) {
            config.project = 'default';
        }

        this.config = config;
        this.config.mappings = config.mappings || mappings;

        this.client = new es.Client({
          host: config.host,
          apiVersion: config.apiVersion || '6.8',
          log: config.log || ''
        });

    }

    createIndexForCentralStorage () {
        const promise = new Promise((resolve, reject) => {

            this.client.indices.get({
              index: this.config.index
            }, (error, exists) => {

                // @TODO update index by client.indices.putMapping([params, [callback]])
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

    getHashesOfMessage (message, locale) {
        const messageKey = getMessageKey(message);
        const hash = crypto.createHmac('sha256', this.config.index)
            .update(messageKey)
            .digest('hex');

        return hash + locale;
    }


    addMessage (message, locale) {

        const promise = new Promise((resolve, reject) => {
            const hash = this.getHashesOfMessage(message, locale);
            const body = {
                project: this.config.project,
                translatedAt: null,
                locale,
                publishedAt: moment().format('YYYY-MM-DDTHH:mm:ss')
            };

            isPlainObject(message) ? body.messageP = message : body.message = message;

            return this.client.create({
                index: this.config.index,
                id: hash,
                type: Object.keys(this.config.mappings)[0],
                refresh: true,
                body
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
            const hash = this.getHashesOfMessage(message, locale);

            const doc = {
                locale,
                translatedAt: moment().format('YYYY-MM-DDTHH:mm:ss')
            };

            isPlainObject(translatedMessage) ? doc.translationP = translatedMessage : doc.translation = translatedMessage;

            return this.client.update({
                index: this.config.index,
                type: Object.keys(this.config.mappings)[0],
                id: hash,
                refresh: true,
                body: { doc }
            }, (error, response) => {

                if (error) {
                    return reject(error);
                }
                return resolve(response);
            });
        });

        return promise;
    }


    fetchMessages () {
        const promise = new Promise((resolve, reject) => {
            this.client.msearch({
                body: [{
                    index: this.config.index,
                    type: Object.keys(this.config.mappings)[0],
                }, {
                    query: {
                        term: {
                            project: this.config.project
                        }
                    }
                }]
            }, (error, response) => {

                if (error) {
                    reject(error);
                }

                resolve({
                    docs: response.responses[0].hits.hits
                });
            });
        });

        return promise;
    }

    deleteMessage (message, locale) {
        const promise = new Promise((resolve, reject) => {
            const hash = this.getHashesOfMessage(message, locale);

            this.client.delete({
                index: this.config.index,
                type: 'doc',
                id: hash
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


