import API from "../middleware/Api";

export async function list(
    path,
    share,
    keywords,
    searchPath
){
    let apiURL = "";
    if (share) {
        if (keywords === "") {
            apiURL = "/share/list/" + share.key;
        } else {
            apiURL = `/share/search/${share.key}/`;
        }
    } else {
        if (keywords === "") {
            apiURL = "/directory";
        } else {
            apiURL = "/file/search/";
        }
    }

    path = keywords === "" ? path : keywords;
    apiURL = apiURL + encodeURIComponent(path);
    if (searchPath) {
        apiURL = `${apiURL}?path=${encodeURIComponent(searchPath)}`;
    }
    return API.get(apiURL);
}
