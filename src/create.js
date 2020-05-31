import path from "path"
import fs from "fs-extra"
import { exec } from "child_process"
import { sync as commandExists } from "command-exists"

export default dist => {
  const target_path = path.resolve(dist)
  if (fs.existsSync(target_path)) {
    console.error("Error: directory exists.")
    process.exit()
  } else if (!commandExists("git")) {
    console.error("Error: git is not installed.")
    process.exit()
  } else {
    const app_path = "https://github.com/warashibe/next-dapp-bare.git"
    exec(
      `git clone ${app_path} ${target_path} && rm -rf ${target_path}/.git`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`)
          return
        }
        console.log(
          `Success: A next-dapp project has been created at ${target_path}.`
        )
        process.exit()
      }
    )
  }
}
