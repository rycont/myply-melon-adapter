import { generateURL, getPlaylistContent } from "./index.ts";

console.log(
  await generateURL((await getPlaylistContent(
    "https://m2.melon.com/landing/playList.htm?type=ply&plylstTypeCode=M20001&memberKey=&plylstSeq=497260802&ref=twitter&snsGate=Y",
  )).map(e => e.id.melon))
);
