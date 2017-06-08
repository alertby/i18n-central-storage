/* global __dirname, describe, it, beforeEach, afterEach */
import ElasticCentralStorage from '../central.storage.elastic';
import moment from 'moment';
import crypto from 'crypto';
import should from 'should';


describe('ElasticCentralStorage', () => {

    let elasticCentralStorage = null;
    const config = {
        host: '192.168.1.237:9200',
        index: 'i18n-central-storage-test'
    };
    const mappings = {
        'messages': {
            '_all': {'enabled': false },
            'properties': {
                'message': {'type': 'text'},
                'translattion': {'type': 'text'},
                'translatedAt': {'type': 'date'},
                'publishedAt': {'type': 'date'}
            }
        }
    };

    beforeEach((done) => {
        elasticCentralStorage = new ElasticCentralStorage(config);

        elasticCentralStorage.client.indices.create({
            index: config.index,
            body: {
                mappings
            }
        }, (error) => {
            if (error) {
                throw Error(error);
            }
            done();

        });

    });

    afterEach((done) => {
        elasticCentralStorage.client.indices.delete({
            index: config.index
        }, (error) => {
            if (error) {
                throw Error(error);
            }
            done();

        });

    });

    it('addMessage', (done) => {
        const locale = 'ru';
        const message = 'test message 1';

        elasticCentralStorage
            .addMessage(message, locale)
            .then((result) => {

                console.log('addMessage ', result);
                should(result.created).is.exactly(true);
                done();
            });
    });


    it('fetchMessages', (done) => {

        const messages = [
            'test message 1',
            'test message 2'
        ];
        const locale = 'ru';


        elasticCentralStorage.client.ping({
                requestTimeout: 30000
        }, (error) => {
            should.not.exist(error);

            elasticCentralStorage
                .fetchMessages(messages, locale)
                .then((result) => {
                    console.log(' fetchMessages  result', result);
                    done();
                });
        });

    });
});


