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
exports.getFutureVids = async function(streamer) {
    // Return a list of all live and upcoming videos up to 100 hours in the future
    // Each element should include a video id, a start time, and a status
    // Currently will not return more than one live video if multiple are live simultaneously
    var vidArr = [];
    var url = "www.youtube.com";
    var path = "/channel/" + streamer.channelId + "/streams";
    var response = await exports.getHTML(url, path);
    if (response.includes('"text":"LIVE"')) {
        let liveIndicatorIndex = response.indexOf(`"text":"LIVE"`);
        let idIndex = response.indexOf(`"videoId":`, liveIndicatorIndex);
        let videoId = response.slice(idIndex+11,idIndex+22);
        let status = "live";
        let startTime = new Date();
        let videoResponse = await exports.getHTML(url, "/watch?v=" + videoId)
        startTime = new Date(videoResponse.slice(videoResponse.indexOf(`"startTimestamp":`)+18,videoResponse.indexOf(`"startTimestamp":`)+43));
        vidArr.push({
            "id": videoId,
            "status": status,
            "startTime": exports.clean(JSON.stringify(startTime))
        });
    };
    path = "/channel/" + streamer.channelId + "/streams";
    var response = await exports.getHTML(url, path);
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
            let status = "upcoming";
            let idIndex = response.indexOf(`"videoId":`, timestampIndex);
            let videoId = response.slice(idIndex+11,idIndex+22);
            vidArr.push({
                "id": videoId,
                "status": status,
                "startTime": exports.clean(JSON.stringify(startTime))
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
                let nthIdIndex = response.indexOf(`"videoId":`, nthTimestampIndex);
                let videoId = response.slice(nthIdIndex+11, nthIdIndex+22);
                let status = "upcoming";
                vidArr.push({
                    "id": videoId,
                    "status": status,
                    "startTime": exports.clean(JSON.stringify(startTime))
                });
            };
            break;
    };
    return vidArr;
};
exports.refreshStreamData = async function(stream) {
    var status = "";
    var startTime = new Date();
    var data = {};
    response = await exports.getHTML("www.youtube.com", "/watch?v=" + stream.id);
    if (response.includes(`"text":"This video isn't available anymore"`) || response.includes(`"This is a private video. Please sign in to verify that you may see it."`) || response.includes(`"This video has been removed by the uploader"`)) {
        stream.status = "missing";
        stream.startTime = undefined;
        return stream;
    };
    var isLive = response.includes(`"isLiveNow":true`);
    var isUpcoming = response.includes(`"isUpcoming":true`);
    var isPast = response.includes(`"endTimestamp":`);
    if (!isLive && !isUpcoming && !isPast) {
        console.error("Unknown stream status with id " + stream.id);
    };
    if (isLive) {stream.status = "live"}
    else if (isUpcoming) {
        stream.status = "upcoming"
        let scheduledStartTime = new Date(scrapeString(response, `"scheduledStartTime":`, ",")*1000);
        if (scheduledStartTime - new Date() < -5400000) {
            stream.status = "late";
        };
    }
    else if (isPast) {stream.status = "past"};// There has to be a better way to do this
    let startTimestamp = scrapeString(response, `"startTimestamp":`, ",");
    startTime = new Date(startTimestamp);
    if (startTime == "Invalid Date") {
        console.log("Bad timestamp");
        stream.startTime = exports.clean(JSON.stringify(new Date()));// Assume we're waiting for host
    }
    else {
        stream.startTime = exports.clean(JSON.stringify(startTime));
    };
    return stream;
};
