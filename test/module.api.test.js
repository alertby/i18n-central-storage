/* global __dirname, describe, it, beforeEach */
import I18nCentralStorage from '../index';
import should from 'should';
import { resolve } from 'path';


describe('Module API', () => {

    let i18nCentralStorage = null;

    beforeEach(() => {

        const directories = [resolve(__dirname, 'fixtures/files')];
        const messagesDirectory = resolve(__dirname, 'fixtures/messages/');
        const extentions = ['.js', '.ejs'];
        const pattern = /gettext\('(.*?)'\)/gi;

        i18nCentralStorage = new I18nCentralStorage({
            directories,
            messagesDirectory,
            extentions,
            pattern
        });
    });

    it('analize en locale', () => {
        const newMessages = i18nCentralStorage.analize('en');
        should(newMessages[0]).equal('test label');
    });
});
