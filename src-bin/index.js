#!/usr/bin/env node

const command = process.argv[2]
const name = process.argv[3]
const path = process.argv[4]
const noinstall = process.argv[5] === "noinstall"
switch (command) {
  case "list":
    const list = require("../lib/list").default
    list()
    break
  case "create":
    const create = require("../lib/create").default
    create(name)
    break
  case "add":
    const add = require("../lib/add").default
    add(name, path, noinstall)
    break
  case "remove":
    const remove = require("../lib/remove").default
    remove(name, path, noinstall)
    break
  default:
    console.log("command not found")
}
