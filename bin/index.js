#!/usr/bin/env node
"use strict";

var command = process.argv[2];
var name = process.argv[3];

switch (command) {
  case "create":
    var create = require("../lib/create");
    create(name);
    break;
  case "add":
    var add = require("../lib/add");
    add(name);
    break;
  case "remove":
    var remove = require("../lib/remove");
    remove(name);
    break;
  default:
    console.log("command not found");
}