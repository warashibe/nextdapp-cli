"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _child_process = require("child_process");

var _commandExists = require("command-exists");

var _default = function _default(dist) {
  var target_path = _path["default"].resolve(dist);

  if (_fsExtra["default"].existsSync(target_path)) {
    console.error("Error: directory exists.");
    process.exit();
  } else if (!(0, _commandExists.sync)("git")) {
    console.error("Error: git is not installed.");
    process.exit();
  } else {
    var app_path = "https://github.com/warashibe/next-dapp-bare.git";
    (0, _child_process.exec)("git clone ".concat(app_path, " ").concat(target_path, " && rm -rf ").concat(target_path, "/.git"), function (error, stdout, stderr) {
      if (error) {
        console.error("exec error: ".concat(error));
        return;
      }

      console.log("Success: A next-dapp project has been created at ".concat(target_path, "."));
      process.exit();
    });
  }
};

exports["default"] = _default;