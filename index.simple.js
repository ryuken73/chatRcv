const httpServer = require('http').createServer();
const options = {};
const io = require('socket.io')(httpServer, options);

const HTTP_PORT = 9000;

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
        console.log(`event: [${eventName}] from [${socket.handshake.address}]:`, args);
        if(eventName === 'setMode'){
            socket.mode = args[0];
            return;
        }
        socket.broadcast.emit(eventName, args[0])
    })
}

httpServer.listen(HTTP_PORT);


