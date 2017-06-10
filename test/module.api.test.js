/* global __dirname, describe, it, beforeEach, afterEach */
import I18nCentralStorage from '../index';
import should from 'should';
import { resolve } from 'path';


describe('Module API', () => {

    let i18nCentralStorage = null;

    beforeEach((done) => {

        const directories = [resolve(__dirname, 'fixtures/files')];
        const messagesDirectory = resolve(__dirname, 'fixtures/messages/');
        const extentions = ['.js', '.ejs'];
        const pattern = /gettext\('(.*?)'\)/gi;

        const elasticConfig = {
            host: '192.168.1.237:9200',
            index: 'i18n-central-storage-test'
        };

        i18nCentralStorage = new I18nCentralStorage({
            directories,
            messagesDirectory,
            extentions,
            pattern,
            elasticConfig
        }, done);
    });

    afterEach((done) => {
        i18nCentralStorage.elasticCentralStorage.deleteIndexForCentralStorage()
            .then(() => { done(); });
    });

    it('analize en locale', () => {
        const { newMessages } = i18nCentralStorage.analize('en');
        should(newMessages[0]).equal('test label');
    });

    it('analize ru locale', () => {
        const { newMessages } = i18nCentralStorage.analize('ru');
        should(newMessages[0]).equal('test label');
    });


    it('addNewMessagesToCentralStorage ru', () => {
        const { newMessages } = i18nCentralStorage.analize('ru');
        should(newMessages[0]).equal('test label');
    });
});
