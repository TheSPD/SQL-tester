module.exports=function(){
		
		var mongoose = require("mongoose");

		var models = {
				userModel : require("./user/user.model.server")(),
				// productModelProject: require("./product/product.model.server")(),
				// reviewModelProject: require("./review/review.model.server")(),
				// categoryModelProject: require("./category/category.model.server")()
		};
		
		return models;
		
};
