Date.prototype.getWeekNumber = function () {
    var d = new Date(+this);
    d.setHours(0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
};

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
      ? args[number]
      : match
        ;
    });
};

(function ($) {
    function getDateOfISOWeek(w, y) {
        var simple = new Date(y, 0, 1 + (w - 1) * 7);
        var dow = simple.getDay();
        var ISOweekStart = simple;
        if (dow <= 4)
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        return ISOweekStart;
    }

    function convertWeekToComparable(y, w) {
        return (y + ((w) / 54))
    }

    $.widget("ui.kalnweek", {
        options: {
            autoOpen: true,
            monthStartindex: 0,
            yearsCount: 3,
            monthsCount: 3,
            startYear: undefined,
            startMonth: undefined,
            startWeek: undefined,
            constraintStartDate: undefined,
            constraintEndDate: undefined
        },
        _eventsSet: false,
        _weekLinkFormat: "<a href='javascript:;' data-year='{1}' data-month='{2}' data-week='{3}' class='{4}'>{0}</a>",
        _monthLinkFormat: "<a href='javascript:;' data-year='{1}' data-month='{2}' class='{3}'>{0}</a>",
        _yearLinkFormat: "<a href='javascript:;' data-year='{1}' class='{2}'>{0}</a>",
        _monthShorts: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        _selectedYear: 0,
        _selectedMonth: 0,
        _selectedWeek: 0,

        getSelection: function () {
            return { yearNumber: this._selectedYear, monthNumber: this._selectedMonth, weekNumber: this._selectedWeek };
        },
        _create: function () {
            // by default, consider this thing closed.
            this._isOpen = false;

            // remember this instance
            $.ui.kalnweek.instances.push(this.element);

            var htmlElement = '<div class="kalnweek-year-container">{0}</div>' +
                    '<div class="kalnweek-month-container">{1}</div>' +
                    '<div class="kalnweek-week-container">{2}</div>';

            var htmlYearPart = '<table class="kalnweek-year-table"></table>',
                htmlMonthPart = '<table class="kalnweek-month-table"></table>',
                htmlWeekPart = '<table class="kalnweek-week-table"></table>';


            var allHtml = htmlElement.format(htmlYearPart, htmlMonthPart, htmlWeekPart);

            $(this.element).addClass('kalnweek').html(allHtml);

        },
        _init: function () {

            // call open if this instance should be open by default
            if (this.options.autoOpen) {
                this.open();
            }

            var firstToday = new Date();

            //console.log(this.options);

            if (this.options.startWeek && this.options.startYear) {

                var firstDayInInitials = getDateOfISOWeek(this.options.startWeek, this.options.startYear);

                // TODO: We need to check constraint end date
                if (this.options.constraintStartDate && (firstDayInInitials.valueOf() >= this.options.constraintStartDate.valueOf())) {
                    firstToday = getDateOfISOWeek(this.options.startWeek, this.options.startYear);
                }
                else {
                    firstToday = this.options.constraintStartDate;
                }
            } else {
                if (this.options.constraintStartDate) {
                    firstToday = this.options.constraintStartDate;
                }
            }

            var initYear = firstToday.getFullYear(),
                initMonth = this.options.startMonth || firstToday.getMonth(),
                initWeek = firstToday.getWeekNumber();

            //console.log(this.options,initYear, initMonth, initWeek);

            // Set init selected values
            this._selectedYear = initYear;
            this._selectedMonth = initMonth;
            this._selectedWeek = initWeek;

            this._trigger("selectweek", event, { yearNumber: this._selectedYear, monthNumber: this._selectedMonth, weekNumber: this._selectedWeek });

            //console.log(initYear, initMonth);

            // Render initial week selector
            this._renderYearSection(initYear);
            this._renderMonthSection(initYear, initMonth);
            this._renderWeekSection(initYear, initMonth);

            this._on(this.element, {
                'click .kalnweek-year-container .kalnweek-year-table td a': function (event) {
                    event.preventDefault();

                    var $currentTarget = $(event.currentTarget),
                        yearNumber = $currentTarget.attr('data-year');

                    if (!$currentTarget.parent().hasClass('disabled')) {
                        this.selectYear(parseInt(yearNumber));
                    }
                }
            });

            this._on(this.element, {
                'click .kalnweek-month-container .kalnweek-month-table td a': function (event) {
                    event.preventDefault();
                    var $currentTarget = $(event.currentTarget),
                        yearNumber = $currentTarget.attr('data-year'),
                        monthNumber = $currentTarget.attr('data-month');

                    if (!$currentTarget.parent().hasClass('disabled')) {
                        this.selectMonth(parseInt(yearNumber), parseInt(monthNumber));
                    }
                }
            });

            this._on(this.element, {
                'click .kalnweek-week-container .kalnweek-week-table td a': function (event) {
                    event.preventDefault();
                    var $currentTarget = $(event.currentTarget),
                        yearNumber = $currentTarget.attr('data-year'),
                        monthNumber = $currentTarget.attr('data-month'),
                        weekNumber = $currentTarget.attr('data-week');

                    if (!$currentTarget.parent().hasClass('disabled')) {
                        $('.kalnweek-week-container .kalnweek-week-table td a').parent().removeClass('selected').removeClass('today');
                        $currentTarget.parent().addClass('today').addClass('selected');
                        this.selectWeek(event, parseInt(yearNumber), parseInt(monthNumber), parseInt(weekNumber));
                    }
                }
            });

            this._trigger('ready');
        },
        _getWeekFirstWeekOnMonth: function (yearNumber, monthNumber) {
            return (new Date(yearNumber, monthNumber)).getWeekNumber();
        },
        _getSafeMonthNumber: function (number) {

            if (number < this.options.monthStartindex) {
                return 12 + number;
            }

            if (number > (this.options.monthStartindex + 11)) {
                return number - 12;
            }

            return number;
        },
        _renderWeekTd: function (weekNumber, yearNumber, monthNumber) {
            var disableWeek = false;

            var currentWeek = convertWeekToComparable(yearNumber, weekNumber),
                constraintStartWeek = 0,
                constraintStartYear = 0,
                constraintEndWeek = 0,
                constraintEndYear = 0,
                constraintStart = 0,
                constraintEnd = 0;

            //console.log(yearToCompare, yearNumber, monthNumber, nonSafeMonthNumber, safeMonthNumber);

            if (this.options.constraintStartDate && !this.options.constraintEndDate) {
                constraintStartWeek = this.options.constraintStartDate.getWeekNumber();
                constraintStartYear = this.options.constraintStartDate.getFullYear();

                constraintStart = convertWeekToComparable(constraintStartYear, constraintStartWeek);

                // Disable if month and year is not greater than the limit
                disableWeek = !(currentWeek >= constraintStart);
            } else {
                if (!this.options.constraintStartDate && this.options.constraintEndDate) {

                    constraintEndWeek = this.options.constraintEndDate.getWeekNumber();
                    constraintEndYear = this.options.constraintEndDate.getFullYear();

                    constraintEnd = convertWeekToComparable(constraintEndYear, constraintEndWeek);

                    // Disable if year is not greater than the limit
                    disableWeek = !(currentWeek <= constraintEnd);
                } else {
                    if (this.options.constraintStartDate && this.options.constraintEndDate) {
                        constraintEndWeek = this.options.constraintEndDate.getWeekNumber();
                        constraintEndYear = this.options.constraintEndDate.getFullYear();

                        constraintStartWeek = this.options.constraintStartDate.getWeekNumber();
                        constraintStartYear = this.options.constraintStartDate.getFullYear();

                        constraintStart = convertWeekToComparable(constraintStartYear, constraintStartWeek);
                        constraintEnd = convertWeekToComparable(constraintEndYear, constraintEndWeek);

                        disableWeek = !(currentWeek >= constraintStart && currentWeek <= constraintEnd);
                    }
                }
            }

            if (disableWeek) {
                return '<td class="disabled">' + this._weekLinkFormat.format(weekNumber, yearNumber, monthNumber, weekNumber, '') + '</td>';
            }
            else {
                return '<td class="{0}">'.format(weekNumber == this._selectedWeek ? 'today selected' : '') + this._weekLinkFormat.format(weekNumber, yearNumber, monthNumber, weekNumber, '') + '</td>';
            }
        },
        _renderWeekSection: function (yearNumber, monthNumber) {
            var startDate = new Date(yearNumber, monthNumber);

            var weeks = [];

            for (var i = new Date(startDate.valueOf()) ; i.getMonth() <= startDate.getMonth() && i.getFullYear() == startDate.getFullYear() ;) {
                var weekToBeInserted = i.getWeekNumber();
                i.setDate(i.getDate() + 7);

                if (i.getFullYear() == startDate.getFullYear()) {
                    weeks.push(weekToBeInserted);
                }
            }

            var htmlInside = '',
                weekNumber = 0;

            for (var i = 0; i < weeks.length; i++) {
                weekNumber = weeks[i];
                htmlInside += this._renderWeekTd(weekNumber, yearNumber, monthNumber);
            }

            $('.kalnweek-week-container .kalnweek-week-table', this.element).html('<tr>' + htmlInside + '</tr>');
        },
        _renderYearTd: function (yearNumber, yearIterator) {
            var disableYear = false;

            if (this.options.constraintStartDate && !this.options.constraintEndDate) {
                // Disable if year is not greater than the limit
                disableYear = !(yearIterator >= this.options.constraintStartDate.getFullYear())
            } else {
                if (!this.options.constraintStartDate && this.options.constraintEndDate) {
                    // Disable if year is not greater than the limit
                    disableYear = !(yearIterator <= this.options.constraintStartDate.getFullYear())
                } else {
                    if (this.options.constraintStartDate && this.options.constraintEndDate) {
                        // Disable if year is not in the range
                        disableYear = !(yearIterator >= this.options.constraintStartDate.getFullYear() && yearIterator <= this.options.constraintEndDate.getFullYear());
                    }
                }
            }

            if (disableYear) {
                return '<td class="{0}">'.format('disabled') + this._yearLinkFormat.format(yearIterator, yearIterator, '') + '</td>';
            }
            else {
                return '<td class="{0}">'.format(yearIterator == this._selectedYear ? 'today selected' : '') + this._yearLinkFormat.format(yearIterator, yearIterator, '') + '</td>';
            }
        },

        _renderMonthTd: function (yearNumber, monthNumber, nonSafeMonthNumber, safeMonthNumber) {
            var disableMonth = false;

            var yearToCompare = yearNumber;

            if (nonSafeMonthNumber < 0) {
                yearToCompare = yearNumber - 1;
            }
            else {
                if (nonSafeMonthNumber > this.options.monthStartindex + 11) {
                    yearToCompare = yearNumber + 1;
                }
            }

            //console.log(yearToCompare, yearNumber, monthNumber, nonSafeMonthNumber, safeMonthNumber);

            if (this.options.constraintStartDate && !this.options.constraintEndDate) {
                // Disable if month and year is not greater than the limit
                disableMonth = !(yearToCompare >= this.options.constraintStartDate.getFullYear() && safeMonthNumber >= this.options.constraintEndDate.getMonth())
            } else {
                if (!this.options.constraintStartDate && this.options.constraintEndDate) {
                    // Disable if year is not greater than the limit
                    disableMonth = !(yearToCompare <= this.options.constraintStartDate.getFullYear() && safeMonthNumber <= this.options.constraintEndDate.getMonth())
                } else {
                    if (this.options.constraintStartDate && this.options.constraintEndDate) {

                        var constraintStartYear = this.options.constraintStartDate.getFullYear(),
                            constraintStartMonth = this.options.constraintStartDate.getMonth(),
                            constraintEndYear = this.options.constraintEndDate.getFullYear(),
                            constraintEndMonth = this.options.constraintEndDate.getMonth();

                        var constraintStart = constraintStartYear + ((constraintStartMonth + 1) / 12),
                            constraintEnd = constraintEndYear + ((constraintEndMonth + 1) / 12);

                        var current = yearToCompare + ((safeMonthNumber + 1) / 12);

                        disableMonth = !(current >= constraintStart && current <= constraintEnd);
                    }
                }
            }

            if (disableMonth) {
                return '<td class="disabled">' + this._monthLinkFormat.format(this._monthShorts[safeMonthNumber], yearToCompare, safeMonthNumber, '') + '</td>';
            }
            else {
                return '<td class="{0}">'.format(safeMonthNumber == this._selectedMonth ? 'today selected' : '') + this._monthLinkFormat.format(this._monthShorts[safeMonthNumber], yearToCompare, safeMonthNumber, '') + '</td>';
            }
        },
        _renderMonthSection: function (yearNumber, monthNumber) {
            var newHtml = '';
            var startMonth = monthNumber - ((this.options.monthsCount - 1) / 2),
                endMonth = monthNumber + ((this.options.monthsCount - 1) / 2);

            for (var i = startMonth; i <= endMonth; i++) {
                //console.log(i);
                var safeMonthNumber = this._getSafeMonthNumber(i);

                newHtml += this._renderMonthTd(yearNumber, monthNumber, i, safeMonthNumber);
            }

            $('.kalnweek-month-container .kalnweek-month-table', this.element).html('<tr>' + newHtml + '</tr>');
        },
        _renderYearSection: function (yearNumber) {
            var newHtml = '';
            var startYear = yearNumber - ((this.options.yearsCount - 1) / 2),
                endYear = yearNumber + ((this.options.yearsCount - 1) / 2);

            for (var i = startYear; i <= endYear; i++) {
                newHtml += this._renderYearTd(yearNumber, i);
            }

            $('.kalnweek-year-container .kalnweek-year-table', this.element).html('<tr>' + newHtml + '</tr>');
        },

        selectYear: function (yearNumber) {

            if (yearNumber != this._selectedYear) {
                this._selectedMonth = this.options.monthStartindex;
                this._selectedWeek = this._getWeekFirstWeekOnMonth(yearNumber, this.options.monthStartindex);
                this._selectedYear = yearNumber;
                // The year has changed
                this._renderYearSection(yearNumber);
                this._renderMonthSection(yearNumber, this.options.monthStartindex);
                this._renderWeekSection(yearNumber, this.options.monthStartindex);

                this._trigger("selectweek", event, { yearNumber: this._selectedYear, monthNumber: this._selectedMonth, weekNumber: this._selectedWeek });
            }
        },
        selectMonth: function (yearNumber, monthNumber) {

            this._selectedMonth = monthNumber;
            this._selectedWeek = this._getWeekFirstWeekOnMonth(yearNumber, monthNumber);

            if (yearNumber != this._selectedYear) {
                this._selectedYear = yearNumber;
                // The year changed
                this._renderYearSection(yearNumber);
            }

            this._renderMonthSection(yearNumber, monthNumber);
            this._renderWeekSection(yearNumber, monthNumber);

            this._trigger("selectweek", event, { yearNumber: this._selectedYear, monthNumber: this._selectedMonth, weekNumber: this._selectedWeek });
        },
        selectWeek: function (event, yearNumber, monthNumber, weekNumber) {
            this._selectedYear = yearNumber;
            this._selectedMonth = monthNumber;
            this._selectedWeek = weekNumber;

            this._trigger("selectweek", event, { yearNumber: yearNumber, monthNumber: monthNumber, weekNumber: weekNumber });
        },
        open: function () {
            this._isOpen = true;

            // trigger beforeopen event.  if beforeopen returns false,
            // prevent bail out of this method. 
            if (this._trigger("beforeopen") === false) {
                return;
            }

            // call methods on every other instance of this dialog
            $.each(this._getOtherInstances(), function () {
                var $this = $(this);

                if ($this.kalnweek("isOpen")) {
                    $this.kalnweek("close");
                }
            });

            // more open related code here

            // trigger open event
            this._trigger("open");

            return this;
        },

        close: function () {
            this._isOpen = false;

            // trigger close event
            this._trigger("close");

            return this;
        },

        isOpen: function () {
            return this._isOpen;
        },

        destroy: function () {
            // remove this instance from $.ui.kalnweek.instances
            var element = this.element,
				position = $.inArray(element, $.ui.kalnweek.instances);

            // if this instance was found, splice it off
            if (position > -1) {
                $.ui.kalnweek.instances.splice(position, 1);
            }

            // call the original destroy method since we overwrote it
            $.Widget.prototype.destroy.call(this);
        },

        _getOtherInstances: function () {
            var element = this.element;

            return $.grep($.ui.kalnweek.instances, function (el) {
                return el !== element;
            });
        },

        _setOption: function (key, value) {
            this.options[key] = value;

            switch (key) {
                case "something":
                    // perform some additional logic if just setting the new
                    // value in this.options is not enough. 
                    break;
            }
        }
    });

    $.extend($.ui.kalnweek, {
        instances: []
    });

})(jQuery);