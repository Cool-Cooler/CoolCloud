# CoolCloud

Lambda function used in the Cloud for Cool Collers project


As stated in our presentation, the flow for the cloud communications aspect of our project follows a familiar approach to many other groups.

We have implemented our system in AWS.

HTTPS protocol was used for communication between the ESP and Lambda functions. In hindsight, MQTT may have been prefereable as this would have enabled easy use of the subscribe/publish feature, as well as take adantage of the efficiencies of MQTT over HTTPS for smaller, data-centric connections.
