var util=require('util')
var Q = require('q');
var api = require('./client_socketio.js');

var client = new api('http://localhost:8012');

client.on('ready', function(){
    Q.fcall(function(){
        var deferred = Q.defer();
        client.get_version(function(version){
            console.log('connected to light.js version %s', version)
            deferred.resolve()
        });
        return deferred.promise;
    })
    .then(function(){
        var deferred = Q.defer();
        client.sync_all(function(){
            deferred.resolve()
        });
        return deferred.promise;
    })
    .then(function(){
        var deferred = Q.defer();
        client.get_rooms(function(rooms){
            deferred.resolve(rooms)
        });
        return deferred.promise;
    })
    .then(function(rooms){
        var promises = [];
        rooms.forEach(function(room){
            promises.push(printRoom(room));
        });
        return Q.all(promises)
    })
    .done(function(){
        console.log("end of room list");
        process.exit();}
    );
});

var printRoom = function(roomname){
    var deferred = Q.defer();
    client.get_devices(roomname, function(devices){
        var promises = [];
        devices.forEach(function(devname){
            var deferred = Q.defer();
            client.get_devicestatus(roomname, devname, function(data){
                deferred.resolve([devname, data]);
            })
            promises.push(deferred.promise);
        });
        Q.allResolved(promises)
        .then(function (promises) {
            console.log("%s:", roomname)
            promises.forEach(function(promise) {
                if (promise.isFulfilled()) {
                    var status = promise.valueOf();
                    var color = status[1];
                    console.log("\t %s: rgb(%s, %s, %s)", status[0], color.r, color.g, color.b);
                } else {
                    var exception = promise.valueOf().exception;
                }
            })
        })
        .then(function(){deferred.resolve()});
    })
    return deferred.promise;
};