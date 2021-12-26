import { findSongId, generateURL, getPlaylistContent } from ".";

getPlaylistContent(
  "https://m2.melon.com/landing/playList.htm?type=ply&plylstTypeCode=M20001&memberKey=&plylstSeq=497260802&ref=twitter&snsGate=Y",
).then(e => findSongId(e[0]))
  .then(e => console.log(e))
