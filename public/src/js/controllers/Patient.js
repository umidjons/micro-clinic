'use strict';

angular.module('MyClinic')
    .controller('PatientSearchCtrl', function ($scope, Patient, Modal) {

        $scope.reset = function (form) {
            // initial value search fields
            $scope.patient = {
                firstName: '',
                lastName: '',
                middleName: '',
                dateOfBirth: ''
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
            Modal.confirm({
                content: 'Удалить пациента?',
                okAction: function (modal) {
                    if (patient) {
                        patient.$delete(function (resp) {
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
    .controller('PatientCtrl', function ($scope, $state, $stateParams, Modal, Sex, Patient, Resident) {
        $scope.sex = Sex.query();
        $scope.residents = Resident.query();

        if ($stateParams.id) {
            Patient.get({id: $stateParams.id}, function (patient) {
                $scope.patient = patient;
            });
        } else {
            $scope.patient = new Patient();
            $scope.patient.resident = $scope.residents[0];
            if ($stateParams.initialPatient) {
                let iniPat = $stateParams.initialPatient;
                if (iniPat.firstName) $scope.patient.firstName = iniPat.firstName;
                if (iniPat.lastName) $scope.patient.lastName = iniPat.lastName;
                if (iniPat.middleName) $scope.patient.middleName = iniPat.middleName;
                if (iniPat.dateOfBirth) $scope.patient.dateOfBirth = iniPat.dateOfBirth;
            }
        }

        $scope.savePatient = function () {
            Modal.confirm({
                okAction: function (modal) {
                    if ($scope.patient._id) {
                        $scope.patient.$update(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp._id) {
                                $state.go('patientView.addServices', {id: resp._id});
                            }
                        });
                    } else {
                        $scope.patient.$save(function (resp) {
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
    .controller('PatientsCtrl', function ($scope, Modal, Patient, Pager) {
        $scope.pagination = Pager.new();

        $scope.pageChanged = function () {
            $scope.reloadPage();
        };

        $scope.reloadPage = function () {
            Patient.query({p: $scope.pagination.current, ps: $scope.pagination.pageSize}, function (patients, headers) {
                $scope.patients = patients;
                $scope.pagination.total = headers('X-Total-Items');
            });
        };

        $scope.deletePatient = function (patient) {
            Modal.confirm({
                content: 'Удалить пациента?',
                okAction: function (modal) {
                    if (patient) {
                        patient.$delete(function (resp) {
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
                                             ServiceCategory, Discount, PartnerSetter, Msg, Modal) {
        $scope.Discount = Discount;

        ServiceCategory.categoriesWithServices(function (categories) {
            // create array with category titles
            $scope.categories = _.pluck(categories, '_id');
        });
        $scope.services = Service.servicesWithCategory();

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
                add: function (srv, qnt) {
                    var found = _.find($scope.patient.services, {_id: srv._id});
                    qnt = qnt || 1;
                    if (found) {
                        if ((found.quantity > 1 && qnt < 0) || qnt > 0)
                            found.quantity += qnt;
                        this.recalc(found);
                    } else {
                        var service = angular.copy(srv);
                        service.quantity = 1;
                        this.recalc(service);
                        $scope.patient.services.push(service);
                    }
                },
                addAll: function (categoryTitle) {
                    var srvList = $scope.ServiceHelper.getByCategory(categoryTitle);
                    for (let srv of srvList) {
                        this.add(srv);
                    }
                },
                remove: function (idx) {
                    if (angular.isUndefined(idx)) {
                        if ($scope.ServiceHelper.Marker.getMarked(true) > 0) {
                            var markedSrvList = $scope.ServiceHelper.Marker.getMarked();
                            $scope.patient.services = _.difference($scope.patient.services, markedSrvList);
                        } else {
                            Msg.error('Услуга не выбрана!');
                        }
                    } else {
                        $scope.patient.services.splice(idx, 1);
                    }
                    $scope.ServiceHelper.Marker.onChange();
                },
                recalc: function (srv) {
                    Service.recalc(srv);
                },
                totalPrice: function () {
                    if ($scope.patient && $scope.patient.services) {
                        return _.reduce($scope.patient.services, function (memo, srv) {
                            return memo + srv.priceTotal;
                        }, 0);
                    } else {
                        return 0;
                    }
                },
                totalQuantity: function () {
                    if ($scope.patient && $scope.patient.services) {
                        return _.reduce($scope.patient.services, function (memo, srv) {
                            return memo + srv.quantity;
                        }, 0);
                    } else {
                        return 0;
                    }
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
                    if (angular.isUndefined(patSrv)) {
                        if ($scope.ServiceHelper.AssignedMarker.getMarked(true) > 0) {
                            var markedPatSrvList = $scope.ServiceHelper.AssignedMarker.getMarked();
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
                        Modal.confirm({
                            content: 'Удалить услугу?',
                            okAction: function (modal) {
                                patSrv.$delete(function (resp) {
                                    // close confirmation window
                                    modal.hide();

                                    if (resp.code == 'success') {
                                        $scope.ServiceHelper.AssignedService.refresh();
                                        $scope.ServiceHelper.AssignedMarker.onChange();

                                    }
                                });
                            }
                        });
                    }
                },
                totalPrice: function () {
                    if ($scope.patient && $scope.patient.services_assigned) {
                        return _.reduce($scope.patient.services_assigned, function (memo, srv) {
                            return memo + srv.priceTotal;
                        }, 0);
                    } else {
                        return 0;
                    }
                },
                totalQuantity: function () {
                    if ($scope.patient && $scope.patient.services_assigned) {
                        return _.reduce($scope.patient.services_assigned, function (memo, srv) {
                            return memo + srv.quantity;
                        }, 0);
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

        $scope.openDiscount = function () {
            if ($scope.ServiceHelper.Marker.getMarked(true) > 0) {
                Discount.open($scope.ServiceHelper.Service.recalc, $scope.ServiceHelper.Marker.getMarked);
            } else {
                Msg.error('Услуга не выбрана!');
            }
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

        Patient.get({id: $stateParams.id}, function (patient) {
            $scope.patient = patient;
            $scope.patient.services = [];
            $scope.ServiceHelper.AssignedService.refresh();
        });
    });