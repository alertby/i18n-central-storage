/* global __dirname, describe, it, beforeEach */
import I18nCentralStorage from '../index';
import { resolve } from 'path';
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
        const directories = [resolve(__dirname, 'fixtures/files')];
        const extentions = ['.js'];

        const files = i18nCentralStorage.searchFilesInDirectoryByExtenstion(directories, extentions);

        files[0].should.equal('react.component.view.js');

    });

    it('searchTextInFileByPattern', () => {
        const regexp = /gettext\('(.*?)'\)/gi;
        const filePath = resolve(__dirname, 'fixtures/files/react.component.view.js');
        const foundStrings = i18nCentralStorage.searchTextInFileByPattern(filePath, regexp);

        foundStrings[0].should.equal('test label');
        foundStrings[1].should.equal('Type here to find sevice');
    });

});
