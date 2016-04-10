'use strict';

angular.module('MyClinic')
    .controller('PartnerCtrl', function ($scope, $state, $stateParams, $modal, Partner, State) {
        console.log('Params:', $stateParams);

        $scope.states = State.query();

        if ($stateParams.id) {
            Partner.get({id: $stateParams.id}, function (partner) {
                console.log('partner=', partner);
                $scope.partner = partner;
            });
        } else {
            $scope.partner = new Partner();
        }

        $scope.savePartner = function () {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Сохранить изменения?';
            $scope.okAction = function () {
                if ($scope.partner._id) {
                    $scope.partner.$update(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('partnerList');
                        }
                    });
                } else {
                    $scope.partner.$save(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('partnerList');
                        }
                    });
                }
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

    })
    .controller('PartnersCtrl', function ($scope, $modal, Partner) {
        $scope.reloadPage = function () {
            $scope.partners = Partner.query();
        };

        $scope.deletePartner = function (partner) {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Удалить партнёра?';
            $scope.okAction = function () {
                if (partner) {
                    partner.$delete(function (resp) {
                        console.log('Response:', resp);
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
    .controller('PartnerViewCtrl', function ($scope, $state, $stateParams, Partner) {
        Partner.get({id: $stateParams.id}, function (partner) {
            $scope.partner = partner;
        });
    });