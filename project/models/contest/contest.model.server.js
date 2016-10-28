module.exports = function(schemas, mongoose) {

	var ContestSchema = schemas.contestSchema;
	var Contest = mongoose.model("Contest", ContestSchema);

	

	var api = {
		// insertContest : insertContest,
		// getContest : getContest,
		// modifyContest : modifyContest,
		// deleteContest : deleteContest,	
		// addChallenge : addChallenge,
		// removeChallenge : removeChallenge,
	};

	return api;

	

}

