import { Client } from '@elastic/elasticsearch';
import crypto from 'crypto';
import moment from 'moment';
import { isPlainObject } from 'lodash';
import { getMessageKey } from './messages';


const defaultMapping = {
    enabled: true,
    properties: {
        project: { type: 'text' },
        message: { type: 'text' },
        locale: { type: 'text' },
        translation: { type: 'text' },
        translatedAt: { type: 'date' },
        publishedAt: { type: 'date' }
    }
};

export default class ElasticCentralStorage {
    constructor(config) {
        const { project = 'default', index, mappings = defaultMapping, host, ...clientConfig } = config;

        if (!host) {
            throw Error('ElasticCentralStorage host should be specified');
        }

        if (!index) {
            throw Error('ElasticCentralStorage index should be specified');
        }

        this.config = {
            index,
            project,
            mappings
        };

        this.client = new Client({
            node: host,
            name: 'elasticsearch-localization-client',
            ...clientConfig
        });
    }

    async createIndexForCentralStorage() {
        try {
            const exists = await this.client.indices.exists({
                index: this.config.index
            });

            // @TODO update index by client.indices.putMapping([params, [callback]])
            if (exists) {
                return Promise.resolve(true);
            }

            const creationResult = await this.client.indices.create({
                index: this.config.index,
                body: {
                    mappings: this.config.mappings
                }
            });

            if (creationResult.acknowledged) {
                return Promise.resolve(creationResult);
            }

            return Promise.reject(creationResult);

        } catch (e) {
            return Promise.reject(e);
        }
    }

    async deleteIndexForCentralStorage() {
        try {
            const result = await this.client.indices.delete({
                index: this.config.index
            });

            if (result.acknowledged) {
                return Promise.resolve(result);
            }

            return Promise.reject(result);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    getHashesOfMessage(message, locale) {
        const messageKey = getMessageKey(message);
        const hash = crypto.createHmac('sha256', this.config.index)
            .update(messageKey)
            .digest('hex');

        return `${hash}${locale}-${this.config.project}`;
    }


    async addMessage(message, locale) {
        const hash = this.getHashesOfMessage(message, locale);
        const body = {
            project: this.config.project,
            translatedAt: null,
            locale,
            publishedAt: moment().format('YYYY-MM-DDTHH:mm:ss')
        };

        isPlainObject(message)
            ? body.messageP = message
            : body.message = message;

        try {
            const response = await this.client.create({
                id: hash,
                index: this.config.index,
                body,
                refresh: true
            });

            return Promise.resolve(response);
        } catch (e) {
            return Promise.reject(e.message);
        }
    }


    addMessageTranslation(message, translatedMessage, locale) {
        const hash = this.getHashesOfMessage(message, locale);

        const doc = {
            locale,
            translatedAt: moment().format('YYYY-MM-DDTHH:mm:ss')
        };

        isPlainObject(translatedMessage)
            ? doc.translationP = translatedMessage
            : doc.translation = translatedMessage;

        return this.client.update({
            index: this.config.index,
            id: hash,
            refresh: true,
            body: { doc }
        });
    }


    async fetchMessages() {
        // @todo fetch all results if TotalHits more then 10000
        try {
            const result = await this.client.search({
                index: this.config.index,
                body: {
                    size: 10000,
                    query: {
                        match_phrase: {
                            project: {
                                query: this.config.project
                            }
                        }
                    }
                }
            });
            return Promise.resolve({ docs: result.hits.hits });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    deleteMessage(id) {
        return this.client.delete({
            index: this.config.index,
            id
        });
    }

}


