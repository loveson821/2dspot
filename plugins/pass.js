module.exports = function(app, passport, LocalStrategy, Account) {

	
	function findById(id, fn) {
	  return Account.findById(id,fn);
	}

	function findByUsername(username, fn) {
	  return Account.findByString(username,fn);
	}

	passport.serializeUser(function(user, done) {
	  console.log( "serialize user id:" + user.id);
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	  console.log( "deserialize user id:" +id);
	  findById(id, function (err, user) {
	    done(err, user);
	  });
	});

	passport.use(new LocalStrategy(
	  function(username, password, done) {

	    var callback = function(err, user) {
	          
	          if (err) { 
	            return done(err); 
	          }
	          if (!user) {
	            return done(null, false, { message: 'Incorrect username.' });
	          }
	          // if (!user.validPassword(password)) {
	          //   return done(null, false, { message: 'Incorrect password.' });
	          // }

	          return done(null, user);
	      }

	      process.nextTick(function () {
	        return Account.login(username,password,callback);
	      });
	  }
	));

	app.post('/login', function(req, res, next) {
	  passport.authenticate('local', function(err, user, info) {
      console.log(req.params);
	    if (err) { return next(err) }
	    if (!user) {
	      req.flash('error', info.message);       
	      return res.redirect('/login')
	    }
	    req.logIn(user, function(err) {
	      if (err) { return next(err); }
	      return res.send(201);
	      //return res.redirect('/users/' + user.email);
	    });
	  })(req, res, next);
	});

	app.get('/logout', function(req, res){
  	req.logout();
  	res.send(200);
	});
	
}