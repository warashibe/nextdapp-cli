import R from "ramdam"
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
  updateEpics,
  updateProps
} from "./util"

const installPlugin = async ({ name, tar_path, noinstall }) => {
  if (noinstall !== true) {
    try {
      await spawnp("yarn", ["add", name])
      console.log(`${name} installed!`)
    } catch (error) {
      console.error(`install error: ${error}`)
      process.exit()
    }
  }
}

const updateComponents = ({
  name,
  pre,
  components_path,
  json,
  tar_path,
  noinstall
}) => {
  const src = noinstall === true ? "../../" + tar_path : name
  if (fs.existsSync(components_path)) {
    try {
      fs.removeSync(components_path)
      console.log(`components removed: ${components_path}`)
    } catch (e) {
      console.log(e)
    }
  } else {
    console.log(`path doesn't exist: ${components_path}`)
  }
  try {
    fs.mkdirSync(components_path)
  } catch (e) {}

  for (const v of json.components || []) {
    let code = [
      `import bind from "nd/bind"`,
      `import { ${v} as _ } from "${src}"`,
      `export default bind(_.Component, _.props, _.funcs)`
    ]
    fs.writeFileSync(`${components_path}/${v}.js`, code.join("\n"))
  }
}

const updateApis = ({ json, name, tar_path, pre, noinstall = false }) => {
  if (R.xNil(json.api)) {
    const api_path = resolve(`pages/api`)
    if (!fs.existsSync(api_path)) {
      fs.mkdirSync(api_path)
    }
    const src = noinstall === true ? "../../" + tar_path : name
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

const updateStatic = ({ name, pre, tar_path }) => {
  const static_path = R.isNil(tar_path)
    ? resolve(`node_modules/${name}/static`)
    : resolve(`${tar_path}/static`)
  if (fs.existsSync(static_path)) {
    const static_tar = resolve(`public/static/${pre}`)
    fs.copySync(static_path, static_tar)
    console.log("static assets copied")
  }
}

const updateFirestore = ({ name, pre, tar_path }) => {
  const firestore_path = R.isNil(tar_path)
    ? resolve(`node_modules/${name}/firebase/firestore.rules`)
    : resolve(`${tar_path}/firebase/firestore.rules`)
  const firestore_tar_path = resolve(`firebase/firestore.rules`)
  const firebase_path = resolve(`firebase`)
  if (fs.existsSync(firestore_path)) {
    let new_rules2 = [
      `rules_version = '2';`,
      `service cloud.firestore {`,
      `  match /databases/{database}/documents {`
    ]

    let rm = 0
    const rules = R.filter(v => {
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
      let tar_rules = R.filter(v => {
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

const updateFunctions = ({ json, pre, name, tar_path }) => {
  if (R.xNil(json.functions)) {
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
      const ex_funcs = R.filter(v => {
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

export default async (name, tar, noinstall = false) => {
  const json_path = resolve("nd/.plugins.json")
  let plugins = getPlugins({ json_path })
  console.log(plugins)
  const pre = getPre(name)
  const components_path = resolve(`nd/${pre}`)
  const tar_path = R.when(R.xNil, v => v.replace(/\/$/, ""))(tar)
  const package_path = resolve("package.json")
  const js_path = resolve("nd/.nextdapp.js")
  const props_path = resolve("nd/.nextdapp-props.js")
  const pjson = isRoot(json_path)
  await installPlugin({ name, tar_path, noinstall })
  const json = getJSON({ name, tar_path })
  plugins[pre] = R.mergeLeft(
    { name: name, key: pre, path: tar, noinstall: noinstall },
    json
  )

  updateEpics({ plugins, js_path, noinstall })
  updateProps({ plugins, props_path, noinstall })
  updateApis({ json, name, tar_path, noinstall, pre })
  updateStatic({ name, pre, tar_path })
  updateComponents({ name, pre, components_path, json, tar_path, noinstall })
  updateFirestore({ name, pre, tar_path })
  updateFunctions({ name, pre, json, tar_path })
  updatePlugins({ json: plugins, json_path })

  process.exit()
}
