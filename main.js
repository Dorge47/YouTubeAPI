const api = require('./screwyYouTubeAPI.js');
async function writeHTML(domain, path) {
    var HTML = await api.getHTML(domain, path);
    console.log(HTML);
};
//writeHTML("","");
async function listFutureVids(channelID) {
    var resp = await api.getFutureVids(channelID);
    console.log(JSON.stringify(resp));
};
//listFutureVids("");
async function showVideoData(videoId) {
    var resp = await api.getVideoById(videoId);
    console.log(JSON.stringify(resp));
}
async function countInstances() {
    domain = "";
    path = "";
    var HTML = await api.getHTML(domain, path);
    var count = (HTML.match("scheduledStartTime"/g) || []).length;
    console.log(count);
}
//countInstances();
//showVideoData("");
// OUTDATED ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// the HTML from `/videos?view=2&live_view=501` will contain one occurence of `"text":"LIVE"` per current livestream, or 0 if the channel is not live
// the HTML from `/videos?view=2&live_view=502` will contain one occurence of `"startTime":` per scheduled livestream, or 0 if there are none scheduled
// `"startTimestamp":` in the HTML of a livestream (current OR past) will precede a datestamp of the exact time the video went live, and a past livestream will also contain `"endTimestamp":`
// past or present livestreams will include a single instance of `"isLiveNow":`
// `"text":"This video isn't available anymore"` for deleted videos/streams
// `"simpleText":"Private video"` for privated videos/streams
// OUTDATED ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------