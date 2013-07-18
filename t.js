var raven = require('raven');

var client = new raven.Client('https://916ecea72d7844c38a1aa6d3ba08e649:dcf289839efc49dea4b58d9c8d192670@app.getsentry.com/10745');

client.patchGlobal();

// record a simple message
client.captureMessage('hello world!')

// capture an exception
client.captureError(new Error('Uh oh!!'));