var ei = require('../plugins/imageProcess.js')({});
var path = require('path');
var fs = require('fs');


dir = path.resolve('../public/images/uploads/');
var imgs = fs.readdirSync(dir);
// var params = [];


//console.log(params);


// async.mapSeries(params, ei.thumbnails, function(){
//     console.log('finish');
// });





// add some items to the queue
for( img in imgs){
    srcPath = path.resolve('../public/images/uploads/'+imgs[img]);
    // q.push({srcPath: srcPath}, function(err){
    // 	console.log('finished processing foo');
    // });
    ei.thumbnails(srcPath, 'undefined', function(image){
        console.log(image);
    });
}


// q.push({name: 'foo'}, function (err) {
//     console.log('finished processing foo');
// });
// q.push({name: 'bar'}, function (err) {
//     console.log('finished processing bar');
// });

// add some items to the queue (batch-wise)

// q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function (err) {
//     console.log('finished processing bar');
// });

// add some items to the front of the queue

// q.unshift({name: 'bar'}, function (err) {
//     console.log('finished processing bar');
// });
