const fsPromise = require('fs').promises;

const jsonDB = (path) => {
    const dbPath = path;
    const read = () => {
        console.log('Read Database.')
        const readPromise = fsPromise.readFile(dbPath)
        .then(data => {
            return JSON.parse(data);
        })
        .catch((err) => {
            throw err;
        })
        return readPromise;
    }
    const save = (jsonData) => {
        console.log('write')
        if(!validCheck(jsonData)){
            return Promise.reject('not valid json data', jsonData);
        }
		const writePromise = fsPromise.writeFile(dbPath, JSON.stringify(jsonData))
        .then(result => {
            return {success: true};
        })
        .catch((err) => {
            throw err;
        })
        return writePromise;
    }
    const init = (dbPath) => {
        // return all supported method
        return {
            read,
            save,
        }
    }
    return {init};
}

const useJSONFile = (path) => {
    console.log('init db:', path)
    return jsonDB(path).init()
}

const validCheck = (db) => {
    const {assets, options, assetsActive} = db;
    const check1 = Array.isArray(assets) && Array.isArray(options) && Array.isArray(assetsActive);
    const check2 = assets.every(asset => {
        const {assetId, assetTitle, sources} = asset;
        const typeValid = assetId !== undefined && assetTitle !== undefined && Array.isArray(sources)
        const keyValid = sources.every(source => {
            const {srcId, srcLocal, srcRemote, srcType} = source;
            return srcId !== undefined && srcLocal !== undefined && srcRemote !== undefined && srcType !== undefined;
        })
        return typeValid && keyValid;
    })
    const check3 = assetsActive.every(asset => {
        const {assetId, assetTitle, sources} = asset;
        const typeValid = assetId !== undefined && assetTitle !== undefined && Array.isArray(sources)
        const keyValid = sources.every(source => {
            const {srcId, srcLocal, srcRemote, srcType} = source;
            return srcId !== undefined && srcLocal !== undefined && srcRemote !== undefined && srcType !== undefined;
        })
        return typeValid && keyValid;
    })

    return check1 && check2 && check3;
}


module.exports = useJSONFile;


// const main = async (path) => {
//     try {
//         const {read, save} = connect(path);
//         const ret = await save({a:1});
//         const saved = await read();
//         console.log(saved)
//     } catch(err){
//         console.log('error in main', err)
//     }
// }

// main('x:/b.json')