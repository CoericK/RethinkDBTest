var express = require('express');
var r = require('rethinkdb');
var sockio = require("socket.io");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});






var io = sockio.listen(app.listen(8090));
console.log("App is listening on 8090");

r.connect({ host: '192.168.1.100'}).then(function(conn) {
  return r.table("todo").changes().run(conn);
})
.then(function(cursor) {
  cursor.each(function(err, item) {
    io.sockets.emit("update", item);
  });
});

io.on("connection", function(socket) {
  r.connect().then(function(conn) {
    return r.table("todo").run(conn)
      .finally(function() { conn.close(); });
  })
  .then(function(cursor) { return cursor.toArray(); })
  .then(function(output) { socket.emit("history", output) });

  socket.on("add", function(text) {
    r.connect().then(function(conn) {
      return t.table("todo").insert({text: text, done: false}).run(conn)
        .finally(function() { conn.close(); });
    })
  }).on("done", function(id, done) {
    r.connect().then(function(conn) {
      return r.table("todo").update({done: done}).run(conn)
        .finally(function() { conn.close(); });
    });
  });
});







module.exports = app;
