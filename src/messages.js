

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


