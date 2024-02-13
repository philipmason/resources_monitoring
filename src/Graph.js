import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

function Graph(props) {
  const // destructuring objects
    { rows:allrows, filterRows } = props;
  // When too many data points are present, the plot is not shown
  // So we need to resample the data to <= 1000 data points
  let rows;
  const sampling_factor = allrows ? Math.ceil(allrows.length / 1000) : 1;
  console.log('allrows:', allrows, 'sampling_factor:', sampling_factor)
  rows = allrows ? allrows.filter((v, i) => i % sampling_factor ===0 ) : [];
  const
    // make array into an array that just has the invoice amounts
    _cpu = rows.map((d) => {
      if (! d.date || ! d.cpu_pct_used) {
        return { x: Date.now().valueOf(), y: Math.random() };
      }
      return { x: new Date(d.date).valueOf(), y: Number(d.cpu_pct_used) };
    }),
    _mem = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.mem_pct_used) };
    }),
    _swap = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.swap_pct_used) };
    }),
    _transient = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.transient_pct_used) };
    }),
    _saswork = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.saswork_pct_used) };
    }),
    _workspace = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.workspace_pct_used) };
    }),
    _xythosfs = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.xythosfs_pct_used) };
    }),
    _recvQbytes = rows.map((d) => {
      let newR = { x: new Date(d.date).valueOf(), y: Math.log10(Number(d.TotalRecvQ_bytes) + 1) }  // +1 to allow representing 0 on a log scale
      if (isNaN(newR.x)) newR.x = new Date().valueOf();
      if (isNaN(newR.y)) newR.y = 0.5;
      return newR;
    }),
    _sendQbytes = rows.map((d) => {
      let newR = { x: new Date(d.date).valueOf(), y: Math.log10(Number(d.TotalSendQ_bytes) + 1) };  // +1 to allow representing 0 on a log scale
      return newR;
    }),
    // usockets_servers, usockets_connections, tcp_active_connections, tcp_inactive_connections, active_https_conn, inactive_https_conn
    // usockservers, usockconn, tcpactconn, tcpinactconn, httpsactconn, httpsinactconn
    _usockservers = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.usockets_servers) };
    }),
    _usockconn = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.usockets_connections) };
    }),
    _tcpactconn = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.tcp_active_connections) };
    }),
    _tcpinactconn = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.tcp_inactive_connections) };
    }),
    _httpsactconn = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.active_https_conn) };
    }),
    _httpsinactconn = rows.map((d) => {
      return { x: new Date(d.date).valueOf(), y: Number(d.inactive_https_conn) };
    }),
    min = Math.min(..._cpu.map((d) => d.x)),
    max = Math.max(..._cpu.map((d) => d.x)),
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

  /*
  console.log("_cpu:", _cpu //, _mem, _swap, _transient, _saswork, _workspace, _xythosfs, _recvQbytes, _sendQbytes, _usockservers, _usockconn, _tcpactconn, _tcpinactconn, _httpsactconn, _httpsinactconn
  )
  */

  const slice_start = 0, slice_length = _cpu.length;
;
  const options = {
      chart: {
        type: "line", //"spline", // column, spline, area, bar, scatter, etc.
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
        { name: "CPU", data: _cpu.slice(slice_start,slice_length) 
        },
        { name: "Mem", data: _mem.slice(slice_start,slice_length) },
        { name: "Swap", data: _swap.slice(slice_start,slice_length) },
        { name: "Transient", data: _transient.slice(slice_start,slice_length) },
        { name: "SASwork", data: _saswork.slice(slice_start,slice_length) },
        { name: "Workspace", data: _workspace.slice(slice_start,slice_length) },
        { name: "Xythosfs", data: _xythosfs.slice(slice_start,slice_length) },

        // recvQbytes, sendQbytes
        { name: "recvQbytes", data: _recvQbytes.slice(slice_start,slice_length), yAxis: 1, dashStyle: 'Dot'},  
        { name: "sendQbytes", data: _sendQbytes.slice(slice_start,slice_length), yAxis: 1, dashStyle: 'Dot'},  
        // usockservers, usockconn, tcpactconn, tcpinactconn, httpsactconn, httpsinactconn
        { name: "uSockServers", data: _usockservers.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden
        { name: "uSockConn", data: _usockconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "tcpActConn", data: _tcpactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "tcpInactConn", data: _tcpinactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "httpsActConn", data: _httpsactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
        { name: "httpsInactConn", data: _httpsinactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: false},   // Initially hidden  
      ],
      xAxis: {
        type: "datetime",
        // title: { text: "% Used", },
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
        minRange: 1800000,
        plotBands: plotBands,
      },
      yAxis: [{
        title: { text: "% Used", },
      }, { // Secondary yAxis
        title: { text: '... Data Queued, log10(bytes)', },
        opposite: true,
        visible: true // Initially set the secondary Y-axis 1 to be visible
    }, { // Tertiary yAxis
        title: {
            text: '--- Number Connections'
        },
        opposite: true,
        visible: false // Initially set the secondary Y-axis 2 to be hidden
    }],
      time: { useUTC: true, timezoneOffset: 0 },
      data: { dateFormat: "YYYY-MM-DD" },
      plotOptions: {
        series: {
          events: {
            legendItemClick: function () {
              const series = this;
              const chart = series.chart;
              
              // Toggle visibility of the series
              series.setVisible(!series.visible);
              
              // Redraw the chart after handling the click
              chart.redraw();
  
              let yAxisVisible = [false, false]; // Array to track visibility of secondary Y-axes
  
              chart.series.forEach((series, index) => {
                if (series.yAxis.index > 0 && series.visible) {
                  yAxisVisible[series.yAxis.index - 1] = true; // Set corresponding secondary Y-axis visibility to true
                }
              });
              chart.yAxis.forEach((yAxis, index) => {
                if (index > 0) {
                  yAxis.update({ visible: yAxisVisible[index - 1] }, false); // Update visibility of secondary Y-axes                  
                }
              });
              chart.redraw();
              
              // Return false to prevent the default toggle action
              return false;
            }
          },  
          // turboThreshold: 0,
          cursor: "pointer",
          point: {
            events: {
              click: function () {
                show(this);
              },
            },
          },
        },
        connectNulls: false,
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
