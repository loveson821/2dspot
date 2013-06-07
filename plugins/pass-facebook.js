module.exports = function(app, passport, FacebookStrategy, Account) {
	var FACEBOOK_APP_ID = "424193037611931"
	var FACEBOOK_APP_SECRET = "65e992c93bc6db62fb90fd9df2762005";

	passport.use(new FacebookStrategy({
	    clientID: FACEBOOK_APP_ID,
    	clientSecret: FACEBOOK_APP_SECRET,
	    callbackURL: "http://localhost:3000/auth/facebook/callback",
	    profileFields: ['photos', 'username', 'emails']
	  	},
		function(accessToken, refreshToken, profile, done) {
		// asynchronous verification, for effect...
			process.nextTick(function () {
			  
			  // To keep the example simple, the user's Facebook profile is returned to
			  // represent the logged-in user.  In a typical application, you would want
			  // to associate the Facebook account with a user record in your database,
			  // and return that user instead.
			     // { id: '1442160592',
				    //  name: 'Wuying Ng',
				    //  first_name: 'Wuying',
				    //  last_name: 'Ng',
				    //  link: 'http://www.facebook.com/woying',
				    //  username: 'woying',
				    //  birthday: '10/06/1990',
				    //  location: { id: '110352975652476', name: 'Macao, China' },
				    //  bio: '隨緣一湯加三餸,即使冰凍,始終都夠用',
				    //  quotes: '傻HI泥噶',
				    //  work: [ [Object] ],
				    //  favorite_teams: [ [Object] ],
				    //  education: [ [Object], [Object], [Object], [Object] ],
				    //  gender: 'male',
				    //  email: 'loveson821@yahoo.com.hk',
				    //  timezone: 8,
				    //  locale: 'en_GB',
				    //  verified: true,
				    //  updated_time: '2013-05-12T17:16:27+0000' } }
				  userObj = profile._json
				  delete userObj.picture
				  userObj.photo = profile.photos[0].value
				  //userObj.name = profile._json
				  Account.findOrRegister(userObj, function(err, user){
				  	if(err){ return done(err);}
				  	return done(null, user);
				  });
			  	// return done(null, profile);
			});
		}
	));

	app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

	// GET /auth/facebook/callback
	//   Use passport.authenticate() as route middleware to authenticate the
	//   request.  If authentication fails, the user will be redirected back to the
	//   login page.  Otherwise, the primary route function function will be called,
	//   which, in this example, will redirect the user to the home page.
	app.get('/auth/facebook/callback', 
	  passport.authenticate('facebook', { failureRedirect: '/login' }),
	  function(req, res) {
	    res.redirect('/account');
	  });
}