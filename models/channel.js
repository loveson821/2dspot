module.exports = function(app, mongoose) {


	var ChannelSchema = new mongoose.Schema({
		name: {type: String, lowercase: true, unique: true },
		description: { type: String},
		createDate: { type: Date, default: Date.now }
	});


	var Channel = mongoose.model('Channel', ChannelSchema);

	var create = function(channelobj, callback){
		var channel = new Channel(channelobj);
		channel.save(function(err){
			callback(err, channel);
		});
	};

	app.post('/channel/create', function(req, res){
		create( req.body, function( err, doc){
			if( err ) throw err;
			else{
				res.send(doc);
			}
		});
	});

	app.get('/channels', function(req, res){
		Channel.find({}).exec(function(err ,docs){
			res.send(docs);
		});
	});

	return {
		create: create
	};
}