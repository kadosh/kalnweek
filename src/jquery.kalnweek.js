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
    $.widget("ui.kalnweek", {
        options: {
            autoOpen: true,
            monthStartindex: 0,
            yearsCount: 3,
            monthsCount: 3,
            yearFromConstraint: 2014,
            yearToConstraint: 2014
        },
        _eventsSet: false,
        _weekLinkFormat: "<a href='javascript:;' data-year='{1}' data-month='{2}' data-week='{3}' class='{4}'>{0}</a>",
        _monthLinkFormat: "<a href='javascript:;' data-year='{1}' data-month='{2}' class='{3}'>{0}</a>",
        _yearLinkFormat: "<a href='javascript:;' data-year='{1}' class='{2}'>{0}</a>",
        _monthShorts: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        _selectedYear: 0,
        _selectedMonth: 0,
        _selectedWeek: 0,

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

            var today = new Date(),
                initYear = today.getFullYear(),
                initMonth = today.getMonth();

            // Set init selected values
            this._selectedYear = initYear;
            this._selectedMonth = initMonth;
            this._selectedWeek = today.getWeekNumber();


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

            alert("there");

            this._on(this.element, {
                'click .kalnweek-week-container .kalnweek-week-table td a': function (event) {
                    event.preventDefault();
                    var $currentTarget = $(event.currentTarget),
                        yearNumber = $currentTarget.attr('data-year'),
                        monthNumber = $currentTarget.attr('data-month'),
                        weekNumber = $currentTarget.attr('data-week');

                    $('.kalnweek-week-container .kalnweek-week-table td a').parent().removeClass('selected').removeClass('today');
                    $currentTarget.parent().addClass('today').addClass('selected');
                    this.selectWeek(parseInt(yearNumber), parseInt(monthNumber), parseInt(weekNumber));
                }
            });



            console.log(this._trigger('afterinit'));
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
        _renderWeekSection: function (yearNumber, monthNumber) {
            var startDate = new Date(yearNumber, monthNumber);

            var weeks = [];

            for (var i = new Date(startDate.valueOf()) ; i.getMonth() <= startDate.getMonth() ;) {
                weeks.push(i.getWeekNumber());
                i.setDate(i.getDate() + 7)
            }

            var htmlInside = '',
                weekNumber = 0;

            for (var i = 0; i < weeks.length; i++) {
                weekNumber = weeks[i];
                htmlInside += '<td class="{0}">'.format(weekNumber == this._selectedWeek ? 'today selected' : '') + this._weekLinkFormat.format(weekNumber, yearNumber, monthNumber, weekNumber, '') + '</td>';
            }

            $('.kalnweek-week-container .kalnweek-week-table', this.element).html('<tr>' + htmlInside + '</tr>');
        },
        _renderYearTd: function (yearNumber, yearIterator) {

            if (this.options.yearFromConstraint && this.options.yearToConstraint) {
                if (yearIterator >= this.options.yearFromConstraint && yearIterator <= this.options.yearToConstraint) {
                    return '<td class="{0}">'.format(yearIterator == this._selectedYear ? 'today selected' : '') + this._yearLinkFormat.format(yearIterator, yearIterator, '') + '</td>';
                }
                else {
                    return '<td class="{0}">'.format('disabled') + this._yearLinkFormat.format(yearIterator, yearIterator, '') + '</td>';
                }
            }

            return '<td class="{0}">'.format(yearIterator == this._selectedYear ? 'today selected' : '') + this._yearLinkFormat.format(yearIterator, yearIterator, '') + '</td>';
        },

        _renderMonthTd: function (yearNumber, monthNumber, nonSafeMonthNumber, safeMonthNumber) {

            var yearToCompare = nonSafeMonthNumber < 0 ? yearNumber - 1 : yearNumber;

            if (this.options.yearFromConstraint && this.options.yearToConstraint) {
                if (yearToCompare >= this.options.yearFromConstraint && yearToCompare <= this.options.yearToConstraint) {
                    return '<td class="{0}">'.format(safeMonthNumber == this._selectedMonth ? 'today selected' : '') + this._monthLinkFormat.format(this._monthShorts[safeMonthNumber], yearToCompare, safeMonthNumber, '') + '</td>';
                }
                else {
                    return '<td class="disabled">' + this._monthLinkFormat.format(this._monthShorts[safeMonthNumber], yearToCompare, safeMonthNumber, '') + '</td>';
                }
            }

            return '<td class="{0}">'.format(safeMonthNumber == this._selectedMonth ? 'today selected' : '') + this._monthLinkFormat.format(this._monthShorts[safeMonthNumber], yearToCompare, safeMonthNumber, '') + '</td>';
        },
        _renderMonthSection: function (yearNumber, monthNumber) {
            var newHtml = '';
            var startMonth = monthNumber - ((this.options.monthsCount - 1) / 2),
                endMonth = monthNumber + ((this.options.monthsCount - 1) / 2);

            for (var i = startMonth; i <= endMonth; i++) {
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
            }
        },
        selectMonth: function (yearNumber, monthNumber) {
            this._selectedYear = yearNumber;
            this._selectedMonth = monthNumber;
            this._selectedWeek = this._getWeekFirstWeekOnMonth(yearNumber, monthNumber);

            if (yearNumber != this._selectedYear) {

                // The year changed
                this._renderYearSection(yearNumber);
            }

            this._renderMonthSection(yearNumber, monthNumber);
            this._renderWeekSection(yearNumber, monthNumber);
        },
        selectWeek: function (yearNumber, monthNumber, weekNumber) {
            this._selectedYear = yearNumber;
            this._selectedMonth = monthNumber;
            this._selectedWeek = weekNumber;


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