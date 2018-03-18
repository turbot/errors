const _ = require("lodash");
const responses = require("turbot-responses");

// Use this function to wrap your log objects, ensuring that real errors
// will not break with console.log / JSON / etc.
exports.toLogObject = function(e) {
  // The stack field problem only happens for Error objects. The rest
  // can be returned unchanged.
  if (!(e instanceof Error)) {
    return e;
  }
  // The stack data often causes things like log output or to JSON to
  // fail. Simply removing and adding it back is enough to stop that
  // problem.
  // TODO - Perhaps there is a better way?
  const newError = _.omit(e, "stack");
  newError.stack = e.stack;
  return newError;
};

//
// Turbot supports standard error types - based on HTTP status codes.
// This includes non-error codes (e.g. 100 - Accepted) because we occasionally
// use them for status information.
//
// The format for calls to error are:
//
//     errors.<type>(<Error object>)
//     errors.<type>(<reason string>)
//     errors.<type>(<reason string>, <error data object>)
//     errors.<type>(<error data object>)
//
// The actual error functions are generated automatically from the
// turbot-responses. This includes two functions:
//     errors.<type>
//     errors.is<Type>
// For example:
//     errors.conflict
//     errors.isConflict
//
for (let type in responses) {
  const details = responses[type];
  (function(type, details) {
    exports[type] = function(reason = {}, data = {}) {
      if (typeof reason != "string") {
        data = reason;
        reason = null;
      }
      let err;
      if (data instanceof Error) {
        err = data;
        // Empty the data now that we have already pulled it into the error object.
        data = {};
      } else {
        err = new Error();
      }
      // Our order of preference is:
      // 1. Custom data for this error.
      // 2. Information in the Error object.
      // 3. Standard details for this error type (e.g. code).
      for (let k in details) {
        if (!err[k]) {
          err[k] = details[k];
        }
      }
      for (let k in data) {
        err[k] = data[k];
      }
      // Reason string is always used if provided.
      if (reason) {
        if (err.message) {
          err.message += ": " + reason;
        } else {
          err.message = reason;
        }
      }
      return err;
    };

    // Capitalize type per http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
    // Do not use utils as that creates a cyclic dependency on includes
    let isName = "is" + type[0].toUpperCase() + type.slice(1);
    exports[isName] = err => {
      if (!err) {
        return false;
      }
      return err.code == details.code;
    };
  })(type, details);
}
