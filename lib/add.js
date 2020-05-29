"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _ramdam = require("ramdam");

var _ramdam2 = _interopRequireDefault(_ramdam);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _child_process = require("child_process");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var installPlugin = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(name) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _util.spawnp)("yarn", ["add", name]);

          case 3:
            console.log(name + " installed!");
            _context.next = 10;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context["catch"](0);

            console.error("install error: " + _context.t0);
            process.exit();

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined, [[0, 6]]);
  }));

  return function installPlugin(_x) {
    return _ref.apply(this, arguments);
  };
}();

var updateEpics = function updateEpics(_ref2) {
  var name = _ref2.name,
      js_path = _ref2.js_path,
      json = _ref2.json,
      pre = _ref2.pre;

  var js = _ramdam2.default.filter(function (v) {
    return (/^\s*$/.test(v) === false && new RegExp("from +\"" + name + "\"").test(v) === false
    );
  })(_fsExtra2.default.readFileSync(js_path, "utf-8").split("\n"));

  var exp = [];
  console.log("checking plugin epics...");
  console.log();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(json.epics || []), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var v = _step.value;

      exp.push(" " + v + " as " + v + "$" + pre);
      console.log(v + "$" + pre);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  console.log();
  js.push("export {" + exp.join(",") + " } from \"" + name + "\"");
  _fsExtra2.default.writeFileSync(js_path, js.join("\n"));
  console.log("epics has been updated!");
};

var updateProps = function updateProps(_ref3) {
  var pre = _ref3.pre,
      props_path = _ref3.props_path,
      name = _ref3.name;

  var props = _ramdam2.default.filter(function (v) {
    return (/^\s*$/.test(v) === false && new RegExp("mergeProps\\(\"" + pre + "\"").test(v) === false && v !== "export default props"
    );
  })(_fsExtra2.default.readFileSync(props_path, "utf-8").split("\n"));
  console.log("checking plugin props...");
  props.push("mergeProps(\"" + pre + "\", require(\"" + name + "\").init)");
  props.push("export default props");
  _fsExtra2.default.writeFileSync(props_path, props.join("\n"));
  console.log("props has been updated!");
};

var updateApis = function updateApis(_ref4) {
  var json = _ref4.json,
      name = _ref4.name;

  if (_ramdam2.default.xNil(json.api)) {
    var api_path = (0, _util.resolve)("src/pages/api");
    if (!_fsExtra2.default.existsSync(api_path)) {
      _fsExtra2.default.mkdirSync(api_path);
    }
    for (var k in json.api || {}) {
      var func_path = (0, _util.resolve)("src/pages/api/" + json.api[k] + ".js");
      var api = ["const path = require(\"path\")", "require(\"dotenv\").config(path.resolve(__dirname, \"../../../.env\"))", "import { " + k + " } from \"" + name + "\"", "import conf from \"../../conf\"", "export default " + k + "({ conf: conf })"];
      _fsExtra2.default.writeFileSync(func_path, api.join("\n"));
    }
  }
};

var updateStatic = function updateStatic(_ref5) {
  var name = _ref5.name,
      pre = _ref5.pre;

  var static_path = (0, _util.resolve)("node_modules/" + name + "/static");
  if (_fsExtra2.default.existsSync(static_path)) {
    var static_tar = (0, _util.resolve)("static/" + pre);
    _fsExtra2.default.copySync(static_path, static_tar);
    console.log("static assets copied");
  }
};

