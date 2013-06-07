var express = require('express')
  , expressValidator = require('express-validator')
  , http = require('http')
  , mongo = require('mongodb')
  , mongoose = require('mongoose')
  , path = require('path')
  , flash = require('connect-flash')    // flash message when redirect page
  , nodemailer = require('nodemailer')  // send mail
  , MemoryStore = require('connect').session.MemoryStore
  , dbPath = 'mongodb://localhost/2dspot'
  , events = require('events')
  , fs = require('fs')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , winston = require('winston') // logger module
  , swagger = require('swagger-node-express')
  ;


var app         = express();
app.server      = http.createServer(app);   // Create an http server
app.sessionStore = new MemoryStore();       // Create a session store to share between methods

//Configurations
var config = require('./config');

app.logger = config.logger;

app.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};



app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger({stream: config.logFile}));
  app.use(express.bodyParser( {uploadDir:'./public/images/uploads'} ));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(expressValidator);
  app.use(express.session({
    cookie: { maxAge: 60000 },
    secret: 'keyboard cat 2dspot',
    key: '2dspot.sid',
    store: app.sessionStore
  }));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  //app.use(app.router);
  mongoose.connect(dbPath, function onMongooseError(err) {
      if (err) throw err;
  });

  var db = mongoose.connection;
  //db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {
    console.log('Connected to DB');
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Import the routes -- * All controllers under ./routes/
/*
fs.readdirSync('routes').forEach(function(file) {
  if ( file[0] == '.' ) return;
  var routeName = file.substr(0, file.indexOf('.'));
  require('./routes/' + routeName)(app, models);
});
*/

// Import the models
var models = {
  Account: require('./models/Account')(app, config, mongoose, nodemailer),
  Post: require('./models/post')(app, mongoose)
  //Comment: require('./models/comment')(app, mongoose)
};

//models.Account.register("loveson821@gmail.com","123","Ng","Ka Long");


// var controllers = {
//   AccountController: require('./routes/AccountController')(app, models.Account ),
//   PostController: require('./routes/PostController')(app, models.Post)
// }


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

/*
app.get('/account', ensureAuthenticated, function(req, res){
  res.send(req.user);
  //console.log(req.user);
  //res.render('account', { user: req.user });
});
*/

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

require('./plugins/pass.js')(app,passport,LocalStrategy,models.Account);
require('./plugins/pass-facebook.js')(app, passport, FacebookStrategy, models.Account);

//app.listen(3000);

module.exports = app;
if (!module.parent) {
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
}

swagger.setAppHandler(app);
swagger.configure("http://localhost:3000","0.1");
// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.


