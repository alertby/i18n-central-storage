/* global __dirname, describe, it */
import { findFilesInDirectory, getObjectFromFile, searchTextInFileByPatterns } from './../src/files.parser';
import { resolve } from 'path';
import { existsSync, unlinkSync } from 'fs';


describe('Files parser', () => {


    it('findFilesInDirectory', () => {
        const directory = resolve(__dirname, 'fixtures/files');
        const extensions = ['.js'];

        const files = findFilesInDirectory(directory, extensions);

        files[0].should.equal(directory + '/react.component.view.js');
    });

    it('searchTextInFileByPatterns', () => {
        const pattern = /gettext\('(.*?)'\)/gi;
        const pluralPattern = /gettextP\('(.*?)', *'(.*?)', *(\d+)\)/gi;
        const pluralCategories = ['one', 'few', 'many', 'other'];

        const filePath = resolve(__dirname, 'fixtures/files/react.component.view.js');
        const foundStrings = searchTextInFileByPatterns(filePath, {
            pattern,
            pluralPattern,
            pluralCategories
        });

        foundStrings[0].should.equal('test label');
        // eslint-disable-next-line max-len
        foundStrings[1].should.equal('Congratulations! You\'ve successfully registered your company. The information needs to be moderated before it\'s published on your company page. You will receive an email about the results of moderation shortly.');
        foundStrings[2].should.equal('Type here to find service');
    });

    it('getObjectFromFile', () => {
        const filePath = resolve(__dirname, 'fixtures/messages/ru.js');
        const data = getObjectFromFile(filePath);

        data['Email address'].should.equal('Email address');
        data['%s cat'].should.eql({
            one: "%d кошка",
            few: "%d кошки",
            many: "%d кошек",
            other: "%d кошка"
        });
    });


    it('create message file if not exists', () => {
        const filePath = resolve(__dirname, 'fixtures/messages/de.js');
        const data = getObjectFromFile(filePath);

        (existsSync(filePath)).should.be.true();
        data.should.be.empty();

        unlinkSync(filePath);
    });

});
