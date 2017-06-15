/* global describe, it */
import {getNewMessages} from './../src/messages';
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
});
