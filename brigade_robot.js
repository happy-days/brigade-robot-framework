/*Copyright 2018 Charter DNA Team (CTEC).

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const IMAGE_VERSION = "3.0.2-python2"
const IMAGE = "quay.io/charter-ctec/rfdocker:" + IMAGE_VERSION

const MINIO_VERSION = "1.0"
const MINIO_CONTAINER = "lukepatrick/minio-node:" + MINIO_VERSION

const { events, Job } = require("brigadier")
const util = require('util')

events.on("exec", (e, p) => {

  // env info
  //console.log("==> Project " + p.name + " clones the repo at " + p.repo.cloneURL)
  //console.log("==> Event " + e.type + " caused by " + e.provider)

  // create job with name and container image to use
  var robot_job = new Job("robot-job", IMAGE) // runs helm_job 
  robot_job.storage.enabled = true
  
  var minio_job = new Job("minio-job", MINIO_CONTAINER)
  minio_job.storage.enabled = true

  // set up ENV
  robot_job.env = {
    "DVC_USER": p.secrets.dvc_user,
    "DVC_PASS": p.secrets.dvc_pass,
    "DVC_IPADDR": p.secrets.dvc_ipaddr,
    "DVC_NAME": p.secrets.dvc_name
  }

  // Destination of the robot results files
  dest_dir = '/mnt/brigade/share'

  // set up minio ENV
  minio_job.env = {
      "FILE_PATH": dest_dir,
      "ACCESS_KEY": "minio",
      "SECRET_KEY": "minio123"
  }
  
  //set up tasks
  minio_job.tasks = [
      "date",
      "node src/file-upload.js"
  ]

  // allow docker socket
  robot_job.docker.enabled = true

  //set up tasks
  robot_job.tasks = [] //init empty tasks
  
  //Tasks
  //Run the tests in the test directory
  robot_job.tasks.push("echo Running robot test suite...")
  robot_job.tasks.push("robot --outputdir /mnt/brigade/share/ /src/tests/")
  robot_job.tasks.push("ls -al /mnt/brigade/share")

  console.log("==> Set up tasks, env, Job ")
  //debug only
  //console.log(robot_job)

  console.log("==> Running robot_job Job")

  // run Start Job, get Promise and print results
  robot_job.run().then( resultStart => {
    //debug only
    /*console.log("==> Start Job Results")
    console.log(resultStart.toString())
    console.log("==> Start Job Done")
    console.log("==> Running Push Job")*/
    minio_job.run().then(resultM => {
       //debug only
       /*console.log("==> Job Results")
       console.log(resultM.toString())
       console.log("==> Job Done")*/
    })
  })
})


events.on("error", (e) => {
    console.log("Error event " + util.inspect(e, false, null) )
    console.log("==> Event " + e.type + " caused by " + e.provider + " cause class" + e.cause + e.cause.reason)
})

events.on("after", (e) => {  
    console.log("After event fired " + util.inspect(e, false, null) )
})
