// force the test environment to 'test'
//process.env.NODE_ENV = 'test';
// get the application server module
var http = require('http');
var assert = require('assert');
var should = require('should');
var app = require('../../server.js');
var mongo = require('mongodb')
  , mongoose = require('mongoose')
  , dbPath = 'mongodb://localhost/2dspot'

var Post = require('../../models/post')(mongoose);
describe('Post model functions', function() {
  before(function() {
    //console.log(Post);
  });

  it('should create a new post',function(done){
    Post.findByString('test post', function(err,doc){
      if(err) Post.create('test post','test body','test author')
    });
    done();
  });

  it('should refuse empty submissions');
  it('should refuse partial submissions');
  it('should keep values on partial submissions');
  it('should refuse invalid emails');
  it('should accept complete submissions');

  it('should remove the test post',function(){
    Post.findByString('test post',function(err,doc){
      doc.remove();
    });
  });
  after(function(done) {
    
    done();
  });
});

