module.exports = function(app, mongoose) {


	var ChannelSchema = new mongoose.Schema({
		name: {type: String, lowercase: true, unique: true },
		description: { type: String},
		createDate: { type: Date, default: Date.now }
	});

	var Channel = mongoose.model('Channel', ChannelSchema);

	var RAcomparator = function(a,b) {
	  if (a.ra < b.ra)
	     return 1;
	  if (a.ra > b.ra)
	    return -1;
	  return 0;
	};

	var outputFilter = function(x){
		delete x.ra;
		delete x.__v;
		return x;
	};

	var getSuggestion = function( num, callback){
		Channel.find({}).exec(function(err, docAll){
			docAll.forEach(function(elem, index, array){
				elem = elem.toObject();
				elem.ra = Math.random();
				array[index] = elem;
			});

			docs = docAll.sort( RAcomparator).slice(0,num);
			docs = docs.map(outputFilter);
			callback(err, docs);
		});

		// Channel.find({ RA: { $gte: seek } }). limit( num ).exec(function(err, docs){
		// 	if( docs.length < num ){
		// 		Channel.find({ RA: { $lt: seek }}). limit( num - docs.length).exec(function(err, docDown){
		// 			docs.push.apply(docs, docDown);
		// 			callback(err, docs);
		// 		});
		// 	}
		// 	else
		// 		callback(err, docs);
		// });
	};

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

	app.get('/channels/suggest/:num?', function(req ,res ){
		num = req.params.num || 5;
		getSuggestion(num, function(err, docs){
			res.send(docs);
		});
	});

	return {
		create: create
	};
}