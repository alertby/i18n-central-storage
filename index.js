import {findFilesInDirectory, searchTextInFileByPattern, getObjectFromFile} from './files.parser';
import {getNewMessages} from './messages';
import { resolve } from 'path';
import createDebug from 'debug';

const debug = createDebug('i18-central-storage');

export default class I18nCentralStorage {
    constructor(config) {
        this.config = config;

        this.directories = config.directories;
        this.messagesDirectory = config.messagesDirectory;
        this.extentions = config.extentions || [];
        this.pattern = config.pattern;
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

        return newMessages;
    }

    fetchFromCentralStorage (messages, locale) {
    }
}

