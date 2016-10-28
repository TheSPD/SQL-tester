module.exports = function(mongoose) {

		var schema = mongoose.Schema;

		var contestSchema = new schema({
			createdAt : Date,
			createdBy : {type : schema.ObjectId, ref : 'User'},
			title : String,
			description : String,
			challenges : [{type : schema.ObjectId, ref : 'Challenge'}],
		});

		return contestSchema;
};