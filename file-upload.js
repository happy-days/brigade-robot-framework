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

const Minio = require('minio')
const fs = require('fs');

const file_path = process.env.FILE_PATH
const accessKey = process.env.ACCESS_KEY
const secretKey = process.env.SECRET_KEY

const testFolder = "/mnt/brigade/share"

// Gather the date for a timestamp
const now = new Date();
var isoString = now.toISOString();
var date = isoString.split('T')[0];
var timestamp = date + '-' + now.getUTCHours() + now.getUTCMinutes() + now.getUTCSeconds() + '_'; 

// Instantiate the minio client with the endpoint
// and access keys as shown below.
var minioClient = new Minio.Client({
  endPoint: 'minio',
  port: 9000,
  secure: false,
  accessKey: accessKey,
  secretKey: secretKey
});

//Check to see if the robot bucket already exists
minioClient.bucketExists('robot', function(err) {
  if (err) {
    if (err.code == 'NoSuchBucket') {
      console.log('Did not find bucket named robot, attempting to create...')
      // Make a bucket called robot.
      minioClient.makeBucket('robot', 'us-east-1', function(err) {
        if (err) return console.log('Error creating bucket.', err)
        console.log('Bucket created successfully in "us-east-1".')
      })
    }
  }
  else console.log('robot bucket exists...')
  console.log('Attempting to upload fileis to the bucket...')
  fs.readdirSync(file_path).forEach(file => {
    // Uploading each of the files in the output directory with a timestamp.
    minioClient.fPutObject('robot', timestamp + file, file_path + '/' + file, 'application/octet-stream', function(err, etag) {
      if (err) return console.log(err)
      console.log('File uploaded successfully.')
    })
  })
});
