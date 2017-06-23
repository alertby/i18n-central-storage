/* global describe, it */
import {getNewMessages, getUnusedMessages} from './../src/messages';
import should from 'should';


describe('Messages parser', () => {


    it('getNewMessages', () => {
        const storedMessages = {
            'test 1': 'test 1',
            'hello': 'hello'
        };
        const foundMessages = [
            'hello',
            'new message'
        ];

        const newMessages = getNewMessages(storedMessages, foundMessages);
        should(newMessages.length).equal(1);
        should(newMessages[0]).equal('new message');
    });

    it('getUnusedMessages', () => {
        const storedMessages = {
            'unused message': 'unused message',
            'hello': 'hello'
        };
        const foundMessages = [
            'hello',
            'new message'
        ];

        const unusedMessages = getUnusedMessages(storedMessages, foundMessages);
        should(unusedMessages.length).equal(1);
        should(unusedMessages[0]).equal('unused message');
    });
});
