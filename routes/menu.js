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

router.get('/:id', async (req, res, next) => {
	const { id } = req.params;
	const asset = await global.db.selectAssetById(parseInt(id));
	res.json(asset);
});

router.put('/', async (req, res, next) => {
	const { title, type, sources } = req.body;
	console.log('##',req.body)
	const result = await global.db.appendAsset({title, type, sources});
	res.json(result);
})

router.post('/:id', async (req, res, next) => {
	const { id } = req.params;
	const { title, type, src } = req.query;
	const result = await global.db.updateAssetById(parseInt(id));
	res.json(result);
});

router.delete('/:id', async (req, res, next) => {
	const { id } = req.params;
	const result = await global.db.deleteAssetById(parseInt(id));
	res.json(result);
});

module.exports = router;