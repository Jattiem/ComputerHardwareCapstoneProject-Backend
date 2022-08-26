function errorHandling(err, req, res, next) {
    if(err) {
        // Put your code here.
    }
    next();
  }
  module.exports = {errorHandling};
  // On your index.js
  const {errorHandling} = require('../middleware/errorhandeling');
//   Place the below code at the bottom of index.js so that it catches all errors.
  // Taking care of all errors
  app.use(errorHandling);