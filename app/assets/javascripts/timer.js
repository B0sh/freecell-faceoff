// timer heavily modified from
// https://github.com/lp1dev/timerJS

var Timer = {};
Timer.refresh_interval = 75;
Timer.intervals = [];
Timer.started = false;
Timer.selector = null;
Timer.start_time = 0;

Timer.start = function (selector, time) {
    if (Timer.started === true && Timer.selector === selector)
        return;

    console.log("started timer " + selector);

    Timer.selector = selector;
    if (typeof time === "undefined")
        Timer.start_time = new Date().getTime();
    else
        Timer.start_time = new Date(time * 1000);

    Timer.started = true;

    var interval_id = setInterval(function () {
        Timer.update();
    }, Timer.refresh_interval);

    Timer.intervals.push(interval_id);
};

Timer.stop = function() {
    for (var i = 0; i < Timer.intervals.length; i++){
        clearInterval(Timer.intervals[i]);
    }

    console.log("stopped timer")

    Timer.started = false;
    Timer.selector = null;
};

Timer.time_string = function(elapsed, type) {
    var localHours = Math.floor(elapsed / 3600000) ;
    var localMinutes = Math.floor(elapsed / 60000) % 60;
    var localSeconds = Math.floor(elapsed / 1000) % 60;
    var localHundredth = Math.floor(elapsed / 100)  % 10;

    // use a str pad function here later
    if (localHours < 10)
        localHours = "0" + localHours;
    if (localMinutes < 10)
        localMinutes = "0" + localMinutes;
    if (localSeconds < 10)
        localSeconds = "0" + localSeconds;

    switch (type) {
        case 's':
            if (localMinutes == "00")
                return (localSeconds+"<small>."+localHundredth+"</small>");
        case 'ms':
            if (localHours == "00")
                return (localMinutes+":"+localSeconds+"<small>."+localHundredth+"</small>");
        case 'hms':
            return (localHours+":"+localMinutes+":"+localSeconds+"<small>."+localHundredth+"</small>");

    }


};

Timer.set_static_time = function(time) {
    Timer.selector.html(Timer.time_string(time, 's'));
};

Timer.update = function(){

    // if switched out of the timer tab, stop calling the timer function
    try {

        var now = new Date().getTime();
        var elapsed = now - Timer.start_time;

        Timer.selector.html(Timer.time_string(elapsed, 's'));
    }
    catch(e) {
        Timer.stop();
    }
}


