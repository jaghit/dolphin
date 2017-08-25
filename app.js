const express = require('express');
const app = express();

const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/new', (req, res) => {
    let dir = path.join('./Public/' + req.body.name);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        res.status(201);
        res.json({name: req.body.name, exists: false});
    } else {
        res.status(200);
        res.json({name: req.body.name, exists: true});
    }
});

app.post('/list', (req, res) => {
    let dir = path.join('./Public/' + req.body.path);
    var body = {
        folders: [],
        files: []
    };
    let files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
        if (fs.lstatSync(dir + '/' + files[i]).isDirectory()) {
            body.folders.push(files[i]);
        } else {
            body.files.push(files[i]);
        }
    }
    res.status(200);
    res.json(body);
});

app.post('/upload', (req, res) => {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        let oldPath = files.file[0].path;
        let newPath = path.join('./Public/' + fields.path[0] + files.file[0].originalFilename);
        if (!fs.existsSync(newPath)) {
            fs.rename(oldPath, newPath, (err) => {
                if (err) throw err;
                res.status(201);
                res.json({file: files.file[0].originalFilename, exists: false});
            });
        } else {
            res.status(200);
            res.json({file: files.file[0].originalFilename, exists: true});
        }

    });
});

app.post('/create', (req, res) => {
    let dir = path.join('./Public/' + req.body.path + req.body.name);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        res.status(201);
        res.json({folder: req.body.name, exists: false});
    } else {
        res.status(200);
        res.json({folder: req.body.name, exists: true});
    }
});

app.listen(8080, () => {
    console.log('App listening on port 8080!');
})