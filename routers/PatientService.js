'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:patientservice');
var models = require('../models');
var Msg = require('../include/Msg');
var mongoose = require('mongoose');
var F = require('../include/F');
var async = require('async');
var excel = require('node-excel-export');
var _ = require('underscore');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'patientService';
        next();
    })
    .param('id', function (req, res, next, id) {
        debug(`param(id): ${id}`);
        models.PatientService.findById(id, function (err, patSrv) {
            if (err) {
                return Msg.sendError(res, err);
            }

            req.patientService = patSrv;
            next();
        });
    })
    .use(['/laboratory/query', '/laboratory/export'], function (req, res, next) {
        // filter all patient services for laboratory
        let condition = {
            'category._id': 'laboratory'
        };

        // if subcategory id is specified, filter services by it
        if (req.query.subcat) {
            condition['subcategory._id'] = mongoose.Types.ObjectId(req.query.subcat);
        }

        // if branch id is specified, filter services by it
        if (req.query.branch) {
            condition['branch'] = mongoose.Types.ObjectId(req.query.branch);
        }

        // if service id is specified, filter services by it
        if (req.query.service) {
            condition['serviceId'] = mongoose.Types.ObjectId(req.query.service);
        }

        // if patient code is specified, filter services by it
        if (req.query.code) {
            condition['patientCode'] = req.query.code;
        }

        // if period specified, filter by it
        if (req.query.start && req.query.end) {
            let period = F.normalizePeriod(req.query.start, req.query.end);
            condition['created'] = {$gte: period.start, $lte: period.end};
        }

        // result handler callback
        let resultHandler = function (err, results) {
            if (err) {
                return Msg.sendError(res, err);
            }
            req.records = results;
            next();
        };

        // if patient name is specified, then do 2 round trip:
        // 1) find patients IDs by regexp
        // 2) query for laboratory
        if (req.query.name) {
            let name = F.escapeForRegExp(req.query.name);
            if (name) {
                // build regular expression
                let re = new RegExp(name, 'i');

                // find match patient IDs
                models.Patient.find(
                    {
                        $or: [
                            {lastName: re},
                            {firstName: re},
                            {middleName: re}
                        ]
                    },
                    {_id: 1}, // return only IDs
                    function (err, patients) {
                        if (err) {
                            return Msg.sendError(res, err);
                        }

                        // build array of IDs from models
                        let patIds = F.arrayOfProps(patients, '_id');

                        // set filter by patient IDs
                        condition['patientId'] = {$in: patIds};

                        // query laboratory
                        models.PatientService.laboratory(condition, resultHandler);
                    }
                );
            } else {
                return Msg.sendError(res, 'Указано не правильное значение "ФИО".');
            }
        } else {
            // query laboratory
            models.PatientService.laboratory(condition, resultHandler);
        }
    })
    .get('/laboratory/export', function (req, res) {
        if (!models.User.can(req.user, 'laboratory:export')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        let border = {
            top: {style: 'thin', color: {rgb: '00000000'}},
            bottom: {style: 'thin', color: {rgb: '00000000'}},
            left: {style: 'thin', color: {rgb: '00000000'}},
            right: {style: 'thin', color: {rgb: '00000000'}}
        };

        let styles = {
            headerDark: {
                fill: {fgColor: {rgb: 'FFCCCCCC'}},
                font: {
                    color: {rgb: '00000000'},
                    sz: 14,
                    bold: true
                },
                alignment: {wrapText: true},
                border: border
            },
            cellDefault: {border: border},
            cellFilled: {fill: {fgColor: {rgb: 'FF15A589'}}, border: border},
            cellNotFilled: {fill: {fgColor: {rgb: 'FFE43725'}}, border: border},
            cellPink: {fill: {fgColor: {rgb: 'FFFFCCFF'}}, border: border},
            cellGreen: {fill: {fgColor: {rgb: 'FF00FF00'}}, border: border}
        };

        let specification = {
            patientCode: {
                displayName: 'ID',
                headerStyle: styles.headerDark,
                cellStyle: styles.cellDefault,
                width: '7'
            },
            visitDate: {
                displayName: 'Дата посещение',
                headerStyle: styles.headerDark,
                cellStyle: styles.cellDefault,
                width: '20'
            },
            fullName: {
                displayName: 'Ф.И.О.',
                headerStyle: styles.headerDark,
                cellStyle: styles.cellDefault,
                width: '30'
            },
            branch: {
                displayName: 'Филиал',
                headerStyle: styles.headerDark,
                cellStyle: styles.cellDefault,
                width: '10'
            }
        };

        // add services into specification
        for (let srv of req.records.services) {
            specification[srv.id] = {
                displayName: srv.shortTitle,
                headerStyle: styles.headerDark,
                cellStyle: function (value, row) {
                    //console.log('VALUE:', value, 'ROW:', row);

                    let state = row[srv.id + '_state'];

                    if (!state) {
                        return styles.cellDefault;
                    }

                    switch (state) {
                        case 'completed':
                            return styles.cellFilled;
                        default:
                            return styles.cellNotFilled;
                    }
                },
                cellFormat: function (value, row) {
                    let val = row[srv.id];

                    // state is completed, but no result value, most likely result filled from template
                    if (val === '' && row[srv.id + '_state'] == 'completed') {
                        // return this symbol
                        return '+';
                    }

                    // return actual value
                    return val;
                },
                width: '7'
            };
        }

        // The data set should have the following shape (Array of Objects)
        // The order of the keys is irrelevant, it is also irrelevant if the
        // dataset contains more fields as the report is build based on the
        // specification provided above. But you should have all the fields
        // that are listed in the report specification
        let dataset = [];

        for (let ps of req.records.patientServices) {
            let row = {
                patientCode: ps._id.patient.code ? ps._id.patient.code : '',
                visitDate: F.formatDateTime(ps._id.created),
                fullName: ps.fullName,
                branch: ps._id.branch.shortTitle
            };

            // add service values
            for (let srv of req.records.services) {
                // by default no value
                row[srv.id] = '';

                // find patient service
                let patSrv = _.find(ps.services, function (item) {
                    return (item.serviceId.toString() == srv.id.toString());
                });

                // by default state is empty
                row[srv.id + '_state'] = '';

                // if service found, fill attributes
                if (patSrv) {
                    // set patient service state
                    row[srv.id + '_state'] = patSrv.state._id;

                    // set patient service result value
                    if (patSrv.result && patSrv.result.fields && patSrv.result.fields.length > 0) {
                        for (let fld of patSrv.result.fields) {
                            if (typeof fld.value !== 'undefined' && fld.value !== null && fld.value !== '') {
                                // <select> value is object in {_id: xxx, text: xxx} format
                                if (fld.type._id == 'select') {
                                    row[srv.id] = fld.value.text;
                                } else {
                                    row[srv.id] = fld.value;
                                }

                                // stop processing other values
                                break;
                            }
                        }
                    }

                }
            }

            dataset.push(row);
        }

        // Create the excel report.
        // This function will return Buffer
        let report = excel.buildExport(
            [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
                {
                    name: 'Лаборатория', // <- Specify sheet name (optional)
                    specification: specification, // <- Report specification
                    data: dataset // <-- Report data
                }
            ]
        );

        // convert Buffer to Base64 and send to the client
        Msg.sendSuccess(res, 'Данные успешно экспортированы.', {content: report.toString('base64')});
    })
    .get('/laboratory/query', function (req, res) {
        if (!models.User.can(req.user, 'laboratory')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // just return results
        Msg.sendSuccess(res, '', req.records);
    })
    .put('/laboratory/save-result/:id', function (req, res) {
        if (!models.User.can(req.user, 'patient:service:results:fill')
            && !models.User.can(req.user, 'patient:service:results:complete')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // only result and state can be changed
        req.patientService.result = req.body.result;
        req.patientService.state = req.body.state;

        // save
        req.patientService.save(function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .get('/laboratory/get-results/:patientId', function (req, res) {
        debug(`patientId: ${req.params.patientId}`);
        let condition = {patientId: req.params.patientId};

        // if lab specified, then show only laboratory service
        if (req.query.lab && req.query.lab == '1') {
            condition['category._id'] = 'laboratory';
        }

        // if branch id is specified, filter services by it
        if (req.query.branch) {
            condition['branch'] = mongoose.Types.ObjectId(req.query.branch);
        }

        // if period specified, filter by it
        if (req.query.start && req.query.end) {
            let period = F.normalizePeriod(req.query.start, req.query.end);
            condition['created'] = {$gte: period.start, $lte: period.end};
        }

        let projection = {
            created: 1,
            state: 1,
            serviceId: 1,
            title: 1,
            result: 1,
            cat: 1,
            category: 1,
            subcategory: 1,
            subsubcategory: 1,
            debt: 1
        };

        models.PatientService
            .find(condition, projection)
            .populate('serviceId')
            .sort({created: -1, 'category.title': 1, 'subcategory.title': 1, 'subsubcategory.title': 1, title: 1})
            .exec(function (err, patientServices) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, '', patientServices);
            });
    })
    .post('/print/:patientId',
        function (req, res, next) {
            if (!models.User.can(req.user, 'patient:service:results:print')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            // find patient
            models.Patient.findById(req.params.patientId, function (err, patient) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                req.patient = patient;
                next();
            });
        },
        function (req, res, next) {
            // prepare results
            if (!req.body.ids || !req.body.ids.length) {
                return Msg.sendError(res, 'Ошибка параметров печати.');
            }

            let projection = {
                created: 1,
                serviceId: 1,
                title: 1,
                result: 1,
                cat: 1,
                minCat: 1,
                category: 1,
                subcategory: 1,
                subsubcategory: 1
            };

            models.PatientService
                .find({_id: {$in: req.body.ids}}, projection)
                .populate('serviceId')
                .sort({created: -1, 'category.title': 1, 'subcategory.title': 1, 'subsubcategory.title': 1, title: 1})
                .exec(function (err, patientServices) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    // group services by minCat
                    // format: {'cat 1': [ps1, ps2, ...], 'cat 2': [ps3, ps4, ...]}
                    let grouped = {};
                    for (let ps of patientServices) {
                        // format date
                        ps.fmtCreated = F.formatDate(ps.created);

                        // set result type
                        ps.resType = '';
                        if (ps.result && ps.result.content) {
                            ps.resType = 'tpl';
                            if (ps.result.fields && ps.result.fields.length > 0) {
                                ps.resType = 'tplWithFields';
                            }
                        } else {
                            if (ps.result && ps.result.fields && ps.result.fields.length > 0) {
                                ps.resType = 'fields';
                            }
                        }

                        // initialize array & group
                        if (typeof grouped[ps.minCat] == 'undefined') {
                            grouped[ps.minCat] = [];
                        }
                        grouped[ps.minCat].push(ps);
                    }

                    req.groupedServices = grouped;
                    next();
                });
        },
        function (req, res) {
            let viewData = {
                patient: {
                    fullName: req.patient.fullName,
                    dateOfBirth: F.formatDate(req.patient.dateOfBirth)
                },
                printDate: F.formatDate(new Date()),
                groupedServices: req.groupedServices
            };

            res.render('partials/laboratory/print_results',
                viewData,
                function (err, html) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }
                    Msg.sendSuccess(res, '', {content: html});
                }
            );
        })
    .get('/:id', function (req, res) {
        req.patientService
            .populate('user', 'username lastName firstName middleName')
            .populate('branch', 'shortTitle', function (err, patSrv) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                Msg.sendSuccess(res, '', patSrv);
            });
    })
    .get('/for/:patientId', function (req, res) {
        debug(`patientId: ${req.params.patientId}`);
        // do not populate user attribute, because it is unnecessary here
        models.PatientService
            .find({patientId: req.params.patientId})
            .populate('user', 'username lastName firstName middleName')
            .populate('branch', 'shortTitle')
            .exec(function (err, patientServices) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, '', patientServices);
            });
    })
    .post('/',
        function (req, res, next) {
            if (!models.User.can(req.user, 'patient:service:add')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            // middleware to prepare patient services for save
            if (!req.body.patientId) {
                return Msg.sendError(res, 'Пациент не указан.');
            }

            if (!req.body.services) {
                return Msg.sendError(res, 'Услуги не указаны');
            }

            let time = new Date();
            for (let srv of req.body.services) {
                // keep original service id
                srv.serviceId = srv._id;

                // delete _id, because it belongs to the service, not patient service
                delete srv._id;

                // currently logged in user
                srv.user = req.user._id;

                // set branch
                srv.branch = req.user.branch._id;

                // set discount's state
                if (srv.discount && srv.discount.type) {
                    if (!models.User.can(req.user, 'patient:service:discount')) {
                        return Msg.sendError(res, 'Доступ запрещен.');
                    }

                    srv.discount.state = {_id: 'new', title: 'Новый'};
                }

                // there is already 'created' field from Service model, we MUST override it
                srv.created = time;

                // set patient id for each service
                srv.patientId = req.body.patientId;
                srv.payed = 0;
                srv.debt = srv.priceTotal;

                srv.state = {_id: 'new', title: 'Новый'};
            }
            next();
        },
        function (req, res) {
            models.PatientService.create(req.body.services, function (err) {
                // if there is error, send it and stop handler with return
                if (err) {
                    return Msg.sendError(res, err);
                }

                // update last visit
                models.Patient.setLastVisit(req.body.patientId, req.body.services[0].created, function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    // all right, show success message
                    Msg.sendSuccess(res, 'Данные успешно сохранены.');
                });
            });
        }
    )
    .put('/:id', function (req, res) {
        req.patientService = Object.assign(req.patientService, req.body);
        req.patientService.save(function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .post('/delete-bulk',
        function (req, res, next) {
            if (!models.User.can(req.user, 'patient:service:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            debug(`STEP 1. Checking patient services states, pays, results before bulk deleting. IDS: ${req.body.ids}`);

            models.PatientService.find({_id: {$in: req.body.ids}})
                .exec(function (err, services) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    if (!services || !services.length) {
                        return Msg.sendError(res, 'Услуги для удаления не найдены.');
                    }

                    for (let srv of services) {
                        // by default mark as removable
                        srv.removeType = 'remove';

                        // is there any completed service
                        if (srv.state._id == 'completed') {
                            return Msg.sendError(res, `Нельзя удалить услугу ${srv.title} в состоянии "${srv.state.title}"`);
                        }

                        // is there any active pay
                        if (srv.pays && srv.pays.length) {
                            // there are pays, so mark as not removable
                            srv.removeType = 'change-state';

                            for (let pay of srv.pays) {
                                if (pay.state._id == 'payed') {
                                    return Msg.sendError(res, `У услуги ${srv.title} имеется активные оплаты.`);
                                }
                            }
                        }

                        // is there any result
                        if (srv.result) {
                            if (srv.result.fields && srv.result.fields.length) {
                                for (let resFld of srv.result.fields) {
                                    if (typeof resFld.value !== 'undefined' && resFld.value !== null && resFld.value !== '') {
                                        return Msg.sendError(res, `У услуги ${srv.title} имеется заполненные результаты.`);
                                    }
                                }
                            }

                            if (srv.result.template && srv.result.content && srv.result.template.content != srv.result.content) {
                                return Msg.sendError(res, `У услуги ${srv.title} имеется заполненные результаты.`);
                            }
                        }
                    }

                    req.services = services;

                    // all right
                    next();
                });
        },
        function (req, res, next) {
            debug('STEP 2. Determining services for actual remove & update state.');

            req.servicesForSave = [];
            req.servicesForRemove = [];
            for (let srv of req.services) {
                switch (srv.removeType) {
                    case 'change-state':
                        srv.state = {_id: 'removed', title: 'Удален'};
                        req.servicesForSave.push(srv);
                        break;

                    case 'remove':
                        req.servicesForRemove.push(srv);
                        break;
                }
            }
            next();
        },
        function (req, res, next) {
            debug('STEP 3. Changing patient services states as removed.');

            if (req.servicesForSave.length) {
                async.each(req.servicesForSave, function (patSrv, done) {
                    patSrv.save(function (err) {
                        if (err) {
                            return done(err);
                        }
                        done();
                    });
                }, function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    return next();
                });
            } else {
                next();
            }
        },
        function (req, res) {
            debug('STEP 4. Actually remove patient services.');

            if (req.servicesForRemove.length) {
                async.each(req.servicesForRemove, function (patSrv, done) {
                    patSrv.remove(function (err) {
                        if (err) {
                            return done(err);
                        }

                        done();
                    });
                }, function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }
                    Msg.sendSuccess(res, 'Записи удалены!');
                })
            }
        }
    )
    .delete('/:id',
        function (req, res, next) {
            if (!models.User.can(req.user, 'patient:service:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            debug(`STEP 1. Checking patient service state, pays, results before deleting. id=${req.params.id}`);

            // by default mark as removable
            req.patientService.removeType = 'remove';

            // is there any completed service
            if (req.patientService.state._id == 'completed') {
                return Msg.sendError(res, `Нельзя удалить услугу ${req.patientService.title} в состоянии "${req.patientService.state.title}"`);
            }

            // is there any active pay
            if (req.patientService.pays && req.patientService.pays.length) {
                // there are pays, so mark as not removable
                req.patientService.removeType = 'change-state';

                for (let pay of req.patientService.pays) {
                    if (pay.state._id == 'payed') {
                        return Msg.sendError(res, `У услуги ${req.patientService.title} имеется активные оплаты.`);
                    }
                }
            }

            // is there any result
            if (req.patientService.result) {
                if (req.patientService.result.fields && req.patientService.result.fields.length) {
                    for (let resFld of req.patientService.result.fields) {
                        if (typeof resFld.value !== 'undefined' && resFld.value !== null && resFld.value !== '') {
                            return Msg.sendError(res, `У услуги ${req.patientService.title} имеется заполненные результаты.`);
                        }
                    }
                }

                if (req.patientService.result.template && req.patientService.result.content
                    && req.patientService.result.template.content != req.patientService.result.content) {
                    return Msg.sendError(res, `У услуги ${req.patientService.title} имеется заполненные результаты.`);
                }
            }

            next();
        },
        function (req, res) {
            debug(`STEP 2. Delete patient service (actual remove or change state to removed. id: ${req.params.id}`);
            let cb = function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            };

            switch (req.patientService.removeType) {
                case 'change-state':
                    req.patientService.state = {_id: 'removed', title: 'Удален'};
                    req.patientService.save(cb);
                    break;

                case 'remove':
                    req.patientService.remove(cb);
                    break;
            }
        }
    );

module.exports = router;