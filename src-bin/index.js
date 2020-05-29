#!/usr/bin/env node

const command = process.argv[2]
const name = process.argv[3]

switch (command) {
  case "create":
    const create = require("../lib/create")
    create(name)
    break
  case "add":
    const add = require("../lib/add")
    add(name)
    break
  case "remove":
    const remove = require("../lib/remove")
    remove(name)
    break
  default:
    console.log("command not found")
}
