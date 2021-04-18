const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

// Main Lambda entry point
exports.handler = async (event, context, callback) => {
  const deviceId  = event.pathParameters.deviceid;
  console.log(deviceId);
  // const deviceId = 'd195e121-d7b7-454a-bbb1-68be0a15e133';
  
  var params = {
    TableName: 'fcontents',
    ExpressionAttributeValues: {
        ":dev_id": {"S": deviceId},
        ":detect": {"BOOL": true}
    },
    ProjectionExpression: 'img_name, bucket_name, device_id, obj_list, created_on',
    FilterExpression: 'attribute_exists(bucket_name) \
                      AND attribute_exists(obj_list) \
                      AND obj_detected = :detect\
                      AND device_id = :dev_id'
  };
  
  var response = {};
  
  await ddb.scan(params, function(err, data) {
    if (err) {
      console.log("Error: ", err);
    } else {
      data.Items.sort(function(a, b){
        return parseInt(b.created_on.S) - parseInt(a.created_on.S)
      });
      const element = data.Items[0];
      
      var thing_list = []
      for (const th of element.obj_list.L){
        thing_list.push(JSON.parse(th.S))
      }
      response = {
        img_link : `https://${element.bucket_name.S}.s3-${process.env.AWS_REGION}.amazonaws.com/${element.device_id.S}/${element.img_name.S}`,
        obj_list : thing_list
      }
    }
  }).promise();
  
  const fresponse = {
    "statusCode": 200,
    "body": JSON.stringify(response),
  };
  callback(null, fresponse);
}