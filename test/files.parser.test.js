/* global __dirname, describe, it */
import {findFilesInDirectory, searchTextInFileByPattern, getObjectFromFile} from './../src/files.parser';
import { resolve } from 'path';
import should from 'should';


describe('Files parser', () => {


    it('findFilesInDirectory', () => {
        const directory = resolve(__dirname, 'fixtures/files');
        const extentions = ['.js'];

        const files = findFilesInDirectory(directory, extentions);

        files[0].should.equal(directory + '/react.component.view.js');

    });

    it('searchTextInFileByPattern', () => {
        const regexp = /gettext\('(.*?)'\)/gi;
        const filePath = resolve(__dirname, 'fixtures/files/react.component.view.js');
        const foundStrings = searchTextInFileByPattern(filePath, regexp);

        foundStrings[0].should.equal('test label');
        foundStrings[1].should.equal('Congratulations! You\'ve successfully registered your company. The information needs to be moderated before it\'s published on your company page. You will receive an email about the results of moderation shortly.');
        foundStrings[2].should.equal('Type here to find service');
    });

    it('getObjectFromFile', () => {
        const filePath = resolve(__dirname, 'fixtures/messages/ru.js');
        const data = getObjectFromFile(filePath);

        data['Email address'].should.equal('Email address');
    });

});
