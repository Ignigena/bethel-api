require('newrelic');

var restify = require('restify'),
    podcast = require('./commands/podcast'),
    ip_addr = '127.0.0.1',
    port    = '8080';

var server = restify.createServer({
    name : 'BethelApi'
});

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.gzipResponse());

server.get('/', welcome);

var PODCAST = '/podcast'
server.get({path : PODCAST , version : '0.0.1'}, podcast.showAllPodcastMedia);
server.get({path : PODCAST + '/:podcastId', version : '0.0.1'}, podcast.findAssociatedPodcastMedia);
server.get({path : PODCAST + '/:podcastId/:mediaId', version : '0.0.1'}, podcast.findPodcastMedia);
server.post({path : PODCAST , version: '0.0.1'}, podcast.updatePodcastMedia);
server.del({path : PODCAST + '/:podcastId/:mediaId', version: '0.0.1'}, podcast.deletePodcastMedia);

server.listen(port ,ip_addr, function() {
    console.log('%s listening at %s ', server.name, server.url);
});

function welcome(req, res, next) {
  res.send('Bethel API');
}
