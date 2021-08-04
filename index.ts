const parseQs = (url: string) =>
  Object.fromEntries(url.split("?")[1].split("&").map((e) => e.split("=")));

interface Song {
    title: string;
    artist: string;
    id: {
        melon: string;
    }
}

export async function getPlaylistContent(url: string): Promise<Song[]> {
  const query = parseQs(url);
  if (!query.plylstSeq) throw new Error("플리 주소가 올바르지 않아요");

  const playlistId = query.plylstSeq;
  const reqUrl =
    `https://www.melon.com/mymusic/playlist/mymusicplaylistview_listSong.htm?plylstSeq=${playlistId}`;

  const fetchedText = await (await fetch(reqUrl)).text();
  return fetchedText.split("<tbody>")[1].split("</tbody>")[0].split("<tr").map((rawRow): Song | null => {
      if(rawRow.trim().length === 0) return null
      const title = rawRow.split(`- 새 창">`)[1].split(`</a`)[0]
      const id = rawRow.split("goSongDetail('")[1].split("'")[0]
      const artist = rawRow.split("goArtistDetail('")[1].split("</a")[0].split('">')[1]
      return {
          title,
          artist,
          id: {
              melon: id
          }
      }
  }).filter<Song>((e): e is Song => e !== null)
}

export function generateURL(songKeys: string[]) {
    return Promise.resolve(`melonapp://play/?ctype=1&menuid=0&cid=${songKeys.join(',')}`)
}
