var mongojs = require('mongojs'),
    db      = mongojs('127.0.0.1:27017/podcast', ['podcast']),
    media   = db.collection('media'),
    storage = db.collection('storage'),
    s3Sync  = require('cron').CronJob,
    AWS     = require('aws-sdk'),
    S       = require('string');

function setHeaders(res) {
    res.cache('public', {maxAge: 600});
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Accept-Encoding');
}

AWS.config.loadFromPath('/var/config/aws.json');
var s3 = new AWS.S3();

new s3Sync('0 */5 * * * *', function() {
    console.log('Syncing podcast storage.');

    storage.find({type: "s3"}, function(err, success) {
        success.forEach(function(sync) {
            s3.listObjects({Bucket: 'bethel-podcaster', Prefix: sync.user+'/'+sync.uuid+'/'}, function(err, data) {
                var storageUsed = 0;
                data['Contents'].shift();
                console.log('Syncing ' + data['Contents'].length + ' items in ' + sync.user + '/' + sync.uuid);

                data['Contents'].forEach(function(item) {
                    var s3media = S(item['ETag']).replaceAll('"', '').s;
                    media.update({uuid: s3media, podcast: Number(sync.uuid)}, {$set: {url: 'http://bethel-podcaster.s3-website-us-east-1.amazonaws.com/' + item['Key'], size: item['Size'], uuid: s3media, podcast: Number(sync.uuid)}}, { upsert: true });
                    storageUsed += item['Size'];
                });

                storage.update({_id: sync._id}, {$set: {storage: storageUsed}});
                console.log(storageUsed + ' storage used.');
            });
        });
    });
}, null, true, 'America/New_York');

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

        media.findOne({$and: [ {podcast: Number(req.params.podcastId)}, {uuid: req.params.mediaId} ]}, {_id: 1}, function (err, success) {
            if (success) {
                res.send(200, success);
                return next();
            }
            return next(err);
        });
    },
    updatePodcastMedia: function (req, res, next) {
        var newMedia = {};
        newMedia.podcast = Number(req.params.podcastId);
        newMedia.uuid = req.params.mediaId;
        newMedia.title = req.params.title;
        newMedia.date = new Date(req.params.date);
        newMedia.description = req.params.description;
        newMedia.duration = req.params.duration;

        var query = {$and: [ {podcast: Number(req.params.podcastId)}, {uuid: req.params.mediaId} ]};
        if (req.params.existingMediaId) {
            query = {_id: mongojs.ObjectId(req.params.existingMediaId)};
        }

        setHeaders(res);

        media.update(query, {$set: newMedia}, { upsert: true }, function (err, success) {
            if (success) {
                res.send(201, newMedia);
                return next();
            }
            return next(err);
        });
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
