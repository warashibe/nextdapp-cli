"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getJSON = exports.spawnp = exports.resolve = exports.isRoot = undefined;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _child_process = require("child_process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isRoot = exports.isRoot = function isRoot(js_path, props_path) {
  if (!_fsExtra2.default.existsSync(js_path) || !_fsExtra2.default.existsSync(props_path)) {
    console.error("Error: not in the root directory: " + __dirname);
    process.exit();
  }
  return true;
};

var resolve = exports.resolve = function resolve(to) {
  return _path2.default.resolve(process.cwd(), to);
};

var spawnp = exports.spawnp = function spawnp(cmd) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  return new _promise2.default(function (res, rej) {
    var sp = (0, _child_process.spawn)(cmd, args);
    sp.stdout.on("data", function (data) {
      console.log("" + data);
    });
    sp.stderr.on("data", function (data) {
      console.error("" + data);
    });
    sp.on("close", function (code) {
      if (code === 0) {
        res(code);
      } else {
        rej(code);
      }
    });
  });
};

var getJSON = exports.getJSON = function getJSON(name) {
  var json_path = resolve("node_modules/" + name + "/nextdapp.json");
  var json = null;
  if (!_fsExtra2.default.existsSync(json_path)) {
    console.log("json not found...");
    process.exit();
  } else {
    try {
      json = JSON.parse(_fsExtra2.default.readFileSync(json_path, "utf-8"));
    } catch (e) {
      console.log(e);
      process.exit();
    }
  }
  return json;
};