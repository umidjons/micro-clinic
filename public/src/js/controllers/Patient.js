'use strict';

angular.module('MyClinic')
    .controller('PatientSearchCtrl', function ($scope) {

    })
    .controller('PatientCtrl', function ($scope, $state, $stateParams, $modal, Sex, Patient) {
        $scope.sex = Sex.query();

        if ($stateParams.id) {
            Patient.get({id: $stateParams.id}, function (patient) {
                $scope.patient = patient;
            });
        } else {
            $scope.patient = new Patient();
        }

        $scope.savePatient = function () {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Сохранить изменения?';
            $scope.okAction = function () {
                if ($scope.patient._id) {
                    $scope.patient.$update(function (resp) {
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('patientList');
                        }
                    });
                } else {
                    $scope.patient.$save(function (resp) {
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('patientList');
                        }
                    });
                }
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

    })
    .controller('PatientsCtrl', function ($scope, $modal, Patient) {
        $scope.reloadPage = function () {
            $scope.patients = Patient.query();
        };

        $scope.deletePatient = function (patient) {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Удалить пациента?';
            $scope.okAction = function () {
                if (patient) {
                    patient.$delete(function (resp) {
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $scope.reloadPage();
                        }
                    });
                }
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

        $scope.reloadPage();
    })
    .controller('PatientViewCtrl', function ($scope, $state, $stateParams, Patient, Service,
                                             ServiceCategory, Discount, PartnerSetter, Msg) {
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
                isAllMarked: false,
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

        Patient.get({id: $stateParams.id}, function (patient) {
            $scope.patient = patient;
            $scope.patient.services = [];
        });

        //todo: output totals (quantity and price) in table footer
        //todo: create 2 pages: 1) add new services 2) services history (оказанные услуги)
    });