module.exports=function(){
		
		var mongoose = require("mongoose");

		var schemas = {
			userSchema : require("./user/user.schema.server")(mongoose),

		}

		var models = {
				userModel : require("./user/user.model.server")(schemas, mongoose),
				// productModelProject: require("./product/product.model.server")(),
				// reviewModelProject: require("./review/review.model.server")(),
				// categoryModelProject: require("./category/category.model.server")()
		};
		
		return models;
		
};
