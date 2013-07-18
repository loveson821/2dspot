var express = require('express')
  , expressValidator = require('express-validator')
  , http = require('http')
  , mongo = require('mongodb')
  , mongoose = require('mongoose')
  , mongoStore = require('connect-mongo')(express)
  , path = require('path')
  , flash = require('connect-flash')    // flash message when redirect page
  , nodemailer = require('nodemailer')  // send mail
  , MemoryStore = express.session.MemoryStore
  , dbPath = 'mongodb://localhost/2dspot'
  , events = require('events')
  , fs = require('fs')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , expressWinston = require('express-winston')
  , winston = require('winston')
  ;
  

var app         = express();
app.server      = http.createServer(app);   // Create an http server
app.sessionStore = new MemoryStore();       // Create a session store to share between methods

var logentries = require('node-logentries');
var log = logentries.logger({
  token:'7cbb5061-0769-4718-bcb1-2af147f6fdcc'
});

var logStream = {
    write: function(message,encoding) {
      log.info(message.replace('\n', ''));
    }
};

//Configurations
var config = {
  domain: process.env.DOMAIN || 'http://ku4n.com',
  
  redis : {
    host: 'pub-redis-13685.us-east-1-2.2.ec2.garantiadata.com',
    pass: '2dspot',
    port: 13685
  },
  
  logFile: fs.createWriteStream('./myLogFile.log', {flags: 'a'}) //use {flags: 'w'} to open in write mode
  /*
  logger: new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'somefile.log' })
    ]
  })*/
};

app.config = config;



app.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.status(403).send({'error':'unauthorized forbidden'})
};



app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger({
    format: ':remote-addr ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms', //The format you prefer. This is optional. Not setting this will output the standard log format  
    stream: logStream //The variable we defined above. The stream method calls the write method.
  }));
  // app.use(expressWinston.logger({
  //   transports: [
  //     new winston.transports.Logio(),
  //     new (winston.transports.File)({ filename: 'somefile.log' })
  //   ]
  // }));
  app.use(express.bodyParser( {keepExtensions: true, uploadDir:'./public/images/uploads'} ));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  //app.use(ga('MO-42439720-1',{
  //  safe: true
  //}));
  app.use(expressValidator);
  app.use(express.session({
    cookie: { maxAge: 2592000000 },
    secret: 'keyboard cat 2dspot',
    key: '2dspot.sid',
    store: new mongoStore({ db: '2dspot' })
    //store: app.sessionStore
  }));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  //app.use(app.router);
  mongoose.connect(dbPath, function onMongooseError(err) {
      if (err) throw err;
  });
  
  mongoose.set('debug', true);
  
  var db = mongoose.connection;
  //db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {
    console.log('Connected to DB');
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


// Model needs plugins
app.redis = require('./plugins/redis')(app, config, mongoose);


app.models = {}
app.models.Account = require('./models/Account')(app, config, mongoose, nodemailer);
app.models.Channel = require('./models/channel')(app, mongoose);
app.models.Post = require('./models/post')(app, mongoose)
app.models.Pin = require('./models/pin')(app, mongoose)

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

require('./plugins/pass.js')(app,passport,LocalStrategy, app.models.Account);
require('./plugins/pass-facebook.js')(app, passport, FacebookStrategy, app.models.Account);

app.use(app.router)
// app.use(function(err, req, res, next){
//   raven.middleware.express('https://916ecea72d7844c38a1aa6d3ba08e649:dcf289839efc49dea4b58d9c8d192670@app.getsentry.com/10745')
//   console.log("It's working")
//   next()
// })

var raven = require('raven');
var client = new raven.Client('https://916ecea72d7844c38a1aa6d3ba08e649:dcf289839efc49dea4b58d9c8d192670@app.getsentry.com/10745');
client.patchGlobal();

app.use(function(err, req, res, next){
  // treat as 404
  if (err.message
    && (~err.message.indexOf('not found')
    || (~err.message.indexOf('Cast to ObjectId failed')))) {
    return next()
  }

  // log it
  // send emails if you want
  console.error(err.stack)
  client.captureError(err)

  // error page
  res.status(500).render('500', { error: err.stack })
})

// assume 404 since no middleware responded
app.use(function(req, res, next){
  res.status(404).send({'status':404})
})

module.exports = app;
if (!module.parent) {
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
}

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.


