#!/usr/bin/env node

const command = process.argv[2]
const name = process.argv[3]
const namespace = process.argv[4]
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
  case "add":
    add(name,namespace)
    break
  case "remove":
    remove(name,namespace)
  break
  /*
  case "update":
    remove(name, namespace)
    add(name, namespace)
    break  
  */
  default:
    console.log("command not found")
}
