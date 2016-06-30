(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('LaboratoryCtrl', function ($scope, $aside, $state, $stateParams, $timeout,
                                                Modal, ServiceCategory, PatientService, Branch) {
            Branch.query(function (resp) {
                $scope.branches = resp;
            });

            ServiceCategory.get({id: 'laboratory'}, function (resp) {
                $scope.categories = resp.subcategories;
                $scope.openTab($scope.categories[0]);
            });


            $scope.filter = {
                branch: $scope.$localStorage.currentUser.branch,
                period: {
                    start: Date.create('the beginning of this day'),
                    end: Date.create('the end of this day')
                },
                services: [],
                service: undefined
            };

            $scope.openTab = function (subcat) {
                let tabChanged = false;
                if (subcat) {
                    tabChanged = true;
                    $scope.activeTab = subcat;
                } else {
                    subcat = $scope.activeTab;
                }

                // determine period
                let period = angular.copy($scope.filter.period);

                // determine branch
                let branch = $scope.filter.branch ? $scope.filter.branch._id : undefined;

                // determine service
                let service = $scope.filter.service && !tabChanged ? $scope.filter.service.id : undefined;

                // determine patient code
                let patCode = $scope.filter.patientCode ? $scope.filter.patientCode : undefined;

                // determine patient full name
                let fullName = $scope.filter.fullName ? $scope.filter.fullName : undefined;

                PatientService.laboratory({
                    service: service,
                    subcat: subcat._id,
                    branch: branch,
                    code: patCode,
                    name: fullName,
                    start: period.start,
                    end: period.end
                }, function (resp) {
                    $scope.records = resp.patientServices;
                    $scope.services = resp.services;
                    $scope.filter.services = angular.copy(resp.services);
                    if (tabChanged) {
                        $scope.filter.service = undefined;
                    }
                });
            };

            $scope.exportTab = function (subcat) {
                let tabChanged = false;
                if (subcat) {
                    tabChanged = true;
                    $scope.activeTab = subcat;
                } else {
                    subcat = $scope.activeTab;
                }

                // determine period
                let period = angular.copy($scope.filter.period);

                // determine branch
                let branch = $scope.filter.branch ? $scope.filter.branch._id : undefined;

                // determine service
                let service = $scope.filter.service && !tabChanged ? $scope.filter.service.id : undefined;

                // determine patient code
                let patCode = $scope.filter.patientCode ? $scope.filter.patientCode : undefined;

                // determine patient full name
                let fullName = $scope.filter.fullName ? $scope.filter.fullName : undefined;

                PatientService.exportToExcel({
                    service: service,
                    subcat: subcat._id,
                    branch: branch,
                    code: patCode,
                    name: fullName,
                    start: period.start,
                    end: period.end
                }, function (resp) {
                    let uri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,';
                    let url = uri + resp.content;
                    $timeout(function () {
                        location.href = url;
                    }, 100);
                });
            };

            $scope.getService = function (srv, rec) {
                return _.find(rec.services, {serviceId: srv.id});
            };

            $scope.isFinished = function (srv, rec) {
                let service = $scope.getService(srv, rec);

                if (!service) {
                    return null;
                }

                // service found & state is completed
                return service && service.state._id == 'completed';
            };

            $scope.getResult = function (srv, rec) {
                let service = $scope.getService(srv, rec);

                // service not found or no result field there
                if (!service || !service.result) {
                    return null;
                }

                // is there any filled result field
                if (service.result.fields.length > 0) {
                    for (let fld of service.result.fields) {
                        if (typeof fld.value !== 'undefined' && fld.value !== null && fld.value !== '') {
                            // <select> value is object in {_id: xxx, text: xxx} format
                            if (typeof fld.value == 'object' && 'text' in fld.value) {
                                return fld.value.text;
                            }
                            return fld.value;
                        }
                    }
                }

                // is there filled content from template
                if (service.result.content &&
                    service.result.content.length > 0 &&
                    service.result.template &&
                    service.result.content != service.result.template.content) {
                    return true;
                }

                // result not ready yet
                return false;
            };

            $scope.getResultValue = function (srv, rec) {
                let res = $scope.getResult(srv, rec);
                return res === true || res === false || res === null ? '' : res;
            };

            $scope.open = function (srv, rec) {
                let patSrv = $scope.getService(srv, rec);
                if (!patSrv) {
                    return;
                }
                $scope.openResult(patSrv);
            };

            $scope.openResult = function (srv) {
                // create and show aside
                $aside({
                    controller: 'ResultCtrl',
                    templateUrl: 'partials/patient/_aside_result.html',
                    title: 'Результат',
                    container: 'body',
                    backdrop: 'static',
                    show: true,
                    resolve: {
                        options: function () {
                            return {
                                // pass data to aside's controller
                                patientService: srv
                            };
                        }
                    }
                });
            };
        })
        .controller('LaboratoryResultsCtrl', function ($scope, $aside, $state, $stateParams,
                                                       Modal, Patient, ServiceCategory, PatientService, Branch) {

            $scope.tinymceOptions = {
                //language: 'ru_RU',
                //language_url: '/assets/lib/tinymce-dist/langs/ru_RU.js',
                plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak searchreplace ' +
                'wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking save table ' +
                'contextmenu directionality emoticons template paste textcolor colorpicker textpattern imagetools',
                paste_data_images: true,
                table_toolbar: false,
                height: 400
            };

            Branch.query(function (resp) {
                $scope.branches = resp;
            });

            $scope.patient = Patient.get({id: $stateParams.id});

            $scope.filter = {
                onlyLaboratory: 1,
                branch: $scope.$localStorage.currentUser.branch,
                period: {
                    start: Date.create('the beginning of this month'),
                    end: Date.create('the end of this day')
                }
            };

            $scope.open = function (patSrv) {
                patSrv.opened = !patSrv.opened;

                if (patSrv.opened) {
                    // no results yet, make it
                    if (angular.isUndefined(patSrv.result)) {
                        patSrv.result = {};
                    }

                    // no results fields yet, make it
                    if (angular.isUndefined(patSrv.result.fields)
                        || patSrv.result.fields.length == 0) {
                        patSrv.result.fields = angular.copy(patSrv.serviceId.resultFields);
                    }
                }
            };

            $scope.templateChanged = function (patSrv) {
                if (patSrv.result.template) {
                    if (!patSrv.result.content) {
                        patSrv.result.content = patSrv.result.template.content;
                    } else {
                        Modal.confirm({
                            content: 'Заменить содержимое поле из шаблона?',
                            okAction: function (modal) {
                                modal.hide();
                                // copy templates content into results content
                                patSrv.result.content = patSrv.result.template.content;
                            }
                        });
                    }
                } else {
                    Modal.confirm({
                        content: 'Очистить содержимое поле?',
                        okAction: function (modal) {
                            modal.hide();
                            // clear result content
                            patSrv.result.content = '';
                        }
                    });
                }
            };

            var savePatSrv = function (modal, patSrv) {
                PatientService.saveResult(patSrv, function (resp) {
                    // close confirmation window
                    modal.hide();
                });
            };

            $scope.serviceComplete = function (patSrv) {
                Modal.confirm({
                    content: 'Завершить услугу?',
                    okAction: function (modal) {
                        patSrv.state = {_id: 'completed', title: 'Завершен'};
                        savePatSrv(modal, patSrv);
                    }
                });
            };

            $scope.serviceSave = function (patSrv) {
                Modal.confirm({
                    okAction: function (modal) {
                        savePatSrv(modal, patSrv);
                    }
                });
            };

            $scope.Printer = {
                isPrintable: function (patSrv) {
                    return patSrv.state._id == 'completed' && (patSrv.debt == 0 || patSrv.hasWarranty);
                },
                completed: function () {
                    let self = this;
                    return _.filter($scope.records, function (patSrv) {
                        return self.isPrintable(patSrv);
                    });
                },
                forPrint: function () {
                    let self = this;
                    return _.filter($scope.records, function (ps) {
                        return self.isPrintable(ps) && ps.print;
                    });
                },
                toggle: function (patSrv, $event) {
                    let patSrvs = this.completed();

                    if (patSrv) { // individual patient service
                        // if CTRL + mouse click, then toggle print value
                        if ($event && $event.ctrlKey) {
                            patSrv.print = !patSrv.print;
                        }

                        // get all completed and marked for print services
                        let forPrint = this.forPrint();

                        // toggle markAllForPrint value according quantity of marked services
                        $scope.markAllForPrint = patSrvs.length == forPrint.length;
                    } else { // all available patient services
                        // toggle all available services print value
                        for (let ps of patSrvs) {
                            ps.print = $scope.markAllForPrint;
                        }
                    }
                },
                print: function () {
                    let services = this.forPrint();
                    let ids = services.map(function (srv) {
                        return srv._id
                    });
                    PatientService.printResults($scope.patient._id, ids);
                }
            };

            $scope.refresh = function () {
                // determine period
                let period = angular.copy($scope.filter.period);

                // determine branch
                let branch = $scope.filter.branch ? $scope.filter.branch._id : undefined;

                PatientService.getResults({
                    patientId: $stateParams.id,
                    lab: $scope.filter.onlyLaboratory,
                    branch: branch,
                    start: period.start,
                    end: period.end
                }, function (resp) {
                    $scope.records = resp;
                });
            };

            $scope.refresh();
        });
})();