(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('CompanyCtrl', function ($scope, $state, $stateParams, Modal, Company, State) {
            $scope.states = State.query();

            if ($stateParams.id) {
                Company.get({id: $stateParams.id}, function (company) {
                    $scope.company = company;
                });
            } else {
                $scope.company = new Company();
            }

            $scope.saveCompany = function () {
                Modal.confirm({
                    okAction: function (modal) {
                        if ($scope.company._id) {
                            $scope.company.$update(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $state.transitionTo('companyEdit', $stateParams, {
                                        reload: true,
                                        inherit: false,
                                        notify: true
                                    });
                                }
                            });
                        } else {
                            $scope.company.$save(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $state.go('companyList');
                                }
                            });
                        }
                    }
                });
            };

        })
        .controller('CompaniesCtrl', function ($scope, Modal, Company) {
            $scope.reloadPage = function () {
                $scope.companies = Company.query({all: 1});
            };

            $scope.deleteCompany = function (company) {
                Modal.confirm({
                    content: 'Удалить компанию?',
                    okAction: function (modal) {
                        if (company) {
                            company.$delete(function (resp) {
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
        .controller('CompanyDetailsCtrl', function ($scope, Company, $state, $stateParams, Msg) {
            if ($stateParams.id) {
                Company.get({id: $stateParams.id}, function (company) {
                    $scope.company = company;
                });
            } else {
                Msg.error('Организация не выбрана!');
                $state.go('companyList');
            }

            $scope.filter = {
                start: Date.create('the beginning of this month'),
                end: Date.create('the end of this month')
            };

            $scope.refresh = function () {
                $scope.filter.companyId = $scope.company._id;
                $scope.records = Company.details($scope.filter);
            };

            $scope.resetSearch = function () {
                $scope.search = {};
            };
        })
        .controller('CompanyPayCtrl', function ($scope, F, Company, $state, $stateParams, Msg, Modal) {
            $scope.refresh = function () {
                Company.get({id: $stateParams.id}, function (company) {
                    $scope.company = company;
                    if ($scope.company.pays && $scope.company.pays.length > 1) {
                        $scope.company.pays = _.sortBy($scope.company.pays, 'date').reverse();
                    }
                });
            };

            if ($stateParams.id) {
                $scope.refresh();
            } else {
                Msg.error('Организация не выбрана!');
                $state.go('companyList');
            }

            $scope.addFunds = function () {
                let pay = angular.copy($scope.pay);
                pay.companyId = $scope.company._id;
                Modal.confirm({
                    content: `Пополнить счет на ${F.formatNumber(pay.amount)} сум от ${F.formatDate(pay.date)}?`,
                    okAction: function (modal) {
                        Company.addPay(pay, function (resp) {
                            $scope.pay = {};
                            $scope.refresh();
                            modal.hide();
                        });
                    }
                });
            };

            $scope.cancelPay = function (payment) {
                let pay = {};
                pay.payId = payment._id;
                pay.companyId = $scope.company._id;
                Modal.confirm({
                    content: `Отменить оплату ${F.formatNumber(payment.amount)} сум от ${F.formatDate(payment.date)}?`,
                    okAction: function (modal) {
                        Company.cancelPay(pay, function (resp) {
                            $scope.refresh();
                            modal.hide();
                        });
                    }
                });
            };

            $scope.fnFilter = function (pay) {
                return pay.amount > 0;
            };
        });
})();