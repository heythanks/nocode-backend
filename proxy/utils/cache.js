class Cache {
	constructor() {
		this.map = {};
		this.timeMap = {}
	}
	get (host) {
		// 获取对应的session
		console.log(JSON.stringify(this.map))
		return this.map[host]
	}
	set (key, val) {
		// 设置对应的session
		this.map[key] = val
	}
}
const globUserCache = new Cache();
module.exports = globUserCache
