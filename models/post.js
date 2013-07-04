module.exports = function(app, mongoose) {
  var fs = require('fs');
	var Schema = mongoose.Schema;
	var ei = require('../plugins/imageProcess.js')(app);
	var redis = app.redis;
	var Channel = mongoose.model('Channel');
  var domain = app.config.domain;

	// var fileUploader = require('../plugins/fileUploader.js')(app);
	// var formidable = require('formidable');

	var PostSchema = new mongoose.Schema({
		title:  String,
		author: {type: Schema.ObjectId, ref: 'Account'},
		body:   String,
		comments: [{  body: String, date: Date, 
                  author: { type: Schema.ObjectId, ref: 'Account'}
                }],
		date: { type: Date, default: Date.now },
		hidden: Boolean,
		voter_ids: [{ type: Schema.ObjectId, select: false }],
		pics: [ { type: String } ],
		meta: {
			votes: { type: Number, default: 0 },
			avs:  Number,
			pv: Number
		},
		channel: {type: Schema.ObjectId, ref: 'Channel'}
	    //contacts:  [Contact],
	    //status:    [Status], // My own status updates only
	    //activity:  [Status]  //  All status updates including friends
	});
  
  PostSchema.index({"date": -1, "channel" : 1})
  
  PostSchema.pre('save', function(next) {

    if (!this.channel){
      console.log(this.channel)
      next(new Error('Invalid channel'))
    }
      
    else
      next()
  })

	PostSchema.methods.rank = function(){
		t = (this.date - new Date(2013,3,25))/1000;
		logV = Math.log(Math.abs(this.meta.votes)+1) / Math.log(5);
		y = this.meta.votes < 0 ? -1 : 1;

		return logV * y + ( t/45000 );
	};

	var Post = mongoose.model('Post', PostSchema);

	var createPostCallback = function(err) {
	    if (err) {
	    	return console.log(err);
		}
	    	return console.log("Post created");
  	};


	var create = function(obj, callback){
		console.log("create function");
		Channel.findOne({name: obj.channel}).select('_id').lean().exec(function(err, doc){
      if(err){
        callback(err, null)
      }
      else{
  			obj.channel = doc._id;
  			var post = new Post(obj);
  			post.save(function(err){
  				callback(err, post);
  			});
      }
			
		});
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
  		callback(err, doc)
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


	app.post('/post', app.ensureAuthenticated, function(req, res, next){
    
    var len = req.files.pics.length
    var paths = []
    req.body.pics = []
    for( var i = 0; i < len; ++i ){
      file = req.files.pics[i]
      paths.push( req.files.pics[i].path )
      req.body.pics.push( domain + req.files.pics[i].path )
    }
    req.body.author = req.user

    ei.thumbnails(paths, 'undefined', function(result){
      res.send({'success': result, 'doc': req.body})
    })
    /*
		if( req.files.pics.length ){
      req.files.pics.map(function(pic){
        console.log(pic)
      })
			
      path = req.files.pic.path;
			//targetPath = path + '.jpg';
			// fs.rename(path, targetPath, function(err){
			// 	if(err) throw err;
			// });
			//fs.renameSync(path, targetPath);
			req.body.pics = [domain + path.slice(6)];
			req.body.author = req.user;
			ei.thumbnails(path, 'undefined',function(err, image){
				if(err){
					res.send(err);
				}else{
					create(req.body, function(err, post){
						if( err) { res.send({'success':false, 'error': err})}
						else{
							res.send(post);
						}
							
					});
					
				}
			});
      
		}else{
	  		fs.unlink(req.files.pic.path);
		}
    */
		
	});

	// app.post('/post',function(req, res) {
	//     var form = new formidable.IncomingForm;
	//     form.keepExtensions = true;
	//     form.uploadDir = 'tmp/';
	 
	//     form.parse(req, function(err, fields, files){
	//       if (err) return res.end('You found error');
	//       console.log(files.pic);
	//     });
	 
	//     form.on('progress', function(bytesReceived, bytesExpected) {
	//         console.log(bytesReceived + ' ' + bytesExpected);
	//     });
	 
	//     form.on('error', function(err) {
	//         res.writeHead(200, {'content-type': 'text/plain'});
	//         res.end('error:\n\n'+util.inspect(err));
	//     });
	//     res.end('Done');
	//     return;
	// });

	// app.post('/post', fileUploader.uploadFile, function(req, res){
	// 	res.send({'status':33});
	// });

	app.get('/post', app.ensureAuthenticated, function(req, res){
		res.render('createpost',{ user: req.user });
	});

	
	app.get('/post/:id', function(req, res){
		Post.find({_id: req.params.id}).populate('author comments.author').exec(function(err,doc){
			if(err) res.send(err);
			res.send(doc);
		});
	});

	app.get('/post/:id/addComment', function(req, res){
		res.render('createComment', {postid: req.params.id, user: req.user});
	});

	app.get('/post/:id/up', function(req, res){
		upThumb(req.params.id, req.user._id, res, function(err, doc){
		  if(err){
        res.send({'success': false, 'error': err})
      }else{
        res.send({'success': true, 'vote': doc.meta.votes})
      }
		});
	});
  

	app.post('/post/:id/comments', app.ensureAuthenticated, function(req,res){
		if( req.body ){

			com = req.body;
			com.date = new Date();
			com.author = req.user;
			addComment( req.params.id, com , res, function(res){
				//res.redirect('/post/'+req.params.id);
        res.status(200).send({"success": true})
			});

		}
		
	});

	app.get('/post/:id/comment/:page?',function(req, res){
		postId = req.params.id;
		page = req.params.page || 1;
		Post.find({_id: postId}).populate('comments.author').exec(function(err, doc){
			doc = doc[0];
			data = {}
			data.count = doc.comments.length;
			data.next = data.count - page*20 > 0;
			data.comments = doc.comments.slice((page-1)*20, page*20);

			res.send(data);
		});
	});

	app.get('/posts', function(req, res){
		//page = req.params.p != 'undefined' ? req.params.p : 0;
		//channel = req.user.channel != 'undefined' ? req.user.channel : null;
		page = 0;
		page_size = 100;
		Post.find({}).sort('-date').skip(page_size*page).limit(page_size)
			.populate('author comments.author').exec(function(err, docs){
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

	app.get('/posts/all/:channel',function(req, res){

	});

	app.get('/posts/meta', function(req, res){
		Post.find({})
			.populate('channel').exec(function(err, docs){
			data = {};

			docs.forEach(function(elem, index, array){
				data[elem.channel.name] = (data[elem.channel.name] ? data[elem.channel.name] : 0) + 1;
			});

			res.send(data);
		});
	});
  
  app.get('/posts/user/:id/:page?', function(req, res){
    page = req.params.page || 0
    page_size = 11;
    Post.find({author: req.params.id})
      .select('-comments -voter_ids')
      .sort('-date')
      .limit(page_size)
      .skip(page * page_size)
      .populate('channel', 'name')
      .exec(function(err, docs){
        data = {}
        data.next = docs.length > 10
        data.docs = docs.slice(0,10);
        res.send(data);
      });
  });

	app.get('/posts/meta/:year/:month/:day', function(req, res){
		year = req.params.year;
		month = req.params.month - 1;
		day = req.params.day;
		start = new Date(year,month,day);
		end = new Date(year,month,day);
		end.setDate(end.getDate()+1);

		Post.find({date: { $gt: start, $lte :end }})
			.populate('channel','name').exec(function(err, docs){
			data = {};
			docs.forEach(function(elem, index, array){
				data[elem.channel.name] = (data[elem.channel.name] ? data[elem.channel.name] : 0) + 1;
			});

			res.send(data);
		});
	});

	app.get('/posts/:year/:month/:day/:channel/:page?/:count?', function(req, res){

		year = req.params.year;
		month = req.params.month - 1;
		day = req.params.day;
		channel = req.params.channel.replace('-',' ');
		page = req.params.page || 1;
		page_size = req.params.count || 20;
		page_size_end = page_size + 1;

		start = new Date(year,month,day);
		end = new Date(year,month,day);
		end.setDate(end.getDate()+1);

		Channel.findOne({ name: channel}).exec(function(err, cha){
			if( err || !cha ) { res.send({ 'status': 404 }); }
      else{
  			Post.find({date: { $gt: start, $lte :end }, channel: cha._id})
          .select('-comments')
  				.populate({
  					path: 'channel', 
  					match: { name : channel },
  					select: 'name'
  				})
  				//.populate('author comments.author').exec(function(err, docs){
  				.populate('author','email _id name photoUrl').exec(function(err, docs){
          	if(err || !docs) { res.send({ 'status': 404 }); }
  					if(docs.length == 0){ console.log('should load redis data');}
  					data = {};
  					data.meta = {};
  					data.meta.count = docs.length;
  					data.meta.next = data.meta.count - page*page_size > 0;
  					data.docs = docs;

  					data.docs.forEach(function(elem, index, array){
  						score = elem.rank();
  						elem = elem.toObject();
  						elem.score = score;
  						delete elem.voter_ids;
              //delete elem.comments;
  						array[index] = elem;
  						//elem.comments_len = elem.comments.length;
  						//elem.comments_next = elem.comments.length > page_size;
  						//elem.comments = elem.comments.slice(0,page_size_end);
						  
  					});
  					data.docs.sort(compare);
  					data.docs = docs.slice((page-1)*page_size, page*page_size);

  					res.send(data);
  			});
      }
			

		});

		
		
		
	});

	return {
		findByString: findByString,
		findById: findById,
		create: create
	};

}