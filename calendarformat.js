(function($) {
    //variables
    var $window = $(window),
        $body = $('body'),
        $dateform = $('#date_form'),
        $error = $('.error'),
        $startdate = $('#date_start'),
        $enddate = $('#date_end'),        
        $button = $('#form_submit'),
        $calendar = $('#calendar'),
        $day_template = $('#day_template'),
        $event_row_template = $('#event_row_template');
        

        //form methods

            $dateform._submit = function() {
            // DESCRIPTION
            // takes values from two input fields date_start and date_end, 
            // make a call to $calendar._getEvents, then send returned data to render function
                //first clear error span
                $error.html('');

                var sdate = $startdate.val(),
                    edate = $enddate.val();

                if (sdate && edate) {
                    $calendar._getEvents(sdate,edate);
                } else {
                    $calendar._error('Please enter both dates.');
                }
            };


        //main methods

            // method variables
            var url_base = "https://trinitylutheranchurch.tandem.co/index.php?type=export&action=json&fields=name,description,locations,departments,group,time_start,time_end,time_setup,time_breakdown&limit=100";
                // json url for tandem calendar. Could make this more variable 
                // by allowing the _getEvents function to build the fields & limit based on user input
            

            $calendar._getEvents = function(sdate,edate) {
            // INPUTS
            // sdate: string (format: yyyy-mm-dd)
            // edate: string (format: yyyy-mm-dd)
            //
            // RETURNS
            // success: object with event data 
            // fail: null

                //building the final url
                var send_url = url_base + '&date_start=' + sdate + '&date_end=' + edate;
                
                //debug
                //console.log('getting events');

                //ajax call to url. Success will return data object, fail will log to console and return Null
                $.getJSON(send_url)
                  
                    .done(function(data) {
                        //DEBUG
                        //console.log('got events');
                        window.events = data.stored.tfs_Event;

                        $calendar.events = data.stored.tfs_Event;
                        $calendar._renderEvents(sdate,edate);
                    })

                    .fail(function(data) {
                        console.log('Something went wrong with the JSON call to ' + send_url);
                        $calendar._error('Having trouble connecting to the calendar server. Please try again.');
                        $calendar.events = null;
                    });

            };


            $calendar._renderEvents = function (sdate, edate) {
            // DESCRIPTION
            // checks that $calendar.events has events, and if so, iterates over 
            // the list to group them by day to more easily render on page.
            // Renders the newly grouped events to underscore templates.

                //DEBUG
                //console.log('rendering');

                //first clear any previous calendar html
                $calendar.html('');

                if ($calendar.events && $calendar.events.length > 0) {

//TODO: Pre-populate sorted events object to contain the whole date range from _getEvents function.
//      Then no need to have the if below, can simply push events.

                    $calendar.sorted_events = {[sdate]:[]};
                    var firstDate = moment(sdate).startOf('day'),
                        lastDate = moment(edate).startOf('day');

                    while(firstDate.add(1, 'days').diff(lastDate) < 0) {
                        console.log(firstDate.format('YYYY-MM-DD'));
                        $calendar.sorted_events[firstDate.format('YYYY-MM-DD')] = [];
                    }
                    console.log($calendar.sorted_events);
                    $.each($calendar.events, function(i, event) {
                        //DEBUG
                        //console.log(event.name + ' - ' + event.date_start);

                        // create new object with events sorted into dates
                        var date = event.date_start;
                        if ($calendar.sorted_events[date]) {
                            $calendar.sorted_events[date].push(event);
                        } else {
                            $calendar.sorted_events[date] = [event];
                        }
                    });

                    // render underscore template to page for each date and event
                    var day_tpl = _.template($day_template.html()),
                        event_row_tpl = _.template($event_row_template.html()),
                        calendar_html = '';

                    $.each($calendar.sorted_events, function(date, events) {
                    // iterate each date

                        //DEBUG
                        //console.log(date);

                        var events_html = '', day_html = '';

                        $.each(events, function(i, event) {
                        //DEBUG
                        //console.log(event.name);

                        // iterate each event in a date
                            var loc = '', row = '', offsite = false;
                            
                            //get locations
                            $.each(event.locations, function(i, l){
                                var name = l.facility_id.name;
                                //DEBUG
                                //console.log(name.split('</span>')[1]);
                                //console.log(!name.includes('Trinity Lutheran Church'));

                                // iterate each location in event
                                if (!(name.includes('Trinity Lutheran Church')) || name.includes('Offsite')) {
                                    //console.log('ping');
                                    offsite = true;
                                    //return false; // exit location loop, don't care anymore
                                }
                                if (!offsite) {
                                    loc += '<span class="location">' + name.split('</span>')[1] + '</span>'
                                }

                                //DEBUG
                                //console.log(loc);
                            })
                            
                            
                            if (!offsite) {
                                row = event_row_tpl({
                                    time_start: moment(event.time_start, 'h:mm a').format('h:mm A'),
                                    time_end:   moment(event.time_end, 'h:mm a').format('h:mm A'),
                                    time_setup: event.time_setup ? moment(event.time_setup, 'h:mm a').format('h:mm A') : '',
                                    time_breakdown:   event.time_setup ? moment(event.time_breakdown, 'h:mm a').format('h:mm A') : '',
                                    title:      event.name,
                                    locations:  loc
                                }) 
                                //console.log(row);
                                events_html += row;
                            }


                        });
                        day_html = day_tpl({date: moment(date).format('dddd, MMMM D, YYYY'),
                                            rows: events_html});
                        //console.log(day_html);
                        calendar_html += day_html;

                    });

                    $calendar.html(calendar_html);
                        
                    
                } else {
                    $calendar._error('No events found. Please check your date range.')
                }

            };


            $calendar._error = function(msg) {
            // INPUT
            //   msg: string
            //
            // DESCRIPTION
            // log msg to console and insert into HTML
                $error.html(msg);
                console.log(msg);
            };

        //events
        $button.on('click', function(e){
            e.preventDefault();
            //console.log($(this));
            $dateform._submit();
        });


        //initialize
        $dateform.children('input').each(function(){
            $(this).datepicker({
                dateFormat: "yy-mm-dd"
            });
        })

        $window.on('load', function() {
            
        });

        //DEBUG
        //window.calendarformat = $calendar;
})(jQuery);




// >>> from livereload import Server
// >>> import os
// >>> os.chdir('T:\Staff Directories\Communications (JOSH)\Scripts\calendarformat')
// >>> server = Server()
// >>> server.watch('T:\Staff Directories\Communications (JOSH)\Scripts\calendarformat')
// >>> server.serve()