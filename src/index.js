import { findFilesInDirectory, searchTextInFileByPatterns, getObjectFromFile, setObjectToFile } from './files.parser';
import ElasticCentralStorage from './central.storage.elastic';
import {
    getNewMessages,
    getUnusedMessages,
    findInStoreResponseNoneExistingMessages,
    getTranslatedMessages,
    getMessageKey,
    getMessageValue
} from './messages';
import path from 'path';
import createDebug from 'debug';
import async from 'async';
import { unionWith, isEqual } from 'lodash';
import pluralCategories from 'make-plural/umd/pluralCategories';

const debug = createDebug('i18-central-storage');

export default class I18nCentralStorage {

    validateConfig(config) {
        if (!config.directories) {
            throw Error('directories should be specified as array: [path.resolve(__dirname, \'../templates/\')]');
        }

        if (!config.messagesDirectory) {
            throw Error('messages directoriy should be specified as string path: path.resolve(__dirname, \'../messages/\')');
        }

        if (!config.pattern) {
            const pattern = /gettext\('(.*?)'\)/gi;
            throw Error('pattern should be specified as regexp: ' + pattern.toString());
        }
    }

    constructor(config, cb) {
        this.config = config;
        this.validateConfig(config);

        this.directories = config.directories;
        this.extension = config.extension || '.js';
        this.messagesDirectory = config.messagesDirectory;
        this.extensions = config.extensions || ['.js', '.jsx', '.ejs', '.html'];
        this.pattern = config.pattern;
        this.pluralPattern = config.pluralPattern;

        this.elasticCentralStorage = new ElasticCentralStorage(config.elasticConfig);
        this.elasticCentralStorage.createIndexForCentralStorage()
            .then(() => { cb(); });
    }

    analize(locale) {
        const messagesFile = path.resolve(this.messagesDirectory, `${locale}${this.extension}`);
        const previousMessages = getObjectFromFile(messagesFile);
        let filesList = [];
        let foundMessages = [];

        this.setPluralCategoriesForLocale(locale);

        this.directories.forEach((directory) => {
            const foundFiles = findFilesInDirectory(directory, this.extensions);
            filesList = filesList.concat(foundFiles);
        }, this);

        debug('filesList', filesList);

        filesList.forEach((filePath) => {
            const messages = searchTextInFileByPatterns(filePath, this);
            foundMessages = unionWith(foundMessages, messages, isEqual);
        }, this);

        const newMessages = getNewMessages(previousMessages, foundMessages);
        const unusedMessages = getUnusedMessages(previousMessages, foundMessages);

        return {
            foundMessages,
            unusedMessages,
            newMessages
        };
    }

    syncLocale(analizedMessages, locale, options) {
        const {
            foundMessages
        } = analizedMessages;
        const { writeResultToFile } = options;


        const promise = new Promise((resolve, reject) => {
            this.fetchTranslationsFromCentralStorage(locale)
                .then((response) => {

                    const noneExistingMessagesInStore = findInStoreResponseNoneExistingMessages(response, foundMessages);
                    const translatedMessages = getTranslatedMessages(response, locale);

                    debug('noneExistingMessagesInStore', noneExistingMessagesInStore);
                    debug('translatedMessages', translatedMessages);

                    this.addNewMessagesToCentralStorage(noneExistingMessagesInStore, locale)
                        .then(() => {
                            const messagesFile = path.resolve(this.messagesDirectory, `${locale}${this.extension}`);
                            const resultingMessages = {};

                            foundMessages.forEach((foundMessage) => {
                                const message = translatedMessages.find((x) => isEqual(x.message, foundMessage));
                                resultingMessages[getMessageKey(foundMessage)] = message && message.translation
                                    ? getMessageValue(message.translation)
                                    : getMessageValue(foundMessage);
                            });

                            debug(' resultingMessages ', resultingMessages);
                            if (writeResultToFile) {
                                setObjectToFile(messagesFile, JSON.stringify(resultingMessages, null, 2));
                            }

                            this.deleteOldMessagesFromCentralStorage(foundMessages)
                                .then(() => {
                                    resolve(resultingMessages);
                                })
                                .catch((error) => {
                                    reject(error);
                                });

                        })
                        .catch((error) => {
                            reject(error);
                        });
                })
                .catch((error) => {
                    reject(error);
                });
        });

        return promise;

    }

    fetchTranslationsFromCentralStorage(locale) {

        const promise = new Promise((resolve, reject) => {

            this.elasticCentralStorage.fetchMessages()
                .then((response) => {
                    if (locale) {
                        response.docs = response.docs.filter((data) => data._source.locale === locale);
                    }
                    debug('  fetchTranslationsFromCentralStorage result ', response);
                    resolve(response);
                })
                .catch((err) => {
                    reject(err);
                });
        });

        return promise;
    }

    addNewMessagesToCentralStorage(messages, locale) {
        const add = (message, callback) => {
            debug('add ', message);
            this.elasticCentralStorage.addMessage(message, locale)
                .then((response) => { callback(null, response); })
                .catch((err) => { callback(err); });
        };

        const promise = new Promise((resolve, reject) => {
            async.map(messages, add, (error, result) => {
                debug('  addNewMessagesToCentralStorage result ', error, result);
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });

        });

        return promise;
    }

    deleteOldMessagesFromCentralStorage(foundMessages) {

        const deleteMessage = (id, callback) => {
            debug('deleteMessage id', id);
            this.elasticCentralStorage.deleteMessage(id)
                .then((response) => { callback(null, response); })
                .catch((err) => { callback(err); });
        };

        return this.fetchTranslationsFromCentralStorage()
            .then((responseWithExistingMessages) => {

                let messagesToDelete = responseWithExistingMessages.docs.map((message) => {
                    if (foundMessages.indexOf(getMessageKey(message._source.message)) >= 0) {
                        return null;
                    }
                    return message._id;
                });
                messagesToDelete = messagesToDelete.filter((m) => m);

                const promise = new Promise((resolve, reject) => {
                    async.map(messagesToDelete, deleteMessage, (error, result) => {
                        debug('  deleteOldMessagesFromCentralStorage result ', error, result);
                        if (error) {
                            return reject(error);
                        }
                        return resolve(result);
                    });

                });

                return promise;
            });
    }

    setPluralCategoriesForLocale(locale) {
        this.pluralCategories = pluralCategories[locale].cardinal;
    }

}

