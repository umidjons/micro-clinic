angular.module('MyClinic')
    .controller('PatientSearchCtrl', function ($scope) {

    })
    .controller('PatientCtrl', function ($scope, $state, $stateParams, $modal, Sex, Patient) {
        $scope.sex = Sex.query();

        console.log('Params:', $stateParams);

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
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('patientList');
                        }
                    });
                } else {
                    $scope.patient.$save(function (resp) {
                        console.log('Response:', resp);
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
    });