var fs = require('fs');
var util = require('util');
var artnet = require('artnet-node');
var Handler = require('./handler.js');
var array_remove = function(array, elem) {
  delete array[array.indexOf(elem)];
  return array.filter(function(value){return value!= undefined})
};

var parseConfig = function(cfg){
    var rooms = {};
    for(var roomname in cfg.rooms){
        var room = {};
        var devid = 0;//unique devicenames per room if no name is given
        for(var i in cfg.rooms[roomname]){
            var dev = cfg.rooms[roomname][i];
            var devicename = "device " + devid;
            if(dev.name){
                devicename = dev.name;
            }
            room[devicename] = parseDevice(dev);
            devid++;
        }
        rooms[roomname] = room;
    }
    return {rooms : rooms,
            config: cfg.config}; // validate config
};

var parseDevice = function(dev){ //better validation and parsing needed :O
    if(dev.type != "rgb")
        throw "only rgbdevices are supported :( " + util.inspect(dev)
    if((dev.r+dev.g+dev.b+dev.channel+dev.modechannel+dev.mode) == NaN)
        throw "missing required variables"
    if(dev.name)
        delete dev.name
    return dev;
};

var Controller = function(cfg){
    var port = cfg.config.port || 6454
    console.log("Using ola server: %s:%s", cfg.config.host, port)
    this.client  = new artnet.Client.ArtNetClient(cfg.config.host, port);
    this.client.UNIVERSE = [1,0];
    this.dmx_dta = new Array(512);
    for(var i=0;i<512;i++)
        this.dmx_dta[i]=0;
    this.rooms = cfg.rooms;
    this.cfg = cfg.config;
    this.queues = {};
    this.version = "0.0.2";
    for(var room in this.rooms){
        this.queues[room] = {   low:[],
                                medium:[],
                                high:[]};
        for(var devname in this.rooms[room]){
            var device = this.rooms[room][devname];
            if(device.modechannel != -1)
                this.dmx_dta[device.channel+device.modechannel-1] = device.mode;
            device._r = device.channel+device.r-1;
            device._g = device.channel+device.g-1;
            device._b = device.channel+device.b-1;
            this.dmx_dta[device._r] = 255;
            this.dmx_dta[device._g] = 255;
            this.dmx_dta[device._b] = 255;
        }
    }
    this.apply_save();
    for(var i in this.cfg.frontends){
        console.log("Starting frontend %s", this.cfg.frontends[i])
        var frontend = require("./frontend_" + this.cfg.frontends[i]);
        frontend.start(this);
    }
    this.update();

    var that=this;

    process.on( 'SIGUSR2', function() {
        that.generate_save();
        process.exit();
    });
    process.on( 'SIGINT', function() {
        that.generate_save();
        process.exit();
    });
};

Controller.prototype.create_handler = function() {
    return new Handler(this, this.rooms, this.cfg);
};

Controller.prototype.update = function() {
    for(var room in this.rooms){
        var prios = ["high", "medium", "low"];
        for(var i in prios){
            var prio = prios[i]
            var handler = this.queues[room][prio][this.queues[room][prio].length-1];
            if(!handler)
                continue
            for(var devn in this.rooms[room]){
                var dev = this.rooms[room][devn];
                var _r = dev._r;
                var _g = dev._g;
                var _b = dev._b;
                this.dmx_dta[_r] = handler.dmx_dta[_r];
                this.dmx_dta[_g] = handler.dmx_dta[_g];
                this.dmx_dta[_b] = handler.dmx_dta[_b];
            }
            break;
        }
    }
    this.client.send(this.dmx_dta);
    var that = this;
    setTimeout(function(){that.update()}, 100);
};

Controller.prototype.generate_save = function() {
    var dta = {};
    for(var room in this.rooms){
        for(var devicename in this.rooms[room]){
            var device = this.rooms[room][devicename];
            var key = [room, devicename, device.type].join('|||');
            var rgb = {
                r: this.dmx_dta[device._r],
                g: this.dmx_dta[device._g],
                b: this.dmx_dta[device._b]
            };
            dta[key] = rgb;
        }
    }
    console.log("writing current light status to disk");
    fs.writeFileSync("lightcache.json", JSON.stringify(dta));
};

Controller.prototype.apply_save = function() {
    if(!fs.existsSync("lightcache.json"))
        return;
    console.log("restoring previous light settings");
    var data = JSON.parse(fs.readFileSync("lightcache.json"));
    for(var room in this.rooms){
        for(var devicename in this.rooms[room]){
            var device = this.rooms[room][devicename];
            var key = [room, devicename, device.type].join('|||');
            if(!data[key])
                continue;
            this.dmx_dta[device._r] = data[key].r;
            this.dmx_dta[device._g] = data[key].g;
            this.dmx_dta[device._b] = data[key].b;
        }
    }
};
Controller.prototype.handler_has_control = function(roomname, handler) {
    var prios = ["high", "medium", "low"];
    for(var i in prios){
        var prio = prios[i]
        if(this.queues[prio].length == 0)
            continue
        if(this.queues[prio].indexOf(handler) != (this.queues[prio].length-1)){
            return false
        }else{
            return true
        }
    }
};
Controller.prototype.handler_get_priority_control = function(roomname) {
    var prios = ["high", "medium", "low"];
    for(var i in prios){
        var prio = prios[i]
        if(this.queues[prio].length != 0)
            return prio;
    }
    return "low"
};
Controller.prototype.handler_get_control = function(roomname, prio, handler) {
    this.handler_release_control(roomname, prio, handler)
    this.queues[roomname][prio].push(handler);

};
Controller.prototype.handler_release_control = function(roomname, prio, handler) {
    this.queues[roomname][prio] = array_remove(this.queues[roomname][prio], (handler));
};

Controller.prototype.handler_exit = function(handler){
    for(var room in this.queues){
        for(var prio in this.queues[room]){
            this.handler_release_control(room, prio, handler)
        }
    }
};

new Controller(parseConfig(JSON.parse(fs.readFileSync(process.argv[2]||'config_example.json'))))