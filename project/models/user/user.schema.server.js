module.exports = function(mongoose) {

		var schema = mongoose.Schema;

		var userSchema = new schema({
			userName: String,
			password: String, 
			fullName: String,
			resetPasswordToken: String,
			resetPasswordExpires: Date,
			isAdmin: Boolean,
			profile: {
				f_name: String,
				l_name: String,
				email: String,
				major: String,
				year: String,
				pf_pic: String,
				netid: String
			},
			createdAt: Date,
		});

		return userSchema;
};