# light.js api documentation version 0.0.1

## parameter types
- `roomname` string, get all rooms via **get_rooms**
- `devicename` string, get all devices in a room via **get_devices**
- `color` object with r, g and b values between 0 and 255, all 3 values are optional, an empty color object is valid
- `priority` string, one of low, medium, high

## query functions

### get_rooms `nothing` -> `list of roomnames`
get all rooms known to the server

### get_devices `roomname` -> `list of devicenames`
get all devicenames in a room

### get_devicestatus `roomname, devicename` -> `color`
get the color of a device. note:
> if you want to query a room that you currently dont't have control, don't forget to call **sync_all**

## change functions

### change_device `roomname, devicename, color` -> `nothing`
set a device's color

### change_some `roomname, list of devicenames, color` -> `nothing`
set all the devices in the room to the given color

### change_all `roomname, color` -> `nothing`
set all devices in the room to the color

### change_room `roomname {devicename->color}` -> `nothing`


## control functions
### has_control `roomname` -> `bool`
_false_ if there is another client in a higher priority queue or one before the client in it's queue

_true_ otherwise


### get_control `roomname` -> `nothing`
puts the client at the beginning of its priority queue

### can\_get_control `roomname` -> `bool`
_true_ if there is no client in a higher priority

_false_ otherwise


### release_control `roomname` -> `nothing`
release the contoll to the next client in the current priority or the one in the lower priority.
if there are no more clients, the server just displays the last status.

## other functions
### sync_all `nothing` -> `nothing`
syncs all rooms to the client's status. used to query status via **get\_device_status**
or for incremental updates via **change_device**

### set_priority `priority[, password]` -> `nothing`
set the client's priority, if set in the config, a password is needed for high priority.

### get_version `nothing` -> `version string`
get the running light.js version

## configuration file
comming soon