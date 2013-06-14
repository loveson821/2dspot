module.exports = function(app) {
  var easyimage = require('easyimage');
  var path = require('path');
  var async = require('async');

  // This one is equal ratio resize
  var resize = function(src_path, dst, width, height, callback){
    easyimage.resize({src: src_path, dst: dst, width: width, height: height}, function(err, image){
      callback(err, image);
    });
  };

  // This one is square
  var thumbnail = function(src_path, dst, width, height, quality, callback){
    easyimage.thumbnail({src: src_path, dst: dst, width: width, height: height, quality: quality}, function(err, image){
      callback(err, image);
    });
  };

  var DefaultCallback = function(err, image) {
    if (err) throw err;
    console.log('Resized');
    console.log(image);
  }

  var filenameChange = function(src_path, dst, prefix){
    if( dst == 'undefined' ){ dst = path.dirname(src_path); };
    filename = path.basename(src_path).replace(/\.(jpg|gif|png)$/, prefix+'$&');
    return path.join( dst, filename );
  };

  var to_s = function(src_path, dst, callback){
    dst = filenameChange(src_path, dst, '_s');
    if( callback == 'undefined'){ callback = DefaultCallback; };
    thumbnail(src_path, dst, 82, 82, 60, function(err,image){
      callback(err,image);
    });
  };

  var to_n = function(src_path, dst, callback){
    dst = filenameChange(src_path, dst, '_n');
    if( callback == 'undefined'){ callback = DefaultCallback; };
    thumbnail(src_path, dst, 164, 164, 80, function(err,image){
      callback(err,image);
    });
  };

  var createThumbnail = function(src_path, dst, callback){
    src_path = path.resolve(src_path);
    to_s(src_path, dst, function(err, image){
      to_n(src_path, dst, function(err, image){
        callback(err, image);
      });
    });
  };

  //queue scope
  var q = async.queue(function (task, callback) {
    console.log('hello ' + task.srcPath);
    createThumbnail(task.srcPath, task.dst, function(err, image){
        callback(err,image);
    });
    
  }, 20);

  // assign a callback, maybe not necessary in a server
  q.drain = function() {
      console.log('all items have been processed');
  };

  var queueThumbnails = function(src_path, dst, callback){
    q.push({srcPath: src_path, dst: dst}, function(err, image){
      if(err){ console.log( err );};
      callback(err, image);
    });
  };

  return {
    to_s: to_s,
    to_n: to_n,
    thumbnails: queueThumbnails
  };

}