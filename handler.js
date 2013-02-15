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
                                "sync_all", "set_priority", "get_version",
                                "has_control", "get_control", "can_get_control", "release_control"];
};

Handler.prototype.get_rooms = function() {
    return Object.keys(this.rooms)
};

Handler.prototype.validate_room = function(roomname) {
    if(this.rooms[roomname]==undefined)
        throw { known_error : true,
                reason : "unknown room '" + roomname + "'"};
};

Handler.prototype.validate_device = function(roomname, devicename) {
    this.validate_room(roomname);
    if(this.rooms[roomname][devicename]==undefined)
        throw { known_error : true,
                reason : "unknown device '" + devicename + "' in room '" + roomname + "'"};
};

Handler.prototype.validate_color = function(value) {
    value = parseInt(value, 10);
    if(value<0)
        throw { known_error : true,
                reason : "color must be equal or greater 0"};
    if(value>255)
        throw { known_error : true,
                reason : "color must be equal or smaller 255"};
    return value;
};

Handler.prototype.get_devices = function(roomname) {
    this.validate_room(roomname);
    return Object.keys(this.rooms[roomname])
};

Handler.prototype.get_devicestatus = function(roomname, devicename){
    this.validate_device(roomname, devicename);
    var dev = this.rooms[roomname][devicename];
    var r = this.dmx_dta[dev._r];
    var g = this.dmx_dta[dev._g];
    var b = this.dmx_dta[dev._b];
    return {r:r, g:g, b:b};
};

Handler.prototype.get_roomstatus = function(roomname) {
    this.validate_room(roomname);
    var status={};
    for(var devname in this.rooms[roomname]){
        status[devname] = this.get_devicestatus(room, devname);
    }
    return status;
};

Handler.prototype.change_device = function(roomname, devicename, data) {
    this.validate_device(roomname, devicename);
    var dev = this.rooms[roomname][devicename];
    var value;
    if((value = data.r) != undefined){
        this.dmx_dta[dev._r] = this.validate_color(value);
    }
    if((value = data.g) != undefined){
        this.dmx_dta[dev._g] = this.validate_color(value);
    }
    if((value = data.b) != undefined){
        this.dmx_dta[dev._b] = this.validate_color(value);
    }
};

Handler.prototype.change_room = function(roomname, data) {
    this.validate_room(roomname);
     for(var devname in data){
        this.change_device(devname, data[devname])
     }
};

Handler.prototype.change_all = function(roomname, value) {
    this.validate_room(roomname);
    this.change_some(roomname, this.get_devices(roomname), value)
};

Handler.prototype.change_some = function(roomname, devnames, value) {
    this.validate_room(roomname);
    for(var i in devnames){
      this.change_device(roomname, devnames[i], value)
    };
};

Handler.prototype.sync_all = function() {
    this.dmx_dta = this.controller.dmx_dta.slice(0)
};

Handler.prototype.set_priority = function(priority, pass) {
    if( (priority=="high")&&(pass!=this.cfg["priority pass"]))
        throw { known_error : true,
                reason : "wrong priority password"};
    console.log(priority)
    if(["low", "medium", "high"].indexOf(priority)==-1)
        throw { known_error : true,
                reason : "unknown priority"};
    this.priority = priority;
};

Handler.prototype.get_version = function() {
    return this.controller.version;
};

Handler.prototype.has_control = function(roomname) {
    this.validate_room(roomname);
    return this.controller.handler_has_control(roomname,this)
};

Handler.prototype.get_control = function(roomname) {
    this.validate_room(roomname);
    this.controller.handler_get_control(roomname, this.priority, this)
};

Handler.prototype.can_get_control = function(roomname) {
    this.validate_room(roomname);
    var values = {low:0, medium:1, high:2};
    var prio = values[this.controller.handler_get_priority_control()];
    var my_priority = values[this.priority];
    return my_priority >= prio;
};

Handler.prototype.release_control = function(roomname) {
    this.validate_room(roomname);
    this.controller.handler_release_control(roomname, this.priority, this);
};

Handler.prototype.client_exit = function() {
    this.controller.handler_exit(this);
    this.controller = undefined;
};

module.exports = Handler;