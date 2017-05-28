import es from 'elasticsearch';

export default class ElasticCentralStorage {
    constructor(config) {

        if (!config.host) {
            throw Error('ElasticCentralStorage host should be specified');
        }

        this.client = new es.Client({
          host: config.host,
          log: 'trace'
        });
    }

    fetch(messages, locale) {
        // @todo
    }

}


