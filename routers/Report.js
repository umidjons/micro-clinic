'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');
var sugar = require('sugar');
var _ = require('lodash');
var debug = require('debug')('myclinic:router:report');
var L = require('../include/L');
var F = require('../include/F');

router
    .use(function (req, res, next) {
        L.context = 'report';
        next();
    })
    .get('/patients-count-by-day-for-period', function (req, res) {
        L.logger.info('Количество пациентов по дням за период', L.meta());

        if (!models.User.can(req.user, 'report:patientsCountByDayForPeriod')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        let condition = {};

        // if period specified, filter by it
        if (req.query.start && req.query.end) {
            let period = F.normalizePeriod(req.query.start, req.query.end);
            condition['lastVisit'] = {$gte: period.start, $lte: period.end};
        } else {
            return Msg.sendError(res, 'Неправильный период!');
        }

        models.Patient.aggregate([
            //db.patients.aggregate([
            {
                $match: condition
            },
            {
                $project: {
                    d: {$dayOfMonth: "$lastVisit"},
                    m: {$month: "$lastVisit"},
                    y: {$year: "$lastVisit"},
                    fmtVisit: {$dateToString: {format: "%d.%m.%Y", date: "$lastVisit"}},
                    fmtCreated: {$dateToString: {format: "%d.%m.%Y", date: "$created"}},
                    branch: "$branch"
                }
            },
            {
                $group: {
                    _id: {d: "$d", m: "$m", y: "$y", branch: "$branch"},
                    countVisits: {$sum: 1},
                    countNew: {$sum: {$cond: [{$eq: ["$fmtCreated", "$fmtVisit"]}, 1, 0]}}
                }
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: '_id.branch',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $sort: {
                    "_id.y": 1,
                    "_id.m": 1,
                    "_id.d": 1,
                    "branch.shortTitle": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    d: "$_id.d",
                    m: "$_id.m",
                    y: "$_id.y",
                    branchId: "$branch._id",
                    branch: "$branch.shortTitle",
                    countVisits: 1,
                    countNew: 1
                }
            }
        ], function (err, records) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // group items by date,
            // for ex: { "19.07.2016" : [ { branch : ... , countVisits : ... , ... }, ... ] }
            let items = _.groupBy(records, function (rec) {
                return Date.create(rec.y, rec.m - 1, rec.d).format("{dd}.{MM}.{yyyy}");
            });

            let results = {};
            let branchTotals = {};
            let dailyTotals = {};
            let totals = {countVisits: 0, countNew: 0};
            for (let date in items) {
                for (let item of items[date]) {
                    // initialize daily totals
                    if (!(date in dailyTotals)) {
                        dailyTotals[date] = {countVisits: 0, countNew: 0};
                    }

                    // calculate daily totals
                    dailyTotals[date].countVisits += item.countVisits;
                    dailyTotals[date].countNew += item.countNew;

                    // calculate totals
                    totals.countVisits += item.countVisits;
                    totals.countNew += item.countNew;
                }

                // group items also by branch for each day,
                // for ex: {"19.07.2016: {"Starmed": [array], ...}}
                let groupedItems = _.groupBy(items[date], function (item) {
                    return item.branch;
                });

                // there is always 1 item, so convert array to a value,
                // for ex: {"19.07.2016: {"Starmed": {object}, ...}}
                for (let branch in groupedItems) {
                    groupedItems[branch] = groupedItems[branch][0];

                    // initialize totals for the current branch
                    if (!(branch in branchTotals)) {
                        branchTotals[branch] = {countVisits: 0, countNew: 0};
                    }

                    // calculate totals for the current branch
                    branchTotals[branch].countVisits += groupedItems[branch].countVisits;
                    branchTotals[branch].countNew += groupedItems[branch].countNew;
                }

                // set info for date by branches
                results[date] = groupedItems;

                // set daily totals
                results[date]['daily'] = dailyTotals[date];

                // set totals by branches
                results['branchTotals'] = branchTotals;

                // set totals for specified period
                results['totals'] = totals;
            }

            Msg.sendSuccess(res, '', results, {log: false});
        });
    });

module.exports = router;