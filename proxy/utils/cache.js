class Cache {
	constructor() {
		this.map = Object.create(null);
		this.timeMap = Object.create(null)
	}
	get (host) {
		// 获取对应的session
		// console.log(this.map[host], 'get cache map')
		return this.map[host]
	}
	set (key, val) {
		// 设置对应的session
		this.map[key] = val
		// console.log(this.map, 'set map')
	}
	clear () {
		this.map = Object.create(null)
	}
}
const globUserCache = new Cache();
module.exports = globUserCache
