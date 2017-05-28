// import { join } from 'path';
// import { existsSync, readdirSync, lstatSync, readFileSync } from 'fs';


export function getNewMessages(storedMessages, foundMessages) {
    const newMessages = [];
    foundMessages.forEach((message) => {
        if (storedMessages[message]) { return; }

        newMessages.push(message);
    });

    return newMessages;
}


