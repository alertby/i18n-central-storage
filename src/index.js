import {findFilesInDirectory, searchTextInFileByPatterns, getObjectFromFile, setObjectToFile} from './files.parser';
import ElasticCentralStorage from './central.storage.elastic';
import {
    getNewMessages,
    getUnusedMessages,
    getNoneExistingMessagesInStore,
    getTranslatedMessages,
    getExistingUnusedMessagesInStore,
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
        this.extentions = config.extentions || ['.js', '.jsx', '.ejs', '.html'];
        this.pattern = config.pattern;
        this.pluralPattern = config.pluralPattern;

        this.elasticCentralStorage = new ElasticCentralStorage(config.elasticConfig);
        this.elasticCentralStorage.createIndexForCentralStorage()
            .then(() => { cb(); });
    }

    analize (locale) {
        const messagesFile = path.resolve(this.messagesDirectory, `${locale}${this.extension}`);
        const previousMessages = getObjectFromFile(messagesFile);
        let filesList = [];
        let foundMessages = [];

        this.setPluralCategoriesForLocale(locale);

        this.directories.forEach((directory) => {
            const foundFiles = findFilesInDirectory(directory, this.extentions);
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

    syncLocale (analizedMessages, locale, options) {
        const {
            foundMessages,
            unusedMessages
        } = analizedMessages;
        const { writeResultToFile } = options;


        const promise = new Promise((resolve, reject) => {
            this.fetchTranslationsFromCentralStorage(foundMessages, locale)
                .then((response) => {

                    const noneExistingMessagesInStore = getNoneExistingMessagesInStore(response, foundMessages);
                    const translatedMessages = getTranslatedMessages(response);
                    const existingUnusedMessagesInStore = getExistingUnusedMessagesInStore(response, unusedMessages);

                    debug('noneExistingMessagesInStore', noneExistingMessagesInStore);
                    debug('translatedMessages', translatedMessages);

                    this.addNewMessagesToCentralStorage(noneExistingMessagesInStore, locale)
                        .then(() => {
                            const messagesFile = path.resolve(this.messagesDirectory, `${locale}${this.extension}`);
                            const resultingMessages = {};

                            foundMessages.forEach((foundMessage) => {
                                const message = translatedMessages.find((x) => isEqual(x.message, foundMessage));
                                resultingMessages[getMessageKey(foundMessage)] = message && message.translation ? getMessageValue(message.translation) : getMessageValue(foundMessage);
                            });

                            debug(' resultingMessages ', resultingMessages);
                            if (writeResultToFile) {
                                setObjectToFile(messagesFile, JSON.stringify(resultingMessages, null, 2));
                            }

                            this.deleteOldMessagesFromCentralStorage(existingUnusedMessagesInStore, locale)
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

    fetchTranslationsFromCentralStorage (messages, locale) {

        const promise = new Promise((resolve, reject) => {

            this.elasticCentralStorage.fetchMessages(messages, locale)
                .then((response) => {

                    debug('  fetchTranslationsFromCentralStorage result ', response);
                    resolve(response);
                })
                .catch((err) => {
                    reject(err);
                });
        });

        return promise;
    }

    addNewMessagesToCentralStorage (messages, locale) {

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

    deleteOldMessagesFromCentralStorage (messages, locale) {

        const deleteMessage = (message, callback) => {
            debug('deleteMessage ', message);
            this.elasticCentralStorage.deleteMessage(message, locale)
                .then((response) => { callback(null, response); })
                .catch((err) => { callback(err); });
        };

        const promise = new Promise((resolve, reject) => {
            async.map(messages, deleteMessage, (error, result) => {
                debug('  deleteOldMessagesFromCentralStorage result ', error, result);
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });

        });

        return promise;
    }

    setPluralCategoriesForLocale(locale) {
      this.pluralCategories = pluralCategories[locale].cardinal;
    }

}

