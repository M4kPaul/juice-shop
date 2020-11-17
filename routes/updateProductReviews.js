/*
 * Copyright (c) 2014-2020 Bjoern Kimminich.
 * SPDX-License-Identifier: MIT
 */

const utils = require('../lib/utils')
const challenges = require('../data/datacache').challenges
const db = require('../data/mongodb')
const insecurity = require('../lib/insecurity')

module.exports = function productReviews () {
  return (req, res, next) => {
		const user = insecurity.authenticatedUsers.from(req)
		if (!user || !user.data) {
			res.status(401).json({ error: 'Unauthorized' })
		} else if (typeof req.body.id !== 'string' || typeof req.body.message !== 'string') {
			res.status(400).json({ error: 'Wrong Params' })
		} else {
			const filter =  { $and: [ { _id: req.body.id }, { author: user.data.email } ] }
			const updateReview = { $set: { message: req.body.message } }
			db.reviews.update(filter, updateReview).then(
				result => {
					utils.solveIf(challenges.noSqlReviewsChallenge, () => { return result.modified > 1 })
					utils.solveIf(challenges.forgedReviewChallenge, () => { return user && user.data && result.original[0].author !== user.data.email && result.modified === 1 })
					res.json(result)
				}, err => {
					res.status(500).json(err)
				})
		}
  }
}
