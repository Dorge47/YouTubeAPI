const https = require("https");
const fs = require('fs');
const ytAPIKey = JSON.parse(fs.readFileSync("apikey"));
function sendRequest(func, params) {
    let urlQuery = new URLSearchParams(params).toString();
    const options = {
        hostname: "youtube.googleapis.com",
        path: "/youtube/v3/" + func + "?" + urlQuery,
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
    };
    return new Promise(function(resolve) {
        https.get(options, (resp) => {
            var data = "";
            resp.on("data", (chunk) => (data += chunk));
            resp.on("end", () => {
                resolve(data);
            });
        });
    });
};
function Stream(id, title, tags, startTime, status) {
    this.id = id;
    this.title = title;
    this.tags = tags;
    this.startTime = startTime;
    this.status = status;
    this.getTimeRemaining = function() {
        
    };
};
exports.getUploadListById = function(channelId) {
    var uploadPlaylistId = "UU" + channelId.slice(2);
    return uploadPlaylistId;
};
exports.getFutureVids = async function(channelId, apiKey) {
    
};
exports.getVid = async function(videoId) {
    let status = "";
    let title = "";
    let tags = [];
    let startTime = "";
    let requestParams = {
        "part": "contentDetails,id,liveStreamingDetails,localizations,player,recordingDetails,snippet,statistics,status,topicDetails",
        "id": videoId,
        "key": ytAPIKey
    }
    let response = await sendRequest("videos", requestParams);
    let responseObj = JSON.parse(response);
    if (responseObj.pageInfo.totalResults == 0) {
        status = "missing";
    }
    else if (responseObj.items[0].liveStreamingDetails === undefined) {
        // Video is not a stream
        return null;
    };
    if (responseObj.items[0].snippet.liveBroadcastContent == "live") {
        status = "live";
    }
    else if (responseObj.items[0].snippet.liveBroadcastContent == "upcoming") {
        status = "upcoming";
    }
    else if (responseObj.items[0].liveStreamingDetails.actualEndTime !== undefined) {
        status = "past";
    };
    title = responseObj.items[0].snippet.title;
    tags = responseObj.items[0].snippet.tags;
    startTime = responseObj.items[0].liveStreamingDetails.actualStartTime || responseObj.items[0].liveStreamingDetails.scheduledStartTime;
    return new Stream(videoId, title, tags, startTime, status);
};
/*async function testYT() {
    output = await exports.getVid("");
    console.log(output);
}*/
/*var requestParams = {
    "part": "status,snippet,id,contentDetails",
    "playlistId": "",
    "key": ytAPIKey
}
async function testYT() {
    output = await sendRequest("playlistItems", requestParams);
    console.log(output);
}*/
/*var requestParams = {
    "part": "contentDetails,id,liveStreamingDetails,localizations,player,recordingDetails,snippet,statistics,status,topicDetails",
    "id": "",
    "key": ytAPIKey
}
async function testYT() {
    output = await sendRequest("videos", requestParams);
    console.log(output);
}*/
/*var requestParams = {
    "part": "contentDetails,contentOwnerDetails,id,localizations,snippet,statistics,status,topicDetails",
    "id": "",
    "key": ytAPIKey
}
async function testYT() {
    output = await sendRequest("channels", requestParams);
    console.log(output);
}*/
//testYT();
