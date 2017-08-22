const express = require('express');
const app = express();

const multiparty = require('multiparty');
const fs = require('fs');

const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/upload', (req, res) => {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        let oldPath = files.file[0].path;
        let newPath = './Public/' + fields.path[0] + '/' + files.file[0].originalFilename;
        fs.rename(oldPath, newPath, (err) => {
            if (err) throw err;
            res.status(201);
            res.send();
        });
    });
});

app.post('/create', (req, res) => {
    let dir = './Public/' + req.body.path;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        res.status(201);
        res.send();
    } else {
        res.status(200);
        res.send();
    }
});

app.listen(8080, () => {
    console.log('App listening on port 8080!');
})