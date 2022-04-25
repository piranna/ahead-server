const {readFile} = require("fs/promises");
const {resolve} = require("path");


module.exports = class
{
    constructor(path)
    {
        this.#path = resolve(path);
    }


    //
    // Public API
    //

    get removed()
    {
        return this.#removed;
    }


    drop(no) {
        if(this.#chunks.delete(no)) this.removed++;
    }

    // end() {
    //     for (const k in chunks) {
    //         if (Object.prototype.hasOwnProperty.call(chunks, k) && chunks[k]?.reject) {
    //             chunks[k].reject();
    //         }
    //     }
    // }

    async get(no)
    {
        return this.#stub(no).promise;
    }

    async set(no, file) {
        return readFile(resolve(this.#path, file))
        .then(function(file)
        {
            const {resolve} = this.#stub(no).resolve

            if(!resolve) throw new Error('Already set')

            resolve(file)
        });
    }



    //
    // Private API
    //

    #chunks = new Set
    #path;
    #removed = 0;

    #stub(no) {
        let chunk = chunks.get(no)

        if(!chunk)
        {
            const promise = new Promise(function(resolve, reject)
            {
                chunk = {reject, resolve}
            })

            chunk.promise = promise;

            this.#chunks.set(no, chunk);
        }

        return chunk;
    }
}
