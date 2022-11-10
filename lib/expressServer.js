// const createError = require('http-errors');
const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const cors = require('cors');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const compression = require('compression');
const helmet = require('helmet');
const rfs = require('rotating-file-stream');
const fs = require('fs');
const mkdirp = require('mkdirp');

// const MAIN_FILE_PATH = path.dirname(require.main.filename);
const MAIN_FILE_PATH = path.dirname(process.execPath);
const LOG_DIR = path.join(process.cwd(), 'log');
fs.existsSync(LOG_DIR) && mkdirp(LOG_DIR)
const accessLogStream = rfs.createStream('access.log', {
   interval: '1d',
   path: LOG_DIR
})

logger.token('dateLocal', (req, res) => { const date = new Date(); return date.toLocaleString(); })

const accessLogToken = {
    'prod': ':remote-addr - :remote-user [:dateLocal] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    'dev': 'common'
}

const normalizePort = (val) => {
   const  port = parseInt(val, 10); 
   if (isNaN(port)) {
     // named pipe
     return val;
   }
   if (port >= 0) {
     // port number
     return port;
   } 
   return false;
 }

const defaultListenHandler = (server) => {
   return () => {
      const addr = server.address();
      const bind = typeof addr === 'string'
         ? 'pipe ' + addr
         : 'port ' + addr.port;
      console.log('Listening on ' + bind);
      }
}

const defaultErrorHandler = port => {
   return error => {
      if (error.syscall !== 'listen') {
         throw error;
      }
   
      const bind = typeof port === 'string'
      ? 'Pipe ' + port 
      : 'Port ' + port;
   
      // handle specific listen errors with friendly messages
      switch (error.code) {
      case 'EACCES':
         console.error(bind + ' requires elevated privileges');
         process.exit(1);
         break;
      case 'EADDRINUSE':
         console.error(bind + ' is already in use');
         process.exit(1);
         break;
      default:
         throw error;
      }
   }
}

const DEFAULT_OPTIONS = {
   HTTP :  {
      port: normalizePort(process.env.HTTP_PORT|| global.USER_PORT || '80'),
      onError: defaultErrorHandler,
      onListen: defaultListenHandler,
   },
   HTTPS : {
      port: normalizePort(process.env.HTTPS_PORT || '443'),
      onError: defaultErrorHandler,
      onListen: defaultListenHandler,      
   }
}

const createServer = ({publicDirectory='public', mode='dev', enableCors=false}) => {
   const app = express();
   app.use(logger(accessLogToken[mode], {stream: accessLogStream}));
   app.use(compression());
   app.use(express.json());
   app.use(express.urlencoded({ extended: false }));
   // app.use(bodyParser.json());
   app.use(bodyParser.urlencoded({ extended: false }));
   app.use(cookieParser());
   console.log('###', enableCors)
   enableCors && app.use(cors());
   let staticPath;
   if(path.isAbsolute(publicDirectory)){
       staticPath = publicDirectory;
       app.use(express.static(publicDirectory));
   } else {
       staticPath = path.join(MAIN_FILE_PATH, publicDirectory);
   }
   console.log('public path =', path.resolve(staticPath))
   app.use(express.static(staticPath));
   app.use(helmet({contentSecurityPolicy:false}));
   app.set('env', mode);
   return app;
}

const attachErrorHandleRouter = app => {
   // console.log(`Attaching Error Handler.`);
   app.use((req, res, next) => {
      next(createError(404));
    });    

   // error handler
   app.use((err, req, res, next) => {
      const mode = req.app.get('env');
      const errorMessages = mode === 'dev' ? err : err.message;
      // return error code
      res.status(err.status || 500);
      res.json({error: JSON.stringify(errorMessages)})
   });
}

const httpServer = {
    create : (options={}) => {
        const {
            publicDirectory='public',
            mode='dev',
            httpOptions={},
            enableCors=false
        } = options;
        const app = createServer({publicDirectory, mode, enableCors});
        const optionDerived = {
            ...DEFAULT_OPTIONS.HTTP,
            ...httpOptions
        }
        const {port, onError, onListen} = optionDerived;
        // attachErrorHandleRouter(app);
        const server = http.createServer(app);
        server.listen(port);
        server.on('listening', onListen(server));
        server.on('error', onError(port));
        return [app, server];
    }
}

const httpsServer = {
    create : (options={}) => {
        const {
            publicDirectory='public',
            mode='dev',
            enableCors=false,
            httpsOptions={},
        } = options;
        const app = createServer({publicDirectory, mode, enableCors});
        const optionDerived = {
            ...DEFAULT_OPTIONS.HTTPS,
            ...httpsOptions
        }
        const {port, onError, onListen} = optionDerived;
        attachErrorHandleRouter(app);
        const server = https.createServer(app);
        server.listen(port);
        server.on('listening', onListen(server));
        server.on('error', onError(port));
        return [app, server];
    }
}
module.exports = {
   httpServer,
   httpsServer,
   attachErrorHandleRouter
}