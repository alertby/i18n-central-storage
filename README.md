# i18n-central-storage

helps to agragate translations from several projects to one place(in our case elasticsearch only supported),

# ![result](media/kibana_translations.png)


You can have you own i18-n or i18n-2 with followen configuration for example:

```js
var locales = ['ru', 'en'];
var i18nConfig = {
    locales: locales,
    defaultLocale: 'ru',
    directory: './messages/'
};
var i18n = new (require('i18n-2'))(i18nConfig);
```

and you have your source files with messages that should be translated, so you can specify pattern for that:

```js
// match any string in you code with gettext('any text')
var pattern = /gettext\('(.*?)'\)/gi;
```

and directories where you source code located:

```js
var directories = [
    path.resolve(__dirname, '../templates/'),
    path.resolve(__dirname, '../assets/js')
];
```

and extentions(array of strings) that should be included in search:

``` js
var extentions = ['.js', '.ejs', '.jsx'];
```

as result all you translated messages will be fetched from elasticsearch and placed to you localization file.


usage example as a gulp task for one locale:

```js

var I18nCentralStorage = require('i18n-central-storage');
var path = require('path');

var directories = [
    path.resolve(__dirname, '../templates/'),
    path.resolve(__dirname, '../assets/js')
];
var messagesDirectory = path.resolve(__dirname, '../messages/');
var extentions = ['.js', '.ejs', '.jsx'];
var pattern = /gettext\('(.*?)'\)/gi;

// here you should specify host and port of your elasticsearch instance,
// index wich you are going to use and prokect reference to split several projects by
// that property
var elasticConfig = {
    host: '192.168.1.237:9200',
    index: 'localizations',
    project: 'projectReferenceOne'
};

var taskFunction = function() {

        var promise = new Promise(function(resolve, reject){
            var i18nCentralStorage = new I18nCentralStorage.default({
                directories,
                messagesDirectory,
                extentions,
                pattern,
                elasticConfig
            }, function() {

                var locale = 'ru';
                var result = i18nCentralStorage.analize(locale);

                i18nCentralStorage
                    .syncLocale(result, locale, { writeResultToFile: true })
                    .then(function (result) {

                        resolve(result);
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        });

        return promise;
    };


module.exports = taskFunction;

```