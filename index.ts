import axios, { AxiosError } from "axios"
import { Adaptor, Playlist, Song } from "myply-common"

const parseQs = (url: string) =>
    Object.fromEntries(
        url
            .split("?")[1]
            .split("&")
            .map((e) => e.split("="))
    )

const getPlaylistIdFromUri = async (uri: string) => {
    if (uri.includes("kko")) {
        try {
            await axios(uri, {
                maxRedirects: 0,
            })
        } catch (e) {
            return parseQs((e as AxiosError).response!.headers.location).sId
        }
        return uri
    }

    const query = parseQs(uri)
    if (!query.plylstSeq) throw new Error("플리 주소가 올바르지 않아요")

    const playlistId = query.plylstSeq
    return playlistId
}

const getRequestableUri = (key: string) => {
    const reqUrl = `https://www.melon.com/mymusic/playlist/mymusicplaylistview_listSong.htm?plylstSeq=${key}`
    return reqUrl
}

const getPlaylistInfo = async (key: string) => {
    const fetched = (
        await axios(
            `https://www.melon.com/mymusic/playlist/mymusicplaylistview_inform.htm?plylstSeq=${key}`
        )
    ).data
    return {
        playlistName: fetched.split('"more_txt_title ">')[1].split("</span")[0],
        playlistDescription: fetched
            .split('<p id="d_sumry">')[1]
            .split("</p")[0],
    }
}

export async function getPlaylistContent(url: string): Promise<Playlist> {
    const playlistId = await getPlaylistIdFromUri(url)
    const fetchedText: string = (await axios(getRequestableUri(playlistId)))
        .data
    const { playlistName, playlistDescription } = await getPlaylistInfo(
        playlistId
    )

    const songs = fetchedText
        .split("<tbody>")[1]
        .split("</tbody>")[0]
        .split("<tr")
        .map((rawRow): Song | null => {
            if (rawRow.trim().length === 0) return null
            const name = rawRow.split(`- 새 창">`)[1].split(`</a`)[0]
            const id = rawRow.split("goSongDetail('")[1].split("'")[0]
            const artist = rawRow
                .split("goArtistDetail('")[1]
                .split("</a")[0]
                .split('">')[1]

            return {
                name,
                artist,
                channelIds: {
                    melon: id,
                },
            }
        })
        .filter<Song>((e): e is Song => e !== null)

    return {
        name: playlistName,
        tracks: songs,
        description: playlistDescription,
        preGenerated: {
            melon: url,
        },
    }
}

export function generateURL(playlist: Playlist): Promise<string> {
    return Promise.resolve(
        `melonapp://play/?ctype=1&menuid=0&cid=${playlist.tracks.map(
            (e) => e.channelIds.melon
        )}`
    )
}

export async function findSongId(song: Song) {
    try {
        const res = await axios(
            `https://m2.melon.com/search/mobile4web/searchsong_list.htm?keyword=${encodeURIComponent(
                song.artist + " " + song.name
            )}`,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/96.0.4664.110",
                },
            }
        )

        return res.data
            .split(
                '<input type ="hidden" name="menuId" value="1000000302"/>'
            )[1]
            .split("</li>")[0]
            .split('<li class="filter_item">')[0]
            .trim()
            .split('d-songId="')[1]
            .split('"')[0]
    } catch (e) {
        return null
    }
}

export const MelonAdapter: Adaptor = {
    generateURL,
    getPlaylistContent,
    findSongId,
    determinator: ["melon", "kko"],
    display: {
        logo: `<svg width="35" height="40" viewBox="0 0 35 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M29.6774 25.1613C29.6774 33.3565 23.0339 40 14.8387 40C6.64352 40 0 33.3565 0 25.1613C0 16.9661 6.64352 10.3226 14.8387 10.3226C23.0339 10.3226 29.6774 16.9661 29.6774 25.1613ZM14.8387 30.9677C18.0455 30.9677 20.6452 28.3681 20.6452 25.1613C20.6452 21.9545 18.0455 19.3548 14.8387 19.3548C11.6319 19.3548 9.03226 21.9545 9.03226 25.1613C9.03226 28.3681 11.6319 30.9677 14.8387 30.9677Z" fill="white"/>
  <path d="M34.8387 5.80645C34.8387 9.01327 32.2391 11.6129 29.0323 11.6129C25.8254 11.6129 23.2258 9.01327 23.2258 5.80645C23.2258 2.59964 25.8254 0 29.0323 0C32.2391 0 34.8387 2.59964 34.8387 5.80645Z" fill="white"/>
  </svg>
  `,
        name: "멜론",
        color: "#00CD3C",
    },
}
