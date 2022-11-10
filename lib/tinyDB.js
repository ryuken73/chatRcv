const useJSONFile = require('./useJSONFile');
const debounce = require('debounce-promise');

const tinyDB = (path) => {
    try {
        const {read, save} = useJSONFile(path);
        const saveDebounced = debounce(save, 200);
        let db = {assets:[], menu:[], options:[]};
        const reReadDB = async () => {
            const jsonDB = await read();
            db = {
                ...db,
                ...jsonDB
            }
            return db;
        }
        const getAssets = () => {
            return db.assets;
        }
        const loadAssets = async () => {
            return getAssets();
        }
        const saveAssets = async (assets) => {
            db.assets = assets;
            return saveDebounced(db);
        }
        const selectAssetsActive = () => {
            return db.assetsActive;
        }
        const saveAssetsActive = async (assetsActive) => {
            db.assetsActive = assetsActive;
            return saveDebounced(db)
        }
        const saveMenu = async (menu) => {
            db.menu = menu;
            return saveDebounced(db)
        }
        const appendMenu = async (asset) => {
            db.menu.push(asset);
            await saveDebounced(db);
            return {success: true, menuLength: db.menu.length}
        }
        const deleteAssetActiveById = async (id) => {
            const targetIndex = db.assetsActive.findIndex(asset => asset.assetId === id );
            if(targetIndex === -1){
                return {success: false}
            }
            db.assetsActive.splice(targetIndex, 1);
            await saveDebounced(db)
            return {success: true, assetsActive: db.assetsActive};
        }
        const getOptions = async () => {
            return db.options;
        }
        const saveOptions = async (options) => {
            db.options = options;
            return saveDebounced(db);
        }
        const updateOption = async (key, value) => {
            const O_options = await loadOptions();
            const O_newOptions = {
                ...O_options,
                [key]: value
            }
            saveOptions(O_newOptions);
            return {success: true, affectedOption: key};
        }
        const selectAssetById = async (id) => {
            return db.assets.find((asset) => asset.assetId === id)
        }
        const appendAsset = async (asset) => {
            const assetId = Date.now();
            const created = (new Date()).toLocaleString();
            const updated = null;
            db.assets.push({...asset, assetId, created, updated});
            await saveDebounced(db)
            return {success: true, assetsLength: db.assets.length}
        }
        const deleteAssetById = async (id) => {
            const targetIndex = db.assets.findIndex(asset => asset.assetId === id );
            if(targetIndex === -1){
                return {success: false}
            }
            db.assets.splice(targetIndex, 1);
            await saveDebounced(db)
            return {success: true, menueLength: db.assets.length}
        }
        const updateAssetById = async (id, asset) => {
            const targetAsset = db.assets.find(asset => asset.assetId === id);
            const targetAssetIndex = db.assets.findIndex(asset => asset.assetId === id);
            if(targetAssetIndex === -1){
                return {success: false}
            }
            const updated = (new Date()).toLocaleString();
            db.assets[targetAssetIndex] = {...targetAsset, ...asset, updated}
            await saveDebounced(db)
            return {success: true, assetsLength: db.assets.length}
        }
        return {
            selectDB: reReadDB,
            selectAssets: loadAssets,
            selectAssetById,
            deleteAssetById,
            updateAssetById,
            appendAsset,
            selectOptions: getOptions,
            updateOption,
            selectAssetsActive,
            saveAssetsActive,
            deleteAssetActiveById,
            appendMenu

        }
    } catch (err) {
        console.error('error in tinyDB:', err)
    }
}

module.exports = tinyDB;
