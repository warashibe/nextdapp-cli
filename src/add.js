import { complement, isNil, mergeLeft, when, filter } from "ramda"
const xNil = complement(isNil)
import path from "path"
import fs from "fs-extra"
import { spawn } from "child_process"

import {
  getPre,
  getJSON,
  isRoot,
  resolve,
  spawnp,
  getPlugins,
  updatePlugins,
  updateFuncs,
  updateProps,
  modName
} from "./util"

const installPlugin = async ({ name }) => {
  try {
    await spawnp("bit", ["import", name])
    console.log(`${name} installed!`)
  } catch (error) {
    console.error(`install error: ${error}`)
    process.exit()
  }
}

const updateApis = ({ json, name, pre }) => {
  if (xNil(json.api)) {
    const api_path = resolve(`pages/api`)
    if (!fs.existsSync(api_path)) {
      fs.mkdirSync(api_path)
    }
    const src = name
    for (let k in json.api || {}) {
      const func_path = resolve(`pages/api/${json.api[k]}_${pre}.js`)
      let api = [
        `const path = require("path")`,
        `import { ${k} } from "${src}"`,
        `import conf from "nd/conf"`,
        `export default ${k}({ conf: conf })`
      ]
      fs.writeFileSync(func_path, api.join("\n"))
    }
  }
}

const updateStatic = ({ name, pre }) => {
  const static_path = resolve(`node_modules/${name}/static`)
  if (fs.existsSync(static_path)) {
    const static_tar = resolve(`public/static/${pre}`)
    fs.copySync(static_path, static_tar)
    console.log("static assets copied")
  }
}

const updateFirestore = ({ name, pre }) => {
  const firestore_path = resolve(
    `node_modules/${name}/firebase/firestore.rules`
  )
  const firestore_tar_path = resolve(`firebase/firestore.rules`)
  const firebase_path = resolve(`firebase`)
  if (fs.existsSync(firestore_path)) {
    let new_rules2 = [
      `rules_version = '2';`,
      `service cloud.firestore {`,
      `  match /databases/{database}/documents {`
    ]

    let rm = 0
    const rules = filter(v => {
      if (
        new RegExp(`service cloud\.firestore`).test(v) === true ||
        RegExp(`match /databases/\\{database\\}/documents`).test(v) === true
      ) {
        rm += 1
      }
      return (
        /^\s*$/.test(v) === false &&
        new RegExp(`rules_version`).test(v) === false &&
        new RegExp(`service cloud\.firestore`).test(v) === false &&
        new RegExp(`match /databases/\\{database\\}/documents`).test(v) ===
          false
      )
    })(fs.readFileSync(firestore_path, "utf-8").split("\n"))
    rules.reverse()
    let new_rules = []
    for (let v of rules) {
      if (rm !== 0 && v.replace(/\s/g, "") === "}") {
        rm -= 1
      } else {
        new_rules.push(v)
      }
    }
    if (!fs.existsSync(firebase_path)) {
      fs.mkdirSync(firebase_path)
    }

    new_rules.reverse()
    new_rules.unshift(`    // ${pre}-start`)
    new_rules.push(`    // ${pre}-end`)
    let new_tar_rules = []
    if (fs.existsSync(firestore_tar_path)) {
      let tar = false
      let rm = 0
      let tar_rules = filter(v => {
        if (
          new RegExp(`service cloud\.firestore`).test(v) === true ||
          RegExp(`match /databases/\\{database\\}/documents`).test(v) === true
        ) {
          rm += 1
        }
        let isend = false
        if (new RegExp(`// ${pre}-start`).test(v) === true) {
          tar = true
        } else if (new RegExp(`// ${pre}-end`).test(v) === true) {
          isend = true
          tar = false
        }
        return (
          tar === false &&
          isend === false &&
          /^\s*$/.test(v) === false &&
          new RegExp(`// ${pre}`).test(v) === false &&
          new RegExp(`rules_version`).test(v) === false &&
          new RegExp(`service cloud\.firestore`).test(v) === false &&
          new RegExp(`match /databases/\\{database\\}/documents`).test(v) ===
            false
        )
      })(fs.readFileSync(firestore_tar_path, "utf-8").split("\n"))
      tar_rules.reverse()
      for (let v of tar_rules) {
        if (rm !== 0 && v.replace(/\s/g, "") === "}") {
          rm -= 1
        } else {
          new_tar_rules.push(v)
        }
      }
      new_tar_rules.reverse()
    } else {
      new_tar_rules = []
    }
    if (new_tar_rules.length !== 0) {
      new_rules2.push(new_tar_rules.join("\n"))
    }
    new_rules2.push(new_rules.join("\n"))
    new_rules2.push(`  }`)
    new_rules2.push(`}`)
    console.log(new_rules2.join("\n"))
    console.log(firestore_tar_path)
    fs.writeFileSync(firestore_tar_path, new_rules2.join("\n"))
  }
}

