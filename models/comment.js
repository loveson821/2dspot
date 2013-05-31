module.exports = function(app, mongoose) {
  var Schema = mongoose.Schema;

  var CommentSchema = new mongoose.Schema({
    author: String,
    body:   String,
    post:   Schema.ObjectId
  });

  var Comment = mongoose.model('Comment', CommentSchema);

  var createCommentCallback = function(err) {
      if (err) {
        return console.log(err);
    }
        return console.log("Post created");
  };

  var create = function(obj) {
    var comment = new Comment(obj);
    comment.save(createCommentCallback);
  };

   
};