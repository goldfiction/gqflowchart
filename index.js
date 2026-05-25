//index.js

const http = require('http');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const multer = require('multer');
const WebSocket = require('ws');
const pty = require('node-pty');
var port=3443;

var Datastore = require('nedb')
    , db = new Datastore({ filename: '~/.gqflow/nedb.json', autoload: true });
console.log("nedb loaded...")
//db.ensureIndex({ fieldName: 'id', unique: true });

var gqfs = require('gqfs');
gqfs = gqfs.gqfs;

var fs=require('fs')

var _l = require('gqlodash').gqlodash
var doq=require('gqdoq')

shell="bash"
if(os.platform()=="win32"){
  shell="powershell.exe" //#"powershell.exe"
}
console.log(shell)

const options = {
    key: fs.readFileSync('./private/key.pem'),
    cert: fs.readFileSync('./private/cert.pem')
};

const path = require('path');
const { exec } = require('child_process');
const app = express();

app.use(basicAuth({
    users: { admin: 'admin' },
    challenge: true // <--- needed to actually show the login dialog!
}));

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
        cb(null,stdout)
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

app.post('/geteditorcontent', (req, res) => {
    db.find({id:req.auth.user}, function (err, docs) {   // Callback is optional
        if (docs.length >= 1) {
            res.status(200).send(docs[0].content);
        } else {
            res.status(400).send("failed to find document")
        }
    });
})

app.post('/editorcontent', (req, res) => {
    if (!req.body.content) {
        return res.status(400).send('No file content.');
    }
    db.update({ id: req.auth.user }, { $set: { content: req.body.content } }, { upsert: true }, function (err, numReplaced, upsert) {
        res.status(200).send("OK");
        //console.log("editorcontent saved!")
    });
})

app.post('/folder', (req, res) => {
    try {
        req.body.path = path.normalize(req.body.path)
        files = gqfs.dir(req.body.path)
        files.mapLimit(3, function (file, cb) {
            stats = gqfs.stat(req.body.path + "/" + file)
            realpath = fs.realpathSync(req.body.path + "/" + file)
            if (stats.isFile())
                cb(null, { file: file, type: "file", path: realpath })
            else if (stats.isDirectory())
                cb(null, { file: file, type: "folder", path: realpath })
            else
                cb(null, { file: file, type: "other", path: realpath })
        }, function (e,r) {
            res.send(JSON.stringify(r))
        })
    } catch (e) {
        res.send("[]")
    }
})

app.post('/path', (req, res) => {
    req.body.path = path.normalize(req.body.path)
    realpath = fs.realpathSync(req.body.path + "/" + (req.body.file || ""))
    res.send(realpath)
})

app.post('/cmd', (req, res) => {
    console.log(req.body)
    execCmd(req.body.command, function (e, r) {
        if (e)
            res.status(400).send({ message: e });
        else
            res.send(r);
    });
});

app.get('/user', (req,res) => {
    console.log(req.auth.user);
    res.send(req.auth.user);
})

app.get('/hello', (req, res) => {
    res.send('Hello from our server!')
})

server = http.createServer(app);
sslserver = https.createServer(options, app);

wss = new WebSocket.Server({server:sslserver});

wss.on('connection', (ws) => {
    // Spawn a new PTY process for each client connection
    const ptyProcess = pty.spawn(shell, [], { // Use 'cmd.exe' on Windows
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
    });

    console.log(`Client connected. PID: ${ptyProcess.pid}`);

    // Listen for data from the PTY process and send it to the client over WebSocket
    ptyProcess.on('data', function (data) {
        ws.send(data);
    });

    // Listen for messages from the client (user input) and write it to the PTY process
    ws.on('message', (message) => {
        ptyProcess.write(message);
    });

    // Handle connection closure
    ws.on('close', () => {
        ptyProcess.kill(); // Kill the PTY process when the client disconnects
        console.log(`Client disconnected. Killed PID: ${ptyProcess.pid}`);
    });
});

console.log('wss listening on port '+port);

//server.listen(80, () => {
//    console.log('server listening on port 80')
//})

sslserver.listen(port,() => {
    console.log('ssl server listening on port '+port)
})
