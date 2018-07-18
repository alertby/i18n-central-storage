import { join, dirname } from 'path';
import { existsSync, readdirSync, lstatSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

function matchedToAnyExtension(filename, filesExtentions) {
    let isMatched = false;
    filesExtentions.forEach((extention) => {

        if (filename.lastIndexOf(extention) >= (filename.length - extention.length)) {
            isMatched = true;
        }

    });
    return isMatched;
}

function unescapeString(string) {
  return string.replace(/\\(.)/g, '$1');
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

export function searchTextInFileByPatterns(filePath, {pattern, pluralPattern, pluralCategories}) {
    const contents = readFileSync(filePath, 'utf8');
    const singularTexts = searchTextInFileByPattern(contents, pattern);
    const pluralTexts = searchTextInFileByPluralPattern(contents, pluralPattern, pluralCategories);

    return [...singularTexts, ...pluralTexts];
}

export function searchTextInFileByPattern(contents, pattern) {
    const foundStrings = contents.match(pattern);

    if (!foundStrings) { return []; }

    const texts = foundStrings.map((matchedText) => {

        const regExp = new RegExp(pattern);
        const text = regExp.exec(matchedText);

        return unescapeString(text[1]);
    });
    return texts;
}

export function searchTextInFileByPluralPattern(contents, pattern, pluralCategories) {
    if (!pattern) { return []; }

    const foundStrings = contents.match(pattern);

    if (!foundStrings) { return []; }

    const texts = foundStrings.map((matchedText) => {

        const regExp = new RegExp(pattern);
        const text = regExp.exec(matchedText);
        const singular = unescapeString(text[1]);
        const plural = unescapeString(text[2]);

        return {
            key: singular,
            value: pluralCategories.reduce((result, category) => {
                category === 'one' ? result[category] = singular : result[category] = plural;
                return result;
            }, {})
        }
    });
    return texts;
}

export function getObjectFromFile(filePath) {
    createFile(filePath);
    const content = readFileSync(filePath, 'utf8');

    return JSON.parse(content);
}


export function setObjectToFile(filePath, data) {
    createFile(filePath);
    writeFileSync(filePath, data, 'utf8');
}

function createFile(filePath) {
    const directoryName = dirname(filePath);

    if (!existsSync(directoryName)) {
        mkdirSync(directoryName);
    }

    if (!existsSync(filePath)) {
        writeFileSync(filePath, JSON.stringify({}), 'utf8');
    }
}


