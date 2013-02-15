var socketio = require('socket.io')
var util = require('util')
module.exports.start=function(controller) {
    var port = 8012;
    var io = socketio.listen(port);
    console.log("socketio frontend listening on port %s", port);
    io.sockets.on('connection', function (socket) {
        var client = controller.create_handler();
        socket.on('disconnect', function(argument) {
            client.client_exit();
        });
        client.exposed_functions.forEach(function(cmd){
            socket.on(cmd, function(){
                var args = Array.prototype.slice.apply(arguments, [0]);
                var error = false;
                var res, reason;
                try{
                    res = client[cmd].apply(client, args);
                }catch(e) {
                    if(!e.known_error)
                        throw e;
                    error = true;
                    reason = e.reason;
                    console.log(arguments)
                    console.log(e)
                }
                var cb=args[args.length-1];
                if(typeof(cb) == 'function') {
                    cb({ok:!error, data:res, error: reason});
                }
            })
        });
    });
};
