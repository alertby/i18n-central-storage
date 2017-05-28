/* global __dirname, describe, it, beforeEach, afterEach */
import ElasticCentralStorage from '../central.storage.elastic';
import should from 'should';


describe('ElasticCentralStorage', () => {

    let elasticCentralStorage = null;
    const config = {
        host: '192.168.1.237:9200',
        index: 'i18n-central-storage'
    };

    beforeEach((done) => {

        elasticCentralStorage = new ElasticCentralStorage(config);

        elasticCentralStorage.client.indices.create({
            index: config.index
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


    it('fetch', (done) => {


        elasticCentralStorage.client.ping({
                requestTimeout: 30000
        }, (err) => {
            should.not.exist(err);

            elasticCentralStorage.fetch(messages, locale);
        });

    });
});


