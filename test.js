'use strict';
const bizSdk = require('facebook-nodejs-business-sdk');
const Ad = bizSdk.Ad;
const Lead = bizSdk.Lead;

const access_token = 'EAAG7FL9NSFUBAAzcFMlwSFybNGg2YhUFMyzVrTEztP1JSdcgi1XPjvhd7BUbZC0WXPcZAvmfpnrODVTc7Yo6efcDkaaIYi1tZAhcYaymBYz4wXIbRzpYu6bJHOGYlS2RdDDonJb6MPYBqRdwIzZB1XIIAWZAghvHt2hCWQDN1c53aNZCLieZBZAZCGZBFgvdZBCKYtHd7CzSDFwBwZDZD';
const app_secret = '060f7c1fbf3210587e33e4547b1a4670';
const app_id = '487172759963733';
const id = '23851190195520490';
const api = bizSdk.FacebookAdsApi.init(access_token);
const showDebugingInfo = true; // Setting this to true shows more debugging info.
if (showDebugingInfo) {
  api.setDebug(true);
}

const logApiCallResult = (apiCallName, data) => {
  console.log(apiCallName);
  if (showDebugingInfo) {
    console.log('Data:' + JSON.stringify(data));
  }
};

let fields, params;
fields = [
];
params = {
};
const leadss = (new Ad(id)).getLeads(
  fields,
  params
);
logApiCallResult('leadss api call complete.', leadss);