var updateFirestore = function updateFirestore(_ref6) {
  var name = _ref6.name,
      pre = _ref6.pre;

  var firestore_path = (0, _util.resolve)("node_modules/" + name + "/firebase/firestore.rules");
  var firestore_tar_path = (0, _util.resolve)("firebase/firestore.rules");

  if (_fsExtra2.default.existsSync(firestore_path)) {
    var new_rules2 = ["rules_version = '2';", "service cloud.firestore {", "  match /databases/{database}/documents {"];

    var rm = 0;
    var rules = _ramdam2.default.filter(function (v) {
      if (new RegExp("service cloud.firestore").test(v) === true || RegExp("match /databases/\\{database\\}/documents").test(v) === true) {
        rm += 1;
      }
      return (/^\s*$/.test(v) === false && new RegExp("rules_version").test(v) === false && new RegExp("service cloud.firestore").test(v) === false && new RegExp("match /databases/\\{database\\}/documents").test(v) === false
      );
    })(_fsExtra2.default.readFileSync(firestore_path, "utf-8").split("\n"));
    rules.reverse();
    var new_rules = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = (0, _getIterator3.default)(rules), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var v = _step2.value;

        if (rm !== 0 && v.replace(/\s/g, "") === "}") {
          rm -= 1;
        } else {
          new_rules.push(v);
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    new_rules.reverse();
    new_rules.unshift("    // " + pre + "-start");
    new_rules.push("    // " + pre + "-end");
    var new_tar_rules = [];
    if (_fsExtra2.default.existsSync(firestore_tar_path)) {
      var tar = false;
      var _rm = 0;
      var tar_rules = _ramdam2.default.filter(function (v) {
        if (new RegExp("service cloud.firestore").test(v) === true || RegExp("match /databases/\\{database\\}/documents").test(v) === true) {
          _rm += 1;
        }
        var isend = false;
        if (new RegExp("// " + pre + "-start").test(v) === true) {
          tar = true;
        } else if (new RegExp("// " + pre + "-end").test(v) === true) {
          isend = true;
          tar = false;
        }
        return tar === false && isend === false && /^\s*$/.test(v) === false && new RegExp("// " + pre).test(v) === false && new RegExp("rules_version").test(v) === false && new RegExp("service cloud.firestore").test(v) === false && new RegExp("match /databases/\\{database\\}/documents").test(v) === false;
      })(_fsExtra2.default.readFileSync(firestore_tar_path, "utf-8").split("\n"));
      tar_rules.reverse();
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = (0, _getIterator3.default)(tar_rules), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _v = _step3.value;

          if (_rm !== 0 && _v.replace(/\s/g, "") === "}") {
            _rm -= 1;
          } else {
            new_tar_rules.push(_v);
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      new_tar_rules.reverse();
    } else {
      new_tar_rules = [];
    }
    if (new_tar_rules.length !== 0) {
      new_rules2.push(new_tar_rules.join("\n"));
    }
    new_rules2.push(new_rules.join("\n"));
    new_rules2.push("  }");
    new_rules2.push("}");
    console.log(new_rules2.join("\n"));
    _fsExtra2.default.writeFileSync(firestore_tar_path, new_tar_rules.join("\n"));
  }
};

var updateFunctions = function updateFunctions(_ref7) {
  var json = _ref7.json,
      pre = _ref7.pre,
      name = _ref7.name;

  if (_ramdam2.default.xNil(json.functions)) {
    var npms = [];
    var funcs = ["// " + pre + "-start"];
    for (var k in json.functions || {}) {
      npms.push(k);
      funcs.push("const funcs_" + pre + " = require(\"" + k + "\")");
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = (0, _getIterator3.default)(json.functions[k] || []), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var v = _step4.value;

          funcs.push("exports." + v + "_" + pre + " = funcs_" + pre + "." + v);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
    funcs.push("// " + pre + "-end");
    console.log(funcs.join("\n"));

    var func_path = (0, _util.resolve)("firebase/functions/index.js");
    if (_fsExtra2.default.existsSync(func_path)) {
      var tar = false;
      var ex_funcs = _ramdam2.default.filter(function (v) {
        var isend = false;
        if (new RegExp("// " + pre + "-start").test(v) === true) {
          tar = true;
        } else if (new RegExp("// " + pre + "-end").test(v) === true) {
          tar = false;
          isend = true;
        }
        return tar === false && isend === false && /^\s*$/.test(v) === false;
      })(_fsExtra2.default.readFileSync(func_path, "utf-8").split("\n"));
      funcs = ex_funcs.concat(funcs);
    }
    console.log(funcs.join("\n"));
    _fsExtra2.default.writeFileSync(func_path, funcs.join("\n"));
    var fb_path = (0, _util.resolve)("firebase/functions");
    console.log("go to " + fb_path + " and install " + npms.join(" ") + " with yarn.");
    console.log("> cd " + fb_path + " && nvm use 10 && yarn add " + npms.join(" "));
  }
};

exports.default = function () {
  var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(name) {
    var pre, package_path, js_path, props_path, json;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            pre = name.replace(/^nd-/, "");
            package_path = (0, _util.resolve)("package.json");
            js_path = (0, _util.resolve)(".nextdapp.js");
            props_path = (0, _util.resolve)(".nextdapp-props.js");

            (0, _util.isRoot)(js_path, props_path);
            _context2.next = 7;
            return installPlugin(name);

          case 7:
            json = (0, _util.getJSON)(name);

            updateEpics({ name: name, js_path: js_path, json: json, pre: pre });
            updateProps((0, _defineProperty3.default)({ name: name, props_path: props_path }, "name", name));
            updateApis({ json: json, name: name });
            updateStatic({ name: name, pre: pre });
            updateFirestore({ name: name, pre: pre });
            updateFunctions({ name: name, pre: pre, json: json });
            process.exit();

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x2) {
    return _ref8.apply(this, arguments);
  };
}();

module.exports = exports.default;