
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , fs = require('fs')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
var fs = require('fs');
app.post('/file-upload', function(req, res) {
    // get the temporary location of the file
    console.log(req.files);
    var tmp_path = req.files.file.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = './public/images/' + req.files.file.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            res.send('File uploaded to: ' + target_path + ' - ' + req.files.file.size + ' bytes');
        });
    });
  });

app.get('/a', function(req,res){
  fs.readFile('./index.html', function(err,page){
    res.writeHead(200,{'Content-type': 'text/html'});
    res.write(page);
    res.end();
  });
  
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
