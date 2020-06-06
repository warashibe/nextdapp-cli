import fs from "fs-extra"
import path from "path"
import { spawn } from "child_process"
import R from "ramdam"
export const isRoot = json_path => {
  if (!fs.existsSync(json_path)) {
    console.error(`Error: not in the root directory: ${__dirname}`)
    process.exit()
  }
  return JSON.parse(fs.readFileSync(json_path, "utf8"))
}
export const getPre = name =>
  /^@/.test(name)
    ? name
        .split("/")
        .slice(1)
        .join("/")
    : name
export const resolve = to => path.resolve(process.cwd(), to)

export const updateEpics = ({ plugins, js_path, noinstall = false }) => {
  let js = []
  for (let pre in plugins) {
    let exp = []
    console.log(`checking plugin epics...`)
    console.log()
    const json = plugins[pre]
    const src =
      noinstall === false && R.xNil(json.path) ? "../" + json.path : json.name
    for (let v of json.epics || []) {
      exp.push(` ${v} as ${v}$${pre}`)
      console.log(`${v}$${pre}`)
    }
    js.push(`export {${exp.join(",")} } from "${src}"`)
  }
  console.log()

  fs.writeFileSync(js_path, js.join("\n"))
  console.log(`epics has been updated!`)
}

export const updateProps = ({ plugins, props_path, noinstall = false }) => {
  const props = [
    "let props = {}",
    "const mergeProps = (name, obj) => {",
    "  for (const k in obj) {",
    "    props[`${k}$${name}`] = obj[k]",
    "  }",
    "}"
  ]

  console.log(`checking plugin props...`)
  for (let pre in plugins) {
    const json = plugins[pre]
    const src =
      noinstall === false && R.xNil(json.path) ? "../" + json.path : json.name
    props.push(`mergeProps("${pre}", require("${src}").init)`)
  }
  props.push(`export default props`)
  fs.writeFileSync(props_path, props.join("\n"))
  console.log(`props has been updated!`)
}

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

export const getJSON = ({ name, tar_path }) => {
  const json_path = R.xNil(tar_path)
    ? resolve(`${tar_path}/nextdapp.json`)
    : resolve(`node_modules/${name}/nextdapp.json`)
  let json = null
  if (!fs.existsSync(json_path)) {
    console.log("json not found...:" + json_path)
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

export const getPlugins = ({ json_path }) => {
  let json = null
  if (!fs.existsSync(json_path)) {
    console.log("json not found..." + json_path)
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

export const updatePlugins = ({ json_path, json }) => {
  try {
    fs.writeFileSync(json_path, JSON.stringify(json))
  } catch (e) {
    console.log(e)
    process.exit()
  }
  return json
}
