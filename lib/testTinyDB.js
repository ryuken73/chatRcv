const tinyDB = require('./tinyDB');
const logger = (msg) => {
    console.log(`[debug]`, msg)
}
logger(tinyDB)

const main = async () => {
    // init tinyDB
    const {
        loadDB,
        selectAssets,
        selectAssetById,
        deleteAssetById,
        updateAssetById,
        appendAsset,
        loadOptions,
        updateOption
    } = tinyDB('../db/db.json')

    // dump DB
    logger(await loadDB());
    // append asset
    await appendAsset({title:'1st asset'});
    /// dump assets
    logger(await selectAssets());
    // select asset by id
    const firstAssetId = (await selectAssets())[0].id;
    logger(await selectAssetById(firstAssetId))
    // update asset by id
    logger(await updateAssetById(firstAssetId, {title:'updated'}));
    logger(await selectAssets());
}

main()