#!/usr/bin/env node
"use strict";

var command = process.argv[2];
var name = process.argv[3];
var namespace = process.argv[4];

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

  case "add":
    add(name, namespace);
    break;

  case "remove":
    remove(name, namespace);
    break;

  /*
  case "update":
    remove(name, namespace)
    add(name, namespace)
    break  
  */

  default:
    console.log("command not found");
}