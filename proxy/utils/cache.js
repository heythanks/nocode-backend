class Cache {
	constructor() {
		// this.hostMap = {
		// 	'cookie': {
		// 		session: '',
		// 		loginContent: {
		// 			path: '',
		// 			loginBodyStr: ''
		// 		}
		// 	}
		// }; //web端用户cookie与session还有login的关系映射
		this.userLoginInfoMap = Object.create(null)
	}
	get (opts) {
		const { type = 'userLoginInfoMap', params = {}  } = opts;
		const { host } = params;
		switch (type) {
			case 'userLoginInfoMap':
				return this.userLoginInfoMap[host]
			default:
				break;
		}
	}
	set (params = {}) {
		const {type = "", key="", val, isParent = false} = params;
		if(isParent) {
			this[type][key] = val;
			console.log(this.userLoginInfoMap, 'userLoginInfoMap')
			return false
		}
		// 设置对应的session
		let keyArr = key.split('.');
		let temp = Object.create(null);
		let len = keyArr.length;
		// 设置type数据的key对应value，支持点符号类型 'obj.query.a'
		keyArr.forEach((ele, index) => {
			if(index === 0) {
				temp = this[type][ele]
			} else if(index<len-1) {
				temp = temp[ele]
			} else {
				temp[ele] = val
			}
		})
	}
	clear () {
		this.map = Object.create(null)
	}
}
const globUserCache = new Cache();
module.exports = globUserCache
