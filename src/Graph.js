import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

function Graph(props) {
  const // destructuring objects
    { rows, filterRows } = props;
    // console.log('rows.length', rows.length);
    // console.log('rows[0]]', rows[0]);
    // console.log('rows[rows.length-1]', rows[rows.length-1]);
  const
    // make array into an array that just has the invoice amounts
    cpu = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.cpu_pct_used) };
    }),
    mem = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.mem_pct_used) };
    }),
    swap = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.swap_pct_used) };
    }),
    transient = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.transient_pct_used) };
    }),
    saswork = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.saswork_pct_used) };
    }),
    workspace = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.workspace_pct_used) };
    }),
    xythosfs = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.xythosfs_pct_used) };
    }),
    recvQbytes = rows.map((d) => {
      let newR = { x: new Date(d.date), y: Math.log10(Number(d.TotalRecvQ_bytes) + 1) }  // +1 to allow representing 0 on a log scale
      if (isNaN(newR.x)) newR.x = new Date();
      if (isNaN(newR.y)) newR.y = 0.5;
      return newR;
    }),
    sendQbytes = rows.map((d) => {
      let newR = { x: new Date(d.date), y: Math.log10(Number(d.TotalSendQ_bytes) + 1) };  // +1 to allow representing 0 on a log scale
      return newR;
    }),
    // usockets_servers, usockets_connections, tcp_active_connections, tcp_inactive_connections, active_https_conn, inactive_https_conn
    // usockservers, usockconn, tcpactconn, tcpinactconn, httpsactconn, httpsinactconn
    usockservers = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.usockets_servers) };
    }),
    usockconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.usockets_connections) };
    }),
    tcpactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.tcp_active_connections) };
    }),
    tcpinactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.tcp_inactive_connections) };
    }),
    httpsactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.active_https_conn) };
    }),
    httpsinactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.inactive_https_conn) };
    }),
    min = Math.min(...cpu.map((d) => d.x)),
    max = Math.max(...cpu.map((d) => d.x)),
    // take min date time and set to midnight on that day
    minDate = new Date(min).setHours(0, 0, 0, 0),
    // take max date time and set to 11:59pm on that day
    maxDate = new Date(max).setHours(23, 59, 59, 999);
  // create an array of dates starting at midnight and ending at 11:59pm
  // for each day between min and max date
  const dates = [];
  for (let d = minDate; d <= maxDate; d += 86400000) {
    dates.push(new Date(d));
  }
  const plotBands = dates.map((d, di) => {
    return {
      from: d,
      to: dates[di + 1] ? dates[di + 1] : maxDate,
      color: di % 2 ? "#ffffff" : "#dddddd",
      label: {
        text: d.toLocaleString("en-us", { weekday: "long" }),
        style: {
          color: "black",
        },
      },
    };
  });
  const options = {
      chart: {
        type: "spline", // column, spline, area, bar, scatter, etc.
        zoomType: "x",
        zooming: { type: "x" },
        height: window.innerHeight,
      },
      info: {
        min: min,
        max: max,
        dates: dates,
      },
      title: {
        text: "LSAF Resource Usage",
      },
      series: [
        { name: "CPU", data: cpu },
        { name: "Mem", data: mem },
        { name: "Swap", data: swap },
        { name: "Transient", data: transient },
        { name: "SASwork", data: saswork },
        { name: "Workspace", data: workspace },
        { name: "Xythosfs", data: xythosfs },
        // recvQbytes, sendQbytes
        { name: "recvQbytes", data: recvQbytes, yAxis: 1, dashStyle: 'Dot'},  
        { name: "sendQbytes", data: sendQbytes, yAxis: 1, dashStyle: 'Dot'},  
        // usockservers, usockconn, tcpactconn, tcpinactconn, httpsactconn, httpsinactconn
        { name: "uSockServers", data: usockservers, yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden
        { name: "uSockConn", data: usockconn, yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "tcpActConn", data: tcpactconn, yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "tcpInactConn", data: tcpinactconn, yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "httpsActConn", data: httpsactconn, yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "httpsInactConn", data: httpsinactconn, yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
      ],
      xAxis: {
        type: "datetime",
        title: { text: "% Used", },
        labels: {
          // format: "{value:%Y-%b-%e %l:%M %p}",
          formatter: function() {
            var date = new Date(this.value);
            var offsetHours = -date.getTimezoneOffset() / 60;
            var offsetMinutes = Math.abs(date.getTimezoneOffset() % 60);
            var offset = 'GMT' + (offsetHours >= 0 ? '+' : '-') + 
                         ('0' + Math.abs(offsetHours)).slice(-2) + ':' + 
                         ('0' + offsetMinutes).slice(-2);
                         // return Highcharts.dateFormat('%Y-%m-%d %H:%M ' + offset, this.value);
                         return Highcharts.dateFormat('%a, %b %d %H:%M ' + offset, this.value);
                        }
        },
        minRange: 3600000,
        plotBands: plotBands,
      },
      yAxis: [{
        title: { text: "% Used", },
      }, { // Secondary yAxis
        title: { text: '... Data Queued, log10(bytes)', },
        opposite: true
    }, { // Tertiary yAxis
        title: {
            text: '--- Number Connections'
        },
        opposite: true
    }],
      time: { useUTC: true, timezoneOffset: 0 },
      data: { dateFormat: "YYYY-MM-DD" },
      plotOptions: {
        series: [{
          turboThreshold: 0,
          cursor: "pointer",
          point: {
            events: {
              click: function () {
                show(this);
              },
            },
          },
        }],
        connectNulls: true,
      },
    },
    show = (e) => {
      // console.log("Date: " + e.category + ", % Used: " + e.y);
      filterRows(e.category);
    };
  console.log("options", options);

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export default Graph;
