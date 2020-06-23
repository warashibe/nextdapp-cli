"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _ramda = require("ramda");

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _child_process = require("child_process");

var _commandExists = require("command-exists");

var _util = require("./util");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var xNil = (0, _ramda.complement)(_ramda.isNil);

var uninstallPlugin = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(_ref) {
    var pre;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            pre = _ref.pre;
            _context.prev = 1;
            _context.next = 4;
            return (0, _util.spawnp)("bit", ["remove", pre, "-s"]);

          case 4:
            console.log("".concat(pre, " uninstalled!"));
            _context.next = 11;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](1);
            console.error("uninstall error: ".concat(_context.t0));
            process.exit();

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[1, 7]]);
  }));

  return function uninstallPlugin(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var updateApis = function updateApis(_ref3) {
  var json = _ref3.json,
      name = _ref3.name,
      pre = _ref3.pre;

  if (xNil(json.api)) {
    var api_path = (0, _util.resolve)("pages/api");

    if (!_fsExtra["default"].existsSync(api_path)) {
      _fsExtra["default"].mkdirSync(api_path);
    }

    for (var k in json.api || {}) {
      var func_path = (0, _util.resolve)("pages/api/".concat(json.api[k], "_").concat(pre, ".js"));

      try {
        _fsExtra["default"].unlinkSync(func_path);
      } catch (e) {
        console.log(e);
      }
    }
  }
};

var updateStatic = function updateStatic(_ref4) {
  var name = _ref4.name,
      pre = _ref4.pre;
  var static_tar = (0, _util.resolve)("public/static/".concat(pre));

  try {
    _fsExtra["default"].removeSync(static_tar);
  } catch (e) {
    console.log(e);
  }

  console.log("static assets removed");
};

var updateFirestore = function updateFirestore(_ref5) {
  var name = _ref5.name,
      pre = _ref5.pre;
  var firestore_tar_path = (0, _util.resolve)("firebase/firestore.rules");

  if (_fsExtra["default"].existsSync(firestore_tar_path)) {
    var new_rules2 = ["rules_version = '2';", "service cloud.firestore {", "  match /databases/{database}/documents {"];
    var new_tar_rules = [];
    var tar = false;
    var rm = 0;
    var tar_rules = (0, _ramda.filter)(function (v) {
      if (new RegExp("service cloud.firestore").test(v) === true || RegExp("match /databases/\\{database\\}/documents").test(v) === true) {
        rm += 1;
      }

      var isend = false;

      if (new RegExp("// ".concat(pre, "-start")).test(v) === true) {
        tar = true;
      } else if (new RegExp("// ".concat(pre, "-end")).test(v) === true) {
        isend = true;
        tar = false;
      }

      return tar === false && isend === false && /^\s*$/.test(v) === false && new RegExp("// ".concat(pre)).test(v) === false && new RegExp("rules_version").test(v) === false && new RegExp("service cloud.firestore").test(v) === false && new RegExp("match /databases/\\{database\\}/documents").test(v) === false;
    })(_fsExtra["default"].readFileSync(firestore_tar_path, "utf-8").split("\n"));
    tar_rules.reverse();

    var _iterator = _createForOfIteratorHelper(tar_rules),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var v = _step.value;

        if (rm !== 0 && v.replace(/\s/g, "") === "}") {
          rm -= 1;
        } else {
          new_tar_rules.push(v);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    new_tar_rules.reverse();

    if (new_tar_rules.length !== 0) {
      new_rules2.push(new_tar_rules.join("\n"));
    }

    new_rules2.push("  }");
    new_rules2.push("}");
    console.log(new_rules2.join("\n"));

    _fsExtra["default"].writeFileSync(firestore_tar_path, new_rules2.join("\n"));
  }
};

var updateFunctions = function updateFunctions(_ref6) {
  var json = _ref6.json,
      pre = _ref6.pre,
      name = _ref6.name;

  if (xNil(json.functions)) {
    var npms = [];

    for (var k in json.functions || {}) {
      npms.push(k);
    }

    var func_path = (0, _util.resolve)("firebase/functions/index.js");

    if (_fsExtra["default"].existsSync(func_path)) {
      var tar = false;
      var ex_funcs = (0, _ramda.filter)(function (v) {
        var isend = false;

        if (new RegExp("// ".concat(pre, "-start")).test(v) === true) {
          tar = true;
        } else if (new RegExp("// ".concat(pre, "-end")).test(v) === true) {
          tar = false;
          isend = true;
        }

        return tar === false && isend === false && /^\s*$/.test(v) === false;
      })(_fsExtra["default"].readFileSync(func_path, "utf-8").split("\n"));

      _fsExtra["default"].writeFileSync(func_path, ex_funcs.join("\n"));
    }

    var fb_path = (0, _util.resolve)("firebase/functions");
    console.log("go to ".concat(fb_path, " and uninstall ").concat(npms.join(" "), " with yarn."));
    console.log("> cd ".concat(fb_path, " && nvm use 10 && yarn remove ").concat(npms.join(" ")));
  }
};

var _default = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(name, namespace) {
    var json_path, plugins, pre, components_path, package_path, js_path, props_path, pjson, json;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            json_path = (0, _util.resolve)("nd/.plugins.json");
            plugins = (0, _util.getPlugins)({
              json_path: json_path
            });
            console.log(plugins);
            pre = (0, _util.getPre)(name);
            name = (0, _util.modName)(name);
            delete plugins[pre];
            components_path = (0, _util.resolve)("nd/".concat(pre));
            package_path = (0, _util.resolve)("package.json");
            js_path = (0, _util.resolve)("nd/.nextdapp.js");
            props_path = (0, _util.resolve)("nd/.nextdapp-props.js");
            pjson = (0, _util.isRoot)(json_path);
            json = (0, _util.getJSON)({
              pre: pre
            });
            (0, _util.updateFuncs)({
              plugins: plugins,
              js_path: js_path,
              pre: pre
            });
            (0, _util.updateProps)({
              plugins: plugins,
              props_path: props_path
            }); //updateApis({ json, name, pre })
            //updateStatic({ name, pre })
            //updateFirestore({ name, pre })
            //updateFunctions({ name, pre, json })

            _context2.next = 16;
            return uninstallPlugin({
              pre: pre
            });

          case 16:
            (0, _util.updatePlugins)({
              json: plugins,
              json_path: json_path
            });
            process.exit();

          case 18:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x2, _x3) {
    return _ref7.apply(this, arguments);
  };
}();

exports["default"] = _default;