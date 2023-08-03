const https = require("https");
const fs = require('fs');
//Uncomment for testing
//const ytAPIKey = JSON.parse(fs.readFileSync("apikey"));
function sendRequest(func, params) {
    let urlQuery = new URLSearchParams(params).toString();
    const options = {
        hostname: "youtube.googleapis.com",
        path: "/youtube/v3/" + func + "?" + urlQuery,
        method: "GET",
        headers: {
            "Accept": "application/json",
        }
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
function Stream(id, title, tags, startTime, status, streamer, blacklist = false) {
    this.id = id;
    this.title = title;
    this.tags = tags;
    this.startTime = startTime;
    this.status = status;
    this.streamer = streamer;
    this.blacklist = blacklist;// Blacklist bad streams so we don't waste API quota refreshing them
    this.getTimeRemaining = function() {
        
    };
};
exports.getFutureStreams = async function(streamer, apiKey) {
    let strmArr = [];
    let playlistId = "UU" + streamer.channelId.slice(2);
    let requestParams = {
        "part": "status,snippet,id,contentDetails",
        "playlistId": playlistId,
        "key": apiKey
    };
    let response = await sendRequest("playlistItems", requestParams);
    let responseObj = JSON.parse(response);
    for (let i = 0; i < responseObj.items.length; i++) {
        //TODO: Check if data returned by playlistItems can be used to determine whether a video is a stream before calling getStream() so we don't waste API quota
        let streamData = await exports.getStream(responseObj.items[i].contentDetails.videoId, streamer, apiKey);
        if (!streamData.blacklist) {
            strmArr.push(streamData);
        };
    };
    return strmArr;
};
exports.getStream = async function(videoId, streamer, apiKey) {
    let status = "";
    let title = "";
    let tags = [];
    let startTime = "";
    let requestParams = {
        "part": "contentDetails,id,liveStreamingDetails,localizations,player,recordingDetails,snippet,statistics,status,topicDetails",
        "id": videoId,
        "key": apiKey
    };
    let response = await sendRequest("videos", requestParams);
    let responseObj = JSON.parse(response);
    if (responseObj.pageInfo.totalResults == 0) {
        // Video is deleted or private
        return {"id": videoId, status: "missing", blacklist: true};
    }
    else if (responseObj.items[0].liveStreamingDetails === undefined) {
        // Video is not a stream
        return {"id": videoId, "blacklist": true};
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
    tags = responseObj.items[0].snippet.tags || [];
    startTime = responseObj.items[0].liveStreamingDetails.actualStartTime || responseObj.items[0].liveStreamingDetails.scheduledStartTime;
    return new Stream(videoId, title, tags, startTime, status, streamer);
};
exports.refreshStream = async function(stream, apikey) {
    let startTime = "";
    if (stream.blacklist == true) {
        console.error("refreshStream() was passed a blacklisted stream!\n\n" + JSON.stringify(stream) + "\n");
        return stream;
    };
    let requestParams = {
        "part": "contentDetails,id,liveStreamingDetails,localizations,player,recordingDetails,snippet,statistics,status,topicDetails",
        "id": videoId,
        "key": apikey
    };
    let response = await sendRequest("videos", requestParams);
    let responseObj = JSON.parse(response);
    if (responseObj.pageInfo.totalResults == 0) {
        // Video is deleted or private
        console.log(stream.streamer.shortName + "'s stream with ID " + stream.id + " is missing");
        stream.blacklist = true;
        return stream;
    }
    else if (responseObj.items[0].liveStreamingDetails === undefined) {
        // Video is not a stream
        console.log("refreshStream() was passed a non-stream video with ID " + stream.id);
        stream.blacklist = true;
        return stream;
    };
    if (responseObj.items[0].snippet.liveBroadcastContent == "live") {
        stream.status = "live";
    }
    else if (responseObj.items[0].snippet.liveBroadcastContent == "upcoming") {
        stream.status = "upcoming";
    }
    else if (responseObj.items[0].liveStreamingDetails.actualEndTime !== undefined) {
        stream.status = "past";
    };
    if (stream.title != responseObj.items[0].snippet.title) {
        stream.title = responseObj.items[0].snippet.title;
        console.log("Title for " + stream.streamer.shortName + "'s stream with ID " + stream.id + " was updated");
    };
    if (stream.tags != responseObj.items[0].snippet.tags) {
        stream.tags = responseObj.items[0].snippet.tags;
        console.log("Tags for " + stream.streamer.shortName + "'s stream with ID " + stream.id + " were updated");
    };
    startTime = responseObj.items[0].liveStreamingDetails.actualStartTime || responseObj.items[0].liveStreamingDetails.scheduledStartTime;
    if (stream.startTime != startTime) {
        stream.startTime = startTime;
        console.log("Start time for " + stream.streamer.shortName + "'s stream with ID " + stream.id + " was updated");
    };
    return stream;
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