const updateFunctions = ({ json, pre, name }) => {
  if (xNil(json.functions)) {
    const firebase_path = resolve(`firebase`)
    if (!fs.existsSync(firebase_path)) {
      fs.mkdirSync(firebase_path)
    }
    const functions_path = resolve(`firebase/functions`)
    if (!fs.existsSync(functions_path)) {
      fs.mkdirSync(functions_path)
    }
    let npms = []
    let funcs = [`// ${pre}-start`]
    for (const k in json.functions || {}) {
      npms.push(k)
      funcs.push(`const funcs_${pre} = require("${k}")`)
      for (const v of json.functions[k] || []) {
        funcs.push(`exports.${v}_${pre} = funcs_${pre}.${v}`)
      }
    }
    funcs.push(`// ${pre}-end`)
    console.log(funcs.join("\n"))

    const func_path = resolve(`firebase/functions/index.js`)
    if (fs.existsSync(func_path)) {
      let tar = false
      const ex_funcs = filter(v => {
        let isend = false
        if (new RegExp(`// ${pre}-start`).test(v) === true) {
          tar = true
        } else if (new RegExp(`// ${pre}-end`).test(v) === true) {
          tar = false
          isend = true
        }
        return tar === false && isend === false && /^\s*$/.test(v) === false
      })(fs.readFileSync(func_path, "utf-8").split("\n"))
      funcs = ex_funcs.concat(funcs)
    }
    console.log(funcs.join("\n"))
    fs.writeFileSync(func_path, funcs.join("\n"))
    const fb_path = resolve(`firebase/functions`)
    console.log(`go to ${fb_path} and install ${npms.join(" ")} with yarn.`)
    console.log(`> cd ${fb_path} && nvm use 10 && yarn add ${npms.join(" ")}`)
  }
}

export default async (name, namespace = null) => {
  const json_path = resolve("nd/.plugins.json")
  let plugins = getPlugins({ json_path })
  console.log(plugins)
  const pre = getPre(name)
  name = modName(name)
  console.log(pre)
  console.log(name)
  const components_path = resolve(`nd/${pre}`)
  const package_path = resolve("package.json")
  const js_path = resolve("nd/.nextdapp.js")
  const props_path = resolve("nd/.nextdapp-props.js")
  const pjson = isRoot(json_path)
  await installPlugin({ name })
  const json = getJSON({ pre })
  const core = json.core || false

  plugins[pre] = mergeLeft(
    { name: name, key: pre, core: core, namespace: namespace },
    json
  )
  updateFuncs({ plugins, js_path, pre })
  updateProps({ plugins, props_path })
  //updateApis({ json, name, pre })
  //updateStatic({ name, pre })
  //updateFirestore({ name, pre })
  //updateFunctions({ name, pre, json })
  updatePlugins({ json: plugins, json_path })

  process.exit()
}
