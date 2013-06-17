module.exports = function(app, mongoose) {
	var async = require('async');

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

	var suggestOutputFilter = function(x){
		delete x.ra;
		delete x.__v;
		return x;
	};

	var normalFilter = function(x){
		y = {}
		y._id = x._id;
		y.name = x.name;
		return y;
	};

	var getSuggestion = function( num, callback){
		Channel.find({}).lean().exec(function(err, docAll){
			docAll.forEach(function(elem, index, array){
				
				elem.ra = Math.random();
				array[index] = elem;
			});

			docs = docAll.sort( RAcomparator).slice(0,num);
			//docs = docs.map(outputFilter);
			callback(err, docs.map(suggestOutputFilter));
		});

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
			res.send(docs.map(normalFilter));
		});
	});

	app.get('/channel/:id', function(req, res){
		Channel.find({_id: req.params.id}).exec(function(err, doc){
			res.send(doc);
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