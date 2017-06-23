import {findFilesInDirectory, searchTextInFileByPattern, getObjectFromFile, setObjectToFile} from './files.parser';
import ElasticCentralStorage from './central.storage.elastic';
import {getNewMessages, getUnusedMessages} from './messages';
import path from 'path';
import createDebug from 'debug';
import async from 'async';

const debug = createDebug('i18-central-storage');

export default class I18nCentralStorage {
    constructor(config, cb) {
        this.config = config;

        this.directories = config.directories;
        this.messagesDirectory = config.messagesDirectory;
        this.extentions = config.extentions || [];
        this.pattern = config.pattern;

        this.elasticCentralStorage = new ElasticCentralStorage(config.elasticConfig);
        this.elasticCentralStorage.createIndexForCentralStorage()
            .then(() => { cb(); });
    }

    analize (locale) {
        const messagesFile = path.resolve(this.messagesDirectory, locale + '.js');
        const previousMessages = getObjectFromFile(messagesFile);
        let filesList = [];
        let foundMessages = [];

        this.directories.forEach((directory) => {
            const foundFiles = findFilesInDirectory(directory, this.extentions);
            filesList = filesList.concat(foundFiles);
        }, this);

        debug('filesList', filesList);

        filesList.forEach((filePath) => {
            const messages = searchTextInFileByPattern(filePath, this.pattern);
            foundMessages = foundMessages.concat(messages);
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
            unusedMessages,
            newMessages
        } = analizedMessages;
        const { writeResultToFile } = options;


        const promise = new Promise((resolve, reject) => {
            this.fetchTranslationsFromCentralStorage(foundMessages, locale)
                .then((response) => {

                    let noneExistingMessagesInStore = response.docs.map((message, index) => {

                        if (!message.found) {
                            return foundMessages[index];
                        }

                        const source = message._source;
                        if (newMessages.indexOf(source.message) >= 0) {
                            return null;
                        }

                        return source.message;
                    });

                    noneExistingMessagesInStore = noneExistingMessagesInStore.filter((m) => m);


                    let translatedMessages = response.docs.map((message) => {

                        if (!message.found) {
                            return null;
                        }

                        const source = message._source;
                        return { [source.message]: source.translation};
                    });

                    translatedMessages = translatedMessages.filter((m) => m);

                    debug('noneExistingMessagesInStore', noneExistingMessagesInStore);

                    this.addNewMessagesToCentralStorage(noneExistingMessagesInStore, locale)
                        .then(() => {
                            const messagesFile = path.resolve(this.messagesDirectory, locale + '.js');
                            const rusultingMessages = {};

                            foundMessages.forEach((key) => {
                                rusultingMessages[key] = translatedMessages[key] || key;
                            });

                            debug(' rusultingMessages ', rusultingMessages);
                            if (writeResultToFile) {
                                setObjectToFile(messagesFile, JSON.stringify(rusultingMessages));
                            }
                            resolve(rusultingMessages);

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
}

