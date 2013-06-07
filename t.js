var redis = require("redis"),
    config = require('./config');


client = redis.createClient(config.redisPort, config.redisDNS);
client = client.auth(config.redisPass, function(err){
	console.log('ok');
});

