const express = require('express');
const router = express.Router();
 
router.get('/', async (req, res, next) => {
	const clipStoreFile = req.app.get('CCTV_CLIPSTORE_FILE')
	res.download(clipStoreFile);
})


module.exports = router;