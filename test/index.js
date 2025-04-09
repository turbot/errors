const _ = require("lodash");
const assert = require("chai").assert;
const errors = require("..");

const TESTS = [
  { type: "notFound", code: 404, message: "Not Found" },
  { type: "conflict", code: 409, message: "Conflict" }
];

describe("turbot-errors", function() {
  describe("Specific type checks", function() {
    TESTS.forEach(test => {
      describe(test.type, function() {
        describe("basic", function() {
          var e;
          before(function() {
            e = errors[test.type]();
          });
          it("has correct message", function() {
            assert.equal(e.message, test.message);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has only message and code fields (and sometimes turbotError)", function() {
            assert.hasAllKeys(e, ["code", "message", "turbotError"]);
          });
        });
        describe("with reason", function() {
          var reason, e;
          before(function() {
            reason = "my great reason";
            e = errors[test.type](reason);
          });
          it("includes correct message", function() {
            assert.include(e.message, test.message);
          });
          it("includes reason in message", function() {
            assert.include(e.message, reason);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has only message and code fields (and sometimes turbotError)", function() {
            assert.hasAllKeys(e, ["code", "message", "turbotError"]);
          });
        });
        describe("with extra data", function() {
          var data, e;
          before(function() {
            data = { one: "my", two: { extra: "data" } };
            e = errors[test.type](data);
          });
          it("has correct message", function() {
            assert.equal(e.message, test.message);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has correct data mixed in", function() {
            assert.deepEqual(_.omit(e, "code", "message", "turbotError"), data);
          });
          it("has only message, code and <data> fields", function() {
            assert.hasAllKeys(e, _.chain(data).keys().union(["code", "message", "turbotError"]).value());
          });
        });
        describe("with replacement message", function() {
          var msg, e;
          before(function() {
            msg = "My message";
            e = errors[test.type]({ message: msg });
          });
          it("has correct message", function() {
            assert.equal(e.message, msg);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has only message and code fields (and sometimes turbotError)", function() {
            assert.hasAllKeys(e, ["code", "message", "turbotError"]);
          });
        });
      });
    });
  });

  describe("Wrap error", function() {
    describe("Raw", function() {
      var obj, e;
      before(function() {
        try {
          obj = JSON.parse('{ "i": { "am": [ "invalid", "json" ], "missing": { "a": "brace" } }');
        } catch (thrownError) {
          //  console.log(thrownError);
          // current error: Expected ',' or '}' after property value in JSON at position 67
          e = errors.internal(thrownError);
        }
      });
      it("isInternal is true", function() {
        assert(errors.isInternal(e));
      });
      it("has original error message", function () {
        console.log(e.message);
        assert.include(e.message, "Expected ',' or '}'");
      });
      it("has a stack trace", function() {
        assert.isString(e.stack);
      });
      it("has original stack trace", function() {
        assert.include(e.stack, "JSON.parse");
      });
    });
    describe("With reason", function() {
      let obj, e;
      let reason = "I know there is a reason!";
      before(function() {
        try {
          obj = JSON.parse('{ "i": { "am": [ "invalid", "json" ], "missing": { "a": "brace" } }');
        } catch (thrownError) {
          // current error: Expected ',' or '}' after property value in JSON at position 67
          e = errors.internal(reason, thrownError);
        }
      });
      it("includes original message", function() {
        assert.include(e.message, "Expected ',' or '}'");
      });
      it("includes reason in message", function() {
        assert.include(e.message, reason);
      });
    });
  });

  describe("is{Type}", function() {
    var e404, e409;
    before(function() {
      e404 = errors.notFound();
      e409 = errors.conflict();
    });
    describe("Not Found", function() {
      it("isNotFound is true", function() {
        assert(errors.isNotFound(e404));
      });
      it("isConflict is false", function() {
        assert(!errors.isConflict(e404));
      });
    });
    describe("Conflict", function() {
      it("isNotFound is false", function() {
        assert(!errors.isNotFound(e409));
      });
      it("isConflict is true", function() {
        assert(errors.isConflict(e409));
      });
    });
  });

  describe("nested error", function() {
    it("not nested error", function() {
      const err = errors.conflict("There is a conflict", { err: "nested string" });

      assert.equal(err.message, "Conflict: There is a conflict");
    });

    it("nested error #1 print warning message", function() {
      const err = errors.conflict("There is a conflict", { err: "nested string" });
      const nested = errors.internal("There is an internal error", { error: err });

      assert.equal(
        nested.message,
        "(warning: please do not nest Turbot Error) Internal Error: There is an internal error"
      );
    });

    it("nested error #2 print warning message", function() {
      const err = errors.conflict("There is a conflict", { err: "nested string" });
      const nested = errors.internal("There is an internal error", { err: err });

      assert.equal(
        nested.message,
        "(warning: please do not nest Turbot Error) Internal Error: There is an internal error"
      );
    });

    it("nested error (not wrapped into an object) print warning message", function() {
      const err = errors.conflict("There is a conflict", { err: "nested string" });
      const nested = errors.internal("There is an internal error", err);

      assert.equal(
        nested.message,
        "(warning: please do not nest Turbot Error) Conflict: There is a conflict: There is an internal error"
      );
    });
  });
});
