// force the test environment to 'test'
//process.env.NODE_ENV = 'test';
// get the application server module
var utils = require('../utils');
var app = require('../../server.js');
var http = require('http');
var request = require('request');
var assert = require('assert');
var should = require('should');
var supertest = require('supertest');

// describe('contact page', function() {
//   before(function() {
//     this.server = http.createServer(app).listen(3000);
//   });

//   it('should show contact a form');
//   it('should refuse empty submissions');
//   it('should refuse partial submissions');
//   it('should keep values on partial submissions');
//   it('should refuse invalid emails');
//   it('should accept complete submissions');


//   after(function(done) {
//     this.server.close(done);
//   });
// });

describe('Application behavior test', function () {
  describe('Login', function () {
    before(function() {
      this.server = http.createServer(app).listen(3000);
    });
    
    it("The server is running",function(done){
      supertest(app).get('/').expect(200);
      done();
    });

    it("User can login, session will be set", function(done){
      var username = "bob";
      var pass = "123";
      //var body = '{ "username": "bob", "password": "123"}';
      var body = { "username": "bob", "password": "123"};
     
      // login should return code 200
      /*
      supertest(app).
        post('/login')
        .set('Content-Type','application/json')
        .send(body)
        .expect(201)
        .end(function(err,res){
          if(err) done(err);
        });
        */
      request({
        method: 'POST', 
        url:'http://localhost:3000/login',
        json: true,
        body: JSON.stringify(body) },
        function(err,res,body){
          if(err) {done(err);}
          else{
            res.statusCode.should.be.equal(201);
            done();
          }
        }
      );
      // after login, try to get /account, if the page doesn't redirect,
      // the code should be 200
      /*
      request.get('http://localhost:3000/account',function(err,res,body){
        console.log(body);
      });
      done();
      */
    });

  });
});