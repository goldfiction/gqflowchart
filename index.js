//index.js

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

var gqfs = require('gqfs');
gqfs = gqfs.gqfs;

const path = require('path');
const { exec } = require('child_process');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public/www')); 

function execCmd(command,cb){ 
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            cb("Error executing command: "+error.message)
            return;
        }
        if (stderr) {
            console.error(`Command produced standard error: ${stderr}`);
            cb("Command produced standard error: "+stderr)
            return;
        }
        cb(null,"Command output (stdout):\n"+stdout)
        console.log(`Command output (stdout):\n${stdout}`);
    });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Files will be saved in the 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload route
app.post('/upload', upload.single('myFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send('File uploaded successfully: ' + req.file.filename);
});

app.post('/download', (req, res) => { 
    console.log(req.body);
    res.send(gqfs.readFile(req.body.file));
    console.log("Downloaded file: " + req.body.file);
})

app.post('/write', (req, res) => {
    console.log(req.body)

    if (!req.body.file) {
        return res.status(400).send('No file specified.');
    }

    if (!req.body.content) {
        return res.status(400).send('No file content.');
    }

    gqfs.writeFile(req.body.file, req.body.content);

    msg = 'File saved successfully: ' + req.body.file
    res.send(msg)
    console.log(msg)
});

app.post('/cmd', (req, res) => { 
    console.log(req.body)
    execCmd(req.body.command, function (e, r) {
        if (e)
            res.status(400).send({ message: e });
        else
            res.send(r);
    })    
})

app.get('/hello', (req, res) => {
    res.send('Hello from our server!')
})

app.listen(80, () => {
    console.log('server listening on port 80')
})