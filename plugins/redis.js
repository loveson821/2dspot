module.exports = function(app, config, mongoose) {
  var mongooseRedisCache = require("mongoose-redis-cache");
  mongooseRedisCache(mongoose, {
     host: config.redis.host,
     port: config.redis.port,
     pass: config.redis.pass,
     options: "redisOptions"
   })
  /*
	var redis = require('redis');

	var client = redis.createClient( config.redis.port, config.redis.host );
	
	if( config.redis.pass ){
		client = client.auth(config.redis.pass, function(err){
			if( err ){
				client = redis.createClient();
			}
			console.log('redis connected');
		});
	}
  */
 
};