const fs = require('fs');

module.exports = {
    async writeFile(rStream, targetFname){
        return new Promise((resolve,reject) => {
            const wStream = fs.createWriteStream(targetFname, {flags:'w'});
            wStream.on('open', () => {
                global.logger.trace(`start write file [${targetFname}]`);
                rStream.pipe(wStream, {end:true});
            })
            
            wStream.on('error', (err) => {
                global.logger.error(err);
                reject(err);
            })

            rStream.on('error', (err) => {
                global.logger.error(err);
                wStream.end();
                reject('client disconnected');
            })

            rStream.on('end', () => {
                global.logger.trace(`end write file [${targetFname}]`);
                  wStream.end();
                resolve({success:true, targetFname});    
            })
        }) 
    },
    async moveFile(sourceFname, targetFname){
        return new Promise((resolve,reject) => {
            fs.rename(sourceFname, targetFname, (err) => {
                if(err){
                    global.logger.error(`error on moving file : ${targetFname}`);
                    reject({success:false});
                    return
                }
                resolve({success:true});
                global.logger.info(`success on moving file : ${targetFname}`);
            })
        })
    },
    async deleteFile(targetFname){
        return new Promise((resolve,reject) => {
            fs.unlink(targetFname, (err) => {
                if(err){
                    global.logger.error(`error on deleting file : ${targetFname}`);
                    global.logger.error(err);
                    reject();
                    return
                }
                resolve();
                global.logger.info(`success on deleting file : ${targetFname}`);
            })
        })
    }
}