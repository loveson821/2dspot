var mt = require('mersenne');


a = []
for(var i = 0; i< 1000; i++)
  console.log(mt.rand(1000));

console.log(a);