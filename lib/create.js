"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _child_process = require("child_process");

var _commandExists = require("command-exists");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (dist) {
  var target_path = _path2.default.resolve(dist);
  if (_fsExtra2.default.existsSync(target_path)) {
    console.error("Error: directory exists.");
    process.exit();
  } else if (!(0, _commandExists.sync)("git")) {
    console.error("Error: git is not installed.");
    process.exit();
  } else {
    var app_path = "https://github.com/warashibe/next-dapp-bare.git";
    (0, _child_process.exec)("git clone " + app_path + " " + target_path + " && rm -rf " + target_path + "/.git", function (error, stdout, stderr) {
      if (error) {
        console.error("exec error: " + error);
        return;
      }
      console.log("Success: A next-dapp project has been created at " + target_path + ".");
      process.exit();
    });
  }
};

module.exports = exports.default;