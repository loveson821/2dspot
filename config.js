module.exports = {
  redisDNS: 'pub-redis-13685.us-east-1-2.2.ec2.garantiadata.com',
  redisPass: '2dspot',
  redisPort: 13685,

  logFile: fs.createWriteStream('./myLogFile.log', {flags: 'a'}), //use {flags: 'w'} to open in write mode
  logger: new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'somefile.log' })
    ]
  })
}