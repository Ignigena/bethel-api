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
    findLocations: function (req, res, next) {
        setHeaders(res);

        db.runCommand( { geoNear: "location", near: [ Number(req.params.lng), Number(req.params.lat) ], maxDistance: req.params.rad / 6371, distanceMultiplier: 6371, spherical: true }, function(err, success) {
            if (success) {
                res.send(200, success);
                return next();
            }
            return next(err);
        });
    },
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
