/* global __dirname, describe, it, beforeEach, afterEach */
import I18nCentralStorage from '../src/index';
import should from 'should';
import path from 'path';
import async from 'async';


describe('Module API', () => {

    let i18nCentralStorage = null;

    beforeEach((done) => {

        const directories = [path.resolve(__dirname, 'fixtures/files')];
        const messagesDirectory = path.resolve(__dirname, 'fixtures/messages/');
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


    it('addNewMessagesToCentralStorage ru', (done) => {
        const locale = 'ru';
        const { newMessages } = i18nCentralStorage.analize(locale);
        should(newMessages[0]).equal('test label');

        i18nCentralStorage
            .addNewMessagesToCentralStorage(newMessages, locale)
            .then((result) => {

                should(result.length).equal(newMessages.length);
                done();
            });
    });

    it('fetchTranslationsFromCentralStorage ru', (done) => {
        const locale = 'ru';
        const messages = [
            {'test messagae 1': 'тестовое сообщение 1'},
            {'another one %s with template': 'другое %s с шаблоном'}
        ];

        const messagesKeys = messages.map((message) => {
            const key = Object.keys(message);
            return key[0];
        });

        const addTranslation = (message, callback) => {

            i18nCentralStorage
                .elasticCentralStorage
                .addMessageTranslation(Object.keys(message)[0], Object.values(message)[0], locale)
                .then((response) => { callback(null, response); })
                .catch((err) => { callback(err); });
        };


        i18nCentralStorage
            .addNewMessagesToCentralStorage(messagesKeys, locale)
            .then((result) => {

                should(result.length).equal(messages.length);

                async.map(messages, addTranslation, (error) => {

                    should(error).null();

                    i18nCentralStorage
                        .fetchTranslationsFromCentralStorage(messagesKeys, locale)
                        .then((response) => {

                            const messagesArray = response.docs.map((message) => {

                                const source = message._source;
                                return { [source.message]: source.translation};
                            });

                            should(messages).deepEqual(messagesArray);
                            done();
                        });
                });

            });

    });


});
