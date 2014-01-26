var mongojs = require('mongojs'),
    db = mongojs('127.0.0.1:27017/podcast', ['podcast']),
    media = db.collection('media');

function setHeaders(res) {
    res.cache('_public_', {maxAge: 600});
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Accept-Encoding');
}

module.exports = {
    showAllPodcastMedia: function (req, res, next) {
        setHeaders(res);

        media.find().sort({date: -1}, function (err, success) {
            if (success) {
                res.send(200, success);
                return next();
            }
            return next(err);
        });
    },
    findAssociatedPodcastMedia: function (req, res, next) {
        setHeaders(res);

        media.find({podcast: Number(req.params.podcastId)}).sort({date: -1}, function (err, success) {
            if (success) {
                res.send(200, success);
                return next();
            }
            return next(err);
        });
    },
    findPodcastMedia: function (req, res, next) {
        setHeaders(res);

        media.find({podcast: Number(req.params.podcastId), uuid: req.params.mediaId}, function (err, success) {
            if (success) {
                res.send(200, success);
                return next();
            }
            return next(err);
        });
    },
    postNewPodcastMedia: function (req, res, next) {
        var newMedia = {};
        newMedia.podcast = req.params.podcastId;
        newMedia.uuid = req.params.mediaId;
        newMedia.title = req.params.title;
        newMedia.date = new Date(req.params.date);
        newMedia.description = req.params.description;
        newMedia.duration = req.params.duration;

        setHeaders(res);

        media.save(newMedia, function (err, success) {
            if (success) {
                res.send(201, newMedia);
                return next();
            }
            return next(err);
        });
    },
    editPodcastMedia: function (req, res, next) {
        //@todo Implement.
    },
    deletePodcastMedia: function (req, res, next) {
        setHeaders(res);

        media.remove({_id: mongojs.ObjectId(req.params.jobId)}, function (err, success) {
            if (success) {
                res.send(204);
                return next();
            }
            return next(err);
        })
    }
};
