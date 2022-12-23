import { writeFileSync } from "fs"

const waitTime = 2 // minutes 

class Entry {
    public socketAddress: string
    public LastMessageTime: number
    constructor(add: string) {
        this.socketAddress = add
        this.LastMessageTime = Date.now()
    }
}

class AddressMap {
    public Addresses: Map<string, Entry> // key permanent address, value temporary address
    WriteToDisk(params: this) {
        writeFileSync("data.json", JSON.stringify(this.Addresses));
    }

    ExistInMemory(permanentAddress: string): boolean {
        var temp = this.Addresses[permanentAddress]
        var minutes_since = Math.floor((Date.now() - temp.LastMessageTime) / 60000)

        if (minutes_since > waitTime) {
            return true
        }
        this.Addresses.delete(permanentAddress)
        return false
    }

    GetSocketAddress(permanentAddress: string): string {
        var temp = this.Addresses[permanentAddress]
        temp.LastMessageTime = Date.now()
        this.Addresses[permanentAddress] = temp
        return temp.socketAddress
    }

    SetPair(permanentAddress: string, socketIOAddress: string) {
        this.Addresses.set(permanentAddress, new Entry(socketIOAddress))
    }
}

export { AddressMap }