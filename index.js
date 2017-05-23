import findFilesInDirectory from './files.parser';


export default class I18nCentralStorage {
    constructor(config) {
        this.config = config;

        this.directories = config.directories || [];
        this.extentions = config.extentions || [];
        this.pattern = config.pattern;
    }


    searchFilesInDirectoryByExtenstion (directories, extentions) {
        let allFiles = [];

        directories.forEach((directory) => {
            allFiles = findFilesInDirectory(directory, extentions);
        });

        return allFiles;
    }
}

