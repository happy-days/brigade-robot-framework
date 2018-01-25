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

//*****CONSTANTS*****//
const IMAGE_VERSION = "3.0.2-python2"
const IMAGE = "quay.io/charter-ctec/rfdocker:" + IMAGE_VERSION

const MINIO_VERSION = "1.0"
const MINIO_CONTAINER = "lukepatrick/minio-node:" + MINIO_VERSION

const SLACK_VERSION = "latest"
const SLACK_CONTAINER = "technosophos/slack-notify:" + SLACK_VERSION

const { events, Job } = require("brigadier")
const util = require('util')

events.on("exec", (e, p) => {

  /* DEBUG env info
  console.log("==> Project " + p.name + " clones the repo at " + p.repo.cloneURL)
  console.log("==> Event " + e.type + " caused by " + e.provider)*/

  //*****VARIABLES*****//
  dest_dir = '/mnt/brigade/share'
  slack_color = '#'+ Math.floor(Math.random()*16777215).toString(16)

  //*****JOBS*****//
  console.log("==> Setting up jobs...")
  var robot_job = new Job("robot-job", IMAGE) 
  robot_job.storage.enabled = true
  robot_job.docker.enabled = true
  
  var minio_job = new Job("minio-job", MINIO_CONTAINER)
  minio_job.storage.enabled = true
  
  var slack_job = new Job("slack-notify", SLACK_CONTAINER)
  slack_job.storage.enabled = false
  console.log("==> ...jobs setup!")

  //*****ENVIRONMENT*****//
  console.log("==> Setting up environment...")
  robot_job.env = {
    DVC_USER: p.secrets.dvc_user,
    DVC_PASS: p.secrets.dvc_pass,
    DVC_IPADDR: p.secrets.dvc_ipaddr,
    DVC_NAME: p.secrets.dvc_name
  }

  minio_job.env = {
    FILE_PATH: dest_dir,
    ACCESS_KEY: p.secrets.minio_user,
    SECRET_KEY: p.secrets.minio_pass
  }

  slack_job.env = {
    SLACK_WEBHOOK: p.secrets.SLACK_WEBHOOK,
    SLACK_USERNAME: "robot-brigade-bot",
    SLACK_TITLE: "Hello World!",
    SLACK_MESSAGE: "It's all Kubernetes from here\n ==> Event " + e.type + " caused by " + e.provider,
    SLACK_COLOR: slack_color,
    SLACK_CHANNEL: "robot"
  }
  console.log("==> ...environment setup!")
  
  //*****TASKS*****//
  console.log("Setting up tasks...")
  minio_job.tasks = [
    "echo Uploading files to minio client...",
    "node src/file-upload.js",
    "echo ...files uploaded to minio client!"
  ]

  robot_job.tasks = [
    "echo Running robot test suite...",
    "robot --outputdir /mnt/brigade/share/ /src/tests/",
    "echo ... robot test suites finished!"
  ]

  slack_job.tasks = [
    "echo Pushing slack notification...",
    "/slack-notify",
    "echo ...slack notification pushed!"
  ]
  console.log("...tasks setup!")


  //*****RUN JOBS*****//
  console.log("==> Running Jobs...")
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
  slack.run().then( resultStart => {
    //debug only
    /*console.log("==> slack Job Results")
    console.log(resultStart.toString())
    console.log("==> slack Job Done")*/
  })
  console.log("==> ...jobs ran!")
})


events.on("error", (e) => {
    console.log("Error event " + util.inspect(e, false, null) )
    console.log("==> Event " + e.type + " caused by " + e.provider + " cause class" + e.cause + e.cause.reason)
})

events.on("after", (e) => {  
    console.log("After event fired " + util.inspect(e, false, null) )
})
