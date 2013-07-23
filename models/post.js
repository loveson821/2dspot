module.exports = function(app, mongoose) {
  var fs = require('fs');
	var Schema = mongoose.Schema;
	var ei = require('../plugins/imageProcess.js')(app);
	var redis = app.redis;
	var Channel = mongoose.model('Channel');
  var domain = app.config.domain;
  var _ = require('underscore')
      , time = require('time');

	var PostSchema = new mongoose.Schema({
		title:  String,
		author: {type: Schema.ObjectId, ref: 'Account'},
		body:   String,
		comments: [{  body: String, date: Date, 
                  author: { type: Schema.ObjectId, ref: 'Account'}
                }],
		date: { type: Date, default: Date.now },
		hidden: Boolean,
		upVoters: [{ type: Schema.ObjectId, ref: 'Account'}],
    downVoters: [{ type: Schema.ObjectId, ref: 'Account'}],
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
  
  PostSchema.index({"date": -1, "channel" : 1, "author": 1})

  // Virtual attributes

  PostSchema
    .virtual('score')
    .get(function() { return this.rank() })

  // Output format
  PostSchema.set('toJSON', {
    virtuals: true
  })

  // Pre save
  PostSchema.pre('save', function(next) {

    if (!this.channel){
      console.log(this.channel)
      next(new Error('Invalid channel'))
    }
      
    else
      next()
  })

	PostSchema.methods.rank = function(){
		var t = (this.date - new Date(2013,3,25))/1000;
		var logV = Math.log(Math.abs(this.meta.votes)+1) / Math.log(5);
		var y = this.meta.votes < 0 ? -1 : 1;

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
      }else if(!doc){
        callback('no channel', null)
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
			callback(err,doc);
		});
	};
 
  var addComment = function(postId, comment, callback){
		Post.findOneAndUpdate({_id: postId}, { $push: { comments: comment}}, function(err){
			callback(err)
		});
  };

  var upThumb = function(postId, userId, callback){
  	Post.findOneAndUpdate({_id: postId, upVoters: { $ne: userId }, downVoters: { $ne: userId }}, 
                          {$inc: {"meta.votes": 1}, $push: { upVoters: userId} }, 
    function(err, doc){
  		callback(err, doc)
  	});
  };

  var downThumb = function(postId, userId, callback){
  	Post.findOneAndUpdate({_id: postId, upVoters: { $ne: userId }, downVoters: { $ne: userId }}, {$inc: {"meta.votes": -1}, $push: { downVoters: userId} }, function(err, doc){
  	  callback(err, doc);
  	});
  };

  /*
  app.get('/post/:id/rank',function(req, res){
  	Post.findOne({_id: req.params.id}, function(err, doc){
  		res.send('doc rank is '+ doc.rank());
  	});
  });
  */


	app.post('/api/v1/post', app.ensureAuthenticated, function(req, res, next){
    
    if( !_.isNull(req.files.pics) ){
      var paths = []
      var req.body.pics = []
      
      if( _.isArray(req.files.pics) ){
        var len = req.files.pics.length
        for( var i = 0; i < len; ++i ){
          var file = req.files.pics[i]
          paths.push( req.files.pics[i].path )
          req.body.pics.push( domain + req.files.pics[i].path.replace('public','') )
        }
      }else{
        
        paths.push( req.files.pics.path )
        req.body.pics.push( domain + req.files.pics.path.replace('public','') )
      }
      
      req.body.author = req.user

      ei.thumbnails(paths, 'undefined', function(result){
        if( result ){
          create(req.body, function(err, doc){
            if(err) res.send({'success': false, 'err': err, 'note':'create post fail'})
            else{
              res.send({'success': true})
            }
          })
        }
        else{
          res.send({'success': false, 'err': 'pictures upload failed'})
        }
        //res.send({'success': result, 'doc': req.body})
      })
      
      
      
    }else{
	  	fs.unlink(req.files.pics.path);
		  res.send({'success': false, 'err': 'no picture cannot create'})
    }
    
		
	});

	app.get('/post', app.ensureAuthenticated, function(req, res){
		res.render('createpost',{ user: req.user });
	});

	
	app.get('/api/v1/post/:id', function(req, res){
		Post.findOne({_id: req.params.id}).select('-comments').populate('author','_id name photoUrl').lean().exec(function(err,doc){
			if(err || !doc ) res.send({'success': false, 'error': 'Not found'})
      else{

        if( req.user ){
          doc.voted = _.contains(doc.upVoters.map(function(x){ return x.toString()}), req.user.id) ? 1 : 
                      (_.contains(doc.downVoters.map(function(x){ return x.toString()}), req.user.id)  ? 0 : -1)
        }
        else
          doc.voted = -1
          doc.downVoters = doc.downVoters.length
          doc.upVoters = doc.upVoters.length

        res.send(doc);
      }
			
		});
	});

	app.get('/post/:id/addComment', app.ensureAuthenticated, function(req, res){
		res.render('createComment', {postid: req.params.id, user: req.user});
	});

	app.get('/api/v1/post/:id/up', app.ensureAuthenticated, function(req, res){
		upThumb(req.params.id, req.user.id, function(err, doc){
		  if(err || !doc){
        res.send({'success': false, 'error': err})
      }else{
        res.send({'success': true, 'vote': doc.meta.votes})
      }
		});
	});
  
  app.get('/api/v1/post/:id/down', app.ensureAuthenticated, function(req, res){
		downThumb(req.params.id, req.user.id, function(err, doc){
		  if(err || !doc){
        res.send({'success': false, 'error': err})
      }else{
        res.send({'success': true, 'vote': doc.meta.votes})
      }
		});
  });

	app.post('/api/v1/post/:id/comments', app.ensureAuthenticated, function(req,res){
		if( req.body ){

			var com = req.body;
			com.date = new Date();
			com.author = req.user;
			addComment( req.params.id, com , function(err){
				if(err) res.send({'success': false, 'error': err})
        else{
          res.send({'success': true})
        }
			});

		}
		
	});

	app.get('/api/v1/post/:id/comments/:page?',function(req, res){
		var postId = req.params.id;
		var page = req.params.page || 1;
		Post.find({_id: postId}).populate('comments.author','_id name photoUrl').exec(function(err, doc){
			doc = doc[0];
			data = {}
			data.count = doc.comments.length;
			data.next = data.count - page*20 > 0;
			data.comments = doc.comments.reverse().slice((page-1)*20, page*20);

			res.send(data);
		});
	});

	app.get('/api/v1/posts', function(req, res){
		//page = req.params.p != 'undefined' ? req.params.p : 0;
		//channel = req.user.channel != 'undefined' ? req.user.channel : null;
		var page = 0;
		var page_size = 100;
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
  
  app.get('/api/v1/posts/user/:id/:page?',app.ensureAuthenticated, function(req, res){
    var page = req.params.page || 0
    var page_size = 11;
    Post.find({author: req.params.id})
      .select('-comments -upVoters -downVoters')
      .sort('-date')
      .limit(page_size)
      .skip(page * page_size)
      .populate('channel', 'name')
      .populate('author', 'email _id name photoUrl')
      .exec(function(err, docs){
        data = {}
        data.next = docs.length > 10
        data.docs = docs.slice(0,10);
        res.send(data);
      });
  });

  var rank = function(date, votes){
    var t = (date - new Date(2013,3,25))/1000;
    var logV = Math.log(Math.abs(votes)+1) / Math.log(5);
    var y = votes < 0 ? -1 : 1;

    return logV * y + ( t/45000 );
  };


	app.get('/api/v1/posts/:year/:month/:day/:channel/:page?/:count?', function(req, res){

		var year = req.params.year;
		var month = req.params.month - 1;
		var day = req.params.day;
		var channel = req.params.channel.replace('-',' ');
		var page = req.params.page || 1;
		var page_size = req.params.count || 20;
		var page_size_end = page_size + 1;

		var start = new time.Date(year,month,day, 'UTC');
		var end = new time.Date(year,month,day, 'UTC');
		end.setDate(end.getDate()+1);

		Channel.findOne({ name: channel}).exec(function(err, cha){
			if( err || !cha ) { res.send({ 'status': 404 }); }
      else{
        var o = {};
        // o.map = function () { emit({score: rank(this.date, this.meta.votes), id: this._id}, 1) }
        o.map = function () { emit(this._id, rank(this.date, this.meta.votes)) }
        o.query = {date: { $gt: start, $lte :end }, channel: cha._id}
        o.out = { inline : 1 }
        o.scope = { rank : rank}
        o.verbose = true;
        // o.limit = 10;

        Post.mapReduce(o, function (err, vals, stats) {
          // console.log(err)
          console.log('map reduce took %d ms', stats.processtime)
          var count = vals.length;
          vals = vals.sort(function(a,b) { 
                      return a.value - b.value;
                  })
                  .reverse().slice((page-1)*page_size, page*page_size)
                  .map( function(item){
                    return item._id;
                  })
          Post.find({ _id: {$in: vals }})
            .select('-comments')
           .populate({
             path: 'channel', 
             match: { name : channel },
             select: 'name'
           })
          .populate('author','email _id name photoUrl').exec(function(err, docs){
            if(err || !docs) { res.send({ 'status': 404 }); }
            var data = {};
            data.meta = {};
            data.meta.count = count;
            data.meta.next = data.meta.count - page*page_size > 0;
            data.docs = docs;

            data.docs.forEach(function(elem, index, array){
              var score = elem.rank();
              elem = elem.toObject();
              elem.score = score;
                
              if( req.user ){
                elem.voted = _.contains(elem.upVoters.map(function(x){ return x.toString()}), req.user.id) ? 1 : 
                            (_.contains(elem.downVoters.map(function(x){ return x.toString()}), req.user.id)  ? 0 : -1)
              }
              else{
                elem.voted = -1
              }
                
              elem.upVoters = elem.upVoters.length;
              elem.downVoters = elem.downVoters.length;
              array[index] = elem;
               
             }) 
             res.send(data)
          })
        })
      }
    })

	});

	return {
		findByString: findByString,
		findById: findById,
		create: create
	};

}