const express = require('express');
const expressServer = require('./lib/expressServer');
const path = require('path');
const fs = require('fs');
const tinyDB = require('./lib/tinyDB');

const mode = process.env.MODE || 'prod';
const ssl = process.env.SSL || 'on';
const SSL_MODE = ssl === 'off' ? false: true;
const HTTP_MEDIA_ROOT = process.env.HTTP_MEDIA_ROOT || 'http://10.10.104.264/media';
// change doc-root, db-file path and attach dir in prod env
const DOC_ROOT_PATH = mode === 'dev' ? 'D:/project/004.react/touch_config/build' : 'd:/touch_config/docs';
const DB_FILE = mode === 'dev' ? process.env.DB_FILE || 'D:/project/002.node/touch_config_server/db/db.json' : 'D:/touch_config/db/db.json';
const DEFAULT_DB_FILE = mode === 'dev' ? process.env.DEFAULT_DB_FILE || 'D:/project/002.node/touch_config_server/db/defaultDB.json' : 'D:/touch_config/db/defaultDB.json';
const MEDIA_ROOT = mode === 'dev' ? 'D:/project/002.node/touch_config_server/media' : 'D:/touch_config/media';
const certPath = path.join(__dirname, './ssl');

fs.access(DB_FILE, (err) => {
    if(err){
        console.error(`cannot access db file. touch empty db.json at ${DB_FILE} and start again.`);
        process.exit();
    }
})

console.log('MODE =', mode);
console.log('SSL_MODE =', SSL_MODE);
console.log('DOC_ROOT =', DOC_ROOT_PATH);
console.log('MEDIA_ROOT =', MEDIA_ROOT);
console.log('DB_FILE =', DB_FILE);
console.log('DEFAULT_DB_FILE =', DEFAULT_DB_FILE);
console.log('HTTP_MEDIA_ROOT =', HTTP_MEDIA_ROOT);

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
const logger = create({logFile:'tiny_socket_server.log'});

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

global.db = tinyDB(DB_FILE);
global.db.selectDB();

app.set('DB_PATH', path.dirname(DB_FILE));
app.set('DB_FILE', path.basename(DB_FILE));
app.set('DB_FILE_FULL', DB_FILE);
app.set('DEFAULT_DB_FILE', DEFAULT_DB_FILE);
app.set('MEDIA_ROOT', MEDIA_ROOT);
app.set('HTTP_MEDIA_ROOT', HTTP_MEDIA_ROOT);

const assetRouter = require('./routes/asset');
const assetListRouter = require('./routes/assetList');
const attachRouter = require('./routes/attach');
const menuRouter = require('./routes/menu');
const assetsActiveRouter = require('./routes/assetsActive');

app.use('/asset', assetRouter);
app.use('/assetList', assetListRouter);
app.use('/attach', attachRouter);
app.use('/menu', menuRouter);
app.use('/assetsActive',assetsActiveRouter);
app.use('/config', express.static(DOC_ROOT_PATH));
app.use('/media', express.static(MEDIA_ROOT));

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