"use strict";
exports.__esModule = true;
exports.AddressMap = void 0;

var fs_1 = require("fs");
var waitTime = 2; // minutes 
var Entry = /** @class */ (function () {
    function Entry(add) {
        this.socketAddress = add;
        this.LastMessageTime = Date.now();
    }
    return Entry;
}());
var AddressMap = /** @class */ (function () {
    function AddressMap() {
    }
    AddressMap.prototype.WriteToDisk = function (params) {
        (0, fs_1.writeFileSync)("data.json", JSON.stringify(this.Addresses));
    };
    AddressMap.prototype.ExistInMemory = function (permanentAddress) {
        var temp = this.Addresses[permanentAddress];
        var minutes_since = Math.floor((Date.now() - temp.LastMessageTime) / 60000);
        if (minutes_since > waitTime) {
            return true;
        }
        this.Addresses["delete"](permanentAddress);
        return false;
    };
    AddressMap.prototype.GetSocketAddress = function (permanentAddress) {
        var temp = this.Addresses[permanentAddress];
        temp.LastMessageTime = Date.now();
        this.Addresses[permanentAddress] = temp;
        return temp.socketAddress;
    };
    AddressMap.prototype.SetPair = function (permanentAddress, socketIOAddress) {
        this.Addresses.set(permanentAddress, new Entry(socketIOAddress));
    };
    return AddressMap;
}());
exports.AddressMap = AddressMap;
