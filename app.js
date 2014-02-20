require('newrelic');

var restify  = require('restify'),
    podcast  = require('./commands/podcast'),
    location = require('./commands/location'),
    ip_addr  = '127.0.0.1',
    port     = '8080';

var server = restify.createServer({
    name : 'BethelApi'
});

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.gzipResponse());

server.get('/', restify.serveStatic({directory : './public', default : 'index.html'}));

var PODCAST = '/podcast';
server.get({path : PODCAST , version : '0.0.1'}, podcast.showAllPodcastMedia);
server.get({path : PODCAST + '/all/:podcastId', version : '0.0.1'}, podcast.findAssociatedPodcastMedia);
server.get({path : PODCAST + '/:mediaId', version : '0.0.1'}, podcast.findPodcastMedia);
server.post({path : PODCAST , version: '0.0.1'}, podcast.updatePodcastMedia);
server.del({path : PODCAST + '/:podcastId/:mediaId', version: '0.0.1'}, podcast.deletePodcastMedia);
server.post({path : PODCAST + '/:podcastId/hit' , version: '0.0.1'}, podcast.updateHitCount);
server.get({path : PODCAST + '/:podcastId/subscribers' , version: '0.0.1'}, podcast.getSubscribers);
server.get({path : PODCAST + '/:podcastId/associated/:nodeId' , version: '0.0.1'}, podcast.findAssociatedMedia);
server.post({path : PODCAST + '/do/sync', version : '0.0.1'}, podcast.syncStorage);

var USER = '/user';
server.get({path : USER + '/:uid/locations', version : '0.0.1'}, location.showAllLocations);
server.post({path : USER + '/:uid/locations', version : '0.0.1'}, location.createLocations);

server.listen(port ,ip_addr, function() {
    console.log('%s listening at %s ', server.name, server.url);
});
