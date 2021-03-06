var mongojs = require('mongojs'),
    restify = require('restify'),
    moment  = require('moment'),
    probe   = require('node-ffprobe'),
    db      = mongojs('127.0.0.1:27017/podcast', ['podcast']),
    stats   = db.collection('stats'),
    media   = db.collection('media'),
    storage = db.collection('storage'),
    s3Sync  = require('cron').CronJob,
  vimeoSync = require('cron').CronJob
    AWS     = require('aws-sdk'),
    S       = require('string');

function setHeaders(res) {
    res.cache('public', {maxAge: 600});
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Accept-Encoding');
}

AWS.config.loadFromPath('/var/config/aws.json');
var s3 = new AWS.S3();

function syncCloudStorage() {
    console.log('Syncing podcast storage.');

    storage.find({type: "s3"}, function(err, success) {
        success.forEach(function(sync) {
            s3.listObjects({Bucket: 'cloud.bethel.io', Prefix: sync.user+'/'+sync.uuid+'/'}, function(err, data) {
                var storageUsed = 0;
                data['Contents'].shift();
                console.log('Syncing ' + data['Contents'].length + ' items in ' + sync.user + '/' + sync.uuid);

                data['Contents'].forEach(function(item) {
                    var s3media = S(item['ETag']).replaceAll('"', '').s;
                    media.update({uuid: s3media, podcast: Number(sync.uuid)}, {$set: {url: 'http://cloud.bethel.io/' + item['Key'], size: item['Size'], uuid: s3media, podcast: Number(sync.uuid), type: 'cloud'},$setOnInsert: {date: item['LastModified'] }}, { upsert: true });
                    storageUsed += item['Size'];
                });

                storage.update({_id: sync._id}, {$set: {storage: storageUsed}});
                console.log(storageUsed + ' storage used.');
            });
        });
    });
    
    media.find({type: "cloud", duration: {$exists: false}}, function(err, success) {
        success.forEach(function(item) {
            probe(encodeURI(item.url), function(err, probeData) {
                if (probeData) {
                    var itemDuration = moment.duration(probeData.streams[0].duration, 's'),
                        humanDuration = "";
                    if (itemDuration.hours() >= 1) {
                        humanDuration = moment().startOf('day').add(itemDuration).format('HH:mm:ss');
                    } else {
                        humanDuration = moment().startOf('day').add(itemDuration).format('mm:ss');
                    }
                    media.update({_id: item._id}, {$set: {duration: humanDuration}}, { upsert: true });
                } else if (err) {
                    console.log(err);
                }
            });
        });
    });
}

new s3Sync('0 */5 * * * *', function() {
  syncCloudStorage();
}, null, true, 'America/New_York');

new vimeoSync('0 */6 * * * *', function() {
  console.log('Syncing Vimeo podcasts.');

  storage.find({type: "vimeo"}, function(err, success) {
      var client = restify.createJsonClient({
          url: 'https://vimeo.com',
          version: '*'
      });
      success.forEach(function(sync) {
          var page = 1;
          do {              
              client.get('/api/v2/' + sync.vimeo + '/videos.json?page=' + page, function(err, req, res, obj) {
                  obj.forEach(function(video) {
                      video.tags.split(', ').forEach(function(tag) {
                          if (sync.tags.indexOf(tag.toLowerCase()) >= 0) {
                              media.update({uuid: video.id, podcast: Number(sync.uuid)}, {$set: {title: video.title, date:new Date(video.upload_date), description: video.description, tags: video.tags.split(', '), duration: video.duration, thumbnail: video.thumbnail_small, uuid: video.id, podcast: Number(sync.uuid)}}, { upsert: true });
                          }
                      });
                  });
              });
              page++;
          } while (page <= 3);
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

        media.findOne({_id: mongojs.ObjectId(req.params.mediaId)}, function (err, success) {
            if (success) {
                res.send(200, success);
                return next();
            }
            return next(err);
        });
    },
    updatePodcastMedia: function (req, res, next) {
        setHeaders(res);

        if (req.params.payload.reference) {
          req.params.payload.reference.id = Number(req.params.payload.reference.id);
        }
        media.update({_id: mongojs.ObjectId(req.params.mediaId)}, {$set: req.params.payload}, {upsert: true}, function (err, success) {
            if (success) {
                res.send(201, req.params.payload);
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
    },
    updateHitCount: function (req, res, next) {
        setHeaders(res);

        var weekNumber = moment().week();
        var update = {};
        update[weekNumber] = 1;

        stats.update({podcast: req.params.podcastId}, {$inc: update}, {upsert: true}, function (err, success) {
            if (success) {
                res.send(200, req.params.podcastId);
                return next();
            }
            return next(err);
        });
    },
    getSubscribers: function (req, res, next) {
        setHeaders(res);

        var weekNumber = moment().week();
        
        stats.findOne({podcast: req.params.podcastId}, function (err, success) {
            if (success) {
                var subscribers = 0;
                subscribers += Math.round(success[weekNumber-1]/7);
                if (subscribers == 0) {
                  subscribers += Math.round(success[weekNumber]/moment().day());
                }
                res.send(200, {subscribers: Math.round(success[weekNumber]/7)});
                return next();
            } else {
                res.send(200, {subscribers: 0});
            }
            return next(err);
        });
    },
    findAssociatedMedia: function (req, res, next) {
        setHeaders(res);

        media.find({podcast: Number(req.params.podcastId), 'reference.id': Number(req.params.nodeId)}).sort({date: -1}, function (err, success) {
            if (success) {
                res.send(200, success);
                return next();
            } else {
                res.send(200, {});
            }
            return next(err);
        });
    },
    syncStorage: function (req, res, next) {
        setHeaders(res);
        syncCloudStorage();
        res.send(200, 'ok');
    }
};
