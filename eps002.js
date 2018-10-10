var imported = document.createElement('script');
imported.src = 'https://www.puck-js.com/puck.js';
document.head.appendChild(imported);

var samples = 100;
var speed = 250;
var values = [];
var labels = [];
var charts = [];
var value = 0;

values.length = samples;
labels.length = samples;
values.fill(0);
labels.fill(0);

        var EPS1V = 0;
        var EPS2V = 0;
        var EPSMAIN = 0;
        var data = new Int16Array(100);

        function onLine(line) { // on recieving a line of data
            try { // attempt to parse the data
                var j = JSON.parse(line);

                var buffer1 = j.EPS1; // buffer for comparison - could not compare JSON objects?
                var buffer2 = j.EPS2;

                if (buffer1 !== undefined) {
                    EPS1V = buffer1;
                };
                if (buffer2 !== undefined) {
                    EPS2V = buffer2;
                };

                elements.EPS1.setValue(EPS1V);
                elements.EPS2.setValue(EPS2V);

                console.log("========================"); // debugging information sent to console
                console.log("j.EPS1=", j.EPS1);
                console.log("j.EPS2=", j.EPS2);
                console.log("buffer1=", buffer1);
                console.log("buffer2=", buffer2);
                console.log("EPS1V=", EPS1V);
                console.log("EPS2V=", EPS2V);
                console.log("EPS1V-EPS2V=", EPS1V - EPS2V);
                console.log("========================");

            } catch (e) { // else return failed line
                console.log("Failed Received: ", line);
            }
        }


        function log() { // A function to store the data in the history
            data.set(new Int16Array(data.buffer, 2)); // move all data values back by one
            data[data.length - 1] = (EPS1V - EPS2V * 100); // set the last data value to the difference between EPS values
            elements.graph.setData(data); // update graph
        }

        setInterval(log, 10); // log data at 10 ms intervals (same as aquisition)


        var connection;

        function connectDevice() { // connection function
            Puck.connect(function(c) {
                if (!c) {
                    alert("Couldn't connect!");
                    return;
                }
                connection = c;
                elements.modal.remove(); // remove modal window on connection      
                var buf = "";
                connection.on("data", function(d) { // Handle the data we get back, and call 'onLine' when we get a line
                    buf += d;
                    var i = buf.indexOf("\n");
                    while (i >= 0) {
                        onLine(buf.substr(0, i));
                        buf = buf.substr(i + 1);
                        i = buf.indexOf("\n");
                    }

                });

                connection.write("reset();\n", function() { // First, reset Puck.js
                    setTimeout(function() { // Wait for it to reset itself
                        // Tell puck to write analogueRead to pins D28 & D29 to Bluetooth at 10 ms intervals
                        // When disconnected, Puck.js resets so the setInterval doesn't keep draining battery.
                        connection.write("setInterval(function(){Bluetooth.println(JSON.stringify({EPS1:analogRead(D28)}))},10);NRF.on('disconnect', function() {reset()});\n", function() {
                            console.log("Ready...");
                            connection.write("setInterval(function(){Bluetooth.println(JSON.stringify({EPS2:analogRead(D29)}))},10);NRF.on('disconnect', function() {reset()});\n", function() {
                                console.log("Ready...");
                            });
                        }, 1000); //eo setTimeout});
                    }, 1000); //eo setTimeout
                }); //eo connection reset
            }); //eo puck.connect
        } //eo connectDevice


function initialize() {
  charts.push(new Chart(document.getElementById("chart0"), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        lineTension: 0.25,
        pointRadius: 0 
      }]
    },
    options: {
      responsive: false,
      animation: {
        duration: speed * 1.5,
        easing: 'linear'
      },
      legend: false,
      scales: {
        xAxes: [{
          display: false
        }],
        yAxes: [{
          ticks: {
            max: 1,
            min: -1
          }
        }]
      }
    }
  }));
}


function advance() {
  value = Math.min(Math.max(value + (0.1 - Math.random() / 5), -1), 1);

  values.push(value);
  values.shift();
  charts.forEach(function(chart) { chart.update(); });

  setTimeout(function() {
    requestAnimationFrame(advance);
  }, speed);
}



window.onload = function() {
  initialize();
  advance();
connectDevice();

};


