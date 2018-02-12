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

//=====CONSTANTS====//
const IMAGE_VERSION = "3.0.2"
const IMAGE = "quay.io/charter-ctec/robot-base:" + IMAGE_VERSION

const MINIO_VERSION = "1.0"
const MINIO_CONTAINER = "lukepatrick/minio-node:" + MINIO_VERSION

const SLACK_VERSION = "latest"
const SLACK_CONTAINER = "technosophos/slack-notify:" + SLACK_VERSION

const { events, Job } = require("brigadier")
const util = require('util')

events.on("exec", runRobot)

events.on("error", (e) => {
    console.log("Error event " + util.inspect(e, false, null) )
    console.log("==> Event " + e.type + " caused by " + e.provider + " cause class" + e.cause + e.cause.reason)
})

events.on("after", (e, p) => {
  //console.log("After event fired" + util.inspect(e, false, null) )
})

function parseResults(logs) {
  //Init test result object
  test_results = {}
  //Parse the results for the collective test output
  test_results['slack_msg'] = logs.split("\n").slice(-8,-6).join("\n")
  // Test data returns an array of the test result numbers
  // index 0 is the total tests
  // index 1 is the passed tests
  // index 2 is the failed tests
  // ex. [4, 1, 3]
  test_data = test_results['slack_msg'].split('\n')[test_results['slack_msg'].split('\n').length - 1].match(/^\d+|\d+\b|\d+(?=\w)/g)
  // Store test data in return object
  test_results['total_tests'] = test_data[0]
  test_results['passed_tests'] = test_data[1]
  test_results['failed_tests'] = test_data[2]
  return test_results
}

function runRobot(e, p){

  //=====VARIABLES=====//
  dest_dir = '/mnt/brigade/share'
  test_results = ""

  //=====Set up Job=====//
  var robot_job = new Job("robot-job", IMAGE)
  robot_job.storage.enabled = true
  robot_job.docker.enabled = true
  
  //=====Set up Environment=====//
  robot_job.env = {
    DVC_USER: p.secrets.dvc_user,
    DVC_PASS: p.secrets.dvc_pass,
    DVC_IPADDR: p.secrets.dvc_ipaddr,
    DVC_NAME: p.secrets.dvc_name
  }
  
  //=====Set up Tasks=====//
  robot_job.tasks = [
    "echo Running robot test suite...",
    "robot --outputdir /mnt/brigade/share/ /src/tests/ || true",
    "echo ... robot test suites finished!"
  ]

  //=====Run Jobs=====//
  robot_job.run().then( resultStart => {
    //debug only
    /*console.log("==> Start Job Results")
    console.log(resultStart.toString())
    console.log("==> Start Job Done")
    console.log("==> Running Push Job")*/
    test_results = parseResults(resultStart.toString())
    runMinio(p)
    runSlack(p)
  })
}

function runMinio(project){

  //=====Set up Job=====//
  var minio_job = new Job("minio-job", MINIO_CONTAINER)
  minio_job.storage.enabled = true

  //=====Set up Environment=====//
  minio_job.env = {
    FILE_PATH: dest_dir,
    ACCESS_KEY: project.secrets.minio_user,
    SECRET_KEY: project.secrets.minio_pass
  }

  //=====Set up Tasks=====//
  minio_job.tasks = [
    "echo Uploading files to minio client...",
    //"node src/file-upload.js",
    "echo ...files uploaded to minio client!"
  ]

  //=====Run Jobs=====//
  minio_job.run().then(resultM => {
    //debug only
    /*console.log("==> Job Results")
    console.log(resultM.toString())
    console.log("==> Job Done")*/
  })
}

function runSlack(project){

  //=====Variables=====//
  //Set color based on the return value of the robot test
  //Red for fail - #FF0000
  //Green for pass - #0CFF00
  
  //Set the slack message, color, and title based on result of the test
  slack_message = test_results['slack_msg']
  if(test_results['total_tests'] === test_results['passed_tests']){
    slack_color = '#0CFF00'
    slack_title = test_results['total_tests'] + " robot tests have completed successfully!"
  }
  else{
    slack_color = '#FF0000'
    slack_title = test_results['total_tests'] + " robot tests have ran, unfortunately " + test_results['failed_tests'] + " tests failed."
  } 
 
  //=====JOBS=====//
  var slack_job = new Job("slack-notify", SLACK_CONTAINER)
  slack_job.storage.enabled = false

  //=====ENVIRONMENT=====//
  slack_job.env = {
    SLACK_WEBHOOK: project.secrets.slack_webhook,
    SLACK_USERNAME: "robot-brigade-bot",
    SLACK_TITLE: slack_title,
    SLACK_MESSAGE: slack_message,
    SLACK_COLOR: slack_color,
    SLACK_CHANNEL: "robot"
  }

  //=====TASKS=====//
  slack_job.tasks = [
    "echo Pushing slack notification...",
    "/slack-notify",
    "echo ...slack notification pushed!"
  ]

  //=====Run Jobs=====//
  //Do not run the slack notify unless there are test results
  if(!!test_results){
    slack_job.run().then( resultStart => {
      //debug only
      //console.log("==> slack Job Results")
      //console.log(resultStart.toString())
      //console.log("==> slack Job Done")
    })
  }
}
