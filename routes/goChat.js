const express = require('express');
const router = express.Router();
const kafkaClient = require('../lib/kafkaClient');

const KAFKA_KEY = 'goChat_key1';
const producer = kafkaClient.createProducer({});

const mkKafkaMsg = message => {
	return [
		{
			key: KAFKA_KEY,
			value: JSON.stringify(message)
		}
	]
}

router.post('/all', async (req, res, next) => {
	const { chatId, ...chatBody } = req.body;
	const topic = 'goChat';
	console.log('got message:', chatId, chatBody); 
	// push to goChat kafka topic
	const payloads = {
		topic,
		messages: mkKafkaMsg(req.body)
	}
	const sendResult = await kafkaClient.sendMessage(producer, payloads);
	console.log(sendResult);
	res.json({success:true});
});

router.post('/warn', (req, res, next) => {
	const { chatId, ...chatBody } = req.body;
	console.log('got message:', chatId, chatBody);
	global.chatMessages.push(req.body);
	// broadcast new warn message added using socket.io
	console.log(global.chatMessages);
	res.json({success:true});
});

router.put('/classifyResult', async (req, res, next) => {
	const { chatId, isError } = req.body;
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
	console.log(sendResult);
	res.json({success:true});
});

module.exports = router;