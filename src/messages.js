

export function getNewMessages(storedMessages, foundMessages) {
    const newMessages = [];
    foundMessages.forEach((message) => {
        if (storedMessages[message]) { return; }

        newMessages.push(message);
    });

    return newMessages;
}


export function getUnusedMessages(storedMessages, foundMessages) {

    if (!storedMessages) { return []; }

    let unusedMessages = Object.keys(storedMessages).map((message) => {
        if (foundMessages.indexOf(message) >= 0) { return null; }

        return message;
    });

    unusedMessages = unusedMessages.filter((m) => m);

    return unusedMessages;
}


export function getNoneExistingMessagesInStore(response, foundMessages) {

    let noneExistingMessagesInStore = response.docs.map((message, index) => {

        if (!message.found) {
            return foundMessages[index];
        }

        const source = message._source;
        if (foundMessages.indexOf(source.message) >= 0) {
            return null;
        }

        return source.message;
    });

    noneExistingMessagesInStore = noneExistingMessagesInStore.filter((m) => m);

    return noneExistingMessagesInStore;
}



export function getExistingUnusedMessagesInStore(response, unusedMessages) {

    let existingUnusedMessagesInStore = response.docs.map((message, index) => {

        if (!message.found) {
            return null;
        }

        const source = message._source;
        if (unusedMessages.indexOf(source.message) < 0) {
            return null;
        }

        return source.message;
    });

    existingUnusedMessagesInStore = existingUnusedMessagesInStore.filter((m) => m);

    return existingUnusedMessagesInStore;
}


export function getTranslatedMessages(response) {


    let translatedMessages = response.docs.map((message) => {

        if (!message.found) {
            return null;
        }

        const source = message._source;

        return {
            message: source.message,
            translation: source.translation
        };
    });

    translatedMessages = translatedMessages.filter((m) => m);

    return translatedMessages;
}


