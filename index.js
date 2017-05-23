import { findFilesInDirectory } from './files.parser';


export default class I18nCentralStorage {
    constructor(config) {
        this.config = config;

        this.directories = config.directories || [];
        this.extentions = config.extentions || [];
        this.pattern = config.pattern;
    }


    searchinDirectory () {
        let allFiles = [];

        this.directories.each((directory) => {
            allFiles = findFilesInDirectory(directory, this.extentions);
        });

    }
}

