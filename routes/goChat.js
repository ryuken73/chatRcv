const express = require('express');
const router = express.Router();
const kafkaClient = require('../lib/kafkaClient');

const KAFKA_KEY = 'goChat_key1';
const producer = kafkaClient.createProducer({});

const utils = require('../utils')
const {elkMethod} = utils;

const mkKafkaMsg = message => {
	return [
		{
			key: KAFKA_KEY,
			value: JSON.stringify(message)
		}
	]
}

router.post('/all', async (req, res, next) => {
	const { chatId, channelId, vodId, ...chatBody } = req.body;
	const pgmKey = `${channelId}-${vodId}`;
	const vodName = global.pgmMap.get(pgmKey);
	const topic = 'goChat';
	console.log('got message:', chatId, vodName, chatBody); 
	global.logger.info(`got message: ${chatId}, ${vodName} ${chatBody.text}`); 
	// push to goChat kafka topic
	const payloads = {
		topic,
		messages: mkKafkaMsg({...req.body, vodName, isError: false})
	}
	const sendResult = await kafkaClient.sendMessage(producer, payloads);
	// console.log(sendResult);
	res.json({success:true});
});

router.post('/warn', (req, res, next) => {
	const { chatId, channelId, vodId, ...chatBody } = req.body;
	const pgmKey = `${channelId}-${vodId}`;
	const vodName = global.pgmMap.get(pgmKey);
	console.log('got message:', chatId, vodName, chatBody);
	global.logger.info(`got warn message: ${chatId}, ${vodName} ${chatBody.text}`); 
	global.chatMessages.push({...req.body, vodName});
	// broadcast new warn message added using socket.io
	// console.log(global.chatMessages);
	const rootNamespace = req.app.get('io').of('/');
	rootNamespace.emit('newWarnMessage', {...req.body, vodName});
	res.json({success:true});
});

router.get('/warn', (req, res, next) => {
	res.json(global.chatMessages);
})

router.put('/classifyResult', async (req, res, next) => {
	const { chatId, isError } = req.body;
	try {
		const searchResult = await elkMethod.getDocIdfromChatId(chatId);
		const success = await elkMethod.updateIsErrorById(searchResult._id, isError);
		if(success){
			global.chatMessages = global.chatMessages.filter(chat => chat.chatId !== chatId);
			console.log(`update isError of chatId:${chatId} to ${isError} success!`);
		} else {
			console.log(`update isError of chatId:${chatId} to ${isError} failed!`);
		}
		res.json({success});
	} catch (err) {
		console.error(err);
		console.log(`update isError of chatId:${chatId} to ${isError} failed!`);
		res.json({success:false, msg:err});
	}
});

router.put('/classifyResult_old', async (req, res, next) => {
	const { chatId, isError } = req.body;
	console.log(req.headers)
	const topic = 'goChatWarn';
	const chat = global.chatMessages.find(chat => chat.chatId === chatId);
	if(chat === undefined){
		res.json({success: false, msg: `chatId[${chatId}] not found`});
		return;
	}
	chat.isError = isError;
	const payloads = {
		topic,
		messages: mkKafkaMsg(chat)
	}
	const sendResult = await kafkaClient.sendMessage(producer, payloads);
	global.chatMessages = global.chatMessages.filter(chat => chat.chatId !== chatId);
	console.log(sendResult);
	res.json({success:true});
});

module.exports = router;