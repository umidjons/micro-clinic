(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('ReportCtrl', function ($scope, Auth, Report, Branch) {
            $scope.period = {
                start: Date.create('the beginning of this month'),
                end: Date.create('today')
            };

            $scope.branches = Branch.query();

            $scope.reloadPage = function () {
                if (!Auth.hasAccess('report:patientsCountByDayForPeriod'))
                    return;

                // generate dates
                $scope.dates = [];
                let date = angular.copy($scope.period.start);
                while (true) {
                    $scope.dates.push(date.format("{dd}.{MM}.{yyyy}"));
                    date = date.advance({days: 1});
                    if (date.isAfter($scope.period.end)) {
                        break;
                    }
                }

                // prepare params & query records
                let params = {
                    start: $scope.period.start,
                    end: $scope.period.end
                };
                Report.patientsCountByDayForPeriod(params, function (resp) {
                    $scope.records = resp;
                });
            };
        });
})();