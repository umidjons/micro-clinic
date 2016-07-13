(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('ReportCtrl', function ($scope, Auth, Report, Branch, $timeout) {
            $scope.period = {
                start: Date.create('the beginning of this month'),
                end: Date.create('today')
            };

            $scope.branches = Branch.query();

            // translate chart labels
            Highcharts.setOptions({
                lang: {
                    shortMonths: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                    rangeSelectorFrom: 'с',
                    rangeSelectorTo: 'по',
                    rangeSelectorZoom: 'Масштаб',
                    resetZoom: 'Восстановить масштаб',
                    loading: 'Загрузка...'
                }
            });

            $scope.chartConfig = {
                options: {
                    chart: {zoomType: 'x', type: 'line'},
                    rangeSelector: {
                        enabled: true,
                        inputDateFormat: '%e %b %Y',
                        inputEditDateFormat: '%d.%m.%Y',
                        buttons: [
                            {
                                count: 7,
                                type: 'day',
                                text: 'нед'
                            },
                            {
                                count: 1,
                                type: 'month',
                                text: 'мес'
                            },
                            {
                                count: 3,
                                type: 'month',
                                text: 'квар'
                            },
                            {
                                count: 1,
                                type: 'month',
                                text: 'год'
                            },
                            {
                                type: 'all',
                                text: 'все'
                            }
                        ]
                    },
                    legend: {enabled: true}
                },
                title: false,
                useHighStocks: true,
                series: [{data: []}],
                func: function (chart) {
                    $timeout(function () {
                        chart.zoom();
                        chart.reflow();
                    }, 0);
                }
            };

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
                    let records = resp;

                    // clear series
                    $scope.chartConfig.series = [];

                    // generate series
                    for (let branch of $scope.branches) {
                        // patient visits series for the branch
                        let seriesVisits = {
                            id: 'Visits' + branch._id,
                            name: branch.shortTitle + ' (посещ.)',
                            data: [],
                            tooltip: {valueSuffix: ' посещений'}
                        };

                        // new patients series for the branch
                        let seriesNew = {
                            id: 'New' + branch._id,
                            name: branch.shortTitle + ' (новых)',
                            data: [],
                            tooltip: {valueSuffix: ' новых'}
                        };

                        // regexp to normalize date
                        let pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
                        for (let date of $scope.dates) {
                            let ts = Date.create(date.replace(pattern, '$3-$2-$1')) // convert dd.mm.yyyy to yyyy-mm-dd
                                .advance({hours: 5}) // adjust offset +0005
                                .getTime(); // get time stamp value

                            // by default count values are zero
                            let valVisits = 0;
                            let valNew = 0;

                            // if there is values in that date for the branch, take them
                            if (records[date] && records[date][branch.shortTitle]) {
                                valVisits = records[date][branch.shortTitle].countVisits;
                                valNew = records[date][branch.shortTitle].countNew;
                            }

                            seriesVisits.data.push([ts, valVisits]);
                            seriesNew.data.push([ts, valNew]);
                        }
                        // add series into chart series
                        $scope.chartConfig.series.push(seriesVisits);
                        $scope.chartConfig.series.push(seriesNew);
                    }

                    // reset zoom & re-flow
                    $scope.chartConfig.getHighcharts().zoom();
                    $scope.chartConfig.getHighcharts().reflow();
                });
            };
        });
})();