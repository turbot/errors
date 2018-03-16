const _ = require("lodash");
const responses = require("turbot-responses");

const errors = {};

// Add a convenience function to create errors
errors.new = function(opts = {}) {
  const err = new Error();
  for (let k in opts) {
    const v = opts[k];
    err[k] = v;
  }
  if (err.code == null) {
    err.code = 500;
  }
  if (err.message == null) {
    err.message = "Internal Error";
  }
  return err;
};

errors.toLogObject = function(e) {
  if (!e) {
    return e;
  }
  const newError = _.omit(e, "stack");
  newError.stack = e.stack;
  return newError;
};

// Load the standard errors
for (let type in responses) {
  const details = responses[type];
  (function(type, details) {
    // Add a function of form:
    // notFound msgString
    // notFound dataObject
    errors[type] = function(reason, data) {
      let v;
      if (reason == null) {
        reason = {};
      }
      if (data == null) {
        data = {};
      }
      const e = errors.new(details);
      // Set data first, so it can be overwritten by reason data
      for (var k in data) {
        v = data[k];
        e[k] = v;
      }
      // Set reason data from string or object
      if (typeof reason === "string") {
        e["reason"] = reason;
      } else if (typeof reason === "object") {
        for (k in reason) {
          v = reason[k];
          e[k] = v;
        }
      }
      return e;
    };

    // Add a function of form:
    // isNotFound err

    // Capitalize type per http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
    // Do not use utils as that creates a cyclic dependency on includes
    return (errors[`is${type[0].toUpperCase()}${type.slice(1)}`] = err =>
      (err != null ? err.code : undefined) === details.code);
  })(type, details);
}

module.exports = errors;
