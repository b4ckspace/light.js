var util=require('util')
var Q = require('q');
var api = require('./client_socketio.js');

var client = new api('http://localhost:8012');

var roomname;
var devnames;

var pass = process.argv[2];

var roomname = process.argv[3];

client.on('ready', function() {
    Q.fcall(function(){
        console.log('connected');
        var deferred = Q.defer();
        client.set_priority('high', pass, function() {
            deferred.resolve()
        });
        return deferred.promise;
    })
    .then(function() {
        var deferred = Q.defer();
        client.get_controll(roomname, function() {
            deferred.resolve()
        });
        return deferred.promise;
    })
    .then(function(){
        var deferred = Q.defer();
        client.change_all(roomname, {r:0, g:0, b:0}, function() {
            console.log("pitch black")
            deferred.resolve()
        });
        return deferred.promise;
    });
});

