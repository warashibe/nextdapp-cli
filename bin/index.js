#!/usr/bin/env node
"use strict";

var command = process.argv[2];
var name = process.argv[3];
var path = process.argv[4];
var noinstall = process.argv[5] === "noinstall";

switch (command) {
  case "list":
    var list = require("../lib/list")["default"];

    list();
    break;

  case "create":
    var create = require("../lib/create")["default"];

    create(name);
    break;

  case "add":
    var add = require("../lib/add")["default"];

    add(name, path, noinstall);
    break;

  case "remove":
    var remove = require("../lib/remove")["default"];

    remove(name, path, noinstall);
    break;

  default:
    console.log("command not found");
}