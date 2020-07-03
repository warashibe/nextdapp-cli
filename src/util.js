import { complement, isNil } from "ramda"
const xNil = complement(isNil)
import fs from "fs-extra"
import path from "path"
import { spawn } from "child_process"
export const isRoot = json_path => {
  if (!fs.existsSync(json_path)) {
    console.error(`Error: not in the root directory: ${__dirname}`)
    process.exit()
  }
  return JSON.parse(fs.readFileSync(json_path, "utf8"))
}
export const getPre = name =>
  /\//.test(name)
    ? name
        .split("/")
        .slice(1)
        .join("/")
    : name

export const modName = name =>
  /\//.test(name) ? name : `warashibe.nextdapp/${name}`

export const resolve = to => path.resolve(process.cwd(), to)

export const updateFuncs = ({ plugins, js_path }) => {
  let js = []
  for (let pre in plugins) {
    let exp = []
    console.log(`checking plugin funcs...`)
    console.log()
    const json = plugins[pre]
    const src = `nd/${json.namespace || pre}`
    for (let v of json.funcs || []) {
      const ns = xNil(json.namespace)
        ? `$${json.namespace}`
        : json.core
          ? ""
          : `$${pre}`
      exp.push(` ${v} as ${v}${ns}`)
      console.log(`${v}${ns}`)
    }
    js.push(`export {${exp.join(",")} } from "${src}"`)
  }
  console.log()

  fs.writeFileSync(js_path, js.join("\n"))
  console.log(`funcs has been updated!`)
}

export const updateProps = ({ plugins, props_path }) => {
  const props = [
    "let props = {}",
    "const mergeProps = (name, obj, core = false, namespace = null) => {",
    "  for (const k in obj) {",
    '    props[`${k}${namespace !== null ? `$${namespace}` : core ? "" : `$${name}`}`] = obj[k]',
    "  }",
    "}"
  ]

  console.log(`checking plugin props...`)
  for (let pre in plugins) {
    if (pre === "core") continue
    const json = plugins[pre]
    const src = `nd/${json.namespace || pre}`
    props.push(`import { init as ${pre} } from "${src}"`)
    props.push(
      `mergeProps("${pre}", ${pre}, ${json.core ? "true" : "false"}, ${
        xNil(json.namespace) ? `"${json.namespace}"` : "null"
      })`
    )
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

export const getJSON = ({ pre, namespace }) => {
  const json_path = xNil(namespace)
    ? resolve(`nd/${namespace}/nextdapp.json`)
    : resolve(`nd/${pre}/nextdapp.json`)
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
