const fsPromise = require('fs').promises;
const path = require('path');
const express = require('express');
const fs = require('fs');
const mkdirp = require('mkdirp');
const router = express.Router();
const utils = require('../utils');

const saveMedia = (inStream, outStream) => {
	return new Promise((resolve, reject) => {
		console.log(inStream);
		inStream.pipe(outStream)
		inStream.on('end', () => {
			resolve()
		})
		inStream.on('error', (err) => {
			reject(err);
		})
	})
}

router.get('/:assetId', async (req, res, next) => {
	const { assetId } = req.params;
	const asset = await global.db.selectAssetById(parseInt(assetId));
	res.json(asset);
});

router.put('/', async (req, res, next) => {
	const { assetTitle, sources, displayMode } = req.body;
	console.log('##',req.body)
	const result = await global.db.appendAsset({assetTitle, sources, displayMode});
	res.json(result);
})

router.post('/:assetId', async (req, res, next) => {
	const { assetId } = req.params;
	const { assetTitle, sources, displayMode } = req.body;
	const result = await global.db.updateAssetById(parseInt(assetId), {assetTitle, sources, displayMode});
	res.json(result);
});

router.delete('/:assetId', async (req, res, next) => {
	const { assetId } = req.params;
	const result = await global.db.deleteAssetById(parseInt(assetId));
	res.json(result);
});

module.exports = router;