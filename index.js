const express = require('express');
const expressServer = require('./lib/expressServer');
const path = require('path');
const fs = require('fs');
const tinyDB = require('./lib/tinyDB');
const scheduler = require('./lib/cronScheduler');
const utils = require('./utils');
const {getPgm} = utils;
const {startSchedule} = scheduler;

const mode = process.env.MODE || 'prod';
const ssl = process.env.SSL || 'on';
const SSL_MODE = ssl === 'off' ? false: true;
const DOC_ROOT_PATH = mode === 'dev' ? 'D:/project/004.react/chatRcv/build' : '/node_project/chatRcv_docs/build';
const URL_FOR_PGMID = process.env.URL_FOR_PGMID || null;
const certPath = path.join(__dirname, './ssl');

console.log('MODE =', mode);
console.log('SSL_MODE =', SSL_MODE);
console.log('DOC_ROOT_PATH =', DOC_ROOT_PATH);
console.log('URL_FOR_PGMID =', URL_FOR_PGMID);


global.urlPgmId = URL_FOR_PGMID;
getPgm().then(result => global.pgmMap = result);
startSchedule();

const option = {
    publicDirectory: DOC_ROOT_PATH,
    mode: mode,
    enableCors: true
}

let httpsOption = null;
try {
    httpsOption = SSL_MODE && {
        ...option,
        sslOptions: {
            key: fs.readFileSync(path.join(certPath, 'sbs.co.kr.key')),
            cert: fs.readFileSync(path.join(certPath, 'sbs.co.kr.crt')),
            ca: fs.readFileSync(path.join(certPath, 'chainca.crt')),
        }
    }    
} catch (err) {
    console.error('Cannot find SSL related files(key and cert files). To continue, set env variable "SSL" off.');
    process.exit(99)
}


const [app, httpServer] = expressServer.httpServer.create(option);
const [appHttps, httpsServer] = httpsOption ? expressServer.httpsServer.create(httpsOption) : [null, null];


const ioOption = {cors: {origin: '*'}};
const io = require('socket.io')(httpServer, ioOption);
const {create, setLevel} = require('./lib/logger')();
const logger = create({logFile:'chatRcv.log'});
global.logger = logger;

io.on('connection', socket =>{
    onConnect(socket);
    attachHandler(socket, io);
    socket.on('disconnect', reason => {
        console.log('disconnected:', socket.mode);
        if(socket.mode){
            socket.broadcast.emit('reset:recorders', socket.mode);
        }
    })
})

const onConnect = socket => {
    console.log('connected: ', socket.handshake.address);
}

const attachHandler = (socket, io) => {
    socket.onAny((eventName, ...args) => {
        logger.debug(`event: [${eventName}] from [${socket.handshake.address}]:[%j]`, args);
        if(eventName === 'setMode'){
            socket.mode = args[0];
            return;
        }
        socket.broadcast.emit(eventName, args[0])
    })
}

const goChatRouter = require('./routes/goChat');
global.chatMessages = [];

app.set('DOC_ROOT_PATH', DOC_ROOT_PATH);
app.set('io', io);

// requests from external network has headers 'from-sslproxy':true
// prevent accessing classifyPage from external requests
const chkHeader = (req, res, next) => {
    // console.log(req.headers);
    if(req.headers['from-sslproxy'] === 'true'){
        res.sendStatus(401)
        return;
    }
    next();
}
app.use('/goChat', goChatRouter);
app.use('/classify', chkHeader, express.static(DOC_ROOT_PATH));

expressServer.attachErrorHandleRouter(app);

// implement cmdMap functions
const printHelp  = () => { 
	console.log("Valid commands : %s", Object.keys(cmdMap).join(' ')) ;
};
const loglevel = argv => { 
	const level = argv.shift().trim();
	const validLevel = ["error","warn","info","debug","trace"];
	if(validLevel.includes(level)){
		setLevel(level);
		logger[level]('log level chagned to %s', level);
	}else{
		console.log('specify level one of %s', validLevel.join(' '));
	}
};
const quit = () => {
    console.log('exit application....');
    process.exit(0);
}
//

const cmdMap = { "help" : printHelp, "log" : loglevel, "quit": quit }; //log debug라고 console치면 debug레벨로 변경됨

process.stdin.resume();
process.stdin.setEncoding('utf-8');
process.stdin.on('data',function(param){
	const paramArray = param.split(' ');
	const cmd = paramArray.shift();
	try {
		cmdMap[cmd.trim()](paramArray);
	} catch(ex) { 
        console.error('Not valid command.')
		cmdMap.help();		
	}
});