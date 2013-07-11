var time = require('time')

end = new time.Date(2013,6,11, 'UTC');
console.log(end.toString())
end.setDate(end.getDate()+1);
console.log(end.toString())