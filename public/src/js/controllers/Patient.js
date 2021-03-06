(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('PatientSearchCtrl', function ($scope, Patient, Modal) {

            $scope.reset = function (form) {
                // initial value search fields
                $scope.patient = {
                    firstName: '',
                    lastName: '',
                    middleName: '',
                    dateOfBirth: '',
                    code: ''
                };

                // empty found patients
                $scope.patients = [];

                // if form provided, reset its state
                if (form) {
                    form.$setPristine();
                }
            };

            $scope.searchPatients = function (isSearchFormValid) {
                if (isSearchFormValid) {
                    $scope.patients = Patient.search($scope.patient);
                }
            };

            $scope.deletePatient = function (patient) {
                var iPatient = angular.copy(patient);
                Modal.confirm({
                    content: 'Удалить пациента?',
                    okAction: function (modal) {
                        if (iPatient) {
                            Patient.delete({}, {_id: iPatient._id}, function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $scope.searchPatients(true);
                                }
                            });
                        }
                    }
                });
            };

            $scope.reset();
        })
        .controller('PatientCtrl', function ($scope, $state, $stateParams, Modal, Sex, Patient, Resident, Msg) {
            $scope.sex = Sex.query();
            $scope.residents = Resident.query();

            var mustBeSearched = function () {
                Msg.error('Поиск не осуществлен! Чтобы создать нового пациента, сначала осуществляйте поиск.');
                $state.go('patientSearch');
            };

            if ($stateParams.id) {
                Patient.get({id: $stateParams.id}, function (patient) {
                    $scope.patient = patient;
                });
            } else {
                $scope.patient = new Patient();
                $scope.patient.resident = $scope.residents[0];
                if ($stateParams.initialPatient) {
                    let iniPat = $stateParams.initialPatient;
                    if (!iniPat.firstName || !iniPat.lastName) {
                        mustBeSearched();
                    }
                    if (iniPat.firstName) $scope.patient.firstName = iniPat.firstName;
                    if (iniPat.lastName) $scope.patient.lastName = iniPat.lastName;
                    if (iniPat.middleName) $scope.patient.middleName = iniPat.middleName;
                    if (iniPat.dateOfBirth) $scope.patient.dateOfBirth = iniPat.dateOfBirth;
                } else {
                    mustBeSearched();
                }
            }

            $scope.savePatient = function () {
                var iPatient = angular.copy($scope.patient);
                Modal.confirm({
                    okAction: function (modal) {
                        if (iPatient._id) {
                            iPatient.$update(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp._id) {
                                    $state.go('patientView.addServices', {id: resp._id});
                                }
                            });
                        } else {
                            iPatient.$save(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp._id) {
                                    $state.go('patientView.addServices', {id: resp._id});
                                }
                            });
                        }
                    }
                });
            };

        })
        .controller('PatientsCtrl', function ($scope, Modal, Patient, Pager, Branch, ServiceCategory) {
            $scope.pagination = Pager.new(50);
            $scope.todaysOnly = 1;
            $scope.branches = Branch.query();
            $scope.categories = ServiceCategory.query();


            $scope.filter = {
                branch: $scope.$localStorage.currentUser.branch,
                by: function (branch) {
                    $scope.filter.branch = branch;
                    $scope.reloadPage();
                }
            };

            $scope.filterService = {
                category: undefined,
                subcategory: undefined,
                subsubcategory: undefined,
                reset: function () {
                    this.category = undefined;
                    this.subcategory = undefined;
                    this.subsubcategory = undefined;
                },
                onChange: function () {
                    if (angular.isDefined(this.category) && !this.category.title) {
                        this.category = undefined;
                    }
                    if (angular.isDefined(this.subcategory) && !this.subcategory.title) {
                        this.subcategory = undefined;
                    }
                    if (angular.isDefined(this.subsubcategory) && !this.subsubcategory.title) {
                        this.subsubcategory = undefined;
                    }
                },
                by: function (category, level) {
                    switch (level) {
                        case 'category':
                            if (angular.isDefined(category)) {
                                this.category = {title: category.title, _id: category._id};
                                if (angular.isDefined(category.subcategories) && category.subcategories.length > 0) {
                                    $scope.subcategories = category.subcategories;
                                } else {
                                    $scope.subcategories = [];
                                }
                                this.subcategory = undefined;
                                this.subsubcategory = undefined;
                            } else {
                                this.category = undefined;
                                this.subcategory = undefined;
                                this.subsubcategory = undefined;
                                $scope.subcategories = [];
                            }
                            break;
                        case 'subcategory':
                            if (angular.isDefined(category)) {
                                this.subcategory = {title: category.title, _id: category._id};
                                if (angular.isDefined(category.subcategories) && category.subcategories.length > 0) {
                                    $scope.subsubcategories = category.subcategories;
                                } else {
                                    $scope.subsubcategories = [];
                                }
                            } else {
                                this.subcategory = undefined;
                                $scope.subsubcategories = [];
                            }
                            this.subsubcategory = undefined;
                            break;
                        case 'subsubcategory':
                            if (angular.isDefined(category)) {
                                this.subsubcategory = {title: category.title, _id: category._id};
                            } else {
                                this.subsubcategory = undefined;
                            }
                            break;
                    }
                    $scope.reloadPage();
                }
            };

            $scope.pageChanged = function () {
                if (!$scope.todaysOnly) {
                    $scope.quickFilter = undefined;
                }
                $scope.reloadPage();
            };

            $scope.reloadPage = function () {
                let params = {
                    p: $scope.pagination.current,
                    ps: $scope.todaysOnly ? 1000 : $scope.pagination.pageSize,
                    today: $scope.todaysOnly
                };

                if ($scope.filter.branch) {
                    params.branch = $scope.filter.branch._id;
                }

                if ($scope.filterService.category) {
                    params.c = $scope.filterService.category._id;
                    if ($scope.filterService.subcategory) {
                        params.sc = $scope.filterService.subcategory._id;
                        if ($scope.filterService.subsubcategory) {
                            params.ssc = $scope.filterService.subsubcategory._id;
                        }
                    }
                }

                Patient.query(params,
                    function (patients, headers) {
                        $scope.patients = patients;
                        $scope.pagination.total = headers('X-Total-Items');
                    });
            };

            $scope.deletePatient = function (patient) {
                var iPatient = angular.copy(patient);
                Modal.confirm({
                    content: 'Удалить пациента?',
                    okAction: function (modal) {
                        if (iPatient) {
                            iPatient.$delete(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $scope.reloadPage();
                                }
                            });
                        }
                    }
                });
            };

            $scope.reloadPage();
        })
        .controller('PatientViewCtrl', function ($scope, $state, $stateParams, Patient, Service, PatientService,
                                                 ServiceCategory, Discount, PartnerSetter, Msg, Modal, Fields,
                                                 $aside, Setting, CompanySetter, Auth) {
            $scope.Discount = Discount;
            $scope.Fields = Fields;

            $scope.services = Service.query();
            $scope.categories = ServiceCategory.query();
            $scope.setting = Setting.query();

            $scope.ServiceHelper = {
                getByCategory: function (catTitle) {
                    return _.where($scope.services, {categoryTitle: catTitle});
                },
                totalPriceByCategory: function (catTitle) {
                    var srvList = this.getByCategory(catTitle);
                    return _.reduce(srvList, function (memo, srv) {
                        return memo + srv.price;
                    }, 0);
                },
                Service: {
                    filter: {
                        category: undefined,
                        subcategory: undefined,
                        subsubcategory: undefined,
                        title: undefined,
                        price: undefined,
                        reset: function () {
                            this.category = undefined;
                            this.subcategory = undefined;
                            this.subsubcategory = undefined;
                            this.title = undefined;
                            this.price = undefined;
                        },
                        onChange: function () {
                            if (angular.isDefined(this.category) && !this.category.title) {
                                this.category = undefined;
                            }
                            if (angular.isDefined(this.subcategory) && !this.subcategory.title) {
                                this.subcategory = undefined;
                            }
                            if (angular.isDefined(this.subsubcategory) && !this.subsubcategory.title) {
                                this.subsubcategory = undefined;
                            }
                        },
                        by: function (category, level) {
                            switch (level) {
                                case 'category':
                                    if (angular.isDefined(category)) {
                                        this.category = {title: category.title};
                                        if (angular.isDefined(category.subcategories) && category.subcategories.length > 0) {
                                            $scope.subcategories = category.subcategories;
                                        } else {
                                            $scope.subcategories = [];
                                        }
                                    } else {
                                        $scope.subcategories = [];
                                        this.category = undefined;
                                    }
                                    this.subcategory = undefined;
                                    this.subsubcategory = undefined;
                                    break;

                                case 'subcategory':
                                    if (angular.isDefined(category)) {
                                        this.subcategory = {title: category.title};
                                        if (angular.isDefined(category.subcategories) && category.subcategories.length > 0) {
                                            $scope.subsubcategories = category.subcategories;
                                        } else {
                                            $scope.subsubcategories = [];
                                        }
                                    } else {
                                        $scope.subsubcategories = [];
                                        this.subcategory = undefined;
                                    }
                                    this.subsubcategory = undefined;
                                    break;

                                case 'subsubcategory':
                                    if (angular.isDefined(category)) {
                                        this.subsubcategory = {title: category.title};
                                    } else {
                                        this.subsubcategory = undefined;
                                    }
                                    break;
                            }
                        }
                    },
                    add: function (srv, qnt) {
                        // mark service as added
                        srv.added = true;

                        srv.overPercent = $scope.patient.resident._id == 'other' ? $scope.setting.foreignerOverPercent : 0;
                        var found = _.find($scope.patient.services, {_id: srv._id});
                        qnt = qnt || 1;
                        if (found) {
                            if ((found.quantity > 1 && qnt < 0) || qnt > 0)
                                found.quantity += qnt;
                            this.recalc(found);
                        } else {
                            var service = angular.copy(srv);
                            service.quantity = 1;

                            // by default select service for later options
                            // for example, set partner or organization
                            service.marked = 1;

                            this.recalc(service);
                            $scope.patient.services.push(service);

                            // need to call after marked = 1
                            $scope.ServiceHelper.Marker.onChange();
                        }
                    },
                    addAll: function (categoryTitle) {
                        var srvList = $scope.ServiceHelper.getByCategory(categoryTitle);
                        for (let srv of srvList) {
                            this.add(srv);
                        }
                    },
                    addFiltered: function (filteredServices) {
                        for (let srv of filteredServices) {
                            this.add(srv);
                        }
                    },
                    addByCat: function (srv, catLevel) {
                        var services = _.filter($scope.services, function (service) {
                            switch (catLevel) {
                                case 'category':
                                    return service.category.title == srv.category.title;
                                case 'subcategory':
                                    return service.category.title == srv.category.title
                                        && service.subcategory.title == srv.subcategory.title;
                                case 'subsubcategory':
                                    return service.category.title == srv.category.title
                                        && service.subcategory.title == srv.subcategory.title
                                        && service.subsubcategory.title == srv.subsubcategory.title;
                            }
                        });
                        for (let service of services) {
                            this.add(service);
                        }
                    },
                    unsetAddedProp: function (srvList) {
                        if (srvList && srvList.length) {
                            for (let srv of srvList) {
                                let oSrv = _.find($scope.services, {_id: srv._id});
                                if (oSrv) {
                                    oSrv.added = false;
                                }
                            }
                        }
                    },
                    remove: function (idx) {
                        if (angular.isUndefined(idx)) {
                            if ($scope.ServiceHelper.Marker.getMarked(true) > 0) {
                                var markedSrvList = $scope.ServiceHelper.Marker.getMarked();
                                $scope.patient.services = _.difference($scope.patient.services, markedSrvList);
                                this.unsetAddedProp(markedSrvList);
                            } else {
                                Msg.error('Услуга не выбрана!');
                            }
                        } else {
                            // remove service and set added property of the original service to the false
                            let srvList = $scope.patient.services.splice(idx, 1);
                            this.unsetAddedProp(srvList);
                        }
                        $scope.ServiceHelper.Marker.onChange();
                    },
                    recalc: function (srv) {
                        Service.recalc(srv);
                    },
                    total: function (property) {
                        if ($scope.patient && $scope.patient.services) {
                            return $scope.F.total($scope.patient.services, property);
                        } else {
                            return 0;
                        }
                    },
                    openDiscount: function (srv) {
                        if (!Auth.hasAccess('patient:service:discount'))
                            return;

                        if (!srv.marked) {
                            srv.marked = 1;
                            $scope.ServiceHelper.Marker.onChange();
                        }
                        $scope.openDiscount();
                    },
                    openPartner: function (srv) {
                        if (!Auth.hasAccess('patient:service:partner'))
                            return;

                        if (!srv.marked) {
                            srv.marked = 1;
                            $scope.ServiceHelper.Marker.onChange();
                        }
                        $scope.openPartner();
                    },
                    openCompany: function (srv) {
                        if (!Auth.hasAccess('patient:service:company'))
                            return;

                        if (!srv.marked) {
                            srv.marked = 1;
                            $scope.ServiceHelper.Marker.onChange();
                        }
                        $scope.openCompany();
                    }
                },
                Marker: {
                    isAllMarked: 0,
                    markedCount: 0,
                    toggleAll: function () {
                        for (let srv of $scope.patient.services) {
                            srv.marked = this.isAllMarked;
                        }
                        this.onChange();
                    },
                    /**
                     * Gets marked services or its count
                     * @param retCount truth - returns count, falsy - returns marked services
                     * @returns {*} list of marked services or marked services count
                     */
                    getMarked: function (retCount) {
                        var res = _.where($scope.patient.services, {marked: 1});
                        if (!retCount) {
                            return res;
                        }
                        return res.length;
                    },
                    onChange: function () {
                        var allSrvCount = $scope.patient.services.length;
                        this.markedCount = this.getMarked(true);
                        this.isAllMarked = allSrvCount > 0 && allSrvCount == this.markedCount ? 1 : 0;

                    },
                    toggle: function (srv, event) {
                        // CTRL + Click toggles selection
                        if (event.ctrlKey) {
                            srv.marked = !srv.marked * 1;
                            this.onChange();
                        }
                    }
                },
                AssignedMarker: {
                    isAllMarked: 0,
                    markedCount: 0,
                    toggleAll: function () {
                        for (let srv of $scope.patient.services_assigned) {
                            // Mark only newly assigned services
                            // Payed services shouldn't be editable
                            if (srv.state._id == 'new') {
                                srv.marked = this.isAllMarked;
                            }
                        }
                        this.onChange();
                    },
                    /**
                     * Gets marked services or its count
                     * @param retCount truth - returns count, falsy - returns marked services
                     * @returns {*} list of marked services or marked services count
                     */
                    getMarked: function (retCount) {
                        var res = _.where($scope.patient.services_assigned, {marked: 1});
                        if (!retCount) {
                            return res;
                        }
                        return res.length;
                    },
                    getNewServices: function (retCount) {
                        if (angular.isUndefined($scope.patient))
                            return;
                        var res = _.filter($scope.patient.services_assigned, function (srv) {
                            return srv.state._id == 'new';
                        });
                        if (!retCount) {
                            return res;
                        }
                        return res.length;
                    },
                    onChange: function () {
                        var allSrvCount = this.getNewServices(true);
                        this.markedCount = this.getMarked(true);
                        this.isAllMarked = allSrvCount > 0 && allSrvCount == this.markedCount ? 1 : 0;
                    }
                },
                AssignedService: {
                    refresh: function () {
                        $scope.patient.services_assigned = PatientService.forPatient({patientId: $scope.patient._id});
                    },
                    remove: function (patSrv) {
                        if (!Auth.hasAccess('patient:service:delete'))
                            return;

                        if (angular.isUndefined(patSrv)) {
                            if ($scope.ServiceHelper.AssignedMarker.getMarked(true) > 0) {
                                var markedPatSrvList = $scope.ServiceHelper.AssignedMarker.getMarked();

                                // check services state
                                for (let srv of markedPatSrvList) {
                                    if (srv.state._id != 'new') {
                                        return Msg.error(`Нельзя удалить услугу в состоянии "${srv.state.title}"`);
                                    }
                                }

                                // get ids as array
                                var srvIds = _.pluck(markedPatSrvList, '_id');
                                Modal.confirm({
                                    content: 'Удалить выбранные услуги?',
                                    okAction: function (modal) {
                                        PatientService.deleteBulk({ids: srvIds}, function (resp) {
                                            // close confirmation window
                                            modal.hide();

                                            if (resp.code == 'success') {
                                                $scope.ServiceHelper.AssignedService.refresh();
                                                $scope.ServiceHelper.AssignedMarker.onChange();

                                            }
                                        });
                                    }
                                });
                            } else {
                                Msg.error('Услуга не выбрана!');
                            }
                        } else {
                            if (patSrv.state._id != 'new') {
                                return Msg.error(`Нельзя удалить услугу в состоянии "${patSrv.state.title}"`);
                            }
                            Modal.confirm({
                                content: 'Удалить услугу?',
                                okAction: function (modal) {
                                    patSrv.$delete(function (resp) {
                                        // close confirmation window
                                        modal.hide();

                                        $scope.ServiceHelper.AssignedService.refresh();
                                        $scope.ServiceHelper.AssignedMarker.onChange();
                                    });
                                }
                            });
                        }
                    },
                    total: function (property) {
                        if ($scope.patient && $scope.patient.services_assigned) {
                            return $scope.F.total($scope.patient.services_assigned, property);
                        } else {
                            return 0;
                        }
                    }
                }
            };

            $scope.openPartner = function () {
                if ($scope.ServiceHelper.Marker.getMarked(true) > 0) {
                    PartnerSetter.open($scope.ServiceHelper.Marker.getMarked);
                } else {
                    Msg.error('Услуга не выбрана!');
                }
            };

            $scope.openCompany = function () {
                if ($scope.ServiceHelper.Marker.getMarked(true) > 0) {
                    CompanySetter.open($scope.ServiceHelper.Marker.getMarked);
                } else {
                    Msg.error('Услуга не выбрана!');
                }
            };

            $scope.openDiscount = function () {
                if ($scope.ServiceHelper.Marker.getMarked(true) > 0) {
                    Discount.open($scope.ServiceHelper.Service.recalc, $scope.ServiceHelper.Marker.getMarked);
                } else {
                    Msg.error('Услуга не выбрана!');
                }
            };

            $scope.toggleFields = function (assignedSrv) {
                assignedSrv.openFields = !assignedSrv.openFields;
            };

            $scope.savePatientServices = function () {
                Modal.confirm({
                    okAction: function (modal) {
                        var patientService = new PatientService();
                        patientService.services = angular.copy($scope.patient.services);
                        patientService.patientId = $scope.patient._id;
                        patientService.$save(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.transitionTo('patientView.services', $stateParams, {
                                    reload: true,
                                    inherit: false,
                                    notify: true
                                });
                            }
                        });
                    }
                });
            };

            $scope.openResult = function (srv) {
                if (!Auth.hasAccess('patient:service:results:fill'))
                    return;

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

            Patient.get({id: $stateParams.id}, function (patient) {
                $scope.patient = patient;
                $scope.patient.services = [];
                $scope.ServiceHelper.AssignedService.refresh();
            });
        })
        .controller('ResultCtrl', function ($scope, $state, $stateParams, options, Service, PatientService,
                                            Modal, Auth) {
            $scope.patientService = options.patientService;

            Service.get({id: $scope.patientService.serviceId}, function (resp) {
                $scope.service = resp;

                // no results yet, make it
                if (angular.isUndefined($scope.patientService.result)) {
                    $scope.patientService.result = {};
                }

                // no results fields yet, make it
                if (angular.isUndefined($scope.patientService.result.fields)
                    || $scope.patientService.result.fields.length == 0) {
                    $scope.patientService.result.fields = angular.copy($scope.service.resultFields);
                }
            });

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

            $scope.templateChanged = function () {
                if ($scope.patientService.result.template) {
                    if (!$scope.patientService.result.content) {
                        $scope.patientService.result.content = $scope.patientService.result.template.content;
                    }
                    else {
                        Modal.confirm({
                            content: 'Заменить содержимое поле из шаблона?',
                            okAction: function (modal) {
                                modal.hide();
                                // copy templates content into results content
                                $scope.patientService.result.content = $scope.patientService.result.template.content;
                            }
                        });
                    }
                } else {
                    Modal.confirm({
                        content: 'Очистить содержимое поле?',
                        okAction: function (modal) {
                            modal.hide();
                            // clear result content
                            $scope.patientService.result.content = '';
                        }
                    });
                }
            };

            var savePatSrv = function (modal) {
                PatientService.saveResult($scope.patientService, function (resp) {
                    // close confirmation window
                    modal.hide();

                    // close aside
                    // aside is a parent scope, so $show/$hide is available
                    $scope.$hide();

                    /*
                     if (resp.code == 'success') {
                     $state.transitionTo('patientView.services', $stateParams, {
                     reload: true,
                     inherit: false,
                     notify: true
                     });
                     }*/
                });
            };

            $scope.serviceComplete = function () {
                if (!Auth.hasAccess('patient:service:results:complete'))
                    return;

                Modal.confirm({
                    content: 'Завершить услугу?',
                    okAction: function (modal) {
                        $scope.patientService.state = {_id: 'completed', title: 'Завершен'};
                        savePatSrv(modal);
                    }
                });
            };

            $scope.serviceSave = function () {
                if (!Auth.hasAccess('patient:service:results:fill'))
                    return;

                Modal.confirm({
                    okAction: function (modal) {
                        savePatSrv(modal);
                    }
                });
            };
        });
})();