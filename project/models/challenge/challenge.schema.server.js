module.exports = function(mongoose) {

		var schema = mongoose.Schema;

		var challengeSchema = new schema({
			heading : String,
			description : String,
			createdAt : Date,
			createdBy : {type : schema.ObjectId, ref : 'User'},
			forContest : {type : schema.ObjectId, ref : 'Contest'},
			testCases : [{type : schema.ObjectId, ref : 'TestCase'}]
		});

		return challengeSchema;
};