#!/usr/bin/env node
"use strict";

var command = process.argv[2];
var name = process.argv[3];
var path = process.argv[4];
var noinstall = process.argv[5] === "noinstall";

var remove = require("../lib/remove")["default"];

var add = require("../lib/add")["default"];

switch (command) {
  /*
  case "list":
    const list = require("../lib/list").default
    list()
    break
  */
  case "create":
    var create = require("../lib/create")["default"];

    create(name);
    break;

  /*
  case "add":
    add(name, path, noinstall)
    break
  case "remove":
    remove(name, path, noinstall)
  break
  case "update":
    remove(name, path, noinstall)
    add(name, path, noinstall)
    break  
  */

  default:
    console.log("command not found");
}