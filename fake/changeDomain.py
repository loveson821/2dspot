from pymongo import MongoClient


client = MongoClient('localhost', 27017)
db = client['2dspot']

posts = db.posts


for p in posts.find():
#p = posts.find_one()
  tmpic = []
  for i in p['pics']:
    tmpic.append(i.replace('ku4n.com/images','cdn.inx.io'))
  p['pics'] = tmpic

  posts.save(p)


