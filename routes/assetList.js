const express = require('express');
const router = express.Router();
const tinyDB = require('../lib/tinyDB');
const fsPromise = require('fs').promises;

router.get('/', async (req, res, next) => {
	const assets = await global.db.selectAssets()
	console.log(assets)
	res.json({success:true, assetList: assets||[]});
})

router.put('/default', async (req, res, next) => {
	const defaultDB = req.app.get('DEFAULT_DB_FILE');
	const dbFile = req.app.get('DB_FILE_FULL');
	const result = await fsPromise.copyFile(defaultDB, dbFile);
	global.db = tinyDB(dbFile);
	await global.db.selectDB();
	res.json({success:true});
})

module.exports = router;