import { isPlainObject, isEqual, some } from 'lodash';

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


export function findInStoreResponseNoneExistingMessages(response, foundMessages) {
    if (!response.docs) {
        return [];
    }

    let noneExistingMessagesInStore = response.docs.map((message) => {

        const source = message._source;
        const isMessageInStore = foundMessages.indexOf(getMessageKey(source.message));
        if (isMessageInStore) {
            return null;
        }

        return source.message;
    });

    noneExistingMessagesInStore = noneExistingMessagesInStore.filter((m) => m);

    return noneExistingMessagesInStore;
}


export function getTranslatedMessages(response, locale) {


    let translatedMessages = response.docs.map((message) => {
        const source = message._source;

        if (source.locale !== locale) {
            return null;
        }

        const isPlural = source.messageP;

        return {
            message: isPlural ? source.messageP: source.message,
            translation: isPlural ? source.translationP : source.translation
        };
    });

    translatedMessages = translatedMessages.filter((m) => m);

    return translatedMessages;
}


