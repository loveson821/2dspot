module.exports = function(app, mongoose){
  var Schema = mongoose.Schema;
  var url = require('url');

  // var Post = mongoose.model('Post')
  // var Account = mongoose.model('Account')

  var PinSchema = new mongoose.Schema({
    user: { type: Schema.ObjectId, ref: 'Account'},
    post: { type: Schema.ObjectId, ref: 'Post'},
    createAt: { type: Date, default: Date.now }
  });

  PinSchema.index({"createAt": -1})

  var Pin = mongoose.model('Pin', PinSchema);

  app.get('/api/v1/pinb/:page?', app.ensureAuthenticated, function(req, res){
    page_size = url.parse(req.url, true).query.count || 20;
    page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
    Pin.find({user: req.user.id})
      .sort('-createAt')
      .limit(page_size)
      .skip(page * page_size)
      .select('post')
      .populate('post', 'title id')
      .exec(function(err, docs){
        if(err) res.send({'success': false, 'error': err})
        else{
          res.send({'success': true, 'docs': docs})
        }
      })
  })

  app.post('/api/v1/pinb', app.ensureAuthenticated, function(req, res){
    /*
      body: {
        postId: id
      }
    */
    var pin = new Pin();
    pin.user = req.user
    pin.post = req.body.postId
    pin.save( function( err) {
      if(err) res.send({'success': false, 'error': err})
      else{
        res.send({'success': true})
      }
    })

  })

}