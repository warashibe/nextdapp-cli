#!/usr/bin/env node

const command = process.argv[2]
const name = process.argv[3]
const path = process.argv[4]
const noinstall = process.argv[5] === "noinstall"
const remove = require("../lib/remove").default
const add = require("../lib/add").default
switch (command) {
  /*
  case "list":
    const list = require("../lib/list").default
    list()
    break
  */
  case "create":
    const create = require("../lib/create").default
    create(name)
  break
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
    console.log("command not found")
}
