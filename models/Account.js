module.exports = function(app, config, mongoose, nodemailer) {
  var crypto = require('crypto');

  var Status = new mongoose.Schema({
    name: {
      first:   { type: String },
      last:    { type: String }
    },
    status:    { type: String }
  });

  var schemaOptions = {
    toJSON: {
      virtuals: true	
    },
    toObject: {
      virtuals: true
    }
  };

  var AccountSchema = new mongoose.Schema({
    email:     { type: String, unique: true },
    password:  { type: String },
    photoUrl:  { type: String },
    name: { type: String }
    // name: {
    //   first:   { type: String },
    //   last:    { type: String },
    //   full:    { type: String }
    // },
    // birthday: {
    //   day:     { type: Number, min: 1, max: 31, required: false },
    //   month:   { type: Number, min: 1, max: 12, required: false },
    //   year:    { type: Number }
    // },
    //biography: { type: String },
    //contacts:  [Contact],
    //status:    [Status], // My own status updates only
    //activity:  [Status]  //  All status updates including friends
  });

  var Account = mongoose.model('Account', AccountSchema);

  var registerCallback = function(err) {
    if (err) {
      return console.log(err);
    };
    return console.log('Account was created');
  };

  var changePassword = function(accountId, newpassword) {
    var shaSum = crypto.createHash('sha256');
    shaSum.update(newpassword);
    var hashedPassword = shaSum.digest('hex');
    Account.update({_id:accountId}, {$set: {password:hashedPassword}},{upsert:false},
      function changePasswordCallback(err) {
        console.log('Change password done for account ' + accountId);
    });
  };

  var forgotPassword = function(email, resetPasswordUrl, callback) {
    var user = Account.findOne({email: email}, function findAccount(err, doc){
      if (err) {
        // Email address is not a valid user
        callback(false);
      } else {
        var smtpTransport = nodemailer.createTransport('SMTP', config.mail);
        resetPasswordUrl += '?account=' + doc._id;
        smtpTransport.sendMail({
          from: 'thisapp@example.com',
          to: doc.email,
          subject: 'SocialNet Password Request',
          text: 'Click here to reset your password: ' + resetPasswordUrl
        }, function forgotPasswordResult(err) {
          if (err) {
            callback(false);
          } else {
            callback(true);
          }
        });
      }
    });
  };

  var login = function(email, password, callback) {
    console.log(" In account login");
    var shaSum = crypto.createHash('sha256');
    shaSum.update(password);
    Account.findOne({email:email,password:shaSum.digest('hex')},function(err,account){
      return callback(err,account);
    });

  };

  var findByString = function(searchStr, callback) {
    var searchRegex = new RegExp(searchStr, 'i');
    Account.find({
      $or: [
        { 'name.full': { $regex: searchRegex } },
        { email:       { $regex: searchRegex } }
      ]
    }, function(err,doc){ callback(err,doc);});
  };

  var findById = function(accountId, callback) {
    Account.findOne({_id:accountId}, function(err,doc) {
      console.log("doc: " + doc);
      callback(err,doc);
    });
  };

  var addContact = function(account, addcontact) {
    contact = {
      name: addcontact.name,
      accountId: addcontact._id,
      added: new Date(),
      updated: new Date()
    };
    account.contacts.push(contact);

    account.save(function (err) {
      if (err) {
        console.log('Error saving account: ' + err);
      }
    });
  };

  var removeContact = function(account, contactId) {
    if ( null == account.contacts ) return;

    account.contacts.forEach(function(contact) {
      if ( contact.accountId == contactId ) {
        account.contacts.remove(contact);
      }
    });
    account.save();
  };

  var hasContact = function(account, contactId) {
    if ( null == account.contacts ) return false;

    account.contacts.forEach(function(contact) {
      if ( contact.accountId == contactId ) {
        return true;
      }
    });
    return false;
  };

  var register = function(email, password, firstName, lastName) {
    var shaSum = crypto.createHash('sha256');
    shaSum.update(password);

    console.log('Registering ' + email);
    var user = new Account({
      email: email,
      name: {
        first: firstName,
        last: lastName,
        full: firstName + ' ' + lastName
      },
      password: shaSum.digest('hex')
    });
    user.save(registerCallback);
    console.log('Save command was sent');
  };

  app.get('/account', app.ensureAuthenticated, function(req, res){
    res.send(req.user);
  });

  return {
    findById: findById,
    register: register,
    hasContact: hasContact,
    forgotPassword: forgotPassword,
    changePassword: changePassword,
    findByString: findByString,
    addContact: addContact,
    removeContact: removeContact,
    login: login,
    Account: Account
  }
}
