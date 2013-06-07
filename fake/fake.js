var mongo = require('mongodb')
  , mongoose = require('mongoose')
  , dbPath = 'mongodb://localhost/2dspot'
  ;

mongoose.connect(dbPath, function onMongooseError(err) {
  if (err) throw err;
});

var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log('Connected to DB');
});


var AccountSchema = new mongoose.Schema({
    email:     { type: String, unique: true },
    password:  { type: String, select: false },
    photoUrl:  { type: String },
    name: { type: String },
    country: { type: String},
    subscribes: [{ type: String }]

  });

AccountSchema.statics.random = function(callback) {
  this.count(function(err, count) {
    if (err) {
      return callback(err);
    }
    var rand = Math.floor(Math.random() * count);
    this.findOne().skip(rand).exec(callback);
  }.bind(this));
};

var Account = mongoose.model('Account', AccountSchema);

var registerCallback = function(err) {
if (err) {
  return console.log(err);
};
return console.log('Account was created');
};


var Schema = mongoose.Schema;

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
      votes: Number,
      avs:  Number,
      pv: Number
    },
    channel: String

    });

PostSchema.methods.rank = function(){
	var t = this.date - new Date(2013,4,25);
	return this.meta.votes;
};

var Post = mongoose.model('Post', PostSchema);

var crypto = require('crypto');
var regist = function(email, password, firstName, lastName, photo) {
    var password;
    if( password){
      shaSum = crypto.createHash('sha256');
      shaSum.update(password);
      password = shaSum.digest('hex');
    }
    else{
      return console.log("no password error");
    }

    console.log('Registering ' + email);
    var user = new Account({
      email: email,
      name: {
        first: firstName,
        last: lastName,
        full: firstName + ' ' + lastName
      },
      password: password,
      photoUrl: photo
    });
    user.save(registerCallback);
    console.log('Save command was sent');
  };

var fs = require('fs');

var FakeAccount = function(){
	var ffn = fs.readFileSync('female-first-name.txt').toString().split("\n");
	var mfn = fs.readFileSync('male-first-name.txt').toString().split("\n");
	var aln = fs.readFileSync('all-last-name.txt').toString().split("\n");
  var photos = fs.readdirSync("/Users/sin/Dropbox/2dspot/public/images/profilePictures");


	function onlyFirst( array ){
		var size = array.length;
		var out = new Array();
		for(var i=0; i < size; i++) {
		   tmp = array[i].split(/\s+/)[0];
		   
		   if( tmp != "")	out.push(tmp);
		}
		return out;
	}

	ffn = onlyFirst(ffn);
	mfn = onlyFirst(mfn);
	aln = onlyFirst(aln);

	ffn_size = ffn.length;
	mfn_size = mfn.length;
	aln_size = aln.length;
  pho_size = photos.length;

	function RandFirstName(){
		if( Math.random() > 0.5 ) 
			firstname = ffn[ Math.floor(Math.random()* ffn_size )];
		else
			firstname = mfn[ Math.floor(Math.random()* mfn_size )];

		return firstname;
	}

	function RandLastName(){
		return aln[ Math.floor(Math.random()* aln_size )];
	}


	// console.log(RandFirstName());
	// console.log(RandLastName());

	for( var i = 0; i < 1000; i++ ){
		firstname = RandFirstName();
		lastname = RandLastName();
    photo = photos[ Math.floor(Math.random()* pho_size )];
		regist(firstname,"123",firstname,lastname, photo);
		console.log(i);
	}

}

var sents = fs.readFileSync("/Users/sin/Dropbox/clean-corpus.en", "utf8").split("\n");
var sents_size = sents.length;

var createPostCallback = function(err) {
    if (err) {
    	return console.log(err);
	}
    	return console.log("Post created");
};

var mt = require('mersenne');
var async = require('async');
var countrys = ['MO','HK','TW'];
var FakePost = function(){
	
	var account;

	var createOneFakePost = function(){
		Account.random(function(err, doc){
			account = doc;
			post = {}
			post.title = sents[Math.floor(mt.rand(sents_size))];
			post.author = account;

			body_size = Math.floor(mt.rand(6)) + 3;
      post.body = "";
			for( var i = 0; i < body_size; ++i )
				post.body += sents[Math.floor(mt.rand(sents_size))].replace(/\r|\n/,"");
			
			post.date = new Date(2013,4,Math.floor(mt.rand(31)));
			post.pics = [];
			pic_num = Math.floor(mt.rand(100));
			post.pics.push( 'uploads/'+pic_num+'.png');
			voters_size = Math.floor(mt.rand(201));
			hotOrCool = Math.random() > 0.5;
      post.channel = countrys[mt.rand(3)];
			post.meta = {};
			post.meta.votes = hotOrCool?voters_size*-1:voters_size;
			Account.find().skip(Math.floor(mt.rand(600))).limit(voters_size).select('_id').exec(function(err, docs){
				post.voter_ids = docs;
				Post(post).save(createPostCallback);
			});
		});
	}	


 //  series_funcs = [];
	// for( var i = 0; i < 1000; i++ ){
    
 //      series_funcs.push(createOneFakePost());
      	
	// }
 //  async.parallel(series_funcs);
  setInterval(function(){
    createOneFakePost();
  }, 10);

  //createOneFakePost();

}


//FakeAccount();
FakePost();
