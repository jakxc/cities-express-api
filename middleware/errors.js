// Error handling Middleware function for logging the error message
const errorLogger = (error, req, res, next) => {
    console.log(`error ${error.message}`); 
    next(error); // calling next middleware
}
 
/**
 *Error handling Middleware function reads the error message 
 *and sends back a response in JSON format
 *
 * @param {obj} error The error object
 * @param {obj} req The requst object
 * @param {obj} res The respnse object
 * @param {obj} next Method to move to next middleware
 */
const errorResponder = (error, req, res, next) => {    
  const status = error.status || 500;
  return res.status(status).json({error: true, message: status === 500 
    ? "The server encountered an error and could not complete the request." 
    : error.message
  })
}
  
/**
 * Fallback Middleware function for returning 
 * 404 error for undefined paths
 *
 * @param {obj} req The requst object
 * @param {obj} res The respnse object
 * @param {obj} next Method to move to next middleware
 */
const invalidPathHandler = (req, res, next) => {
  res.status(404);
  res.send("Route not found!");
  return;
}

module.exports = {
    errorLogger: errorLogger,
    errorResponder: errorResponder,
    invalidPathHandler: invalidPathHandler
}