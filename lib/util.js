"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updatePlugins = exports.getPlugins = exports.getJSON = exports.spawnp = exports.updateProps = exports.updateFuncs = exports.resolve = exports.getPre = exports.isRoot = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var _child_process = require("child_process");

var _ramdam = _interopRequireDefault(require("ramdam"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var isRoot = function isRoot(json_path) {
  if (!_fsExtra["default"].existsSync(json_path)) {
    console.error("Error: not in the root directory: ".concat(__dirname));
    process.exit();
  }

  return JSON.parse(_fsExtra["default"].readFileSync(json_path, "utf8"));
};

exports.isRoot = isRoot;

var getPre = function getPre(name) {
  return /^@/.test(name) ? name.split("/").slice(1).join("/") : name;
};

exports.getPre = getPre;

var resolve = function resolve(to) {
  return _path["default"].resolve(process.cwd(), to);
};

exports.resolve = resolve;

var updateFuncs = function updateFuncs(_ref) {
  var plugins = _ref.plugins,
      js_path = _ref.js_path,
      _ref$noinstall = _ref.noinstall,
      noinstall = _ref$noinstall === void 0 ? false : _ref$noinstall;
  var js = [];

  for (var pre in plugins) {
    var exp = [];
    console.log("checking plugin funcs...");
    console.log();
    var json = plugins[pre];
    var src = json.noinstall === true ? "../" + json.path : json.name;

    var _iterator = _createForOfIteratorHelper(json.funcs || []),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var v = _step.value;
        exp.push(" ".concat(v, " as ").concat(v, "$").concat(pre));
        console.log("".concat(v, "$").concat(pre));
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    js.push("export {".concat(exp.join(","), " } from \"").concat(src, "\""));
  }

  console.log();

  _fsExtra["default"].writeFileSync(js_path, js.join("\n"));

  console.log("funcs has been updated!");
};

exports.updateFuncs = updateFuncs;

var updateProps = function updateProps(_ref2) {
  var plugins = _ref2.plugins,
      props_path = _ref2.props_path,
      _ref2$noinstall = _ref2.noinstall,
      noinstall = _ref2$noinstall === void 0 ? false : _ref2$noinstall;
  var props = ["let props = {}", "const mergeProps = (name, obj) => {", "  for (const k in obj) {", "    props[`${k}$${name}`] = obj[k]", "  }", "}"];
  console.log("checking plugin props...");

  for (var pre in plugins) {
    var json = plugins[pre];
    var src = json.noinstall === true ? "../" + json.path : json.name;
    props.push("import * as \"".concat(pre, " from \"").concat(src, "/lib/init)"));
    props.push("mergeProps(\"".concat(pre, "\", ").concat(src, ")"));
  }

  props.push("export default props");

  _fsExtra["default"].writeFileSync(props_path, props.join("\n"));

  console.log("props has been updated!");
};

exports.updateProps = updateProps;

var spawnp = function spawnp(cmd) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return new Promise(function (res, rej) {
    var sp = (0, _child_process.spawn)(cmd, args);
    sp.stdout.on("data", function (data) {
      console.log("".concat(data));
    });
    sp.stderr.on("data", function (data) {
      console.error("".concat(data));
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

exports.spawnp = spawnp;

var getJSON = function getJSON(_ref3) {
  var name = _ref3.name,
      tar_path = _ref3.tar_path;
  var json_path = _ramdam["default"].xNil(tar_path) ? resolve("".concat(tar_path, "/nextdapp.json")) : resolve("node_modules/".concat(name, "/nextdapp.json"));
  var json = null;

  if (!_fsExtra["default"].existsSync(json_path)) {
    console.log("json not found...:" + json_path);
    process.exit();
  } else {
    try {
      json = JSON.parse(_fsExtra["default"].readFileSync(json_path, "utf-8"));
    } catch (e) {
      console.log(e);
      process.exit();
    }
  }

  return json;
};

exports.getJSON = getJSON;

var getPlugins = function getPlugins(_ref4) {
  var json_path = _ref4.json_path;
  var json = null;

  if (!_fsExtra["default"].existsSync(json_path)) {
    console.log("json not found..." + json_path);
    process.exit();
  } else {
    try {
      json = JSON.parse(_fsExtra["default"].readFileSync(json_path, "utf-8"));
    } catch (e) {
      console.log(e);
      process.exit();
    }
  }

  return json;
};

exports.getPlugins = getPlugins;

var updatePlugins = function updatePlugins(_ref5) {
  var json_path = _ref5.json_path,
      json = _ref5.json;

  try {
    _fsExtra["default"].writeFileSync(json_path, JSON.stringify(json));
  } catch (e) {
    console.log(e);
    process.exit();
  }

  return json;
};

exports.updatePlugins = updatePlugins;