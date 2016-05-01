'use strict';

angular.module('MyClinic')
    .controller('CashListCtrl', function ($scope, $aside, $state, Cash, PayType, Modal) {
        $scope.payTypes = PayType.query();
        $scope.records = Cash.pendingPatients();

        $scope.startPay = function (patientService) {

            // create and show aside, also keep it in a property
            let asidePay = $aside({
                scope: $scope,
                templateUrl: 'partials/cash/_aside_pay.html',
                title: 'Оплата',
                container: 'body',
                backdrop: 'static',
                controller: function () {
                    this.type = undefined;
                    this.total = patientService.totalDebt;
                    this.debt = 0; // debt after pay

                    let ctrl = this;
                    this.save = function () {
                        Modal.confirm({
                            okAction: function (modal) {
                                var cash = new Cash();
                                cash.pay = {
                                    patientId: patientService.patient._id,
                                    totalDebt: patientService.totalDebt,
                                    payType: ctrl.type
                                };

                                cash.$payAll(function (resp) {
                                    if (resp.code == 'success') {
                                        // close modal & aside
                                        modal.hide();
                                        asidePay.hide();
                                        // reload page
                                        $state.transitionTo('cashList', null, {
                                            reload: true,
                                            inherit: false,
                                            notify: true
                                        });
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
    })
    .controller('CashPayCtrl', function ($scope, $state, $stateParams, F, Cash, PayType, Msg, Modal) {
        // init section
        var init = function () {
            $scope.payTypes = PayType.query();
            $scope.patientService = $stateParams.patientService;
            $scope.pay = {
                type: undefined,
                total: $scope.patientService.totalDebt,
                debt: 0
            };

            Cash.pendingServicesOf({patientId: $scope.patientService.patient._id}, function (resp) {
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
                        console.log('resp=', resp);
                        if (resp.code === 'success') {
                            $state.go('cashList');
                        }
                    });
                }
            });
        };

        init();
    });