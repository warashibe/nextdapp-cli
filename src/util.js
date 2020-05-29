import fs from "fs-extra"
import path from "path"
import { spawn } from "child_process"

export const isRoot = (js_path, props_path) => {
  if (!fs.existsSync(js_path) || !fs.existsSync(props_path)) {
    console.error(`Error: not in the root directory: ${__dirname}`)
    process.exit()
  }
  return true
}

export const resolve = to => path.resolve(process.cwd(), to)

export const spawnp = (cmd, args = []) => {
  return new Promise((res, rej) => {
    const sp = spawn(cmd, args)
    sp.stdout.on("data", data => {
      console.log(`${data}`)
    })
    sp.stderr.on("data", data => {
      console.error(`${data}`)
    })
    sp.on("close", code => {
      if (code === 0) {
        res(code)
      } else {
        rej(code)
      }
    })
  })
}

export const getJSON = name => {
  const json_path = resolve(`node_modules/${name}/nextdapp.json`)
  let json = null
  if (!fs.existsSync(json_path)) {
    console.log("json not found...")
    process.exit()
  } else {
    try {
      json = JSON.parse(fs.readFileSync(json_path, "utf-8"))
    } catch (e) {
      console.log(e)
      process.exit()
    }
  }
  return json
}
