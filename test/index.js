const _ = require("lodash");
const assert = require("chai").assert;
const errors = require("../index.js");

const TESTS = [
  { type: "notFound", code: 404, message: "Not Found" },
  { type: "conflict", code: 409, message: "Conflict" }
];

describe("turbot-errors", function() {
  describe("Specific type checks", function() {
    TESTS.forEach(test => {
      describe(test.type, function() {
        describe("basic", function() {
          let e = new errors[test.type]();
          it("has correct message", function() {
            assert.equal(e.message, test.message);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has only message and code fields", function() {
            assert.hasAllKeys(e, ["code", "message"]);
          });
        });
        describe("with reason", function() {
          let reason = "my great reason";
          let e = new errors[test.type](reason);
          it("has correct message", function() {
            assert.equal(e.message, test.message);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has correct reason", function() {
            assert.equal(e.reason, reason);
          });
          it("has only message, reason and code fields", function() {
            assert.hasAllKeys(e, ["code", "message", "reason"]);
          });
        });
        describe("with extra data", function() {
          let data = { one: "my", two: { extra: "data" } };
          let e = new errors[test.type](data);
          it("has correct message", function() {
            assert.equal(e.message, test.message);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has correct data mixed in", function() {
            assert.deepEqual(_.omit(e, "code", "message"), data);
          });
          it("has only message, code and <data> fields", function() {
            assert.hasAllKeys(
              e,
              _.chain(data)
                .keys()
                .union(["code", "message"])
                .value()
            );
          });
        });
        describe("with replacement message", function() {
          let msg = "My message";
          let e = new errors[test.type]({ message: msg });
          it("has correct message", function() {
            assert.equal(e.message, msg);
          });
          it("has correct code", function() {
            assert.equal(e.code, test.code);
          });
          it("has only message and code fields", function() {
            assert.hasAllKeys(e, ["code", "message"]);
          });
        });
      });
    });
  });
  describe("is{Type}", function() {
    let e404 = new errors.notFound();
    let e409 = new errors.conflict();
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
});
