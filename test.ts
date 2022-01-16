import { findSongId, getPlaylistContent } from "."

getPlaylistContent("http://kko.to/5sEzF72fT").then((e) =>
    console.log(e.name, e.description)
)
