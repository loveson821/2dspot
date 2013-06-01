module.exports = function(app, mongoose) {
  var fs = require('fs');
	var Schema = mongoose.Schema;

	var PostSchema = new mongoose.Schema({
		title:  String,
		author: String,
		body:   String,
		comments: [{  body: String, date: Date, 
                  author: String, user: Schema.ObjectId 
                }],
		date: { type: Date, default: Date.now },
		hidden: Boolean,
		voter_ids: [{ type: Schema.ObjectId, select: false }],
		pics: [ { type: String } ],
		meta: {
			votes: Number,
			avs:  Number,
			pv: Number
		},
		channel: String
	    //contacts:  [Contact],
	    //status:    [Status], // My own status updates only
	    //activity:  [Status]  //  All status updates including friends
	  });

	PostSchema.methods.rank = function(){
		t = (this.date - new Date(2013,3,25))/1000;
		logV = Math.log(Math.abs(this.meta.votes)) / Math.log(5);
		y = this.meta.votes < 0 ? -1 : 1;

		return logV + y * ( t/45000 );
		//return t;
	};

	var Post = mongoose.model('Post', PostSchema);

	var createPostCallback = function(err) {
	    if (err) {
	    	return console.log(err);
		}
	    	return console.log("Post created");
  	};

	// var create = function(title, body, author, pic){
	// 	var post = new Post({
	// 			title: title,
	// 			author: author,
	// 			body: body,
	// 			pics: [pic]
	// 	});
	// 	post.save(createPostCallback);
	// };

	var create = function(obj){
		console.log("create function");
		var post = new Post(obj);
		post.save(createPostCallback);
	};

	var compare = function(a,b) {
	  if (a.score < b.score)
	     return 1;
	  if (a.score > b.score)
	    return -1;
	  return 0;
	};

	var findByString = function(searchStr, callback) {
		var searchRegex = new RegExp(searchStr, 'i');
		Post.find({
			$or: [
					{ 'title': { $regex: searchRegex } },
					{ email:       { $regex: searchRegex } }
					]
			}, function(err,doc){ callback(err,doc);});
	};

	var findById = function(accountId, callback) {
		Post.findOne({_id:accountId}, function(err,doc) {
			console.log("doc: " + doc);
			callback(err,doc);
		});
	};
 
  var addComment = function(postId, comment, res, callback){
		Post.findOneAndUpdate({_id: postId}, { $push: { comments: comment}}, function(err){
			if(err)
				console.log(err);
			else
				callback(res);
		});
  };

  var upThumb = function(postId, userId, res, callback){
  	Post.findOneAndUpdate({_id: postId, voter_ids: { $ne: userId }}, {$inc: {"meta.votes": 1}, $push: {voter_ids: userId} }, function(err, doc){
  		if(err){ console.log(err); res.send(400); }
  		else
  			callback(res);
  	});
  };

  var downThumb = function(postId, userId, res, callback){
  	Post.findOneAndUpdate({_id: postId, voter_ids: { $ne: userId }}, {$inc: {"meta.votes": -1}, $push: {voter_ids: userId} }, function(err, doc){
  		if(err){ console.log(err); res.send(400); }
  		else
  			callback(res);
  	});
  };

  app.get('/post/:id/rank',function(req, res){
  	Post.findOne({_id: req.params.id}, function(err, doc){
  		res.send('doc rank is '+ doc.rank());
  	});
  });
	// var show = function(){
 //    async.parallel([
 //      function(callback){
 //    		Post.find({}).exec(function(err, doc){
 //          callback(null,doc);
 //        });
 //      }],
 //      function(err, results){ console.log(results); });
	// };


	app.post('/post', function(req, res, next){
		if( req.files.pic.size ){
			var path = req.files.pic.path;
      console.log(path);
			req.body.pics = [path];
		}else{
      fs.unlink(req.files.pic.path);
    }
		req.body.author = req.user.email;
		create(req.body);
		res.send(req.body);
	});

	app.get('/post', app.ensureAuthenticated, function(req, res){
		res.render('createpost',{ user: req.user });
	});

	
	app.get('/post/:id', function(req, res){
		Post.find({_id: req.params.id}).exec(function(err,doc){
			if(err) res.send(err);
			res.send(doc);
		});
	});

	app.get('/post/:id/addComment', function(req, res){
		res.render('createComment', {postid: req.params.id, user: req.user});
	});

	app.get('/post/:id/up', function(req, res){
		upThumb(req.params.id, req.user._id, res, function(res){
			res.send(200);
		});
	});

	app.post('/post/:id',function(req,res){
		if( req.body ){

			com = req.body;
			com.date = new Date();
			com.author = req.user.email;
			com.user = req.user;
			addComment( req.params.id, com , res, function(res){
				res.redirect('/post/'+req.params.id);
			});

		}
		
	});

	app.get('/post/:id/comment/:page',function(req, res){
		postId = req.params.id;
		page = req.params.page;
		Post.find({_id: postId}).exec(function(err, doc){
			doc = doc[0];
			data = {}
			data.count = doc.comments.length;
			data.next = data.count - page*20 > 0;
			data.comments = doc.comments.slice((page-1)*20, page*20);

			res.send(data);
		});
	});

	app.get('/posts/:p?', function(req, res){
		page = req.params.p != 'undefined' ? req.params.p : 0;
		//channel = req.user.channel != 'undefined' ? req.user.channel : null;
		page_size = 100;
		Post.find({}).sort('-date').skip(page_size*page).limit(page_size)
			.exec(function(err, docs){
			docs.forEach(function(elem, index, array){
				score = elem.rank();
				elem = elem.toObject();
				elem.score = score;
				delete elem.voter_ids;
				array[index] = elem;
				
			});

			res.send(docs.sort(compare));

		});
	});

	app.get('/posts/meta/:year/:month/:day', function(req, res){
		year = req.params.year;
		month = req.params.month - 1;
		day = req.params.day;
		start = new Date(year,month,day);
		end = new Date(year,month,day);
		end.setDate(end.getDate()+1);

		Post.find({date: { $gt: start, $lte :end }}).select("channel").exec(function(err, docs){
			data = {};
			docs.forEach(function(elem, index, array){
				data[elem.channel] = (data[elem.channel] ? data[elem.channel] : 0) + 1;
			});

			res.send(data);
		});
	});

	app.get('/posts/:year/:month/:day/:channel/:page?', function(req, res){

		year = req.params.year;
		month = req.params.month - 1;
		day = req.params.day;
		channel = req.params.channel;
		page = req.params.page;
		page_size = 5;

		start = new Date(year,month,day);
		end = new Date(year,month,day);
		end.setDate(end.getDate()+1);

		Post.find({date: { $gt: start, $lte :end }, channel: channel}).exec(function(err, docs){
			data = {};
			data.meta = {};
			data.meta.count = docs.length;
			data.meta.next = data.meta.count - page*page_size > 0;
			data.docs = docs.slice((page-1)*page_size, page*page_size);

			data.docs.forEach(function(elem, index, array){
				score = elem.rank();
				elem = elem.toObject();
				elem.score = score;
				delete elem.voter_ids;
				array[index] = elem;
				elem.comments_len = elem.comments.length;
				elem.comments_next = elem.comments.length > 20;
				elem.comments = elem.comments.slice(0,21);
				
			});
			data.docs.sort(compare);
			res.send(data);
		});
		
		
	});

	return {
		findByString: findByString,
		findById: findById,
		create: create
	};

};