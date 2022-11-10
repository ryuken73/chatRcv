const fsPromise = require('fs').promises;
const path = require('path');
const express = require('express');
const fs = require('fs');
const mkdirp = require('mkdirp');
const router = express.Router();
const utils = require('../utils');

const saveMedia = (inStream, outStream) => {
	return new Promise((resolve, reject) => {
		inStream.pipe(outStream)
		inStream.on('end', () => {
			resolve()
		})
		inStream.on('error', (err) => {
			console.log(err)
			reject(err);
		})
	})
}

router.put('/', async (req, res, next) => {
	const { fname, size, srcId } = req.query;
	const baseDir = req.app.get('MEDIA_ROOT');
	const httpMediaRoot = req.app.get('HTTP_MEDIA_ROOT');
	const dateString = utils.date.getString({dateOnly: true})
	const targetDir = path.join(baseDir, dateString);
	const httpPath = `${httpMediaRoot}/${dateString}/${fname}`
	mkdirp(targetDir)
	.then(async made => {
		const outFname = path.join(targetDir, fname);
		const inStream = req;
		const outStream = fs.createWriteStream(outFname)
		saveMedia(inStream, outStream)
		res.json({success:true, srcLocal:outFname, srcRemote:httpPath, size, srcId});
	})
	.catch(err => {
		console.error(err);
		res.json({success: false});
	})
})

module.exports = router;