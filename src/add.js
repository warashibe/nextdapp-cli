import R from "ramdam"
import path from "path"
import fs from "fs-extra"
import { spawn } from "child_process"
import { getJSON, isRoot, resolve, spawnp } from "./util"

const installPlugin = async name => {
  try {
    await spawnp("yarn", ["add", name])
    console.log(`${name} installed!`)
  } catch (error) {
    console.error(`install error: ${error}`)
    process.exit()
  }
}

const updateEpics = ({ name, js_path, json, pre }) => {
  const js = R.filter(v => {
    return (
      /^\s*$/.test(v) === false &&
      new RegExp(`from +"${name}"`).test(v) === false
    )
  })(fs.readFileSync(js_path, "utf-8").split("\n"))

  let exp = []
  console.log(`checking plugin epics...`)
  console.log()
  for (let v of json.epics || []) {
    exp.push(` ${v} as ${v}$${pre}`)
    console.log(`${v}$${pre}`)
  }
  console.log()
  js.push(`export {${exp.join(",")} } from "${name}"`)
  fs.writeFileSync(js_path, js.join("\n"))
  console.log(`epics has been updated!`)
}

const updateProps = ({ pre, props_path, name }) => {
  const props = R.filter(
    v =>
      /^\s*$/.test(v) === false &&
      new RegExp(`mergeProps\\("${pre}"`).test(v) === false &&
      v !== "export default props"
  )(fs.readFileSync(props_path, "utf-8").split("\n"))
  console.log(`checking plugin props...`)
  props.push(`mergeProps("${pre}", require("${name}").init)`)
  props.push(`export default props`)
  fs.writeFileSync(props_path, props.join("\n"))
  console.log(`props has been updated!`)
}

const updateApis = ({ json, name }) => {
  if (R.xNil(json.api)) {
    const api_path = resolve(`pages/api`)
    if (!fs.existsSync(api_path)) {
      fs.mkdirSync(api_path)
    }
    for (let k in json.api || {}) {
      const func_path = resolve(`pages/api/${json.api[k]}.js`)
      let api = [
        `const path = require("path")`,
        `import { ${k} } from "${name}"`,
        `import conf from "../../conf"`,
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
    fs.writeFileSync(firestore_tar_path, new_tar_rules.join("\n"))
  }
}

const updateFunctions = ({ json, pre, name }) => {
  if (R.xNil(json.functions)) {
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

export default async name => {
  const pre = name.replace(/^nd-/, "")
  const package_path = resolve("package.json")
  const js_path = resolve(".nextdapp.js")
  const props_path = resolve(".nextdapp-props.js")
  isRoot(js_path, props_path)
  await installPlugin(name)
  const json = getJSON(name)
  updateEpics({ name, js_path, json, pre })
  updateProps({ name, props_path, pre })
  updateApis({ json, name })
  updateStatic({ name, pre })
  updateFirestore({ name, pre })
  updateFunctions({ name, pre, json })
  process.exit()
}
