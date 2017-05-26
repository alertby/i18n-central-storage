import { join } from 'path';
import { existsSync, readdirSync, lstatSync, readFileSync } from 'fs';

function matchedToAnyExtension(filename, filesExtentions) {
    let matched = false;
    filesExtentions.forEach((extention) => {

        if (filename.indexOf(extention)) { return; }
        matched = true;
    });
    return matched;
}


export function findFilesInDirectory(baseDirectoryPath, filesExtentions) {

    let files = [];

    if (!existsSync(baseDirectoryPath)) {
        return files;
    }

    files = readdirSync(baseDirectoryPath);
    for (let i = 0; i < files.length; i++) {
        const filename = join(baseDirectoryPath, files[i]);
        const stat = lstatSync(filename);
        if (stat.isDirectory()) {
            files = files.concat(findFilesInDirectory(filename, filesExtentions));
        } else if (matchedToAnyExtension(filename, filesExtentions)) {
            files.push(filename);
        }
    }
    return files;
}


export function searchTextInFileByPattern(filePath, pattern) {
    const contents = readFileSync(filePath, 'utf8');
    const foundStrings = contents.match(pattern);

    const texts = foundStrings.map((matchedText) => {

        const regExp = new RegExp(pattern);
        const text = regExp.exec(matchedText);

        return text[1];
    });
    return texts;
}
