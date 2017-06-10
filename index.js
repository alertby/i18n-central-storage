import {findFilesInDirectory, searchTextInFileByPattern, getObjectFromFile} from './files.parser';
import ElasticCentralStorage from './central.storage.elastic';
import {getNewMessages} from './messages';
import { resolve } from 'path';
import createDebug from 'debug';

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
        const messagesFile = resolve(this.messagesDirectory, locale + '.js');
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

        debug('newMessages', newMessages);

        return {
            foundMessages,
            previousMessages,
            newMessages
        };
    }

    fetchFromCentralStorage (messages, locale) {
    }

    addNewMessagesToCentralStorage (messages, locale) {
        fetchFromCentralStorage
    }
}

