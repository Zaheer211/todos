
const express = require('express');
const redis = require('redis');
const redisSub = require('redis').createClient();
const socket = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const app = express();
const PORT = 3000;

const redisClient = redis.createClient();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});

io = socket(server);

io.on('connection', () => {
    console.log("Socket connection established...");
});

redisClient.config('SET',"notify-keyspace-events", "KEA");
redisClient.on('connect', () => {
    console.log("Connected to redis");
});

redisSub.on('pmessage', (pattern, channel, msg) => {
    if(msg === "expired"){
        console.log(pattern, channel, msg);
        console.log("Our required key is:", channel.split(':').pop())
        let expiredTodoId = channel.split(':').pop();
        io.emit('todoExpired', expiredTodoId);
    }
});

redisSub.psubscribe('__keyspace@0__:*', (err) => {
    if (err) console.error('Error subscribing to pattern', err)
});

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    let allTodos = [];
    let count = 0;
    redisClient.keys('todo__*', (err, arrayOfKeys) => {
        if (err) throw err;
        
        arrayOfKeys.forEach((key, index) => {
            count++;

            allTodos.push(new Promise((resolve, reject) => {
                redisClient.get(key, (err, todo) => {
                    if(err) {
                        reject(err)
                    }else{
                        resolve(JSON.parse(todo));
                    }
                });
            }));

            if (count === arrayOfKeys.length) {
                
                Promise.all(allTodos).then(todos => {
                    console.log(todos);
                    res.render('index', {todos: todos, moment: moment});
                }).catch(err => {
                    throw err;
                })
            }
        });
    });
});

app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', (req, res) => {

    let todo = {
        id: "todo__" + uuidv4(),
        title: req.body.title,
        detail: req.body.detail,
        expiry: new Date(req.body.expiry),
    }

    let todoExpiresInSec = Math.round(((todo.expiry.getTime() - (Date.now())) / 1000));

    redisClient.set(todo.id, JSON.stringify(todo), 'EX', todoExpiresInSec, function (err, response) {
        if (err) {
            console.error(err);
        } else {
            console.log(response);
            res.redirect('/');
        }
    });
});
