(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('CashListCtrl', function ($scope, $aside, $state, Cash, PayType, Modal, Branch) {
            $scope.payTypes = PayType.query();
            $scope.records = [];
            $scope.branches = Branch.query();
            $scope.todaysOnly = 1;
            $scope.period = {
                start: Date.create('the beginning of this month'),
                end: Date.create('the end of this month')
            };

            $scope.Filter = {
                branch: $scope.$localStorage.currentUser.branch,
                by: function (branch) {
                    $scope.Filter.branch = branch;
                    $scope.reloadPage();
                }
            };

            $scope.reloadPage = function () {
                // determine period
                let period = {};
                if ($scope.todaysOnly) {
                    period.start = Date.create();
                    period.end = Date.create();
                } else {
                    period = angular.copy($scope.period);
                }

                // determine branch
                let branch = $scope.Filter.branch ? $scope.Filter.branch._id : undefined;

                // get records
                $scope.records = Cash.pendingPatients({branch: branch, period: period});
            };

            // initial loading
            $scope.reloadPage();

            $scope.startPay = function (patientService) {

                // create and show aside, also keep it in a property
                let asidePay = $aside({
                    scope: $scope,
                    templateUrl: 'partials/cash/_aside_pay.html',
                    title: 'Оплата',
                    container: 'body',
                    backdrop: 'static',
                    controller: function () {
                        this.check = {
                            print: true, // true - print check
                            includeCash: true, // true - include cash type pays into check
                            includeCashless: false // true - include cashless type pays into check
                        };
                        this.type = undefined;
                        this.totalMax = patientService.totalDebt - patientService.totalCompany;
                        this.total = patientService.totalDebt - patientService.totalCompany;
                        this.totalCompany = patientService.totalCompany;
                        this.debt = 0; // debt after pay
                        this.isByCompany = this.total == 0 && this.totalCompany > 0;
                        this.fullName = patientService.patient.lastName + ' ' + patientService.patient.firstName + ' '
                            + (patientService.patient.middleName ? patientService.patient.middleName : '');

                        let ctrl = this;

                        this.typeChanged = function () {
                            if (ctrl.type && ctrl.type._id == 'separated') {
                                ctrl.recalc();
                            } else {
                                ctrl.totalCash = 0;
                                ctrl.totalCashless = 0;
                            }

                            // if Cashless pay, by default do not print check
                            ctrl.check.print = ctrl.type._id != 'cashless';
                        };

                        this.recalc = function (which) {
                            if (ctrl.type && ctrl.type._id == 'separated') {
                                if (angular.isUndefined(which)) { // total changed
                                    ctrl.totalCash = Math.ceil(ctrl.total / 2);
                                    ctrl.totalCashless = ctrl.total - ctrl.totalCash;
                                } else if (which == 'cash') { // cash changed
                                    ctrl.totalCashless = ctrl.total - ctrl.totalCash;
                                } else if (which == 'cashless') { // cashless changed
                                    ctrl.totalCash = ctrl.total - ctrl.totalCashless;
                                }
                            }
                            // calculate debt
                            ctrl.debt = ctrl.totalMax - ctrl.total;
                        };

                        this.save = function () {
                            Modal.confirm({
                                okAction: function (modal) {
                                    var cash = new Cash();
                                    let branch = $scope.Filter.branch ? $scope.Filter.branch._id : undefined;

                                    // determine period
                                    let period = {};
                                    if ($scope.todaysOnly) {
                                        period.start = Date.create();
                                        period.end = Date.create();
                                    } else {
                                        period = angular.copy($scope.period);
                                    }

                                    cash.pay = {
                                        branch: branch,
                                        patientId: patientService.patient._id,
                                        totalDebt: patientService.totalDebt,
                                        payType: ctrl.type,
                                        total: ctrl.total,
                                        totalCash: ctrl.totalCash,
                                        totalCashless: ctrl.totalCashless,
                                        totalCompany: ctrl.totalCompany,
                                        debt: ctrl.debt,
                                        period: period
                                    };

                                    cash.$payAll(function (resp) {
                                        if (resp.payTime) {
                                            // close modal & aside
                                            modal.hide();
                                            asidePay.hide();

                                            if (ctrl.check.print) {
                                                Cash.printCheck(
                                                    patientService.patient._id,
                                                    resp.payTime,
                                                    ctrl.check.includeCash,
                                                    ctrl.check.includeCashless,
                                                    function () {
                                                        // reload page
                                                        $state.transitionTo('cashList', null, {
                                                            reload: true,
                                                            inherit: false,
                                                            notify: true
                                                        });
                                                    });
                                            } else {
                                                // reload page
                                                $state.transitionTo('cashList', null, {
                                                    reload: true,
                                                    inherit: false,
                                                    notify: true
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        };
                    },
                    controllerAs: 'Pay',
                    show: true
                });
            };

            $scope.resetFilter = function () {
                $scope.sort = {by: undefined, reverse: false};
                $scope.filter = {};
            };

            $scope.changeSort = function (columnName) {
                if (angular.isUndefined($scope.sort)) {
                    $scope.sort = {by: undefined, reverse: false};
                }
                $scope.sort.by = columnName;
                $scope.sort.reverse = !$scope.sort.reverse;
            };

            $scope.classSort = function (columnName) {
                if (!$scope.sort) return '';
                var class_ = $scope.sort.by == columnName;
                if (!class_) return '';
                return !$scope.sort.reverse ? 'fa-caret-up' : 'fa-caret-down';
            };


        })
        .controller('CashPayCtrl', function ($scope, $state, $stateParams, F, Cash, PayType, Msg, Modal) {
            // init section
            var init = function () {
                if (!$stateParams.patientService) {
                    return $state.go('cashList');
                }
                $scope.payTypes = PayType.query();
                $scope.patientService = $stateParams.patientService;
                $scope.pay = {
                    type: undefined,
                    total: $scope.patientService.totalDebt,
                    debt: 0
                };

                Cash.pendingServicesOf(
                    {
                        branch: $scope.$localStorage.currentUser.branch._id,
                        patientId: $scope.patientService.patient._id
                    },
                    function (resp) {
                        $scope.pendingServices = resp;
                        for (let srv of $scope.pendingServices) {
                            srv.forPay = srv.debt;
                            srv.debtAfterPay = 0;

                            // add pays array
                            srv.pays = [];
                            srv.pays.push({
                                payType: undefined,
                                amount: srv.debt
                            });
                        }
                    });
            };

            $scope.PendingServiceHelper = {
                forPayChanged: function (penSrv) {
                    penSrv.debtAfterPay = penSrv.debt - penSrv.forPay;
                    penSrv.pays.splice(1); // remove other pays, except the first
                    penSrv.pays[0].amount = penSrv.forPay; // re-set amount of the first pay
                },
                splitPay: function (penSrv) {
                    if (penSrv.pays.length > 1) {
                        Msg.error('Оплата уже разделена по всем возможным типам!');
                        return;
                    }

                    var halfAmount_1 = Math.ceil(penSrv.forPay / 2);
                    var halfAmount_2 = penSrv.forPay - halfAmount_1;

                    // set first pay as cash type with half amount of forPay
                    penSrv.pays[0].amount = halfAmount_1;
                    penSrv.pays[0].payType = $scope.payTypes[0];

                    // add second pay with cashless type with another half amount of forPay
                    penSrv.pays.push({
                        payType: $scope.payTypes[1],
                        amount: halfAmount_2
                    });
                },
                mergePay: function (penSrv) {
                    if (penSrv.pays.length < 2) {
                        Msg.error('Нечего отменить! Вероятно разделение оплаты по типам уже отменена ' +
                            'или разделение не произведена вообще.');
                        return;
                    }
                    penSrv.pays[0].payType = undefined; // restore pay type of the first payment
                    this.forPayChanged(penSrv);
                },
                normalizePays: function (penSrv, payIdx) {
                    var otherIdx = 1 - payIdx;
                    penSrv.pays[otherIdx].amount = penSrv.forPay - penSrv.pays[payIdx].amount;
                }
            };

            $scope.save = function () {
                Modal.confirm({
                    okAction: function (modal) {
                        var cash = new Cash();
                        cash.pendingServices = angular.copy($scope.pendingServices);
                        cash.$save(function (resp) {
                            modal.hide();
                            if (resp.code === 'success') {
                                $state.go('cashList');
                            }
                        });
                    }
                });
            };

            init();
        })
        .controller('CashRegCtrl', function ($scope, $filter, $q, $state, $aside, Msg, Cash, Modal, Branch) {
            $scope.branches = Branch.query();

            $scope.filter = {
                startDate: Date.create('today'),
                endDate: Date.create('today'),
                branch: $scope.$localStorage.currentUser.branch,
                by: function (branch) {
                    $scope.filter.branch = branch;
                    $scope.refresh();
                }
            };

            $scope.refresh = function () {
                var params = {
                    startDate: $scope.filter.startDate,
                    endDate: $scope.filter.endDate,
                    branch: $scope.filter.branch ? $scope.filter.branch._id : undefined
                };
                Cash.registry(params, function (resp) {
                    $scope.records = resp;
                });
            };

            $scope.details = function (pay) {
                var deferred = $q.defer();

                if (angular.isUndefined(pay.payDetails)) {
                    Cash.payDetails({patientId: pay.patientId, payTime: pay.payTime}, function (resp) {
                        pay.payDetails = resp;
                        deferred.resolve(pay);
                    });
                } else {
                    deferred.resolve(pay);
                }
                pay.payDetailsOpened = !pay.payDetailsOpened;

                return deferred.promise;
            };

            $scope.printCheck = function (pay) {
                // create and show aside, also keep it in a property
                let asideCheck = $aside({
                    scope: $scope,
                    templateUrl: 'partials/cash/_aside_check.html',
                    title: 'Распечатка чека',
                    container: 'body',
                    backdrop: 'static',
                    controller: function () {
                        this.check = {
                            includeCash: true, // true - include cash type pays into check
                            includeCashless: false // true - include cashless type pays into check
                        };
                        this.fullName = pay.patient.lastName + ' ' + pay.patient.firstName + ' '
                            + (pay.patient.middleName ? pay.patient.middleName : '');

                        let ctrl = this;

                        this.print = function () {
                            // close aside
                            asideCheck.hide();

                            Cash.printCheck(
                                pay.patientId,
                                pay.payTime,
                                ctrl.check.includeCash,
                                ctrl.check.includeCashless,
                                function () {
                                    Msg.success('Распечатка чека завершена.');
                                });
                        };
                    },
                    controllerAs: 'Check',
                    show: true
                });
            };

            $scope.resetSearch = function () {
                $scope.sort = {by: undefined, reverse: false};
                $scope.search = {};
            };

            $scope.changeSort = function (columnName) {
                if (angular.isUndefined($scope.sort)) {
                    $scope.sort = {by: undefined, reverse: false};
                }
                $scope.sort.by = columnName;
                $scope.sort.reverse = !$scope.sort.reverse;
            };

            $scope.classSort = function (columnName) {
                if (!$scope.sort) return '';
                var class_ = $scope.sort.by == columnName;
                if (!class_) return '';
                return !$scope.sort.reverse ? 'fa-caret-up' : 'fa-caret-down';
            };

            $scope.refund = function (pay) {
                $scope.details(pay).then(function (pay) {
                    // check each service state for this pay
                    let canBeRefunded = true;
                    for (let patSrv of pay.payDetails) {
                        if (patSrv.state._id == 'completed') {
                            canBeRefunded = false;
                            break;
                        }
                    }

                    // check pay can be refunded
                    if (!canBeRefunded) {
                        Msg.error('Существуют оказанные услуги в состоянии заверщен. Оплату нельзя возвращать!');
                        return;
                    }

                    let msg = 'Возвращат ' + $filter('number')(pay.payAmount, 2) + ' сум?';

                    // start refund process
                    Modal.confirm({
                        content: msg,
                        okAction: function (modal) {
                            var params = {
                                branch: $scope.filter.branch ? $scope.filter.branch._id : undefined,
                                patientId: pay.patientId,
                                payTime: pay.payTime,
                                payAmount: pay.payAmount
                            };
                            Cash.refund(params, function (resp) {
                                console.log('Refund response:', resp);

                                modal.hide();
                                $scope.refresh();
                            });
                        }
                    });
                });
            };

            $scope.refresh();
        });
})();