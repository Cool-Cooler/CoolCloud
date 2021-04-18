const AWS = require('aws-sdk')

const {v4: uuidv4} = require('uuid');

AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()
const URL_EXPIRATION_SECONDS = 300

// Main Lambda entry point
exports.handler = async (event) => {
  return await getUploadURL(event)
}

const getUploadURL = async function(event) {
  const randomID = `${uuidv4()}`
  // This should be taken as pasrt of the request
  const deviceID = 'd195e121-d7b7-454a-bbb1-68be0a15e133'
  const Key = `${deviceID}/${randomID}.jpg`

console.log(Key)
  // Get signed URL from S3
  const s3Params = {
    Bucket: 'esp32-rekognition-837571149706',
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  }
  const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params)
  return JSON.stringify({
    uploadURL: uploadURL,
    Key
  })
}
