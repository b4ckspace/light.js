var Handler = function(controller,rooms, cfg){
    this.controller = controller;
    this.rooms = rooms;
    this.cfg = cfg;
    this.dmx_dta = new Array(512);
    for(var i=0;i<512;i++)
        this.dmx_dta[i]=0;
    this.priority = "medium";
    this.exposed_functions = [  "get_rooms", "get_devices", "get_devicestatus",
                                "change_device", "change_some", "change_all", "change_room",
                                "sync_all", "set_priority",
                                "has_controll", "get_controll", "can_get_controll", "release_controll"];
};

Handler.prototype.get_rooms = function() {
    return Object.keys(this.rooms)
};

Handler.prototype.get_devices = function(roomname) {
    return Object.keys(this.rooms[roomname])
};

Handler.prototype.get_devicestatus = function(roomname, devicename){
    var dev = this.rooms[roomname][devicename];
    var r = this.dmx_dta[dev._r];
    var g = this.dmx_dta[dev._g];
    var b = this.dmx_dta[dev._b];
    return {r:r, g:g, b:b};
};

Handler.prototype.get_roomstatus = function(roomname) {
    var status={};
    for(var devname in this.rooms[roomname]){
        status[devname] = this.get_devicestatus(room, devname);
    }
    return status;
};

Handler.prototype.change_device = function(roomname, devicename, data) {
    var dev = this.rooms[roomname][devicename];
    if(data.r != undefined)
        this.dmx_dta[dev._r] = data.r;
    if(data.g != undefined)
        this.dmx_dta[dev._g] = data.b;
    if(data.b != undefined)
        this.dmx_dta[dev._b] = data.b;
};

Handler.prototype.change_room = function(roomname, data) { // device -> value
     for(var devname in data){
        this.change_device(devname, data[devname])
     }
};

Handler.prototype.change_all = function(roomname, value) { // value for all
    this.change_some(roomname, this.get_devices(roomname), value)
};

Handler.prototype.change_some = function(roomname, devnames, value) {
    for(var i in devnames){
      this.change_device(roomname, devnames[i], value)
    };
};

Handler.prototype.sync_all = function() {
    this.dmx_dta = this.controller.dmx_dta.slice(0)
};

Handler.prototype.set_priority = function(priority, pass) {
    if( (priority=="high")&&(pass!=this.cfg["priority pass"]))
        throw "wrong priority password";
    console.log(priority)
    if(["low", "medium", "high"].indexOf(priority)==-1)
        throw "no valid priority";
    this.priority = priority;
};

Handler.prototype.has_controll = function(roomname) {
    return this.controller.handler_has_controll(roomname,this)
};

Handler.prototype.get_controll = function(roomname) {
    this.controller.handler_get_controll(roomname, this.priority, this)
};

Handler.prototype.can_get_controll = function(roomname) {
    var values = {low:0, medium:1, high:2};
    var prio = values[this.controller.handler_get_priority_controll()];
    var my_priority = values[this.priority];
    return my_priority >= prio;
};

Handler.prototype.release_controll = function(roomname) {
    this.controller.handler_release_controll(roomname, this.priority, this);
};

Handler.prototype.client_exit = function() {
    this.controller.handler_exit(this);
    this.controller = undefined;
};

module.exports = Handler;