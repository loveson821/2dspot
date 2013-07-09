var ei = require('../plugins/imageProcess.js')({});
var path = require('path');
var fs = require('fs');


dir = path.resolve('../public/images/uploads/');
var imgs = fs.readdirSync(dir);

// add some items to the queue
var srcPath = []
for( img in imgs){
    srcPath.push(path.resolve('../public/images/uploads/'+imgs[img]))
}

ei.thumbnails(srcPath, 'undefined', function(image){
    console.log(image);
});

