/* global describe, it, before, after */
import should from 'should';
import ElasticCentralStorage from '../src/central.storage.elastic';

describe('ElasticCentralStorage', () => {

    let elasticCentralStorage = null;
    const config = {
        host: '192.168.252.10:30704',
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


    it('fetchMessages', async () => {

        const pingResult = await elasticCentralStorage.client.ping();

        pingResult.should.be.true();

        elasticCentralStorage
            .fetchMessages()
            .then((result) => {

                should(result.docs[0]._source.message).is.exactly('test message 1');
            });
    });
});


