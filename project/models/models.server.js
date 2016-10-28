module.exports=function(){
		
		var mongoose = require("mongoose");

		var schemas = {
			userSchema : require("./user/user.schema.server")(mongoose),
			challengeSchema : require("./challenge/challenge.schema.server")(mongoose),
			contestSchema : require("./contest/contest.schema.server")(mongoose),
		}

		var models = {
				userModel : require("./user/user.model.server")(schemas, mongoose),
				challengeModel : require("./challenge/challenge.model.server")(schemas, mongoose),
				contestModel : require("./contest/challenge.model.server")(schemas, mongoose),
				// productModelProject: require("./product/product.model.server")(),
				// reviewModelProject: require("./review/review.model.server")(),
				// categoryModelProject: require("./category/category.model.server")()
		};
		
		return models;
		
};
