import { join } from 'path';
import { existsSync, readdirSync, lstatSync, readFileSync } from 'fs';

function matchedToAnyExtension(filename, filesExtentions) {
    let isMatched = false;
    filesExtentions.forEach((extention) => {

        if (filename.search(extention) >= (filename.length - extention.length)) {
            isMatched = true;
        }

    });
    return isMatched;
}


export function findFilesInDirectory(baseDirectoryPath, filesExtentions) {

    let files = [];
    let filesNames = [];

    if (!existsSync(baseDirectoryPath)) {
        return files;
    }

    files = readdirSync(baseDirectoryPath);

    files.forEach((file) => {
        const filename = join(baseDirectoryPath, file);
        const stat = lstatSync(filename);


        if (stat.isDirectory()) {

            filesNames = filesNames.concat(findFilesInDirectory(filename, filesExtentions));
        } else if (matchedToAnyExtension(filename, filesExtentions)) {

            filesNames.push(filename);
        }
    }, this);

    return filesNames;
}


export function searchTextInFileByPattern(filePath, pattern) {
    const contents = readFileSync(filePath, 'utf8');
    const foundStrings = contents.match(pattern);

    if (!foundStrings) { return []; }

    const texts = foundStrings.map((matchedText) => {

        const regExp = new RegExp(pattern);
        const text = regExp.exec(matchedText);

        return text[1];
    });
    return texts;
}

export function getObjectFromFile(filePath) {
    const content = readFileSync(filePath, 'utf8');

    return JSON.parse(content);
}
