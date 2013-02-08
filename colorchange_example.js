var util=require('util')
var Q = require('q');
var api = require('./client_socketio.js');

var client = new api('http://localhost:8012');

var roomname;
var devnames;

client.on('ready', function() {
    Q.fcall(function(){
        var deferred = Q.defer();
        client.get_rooms(function(roomlist) {
            deferred.resolve(roomlist)
        });
        return deferred.promise;
    })
    .then(function(rooms) {
        roomname = rooms[0];
        var deferred = Q.defer();
        client.get_devices(rooms[0], function(devicelist) {
            deferred.resolve(devicelist)
        });
        return deferred.promise;
    })
    .then(function(devices){
        devnames = devices;
        var deferred = Q.defer();
        client.get_control(roomname, function() {
            deferred.resolve()
        });
        return deferred.promise;
    })
    .then(run);
});

var run = function() {
    console.log("run")
    console.log(util.inspect(devnames))
    devnames.forEach(function(dev) {
        var r=Math.round(Math.random()*255);
        var g=Math.round(Math.random()*255);
        var b=Math.round(Math.random()*255);
        console.log("%s, %s, %s", roomname, dev, {r:r, g:g, b:b})
        client.change_device(roomname, dev, {r:r, g:g, b:b});
    });
    setTimeout(run, 500);
};