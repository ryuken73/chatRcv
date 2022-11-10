const express = require('express');
const router = express.Router();
const {encryptUrl} = require('../lib/encryptUrl');
 
router.get('/', async (req, res, next) => {
	const cctvHost = req.app.get('CCTV_HOST');
	const cctvId = req.query.cctvId;
	const encryptedUrl = encryptUrl(cctvHost, cctvId);
	res.json({url: encryptedUrl});
})


module.exports = router;