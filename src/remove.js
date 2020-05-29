import R from "ramdam"
import path from "path"
import fs from "fs-extra"
import { exec } from "child_process"
import { sync as commandExists } from "command-exists"
import { getJSON, isRoot, resolve, spawnp } from "./util"

const uninstallPlugin = async name => {
  try {
    await spawnp("yarn", ["remove", name])
    console.log(`${name} uninstalled!`)
  } catch (error) {
    console.error(`uninstall error: ${error}`)
    process.exit()
  }
}

const updateEpics = ({ name, js_path, pre }) => {
  const js = R.filter(v => {
    return (
      /^\s*$/.test(v) === false &&
      new RegExp(`from +"${name}"`).test(v) === false
    )
  })(fs.readFileSync(js_path, "utf-8").split("\n"))
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
  props.push(`export default props`)
  fs.writeFileSync(props_path, props.join("\n"))
  console.log(`props has been updated!`)
}

const updateApis = ({ json, name }) => {
  if (R.xNil(json.api)) {
    const api_path = resolve(`src/pages/api`)
    if (!fs.existsSync(api_path)) {
      fs.mkdirSync(api_path)
    }
    for (let k in json.api || {}) {
      const func_path = resolve(`src/pages/api/${json.api[k]}.js`)
      try {
        fs.unlinkSync(func_path)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

const updateStatic = ({ name, pre }) => {
  const static_tar = resolve(`static/${pre}`)
  try {
    fs.unlinkSync(static_tar)
  } catch (e) {
    console.log(e)
  }
  console.log("static assets removed")
}

const updateFirestore = ({ name, pre }) => {
  const firestore_tar_path = resolve(`firebase/firestore.rules`)
  if (fs.existsSync(firestore_tar_path)) {
    let new_rules2 = [
      `rules_version = '2';`,
      `service cloud.firestore {`,
      `  match /databases/{database}/documents {`
    ]

    let new_tar_rules = []
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
    if (new_tar_rules.length !== 0) {
      new_rules2.push(new_tar_rules.join("\n"))
    }
    new_rules2.push(`  }`)
    new_rules2.push(`}`)
    console.log(new_rules2.join("\n"))
    fs.writeFileSync(firestore_tar_path, new_tar_rules.join("\n"))
  }
}

const updateFunctions = ({ json, pre, name }) => {
  if (R.xNil(json.functions)) {
    let npms = []
    for (const k in json.functions || {}) {
      npms.push(k)
    }
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
      fs.writeFileSync(func_path, ex_funcs.join("\n"))
    }
    const fb_path = resolve(`firebase/functions`)
    console.log(`go to ${fb_path} and uninstall ${npms.join(" ")} with yarn.`)
    console.log(
      `> cd ${fb_path} && nvm use 10 && yarn remove ${npms.join(" ")}`
    )
  }
}

export default async name => {
  const pre = name.replace(/^nd-/, "")
  const package_path = resolve("package.json")
  const js_path = resolve(".nextdapp.js")
  const props_path = resolve(".nextdapp-props.js")
  isRoot(js_path, props_path)
  const json = getJSON(name)
  updateEpics({ name, js_path, pre })
  updateProps({ name, props_path, name })
  updateApis({ json, name })
  updateStatic({ name, pre })
  updateFirestore({ name, pre })
  updateFunctions({ name, pre, json })
  await uninstallPlugin(name)
  process.exit()
}
