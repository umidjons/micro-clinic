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
        });
})();