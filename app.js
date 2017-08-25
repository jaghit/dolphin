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
    let log = '\n[ TIMESTAMP ] ' + timestamp + '\n[ ENDPOINT ] Incoming request to ' + point + ' \n[ USERAGENT ] ' + agent + '\n[ IP ADDRESS ] ' + address;
    console.log(log);
}

app.post('/new', (req, res) => {
    log(req, '/New');

    let _path = path.join('./Public/' + req.body.name + '/');
    if (!fs.existsSync(_path)) {
        fs.mkdirSync(_path);
        res.status(201);
        res.json({ exist: false, create: true });
    } else {
        res.status(200);
        res.json({ exist: true, create: false });
    }
});

app.post('/list', (req, res) => {
    log(req, '/List');

    let _path = path.join('./Public/' + req.body.path + '/');
    let body = {
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
        res.json({ exist: false });
    }

});

app.post('/upload', (req, res) => {
    log(req, '/Upload');

    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        let oldPath = files.file[0].path;
        let newPath = path.join('./Public/' + fields.path[0] + '/');
        if (fs.existsSync(newPath)) {
            newPath = path.join(newPath + '/' + files.file[0].originalFilename);
            if (!fs.existsSync(newPath)) {
                fs.rename(oldPath, newPath, (err) => {
                    if (err) throw err;
                    res.status(201);
                    res.json({ exist: false, create: true });
                });
            } else {
                res.status(200);
                res.json({ exist: true, create: false });
            }
        } else {
            res.status(404);
            res.json({ exists: false });
        }
    });
});

app.post('/create', (req, res) => {
    log(req, '/Create');

    let _path = path.join('./Public/' + req.body.path + '/');
    if (fs.existsSync(_path)) {
        _path = path.join(_path + '/' + req.body.name)
        if (!fs.existsSync(_path)) {
            fs.mkdirSync(_path);
            res.status(201);
            res.json({ exist: false, create: true });
        } else {
            res.status(200);
            res.json({ exist: true, create: false });
        }
    } else {
        res.status(404);
        res.json({ exist: false, create: false });
    }
});

app.post('/delete', (req, res) => {
    log(req, '/Delete');

    let _path = path.join('./Public/' + req.body.path);
    let deleted = removeRecursive(_path);
    res.status(200);
    res.json({ exist: deleted, delete: deleted });
});

function removeRecursive(_path) {
    if (fs.existsSync(_path)) {
        fs.readdirSync(_path).forEach(function (file, index) {
            var curPath = _path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                removeRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(_path);
        return true;
    } else {
        return false;
    }
};

app.listen(8080, () => {
    console.log('CORS-enabled web server listening on port 8080!');
})