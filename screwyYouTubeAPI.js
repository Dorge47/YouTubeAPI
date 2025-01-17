const https = require('https');
function getNthPosition(string, subString, n) {// n = 1,2,3... (NOT 0)
    var pos = string.split(subString, n).join(subString).length;
    switch (pos) {
        case string.length:
            return -1;
        default:
            return pos;
    };
};
function scrapeString(string, starter, delimiter, offset = 0) {
    var strt = string.indexOf(starter);
    var len = starter.length;
    var tempStr = string.slice(strt + len);
    var fin = (tempStr.indexOf(delimiter) + offset);
    var finalStr = tempStr.slice(0, fin);
    return exports.clean(finalStr);
};
exports.clean = function(string) {
    if (typeof(string) != "string") {
        return string;
    };
    return string.replace(/['"`{}]/g, '');
};
exports.getHTML = function(url, path) {
    var options = {
        host: url,
        port: 443,
        path: path
    };
    return new Promise(function(resolve) {// Shut up I'll add rejection handling later
        https.get(options, (resp) => {
            var data = "";
            resp.on("error", (er) => {
                console.log(JSON.stringify(er));
                process.exit();
            });
            resp.on("data", (chunk) => (data += chunk));
            resp.on("end", () => {
                resolve(data);
            });
        });
    })
};
exports.getFutureVids = async function(channelId) {
    // Return a list of all live and upcoming videos up to 100 hours in the future
    // Each element should include a video id, a start time, and a status
    // Will not return more than one live video if multiple are live simultaneously
    // Will not return stream if streamer is over an hour late
    var vidArr = [];
    var url = "www.youtube.com";
    var path = "/channel/" + channelId + "/streams";
    let quota = 0;
    var response = await exports.getHTML(url, path);
    quota++;
    if (response.includes('"text":"LIVE"')) {
        let liveIndicatorIndex = response.indexOf(`"text":"LIVE"`);
        let idIndex = response.indexOf(`"videoId":`, liveIndicatorIndex);
        let videoId = response.slice(idIndex+11,idIndex+22);
        let status = "live";
        let startTime = new Date();
        let videoResponse = await exports.getHTML(url, "/watch?v=" + videoId)
        quota++;
        startTime = new Date(videoResponse.slice(videoResponse.indexOf(`"startTimestamp":`)+18,videoResponse.indexOf(`"startTimestamp":`)+43));
        // Is this necessary? Check if it's possible to get the start time of a currently live stream from the streams page
        vidArr.push({
            "id": videoId,
            "status": status,
            "available_at": exports.clean(JSON.stringify(startTime)),
            "channel": {
                "id": channelId
            }
        });
    };
    var numScheduled = (response.match(/"startTime":/g) || []).length;
    switch (numScheduled) {
        case 0:
            break;
        case 1:
            let timestampIndex = response.indexOf(`"startTime":`);
            let startTime = new Date(response.slice(timestampIndex+13, timestampIndex+23)*1000);
            // Technically this will start cutting off the last digit of the datestamp in November of 2286, maybe update it before then
            let currentTime = new Date();
            if ((startTime - currentTime) > 360000000) { // Ignore streams over 100 hours in the future
                break;
            };
            if ((currentTime - startTime) > 3600000) { // Ignore streams scheduled for over an hour ago
                break;
            };
            let status = "upcoming";
            let idIndex = response.indexOf(`"videoId":`, timestampIndex);
            let videoId = response.slice(idIndex+11,idIndex+22);
            vidArr.push({
                "id": videoId,
                "status": status,
                "available_at": exports.clean(JSON.stringify(startTime)),
                "channel": {
                    "id": channelId
                }
            });
            break;
        default:
            for (let i = 0; i < numScheduled; i++) {
                let nthTimestampIndex = getNthPosition(response, `"startTime":`, (i + 1));
                let startTime = new Date(response.slice(nthTimestampIndex+13, nthTimestampIndex+23)*1000);
                let currentTime = new Date();
                if ((startTime - currentTime) > 360000000) {
                    continue;
                };
                if ((currentTime - startTime) > 3600000) {
                    continue;
                };
                let nthIdIndex = response.indexOf(`"videoId":`, nthTimestampIndex);
                let videoId = response.slice(nthIdIndex+11, nthIdIndex+22);
                let status = "upcoming";
                vidArr.push({
                    "id": videoId,
                    "status": status,
                    "available_at": exports.clean(JSON.stringify(startTime)),
                    "channel": {
                        "id": channelId
                    }
                });
            };
            break;
    };
    return [vidArr, quota];
};
exports.getVideoById = async function(videoId) {
    var status = "";
    var channelId = "";
    var startTime = new Date();
    var data = {};
    response = await exports.getHTML("www.youtube.com", "/watch?v=" + videoId);
    if (response.includes(`"text":"This video isn't available anymore"`) || response.includes(`"This is a private video. Please sign in to verify that you may see it."`) || response.includes(`"This video has been removed by the uploader"`)) {
        status = "missing";
        data = {
            "id": videoId,
            "status": status,
            "available_at": undefined,
            "channel": {
                "id": undefined
            }
        };
        return data;
    };
    var isLive = response.includes(`"isLiveNow":true`);
    var isUpcoming = response.includes(`"isUpcoming":true`);
    var isPast = response.includes(`"endTimestamp":`);
    if (!isLive && !isUpcoming && !isPast) {
        console.error("Unknown stream status with id " + videoId);
    }
    if (isLive) {status = "live"}
    else if (isUpcoming) {status = "upcoming"}
    else if (isPast) {status = "past"};// There has to be a better way to do this
    if (isUpcoming) {
        if (response.includes(`"offerId":"sponsors_only_video"`)) { // Stream is members-only and does not contain a scheduledStartTime
            startTime = exports.clean(JSON.stringify(new Date(scrapeString(response, `"startTimestamp":`, ","))));
        }
        else {
            startTime = exports.clean(JSON.stringify(new Date((scrapeString(response, `"scheduledStartTime":`, ",") * 1000))));
        }
    }
    else {
        startTime = exports.clean(JSON.stringify(new Date(scrapeString(response, `"startTimestamp":`, ","))));
    };
    channelId = scrapeString(response, `"channelId":`, ",");
    data = {
        "id": videoId,
        "status": status,
        "available_at": startTime,
        "channel": {
            "id": channelId
        }
    };// Add more channel data later
    return data;
};
