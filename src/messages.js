import { isPlainObject, differenceWith, isEqual, some } from 'lodash';

export function getMessageKey(message) {
    if (isPlainObject(message)) {
        return message.key;
    }

    return message;
}

export function getMessageValue(message) {
    if (isPlainObject(message)) {
        return message.value;
    }

    return message;
}

export function getNewMessages(storedMessages, foundMessages) {
    const newMessages = [];
    foundMessages.forEach((message) => {
        const messageKey = getMessageKey(message);
        if (storedMessages[messageKey]) { return; }

        newMessages.push(message);
    });

    return newMessages;
}


export function getUnusedMessages(storedMessages, foundMessages) {

    if (!storedMessages) { return []; }

    const foundMessagesKeys = foundMessages.map((message) => getMessageKey(message));

    let unusedMessages = Object.keys(storedMessages).map((message) => {
        if (foundMessagesKeys.indexOf(message) >= 0) { return null; }

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
        const isMessageInStore = some(foundMessages, (foundMessage) => isEqual(foundMessage, source.message));
        if (isMessageInStore) {
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
        const messageKey = getMessageKey(source.message);
        if (unusedMessages.indexOf(messageKey) < 0) {
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
        const isPlural = source.messageP;

        return {
            message: isPlural ? source.messageP: source.message,
            translation: isPlural ? source.translationP : source.translation
        };
    });

    translatedMessages = translatedMessages.filter((m) => m);

    return translatedMessages;
}


