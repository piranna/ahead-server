
/** Originally based on https://stackoverflow.com/a/41563966/3790725 */
module.exports = function csvToArray(text)
{
    let p = "";
    let row = [""];
    let ret = [row];
    let i = 0;
    let r = 0;
    let s = true;

    for (let l of text) {
        if ("\"" === l) {
            if (s && l === p)
                row[i] += l;

            s = !s;
        }

        else if ("," === l && s)
            row[++i] = l = "";

        else if ("\n" === l && s) {
            // Remove carriage return from row last field
            if ("\r" === p) row[i] = row[i].slice(0, -1);

            ret[++r] = row = [l = ""];
            i = 0;
        }

        else
            row[i] += l;

        p = l;
    }

    return ret;
};
