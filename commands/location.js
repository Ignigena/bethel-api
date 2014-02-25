var mongojs  = require('mongojs'),
    restify  = require('restify'),
    db       = mongojs('127.0.0.1:27017/account', ['account']),
    location = db.collection('location');

function setHeaders(res) {
    res.cache('public', {maxAge: 600});
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Accept-Encoding');
}

module.exports = {
    showAllLocations: function (req, res, next) {
        setHeaders(res);

        location.find({uid: Number(req.params.uid)}).sort({title: 1},function (err, success) {
            if (success) {
                res.send(200, {'locations':success});
                return next();
            }
            return next(err);
        });
    },
    createLocations: function (req, res, next) {
        setHeaders(res);

        location.insert(req.params.location);
        
        location.find(req.params.location, function(err, success) {
            if (success) {
                res.send(200, {'locations':success});
                return next();
            }
            return next(err);
        });
    }
};
