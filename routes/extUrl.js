const fsPromise = require('fs').promises;
const path = require('path');
const express = require('express');
const router = express.Router();

router.get('/latest', async (req, res, next) => {
	const jsonFname = req.app.get('EXT_URLS_FILE_FULL');
	res.download(jsonFname);
})

router.put('/save', async (req, res, next) => {
	const jsonFname = req.app.get('EXT_URLS_FILE_FULL');
	const backFname = `${jsonFname}.${Date.now()}`
	try {
		await fsPromise.copyFile(jsonFname, backFname);
		await fsPromise.writeFile(jsonFname, JSON.stringify(req.body));
		res.json({
			success: true,
			saveData: req.body
		})
	} catch (err) {
		console.error('error:', err);
		res.json({
			success: false,
			err: err.message
		})
	}
})

module.exports = router;