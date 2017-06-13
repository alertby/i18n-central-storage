

export function getNewMessages(storedMessages, foundMessages) {
    const newMessages = [];
    foundMessages.forEach((message) => {
        if (storedMessages[message]) { return; }

        newMessages.push(message);
    });

    return newMessages;
}


export function getUnusedMessages(storedMessages, foundMessages) {
    const unusedMessages = [];

    if (!storedMessages) { return []; }

    Object.keys(storedMessages).forEach((message) => {
        if (foundMessages[message]) { return; }

        unusedMessages.push(message);
    });

    return unusedMessages;
}


