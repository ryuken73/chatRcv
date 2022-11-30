const https = require('https');

const number = {
    padZero(num){
        if(num < 10){
            return `0${num}`;
        }
        return num.toString();
    }
}

const string = {
    toObject(string, itemSep, keySep){
        if(typeof(string) !== 'string') return {};
        const itemArray = string.replace(/^\?/,'').split(itemSep);
        return itemArray.reduce((parsedObj, item) => {
            const key = item.split(keySep)[0];
            const value = item.split(keySep)[1];
            // console.log('**',key,value)
            parsedObj[key] = value;
            return parsedObj
        },{})
    }
}

const clone = {
    replaceElement(array, index, newElement){
        return [
            ...array.slice(0, index),
            newElement,
            ...array.slice(index+1)
        ]
    }
}

const date = {
    getString({date=new Date(), separator={}, dateOnly=false}){
        const {
            dateSep='', 
            timeSep='', 
            sep='.'
        } = separator;
        const year = date.getFullYear();
        const month = number.padZero(date.getMonth() + 1);
        const day = number.padZero(date.getDate());
        const hour = number.padZero(date.getHours());
        const minute = number.padZero(date.getMinutes());
        const second = number.padZero(date.getSeconds());
        const dateString = `${year}${dateSep}${month}${dateSep}${day}`;
        const timeString = `${hour}${timeSep}${minute}${timeSep}${second}`;
        return dateOnly ? dateString : `${dateString}${sep}${timeString}`;
    }
}

const getPgm = () => {
    return new Promise((resolve, reject) => {
        if(global.urlPgmId === null){
            console.error('url to get pgmid is null. please set URL_FOR_PGMID env var!');
            return;
        }
        console.log('execute periodic job: get pgmid');
        const request = https.request(global.urlPgmId, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk.toString());
            response.on('end', () => {
                const body = JSON.parse(data);
                const pgmMap = makePgmMap(body);
                resolve(pgmMap);
            })
        })
        request.on('error', (error) => {
            console.error(`error to request pgmid:${error.message}`);
        });
        request.end();
    })
}

const makePgmMap = (data) => {
    const pgmMap = new Map();
    const channelIds = Object.keys(data);
    channelIds.map(channelId => {
       const pgms = data[channelId];
       pgms.map(pgm => {
           const key = `${channelId}-${pgm.PGM_ID}`;
           const value = pgm.PGM_NM;
           pgmMap.set(key, value);
       })
    })
    console.log('size of PGM MAP is', pgmMap.size)
    return pgmMap
}

module.exports = {
    clone,
    date,
    string,
    getPgm,
    makePgmMap
}