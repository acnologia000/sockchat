var countDownDate = 500 * 1000;
var now = 490  * 1000;
var x = setInterval(function () {
    now = now + 1000;

    var distance = countDownDate - now;

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("demo").innerHTML = days + "d " + hours + "h " +
        minutes + "m " + seconds + "s ";

    if (distance <= 0) {
        clearInterval(x);
        document.getElementById("demo").innerHTML = "<h2>Session has started</h2>";
    }

}, 1000);
