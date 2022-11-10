const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
	const assetsActive = await global.db.selectAssetsActive();
	console.log(assetsActive);
	res.json({success:true, assetsActive: assetsActive||[]});
})

router.put('/', async (req, res, next) => {
	const { assetsActive } = req.body;
	console.log('##',req.body)
	const result = await global.db.saveAssetsActive(assetsActive);
	console.log(result)
	res.json(result);
})

router.delete('/:assetId', async (req, res, next) => {
	const { assetId } = req.params;
	const result = await global.db.deleteAssetActiveById(parseInt(assetId));
	res.json(result);
});

module.exports = router;