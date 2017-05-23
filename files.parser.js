import { join } from 'path';
import { existsSync, readdirSync, lstatSync } from 'fs';

function matchedToAnyExtension(filename, filesExtentions) {
    let matched = false;
    filesExtentions.each((extention) => {

        if (filename.indexOf(extention)) { return; }
        matched = true;
    });
    return matched;
}


export default function findFilesInDirectory(baseDirectoryPath, filesExtentions) {

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

