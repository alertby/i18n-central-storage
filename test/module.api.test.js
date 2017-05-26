/* global describe, it, beforeEach */
import I18nCentralStorage from '../index';
import should from 'should';


describe('Module API', () => {

    let i18nCentralStorage = null;

    beforeEach(() => {

        const directories = [];
        const extentions = [];
        const pattern = 'gettext';

        i18nCentralStorage = new I18nCentralStorage({
            directories,
            extentions,
            pattern
        });
    });

    it('searchFilesInDirectoryByExtenstion', () => {


    });
});
