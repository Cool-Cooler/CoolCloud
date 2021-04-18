const AWS = require('aws-sdk')
// Set the region 
AWS.config.update({region: process.env.AWS_REGION});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var s3 = new AWS.S3();

exports.handler = function(event, context, callback) {
   //console.log("Incoming Event: \n", JSON.stringify(event));
   
    var request = require('request');
    
    const bucket = event.Records[0].s3.bucket.name;
    const filePath = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const deviceID = filePath.split("/")[0];
    const imgName = filePath.split("/")[1];
    
    // fetch uploaded s3 object 
    s3.getObject({
        Bucket: bucket,
        Key: filePath
    }, function(err, data) {
        if (err) {
            callback(err);
        } else {
            // fetch inference from remote server
            var req = request
            .post('http://ec2-18-207-241-107.compute-1.amazonaws.com/infer', 
            function (err, resp, body) {
              if (err) {
                var params = {
                 TableName: 'fcontents',
                 Item: {
                   'img_name' : { "S": imgName},
                   'device_id' : {"S": deviceID},
                   'bucket_name': {"S": bucket},
                   'created_on' : {"S" : new Date().getTime().toString()},
                   'obj_detected' :{"BOOL": false}
                 }
                }
                // Call DynamoDB to add the item to the table
                ddb.putItem(params, function(err, data) {
                 if (err) {
                    callback(null, {"Error": err});
                 } else {
                    callback(null, {"Success": data});
                 }
                });
                callback(err);
              } else {
                // console.log("inference" + body);
                body = JSON.parse(body)
                var thing_list = []
                console.log(body)
                console.log(body.results)
                for(const th of body.result){
                    var dbth = {}
                    dbth.thing_class = th.t_class
                    dbth.count = th.t_count
                    thing_list.push({"S": JSON.stringify(dbth)})
                }
                var params = {
                 TableName: 'fcontents',
                 Item: {
                   'img_name' : {"S": imgName},
                   'device_id' : {"S": deviceID},
                   'bucket_name': {"S": bucket},
                   'created_on' : {"S" : new Date().getTime().toString()},
                   'obj_detected' :{"BOOL": true},
                   'obj_list' : {"L": thing_list}
                 }
                };

                console.log(JSON.stringify(params));
                
                // Call DynamoDB to add the item to the table
                // This is adding data only, not updating
                ddb.putItem(params, function(err, data) {
                 if (err) {
                    callback(null, {"Error": err});
                 } else {
                    callback(null, {"Success": data});
                 }
                });
              }
            });
            
            var form = req.form();
            form.append('fimg', data.Body, {
                filename: imgName,
                contentType: 'image/jpg'
            });
        }
    });
};
