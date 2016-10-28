module.exports = function(schemas, mongoose) {

	var ChallengeSchema = schemas.challengeSchema;
	var Challenge = mongoose.model("Challenge", ChallengeSchema);

	

	var api = {
		// insertChallenge : insertChallenge,
		// getChallenge : getChallenge,
		// modifyChallenge : modifyChallenge,
		// deleteChallenge : deleteChallenge,
		// addTestCase : addTestCase,
		// removeTestCase : removeTestCase,
	};

	return api;

	

}

