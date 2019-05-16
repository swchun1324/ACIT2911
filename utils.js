const MongoClient = require('mongodb').MongoClient;

var _dbUser = null;

var CONNECTION_URI = "mongodb+srv://example:asdfasdf@agiledevelopment-1ppyn.mongodb.net/test?retryWrites=true";
var DATABASE = 'forumdb';

getDb = () => {
    return _dbUser;
};

getObjectId = () => {
    return require('mongodb').ObjectID;
};

init = (callback) => {
    MongoClient.connect(CONNECTION_URI, { useNewUrlParser: true }, (err, client) => {
        if (err) {
            return console.log('Unable to connect to DB');
        }
        _dbUser = client.db(DATABASE);
        console.log('Successfully connected to MongoDB server');
    });
};

module.exports = {
    getDb: getDb,
    getObjectId: getObjectId,
    init: init
};