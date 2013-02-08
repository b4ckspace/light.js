var util=require('util')
var events = require('events');
var socket_client = require('socket.io-client')

var api_functions = [   "get_rooms", "get_devices", "get_devicestatus",
                        "change_device", "change_some", "change_all", "change_room",
                        "sync_all", "setPriority",
                        "has_controll", "get_controll", "can_get_controll", "release_controll"];

var Client = function(url){
    events.EventEmitter.call(this);
    this.socket = socket_client.connect(url);
    var that = this;
    this.socket.on('connect', function(){
        that.emit('ready')
    });
};

util.inherits(Client, events.EventEmitter);

api_functions.forEach(function(cmd){
    Client.prototype[cmd]=function(){
        // console.log("sendcmd : %s || %s", cmd, util.inspect(arguments))
        var args = Array.prototype.slice.apply(arguments, [0]);
        var cb=args[args.length-1];
        if(typeof(cb) == 'function') {
            var that=this;
            args[args.length-1]=function(response){
                if(response.ok){
                    cb(response.data)
                }else{
                    that.emit('error', cmd, response.error)
                }
            };
        }
        args.unshift(cmd)
        this.socket.emit.apply(this.socket, args);
    };
});

module.exports=Client;