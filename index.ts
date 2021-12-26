import axios from "axios"
import { Adaptor, Playlist, Song } from "myply-common"

const parseQs = (url: string) =>
  Object.fromEntries(url.split("?")[1].split("&").map((e) => e.split("=")));

export async function getPlaylistContent(url: string): Promise<Song[]> {
  const query = parseQs(url);
  if (!query.plylstSeq) throw new Error("플리 주소가 올바르지 않아요");

  const playlistId = query.plylstSeq;
  const reqUrl =
    `https://www.melon.com/mymusic/playlist/mymusicplaylistview_listSong.htm?plylstSeq=${playlistId}`;

  const fetchedText: string = (await axios(reqUrl)).data

  return fetchedText.split("<tbody>")[1].split("</tbody>")[0].split("<tr").map((rawRow): Song | null => {
    if (rawRow.trim().length === 0) return null
    const title = rawRow.split(`- 새 창">`)[1].split(`</a`)[0]
    const id = rawRow.split("goSongDetail('")[1].split("'")[0]
    const artist = rawRow.split("goArtistDetail('")[1].split("</a")[0].split('">')[1]
    return {
      title,
      artist,
      channelIds: {
        melon: id
      }
    }
  }).filter<Song>((e): e is Song => e !== null)
}

export function generateURL(playlist: Playlist): Promise<string> {
  return Promise.resolve(`melonapp://play/?ctype=1&menuid=0&cid=${playlist.tracks.map(e => e.channelIds.melon)}`)
}

export async function findSongId(song: Song) {
  const res = await axios(`https://m2.melon.com/search/mobile4web/searchsong_list.htm?keyword=${encodeURIComponent(song.artist + " " + song.title)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/96.0.4664.110"
    }
  })
  return res.data
    .split('<input type ="hidden" name="menuId" value="1000000302"/>')[1]
    .split("</li>")[0]
    .split('<li class="filter_item">')[0]
    .trim()
    .split('d-songId="')[1]
    .split('"')[0]
}

export const MelonAdapter: Adaptor = {
  generateURL,
  getPlaylistContent,
  findSongId,
  determinator: ["melon", "kko"]
}
