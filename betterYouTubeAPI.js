const https = require("https");
const ytAPIKey = JSON.parse(fs.readFileSync("/apikey"));
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
exports.getUploadListById = function(channelId) {
    var uploadPlaylistId = "UU" + channelId.slice(2);
    return uploadPlaylistId;
};
exports.getFutureVids = async function(channelId, apiKey) {
    
}
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
