const path = require('path')
const { loginProxy } = require(path.resolve(__dirname, '../utils/helpers'))

const loginController = (req, res, next) => {
	const {body, } = req;
	const userCookie = req.get('Cookie')
	console.log(userCookie, '999', body)
	loginProxy({userCookie, ...body}).then(result => {
		console.log(result, 'result')
		res.send(result.data)
	}).catch(err=> {
		console.log(err, 'err')
	})
}
module.exports = loginController
