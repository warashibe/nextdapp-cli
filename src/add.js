import { concat, complement, isNil, mergeLeft, when, filter } from "ramda"
const xNil = complement(isNil)
import path from "path"
import fs from "fs-extra"
import { spawn } from "child_process"

import {
  getPre,
  getJSON,
  resolve,
  spawnp,
  getPlugins,
  updatePlugins,
  updateFuncs,
  updateProps,
  modName
} from "./util"

const installPlugin = async ({ name, namespace }) => {
  try {
    let param = ["import", name, "--override"]
    if (xNil(namespace)) {
      param = concat(param, ["-p", `nd/${namespace}`])
    }
    await spawnp("bit", param)
    console.log(`${name} installed!`)
  } catch (error) {
    console.error(`install error: ${error}`)
    process.exit()
  }
}

export default async (name, namespace = null) => {
  const json_path = resolve("nd/.plugins.json")
  let plugins = getPlugins({ json_path })
  console.log(plugins)
  const pre = getPre(name)
  name = modName(name)
  const components_path = resolve(`nd/${pre}`)
  const package_path = resolve("package.json")
  const js_path = resolve("nd/.nextdapp.js")
  const props_path = resolve("nd/.nextdapp-props.js")
  await installPlugin({ name, namespace })
  const json = getJSON({ pre, namespace })
  const core = json.core || false

  plugins[pre] = mergeLeft(
    { name: name, key: pre, core: core, namespace: namespace },
    json
  )
  updateFuncs({ plugins, js_path })
  updateProps({ plugins, props_path })
  updatePlugins({ json: plugins, json_path })

  process.exit()
}
