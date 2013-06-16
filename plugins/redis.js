module.exports = function(app, config) {

	var redis = require('redis');


	// if( !config.redis ){
	// 	console.log( ' please set configuration: redis.host, redis.pass, redis.port ');
	// }

	var client = redis.createClient( config.redis.port, config.redis.host );
	
	if( config.redis.pass ){
		client = client.auth(config.redis.pass, function(err){
			if( err ){
				client = redis.createClient();
			}
			console.log('redis connected');
		});
	}
 
	// client.on('error', function (err) {
	//     console.log('Error ' + err);
	// });
	 
	// client.on('connect', onConnect);
	 
	// function onConnect() {
	//     // Set a value with an expiration
	//     client.set('string key', 'Hello World', redis.print);
	//     // Expire in 3 seconds
	//     client.expire('string key', 3);
	 
	//     // This timer is only to demo the TTL
	//     // Runs every second until the timeout
	//     // occurs on the value
	//     var myTimer = setInterval(function() {
	//         client.get('string key', function (err, reply) {
	//             if(reply) {
	//                 console.log('I live: ' + reply.toString());
	//             } else {
	//                 clearTimeout(myTimer);
	//                 console.log('I expired');
	//                 client.quit();
	//             }
	//         });
	//     }, 1000);
	// }

};