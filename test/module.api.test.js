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
        const pluralPattern = /gettextP\('(.*?)', *'(.*?)', *(\d+)\)/gi;

        const elasticConfig = {
            host: '192.168.1.243:31809',
            index: 'i18n-central-storage-test'
        };

        i18nCentralStorage = new I18nCentralStorage({
            directories,
            messagesDirectory,
            extentions,
            pattern,
            pluralPattern,
            elasticConfig
        }, done);
    });

    afterEach((done) => {
        i18nCentralStorage.elasticCentralStorage.deleteIndexForCentralStorage()
            .then(() => { done(); });
    });

    it('analize en locale', () => {
        const { newMessages } = i18nCentralStorage.analize('en');
        should(newMessages[0]).eql({
            key: '%s site title',
            value: {
                one: '%s site title',
                other: '%s site titles'
            }
        });
        should(newMessages[1]).equal('test label');
    });

    it('analize ru locale', () => {
        const { newMessages } = i18nCentralStorage.analize('ru');
        should(newMessages[0]).eql({
            key: '%s site title',
            value: {
                one: '%s site title',
                few: '%s site titles',
                many: '%s site titles',
                other: '%s site titles'
            }
        });
        should(newMessages[1]).equal('test label');
    });


    it('addNewMessagesToCentralStorage ru', (done) => {
        const locale = 'ru';
        const { newMessages } = i18nCentralStorage.analize(locale);
        should(newMessages[1]).equal('test label');

        i18nCentralStorage
            .addNewMessagesToCentralStorage(newMessages, locale)
            .then((result) => {

                should(result.length).equal(newMessages.length);
                done();
            });
    });

    it('addNewMessagesToCentralStorage already existing', (done) => {
        const locale = 'ru';
        const newMessages = ['existing message 1', 'existing message 2'];

        i18nCentralStorage
            .addNewMessagesToCentralStorage(newMessages, locale)
            .then((result) => {

                should(result.length).equal(newMessages.length);
                i18nCentralStorage
                    .addNewMessagesToCentralStorage(newMessages, locale)
                    .catch((errors) => {

                        should(errors.indexOf('version_conflict_engine_exception')).equal(1);
                        done();
                    });
            });
    });

    it('syncLocale ru', (done) => {
        const locale = 'ru';
        const analizedMessages = i18nCentralStorage.analize('ru');
        const pluralTranslation = {key: '%s site titles', value: {
          one: '%s заголовок сайта',
          few: '%s заголовка сайта',
          many: '%s заголовков сайта',
          other: '%s заголовков сайта'
        }};
        console.log('analizedMessages.newMessages[0]', analizedMessages);

        i18nCentralStorage
            .addNewMessagesToCentralStorage(analizedMessages.newMessages, locale)
            .then(() => i18nCentralStorage
                .elasticCentralStorage
                .addMessageTranslation(analizedMessages.newMessages[0], pluralTranslation, locale)
            )
            .then(() => i18nCentralStorage
                .elasticCentralStorage
                .addMessageTranslation(analizedMessages.newMessages[1], 'this_is_translated_word', locale)
            )
            .then(() => i18nCentralStorage
                .syncLocale(analizedMessages, locale, {writeResultToFile: false})
            )
            .then((result) => {
                should(Object.keys(result).length).equal(analizedMessages.foundMessages.length);
                should(result.site_description_constant).equal('site_description_constant');
                should(result[analizedMessages.newMessages[0].key]).eql(pluralTranslation.value);
                should(result[analizedMessages.newMessages[1]]).equal('this_is_translated_word');

                done();
            })
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
            const [key] = Object.keys(message);
            const value = message[key];

            i18nCentralStorage
                .elasticCentralStorage
                .addMessageTranslation(key, value, locale)
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
