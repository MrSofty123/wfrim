
const fs = require('fs')
const Os = require('os')
const path = require('path')
const filepath = Os.homedir() + '/Documents/testapp/relicDB.json'

fs.open(filepath,'r',function(err, f) {
if (err) {
    ensureDirectoryExistence(filepath)
    fs.writeFile( filepath, "[]", (err) => {
        if (err) console.error(err)
        console.log('Data written')
    });
    console.log(`event.reply('getRelicDB', {data: "[]", success:true});`)
} else {
    fs.readFile(filepath,'utf8',(err,data) => {
        if (err)
        console.log(err)
        console.log(`event.reply('getRelicDB', err ? {data: err, success:false}:{data: data.replace(/^\uFEFF/, ''), success:true});`)
    })
}
});

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}