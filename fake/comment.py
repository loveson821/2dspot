from pymongo import MongoClient
from random import choice, randrange
from datetime import datetime

client = MongoClient('localhost', 27017)
db = client['2dspot']

posts = db.posts
users = db.accounts

accounts = [u for u in users.find()]

sents = [i for i in open("/Users/sin/Dropbox/clean-corpus.en",'r')]

for p in posts.find():
#p = posts.find_one()
  p['comments'] = []
  for i in xrange(0,randrange(20)):
    comment = {}
    # pick an account	
    account = choice(accounts)
    comment['author'] = account['email']
    comment['user'] = account['_id']
    comment['date'] = datetime.now()
    comment['body'] = ''
    for x in xrange(0,randrange(5)):
      comment['body'] = comment['body'] + choice(sents)

    p['comments'].append(comment)

  posts.save(p)
  

# print randrange(20)
# print choice(sents)
# print choice(accounts)