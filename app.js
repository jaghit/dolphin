'use strict';

const express = require('express');
const app = express();

const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

const cors = require('cors');
app.use(cors());

function log(req, point) {
    let timestamp = new Date();
    let agent = req.headers['user-agent'];
    let address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let log = '\n[ TIMESTAMP ] ' + timestamp + ' [ IP ADDRESS ] ' + address + ' [ ENDPOINT ] Incoming request to ' + point + ' \n[ USERAGENT ] ' + agent;
    console.log(log);
    // fs.appendFile('log.txt', log + '\n', function (err) {
    //     if (err) throw err;
    // });
}

app.post('/new', (req, res) => {
    log(req, '/New');
    try {
        let _path = path.join('./Public/' + req.body.name + '/');
        if (!fs.existsSync(_path)) {
            fs.mkdirSync(_path);
            res.status(201);
            res.json({ exists: false, create: true });
        } else {
            res.status(200);
            res.json({ exists: true, create: false });
        }
    } catch (err) {
        console.log('[ ERROR ] Server crash !! (Might problem in POST)');
    }
});

app.post('/list', (req, res) => {
    log(req, '/List');
    try {
        let _path = path.join('./Public/' + req.body.path + '/');
        let body = {
            exists: true,
            folders: [],
            files: []
        };
        if (fs.existsSync(_path)) {
            let files = fs.readdirSync(_path);
            for (let i = 0; i < files.length; i++) {
                if (fs.lstatSync(_path + '/' + files[i]).isDirectory()) {
                    body.folders.push(files[i]);
                } else {
                    body.files.push(files[i]);
                }
            }
            res.status(200);
            res.json(body);
        } else {
            res.status(404);
            res.json({ exists: false });
        }
    } catch (err) {
        console.log('[ ERROR ] Server crash !! (Might problem in POST)');
    }
});

app.post('/upload', (req, res) => {
    log(req, '/Upload');
    try {
        var form = new multiparty.Form();
        form.parse(req, function (err, fields, files) {
            try {
                let oldPath = files.file[0].path;
                let newPath = path.join('./Public/' + fields.path[0] + '/');
                if (fs.existsSync(newPath)) {
                    newPath = path.join(newPath + '/' + files.file[0].originalFilename);
                    if (!fs.existsSync(newPath)) {
                        fs.rename(oldPath, newPath, (err) => {
                            if (err) throw err;
                            res.status(201);
                            res.json({ exists: false, create: true });
                        });
                    } else {
                        res.status(200);
                        res.json({ exists: true, create: false });
                    }
                } else {
                    res.status(404);
                    res.json({ exists: false });
                }
            } catch (err) {
                console.log('\n' + err + '\nFields: ' + fields.name + '\nFiles: ' + files.name);
            }
        });
    } catch (err) {
        console.log('[ ERROR ] Server crash !! (Might problem in POST)');
    }
});

app.post('/create', (req, res) => {
    log(req, '/Create');
    try {
        let _path = path.join('./Public/' + req.body.path + '/');
        if (fs.existsSync(_path)) {
            _path = path.join(_path + '/' + req.body.name)
            if (!fs.existsSync(_path)) {
                fs.mkdirSync(_path);
                res.status(201);
                res.json({ exists: false, create: true });
            } else {
                res.status(200);
                res.json({ exists: true, create: false });
            }
        } else {
            res.status(404);
            res.json({ exists: false, create: false });
        }
    } catch (err) {
        console.log('[ ERROR ] Server crash !! (Might problem in POST)');
    }
});

app.post('/download', (req, res) => {
    log(req, '/Download');
    try {
        let _path = path.join('./Public/' + req.body.path);
        // DO NOT DELETE OR REMOVE :P
        // let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        let fullUrl = req.protocol + '://' + req.get('host') + '/Public' + req.body.path;
        if (fs.existsSync(_path)) {
            res.status(200);
            res.json({ exists: true, file: fullUrl });
        } else {
            res.status(404);
            res.json({ exists: false });
        }
    } catch (err) {
        console.log('[ ERROR ] Server crash !! (Might problem in POST)');
    }
});

app.use(express.static('Public'));

app.post('/rename', (req, res) => {
    log(req, '/Rename');
    try {
        let _path = path.join('./Public/' + req.body.path);
        if (fs.existsSync(_path)) {
            let splitPath = req.body.path.split('/');
            splitPath[splitPath.length - 1] = req.body.name;
            let newPath = './Public';
            for (let i = 1; i < splitPath.length; i++) {
                newPath += '/' + splitPath[i];
            }
            fs.rename(_path, newPath, (err) => {
                if (err) throw err;
                res.status(200);
                res.json({ exists: true, rename: true });
            });
        } else {
            res.status(404);
            res.json({ exists: false, rename: false });
        }
    } catch (err) {
        console.log('[ ERROR ] Server crash !! (Might problem in POST)');
    }
});

app.post('/delete', (req, res) => {
    log(req, '/Delete');
    try {
        let _path = path.join('./Public/' + req.body.path);
        let deleted = false;

        if (fs.existsSync(_path)) {
            if (fs.lstatSync(_path).isDirectory()) {
                deleted = removeRecursive(_path);
            } else {
                fs.unlinkSync(_path);
                deleted = true;
            }
            res.status(200);
            res.json({ exists: deleted, delete: deleted });
        } else {
            res.status(404);
            res.json({ exists: deleted, delete: deleted });
        }
    } catch (err) {
        console.log('[ ERROR ] Server crash !! (Might problem in POST)');
    }
});

function removeRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                removeRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
        return true;
    } else {
        return false;
    }
};

app.listen(8080, () => {
    if (!fs.existsSync('./Public')) {
        fs.mkdirSync('./Public');
    }
    console.log('CORS-enabled web server listening on port 8080!');
})