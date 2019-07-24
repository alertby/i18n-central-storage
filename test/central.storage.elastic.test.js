/* global describe, it, before, after */
import ElasticCentralStorage from '../src/central.storage.elastic';
import should from 'should';


describe('ElasticCentralStorage', () => {

    let elasticCentralStorage = null;
    const config = {
        host: '192.168.1.243:31809',
        index: 'i18n-central-storage-test'
    };


    before((done) => {
        elasticCentralStorage = new ElasticCentralStorage(config);

        elasticCentralStorage.createIndexForCentralStorage()
            .then(() => { done(); });


    });

    after((done) => {

        elasticCentralStorage.deleteIndexForCentralStorage()
            .then(() => { done(); });

    });

    it('addMessage', (done) => {
        const locale = 'ru';
        const message = 'test message 1';

        elasticCentralStorage
            .addMessage(message, locale)
            .then((response) => {

                should(response.result).is.exactly('created');
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

                    should(result.docs[0].found).is.exactly(true);
                    done();
                });
        });

    });
});


