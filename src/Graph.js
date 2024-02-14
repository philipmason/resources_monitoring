import React, { useState, useRef, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import moment from 'moment';

function Graph(props) {
  const chartRef = useRef(null);
  const initialSeriesVisibility = { 
    CPU: true, 
    Mem: true, 
    Swap: true, 
    Transient: true, 
    SASwork: true, 
    Workspace: true, 
    Xythosfs: true, 
    recvQbytes: false, 
    sendQbytes: false, 
    uSockServers: false, 
    uSockConn: true, 
    tcpActConn: false, 
    tcpInactConn: false, 
    httpsActConn: false, 
    httpsInactConn: false 
  };
  const [seriesVisibility, setSeriesVisibility] = useState( initialSeriesVisibility );

  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current.chart;

      // Update series visibility based on state
      chart.series.forEach(series => {
        const seriesName = series.name;
        if (seriesVisibility[seriesName] !== undefined) {
          series.setVisible(seriesVisibility[seriesName], false);
        }
      });

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
    }
  }, [seriesVisibility]);


  const // destructuring objects
    { rows:allrows, filterRows, useUTC } = props;
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
        return { x: Date.now(), y: Math.random() };
      }
      return { x: new Date(d.date), y: Number(d.cpu_pct_used) };
    }),
    _mem = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.mem_pct_used) };
    }),
    _swap = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.swap_pct_used) };
    }),
    _transient = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.transient_pct_used) };
    }),
    _saswork = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.saswork_pct_used) };
    }),
    _workspace = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.workspace_pct_used) };
    }),
    _xythosfs = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.xythosfs_pct_used) };
    }),
    _recvQbytes = rows.map((d) => {
      let newR = { x: new Date(d.date), y: Math.log10(Number(d.TotalRecvQ_bytes) + 1) }  // +1 to allow representing 0 on a log scale
      if (isNaN(newR.x)) newR.x = new Date();
      if (isNaN(newR.y)) newR.y = 0.5;
      return newR;
    }),
    _sendQbytes = rows.map((d) => {
      let newR = { x: new Date(d.date), y: Math.log10(Number(d.TotalSendQ_bytes) + 1) };  // +1 to allow representing 0 on a log scale
      return newR;
    }),
    // usockets_servers, usockets_connections, tcp_active_connections, tcp_inactive_connections, active_https_conn, inactive_https_conn
    // usockservers, usockconn, tcpactconn, tcpinactconn, httpsactconn, httpsinactconn
    _usockservers = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.usockets_servers) };
    }),
    _usockconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.usockets_connections) };
    }),
    _tcpactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.tcp_active_connections) };
    }),
    _tcpinactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.tcp_inactive_connections) };
    }),
    _httpsactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.active_https_conn) };
    }),
    _httpsinactconn = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.inactive_https_conn) };
    }),
    min = Math.min(..._cpu.map((d) => d.x)),
    max = Math.max(..._cpu.map((d) => d.x));
    let minDate, maxDate;
    if (useUTC) {
      // take min date time and set to midnight on that day
      minDate = new Date(min).setUTCHours(0, 0, 0, 0);
      // take max date time and set to 11:59pm on that day
      maxDate = new Date(max).setUTCHours(24, 0, 0, 0);
    } else {
      // take min date time and set to midnight on that day
      minDate = new Date(min).setHours(0, 0, 0, 0);
      // take max date time and set to 11:59pm on that day
      maxDate = new Date(max).setHours(24, 0, 0, 0);
    }
  // create an array of dates starting at midnight and ending at 11:59pm
  // for each day between min and max date
  const dates = [];
  for (let d = minDate; d <= maxDate; d += 86400000) {
    dates.push(new Date(d));
  }
  console.log('dates:', dates);
  console.log('last date:', dates.slice(-1)[0]);
  const plotBands = dates.map((d, di) => {
    return {
      from: d,
      to: dates[di + 1] ? dates[di + 1] : maxDate,
      color: di % 2 ? "#ffffff" : "#dddddd",
      label: {
        // text: d.toLocaleString("en-us", { weekday: "long" }),
        text: moment(d).format('ddd, MMM DD'),
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
      global: {
        useUTC: useUTC, 
        timezoneOffset: new Date().getTimezoneOffset(),
      },
      info: {
        min: min,
        max: max,
        dates: dates,
      },
      tooltip: {
        formatter: function() {
          let date = Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x, useUTC);
          if (useUTC) {
            return '<b>' + date + ' UTC </b><br/>' +
              'Value: ' + this.y;
          }
          date = moment(new Date(this.x)).format('YYYY-MM-DD HH:mm');
          const utcOffset = new Date(this.x).getTimezoneOffset();
          const sign = (utcOffset > 0) ? '-' : '+';
          const hours = Math.floor(Math.abs(utcOffset) / 60);
          const minutes = Math.abs(utcOffset) % 60;
          const offsetString = sign + Highcharts.pad(hours, 2) + ':' + Highcharts.pad(minutes, 2);

          // return '<b>' + Highcharts.dateFormat('%a, %b %d %H:%M', this.x, useUTC) + ' UTC' + offsetString + '</b><br/>' +           'Value: ' + this.y;
          // let localdateopts = {month: 'short',   // Short month name (e.g., Jan)
          //   day: 'numeric',    // Day of the month (e.g., 15)
          //   hour: 'numeric',   // Hour (e.g., 12)
          //   minute: 'numeric',  // Minute (e.g., 30)
          //   hour12: false         // Use 24-hour format
          // }
          // return '<b>' + new Date(this.x).toLocaleString("en-us", localdateopts) + ' UTC' + offsetString + '</b><br/> Value: ' + this.y;
          const options = {
            month: 'short',       // Three-letter month abbreviation (e.g., Jan)
            day: '2-digit',       // Two-digit day (01-31)
            hour: '2-digit',      // Two-digit hour (00-23)
            minute: '2-digit',    // Two-digit minute (00-59)
            hourCycle: 'h23'      // Use 24-hour format
          };
          return '<b>' + new Intl.DateTimeFormat('en-US', options).format(this.x) + ' UTC' + offsetString + '</b><br/> Value: ' + this.y;
        }
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
        { name: "recvQbytes", data: _recvQbytes.slice(slice_start,slice_length), yAxis: 1, dashStyle: 'Dot', visible: seriesVisibility["recvQbytes"] },  
        { name: "sendQbytes", data: _sendQbytes.slice(slice_start,slice_length), yAxis: 1, dashStyle: 'Dot', visible: seriesVisibility["sendQbytes"] },  
        // uSockServers, uSockConn, tcpActConn, tcpInactConn, httpsActConn, httpsInactConn
        { name: "uSockServers", data: _usockservers.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: seriesVisibility["uSockServers"] },   // Initially hidden
        { name: "uSockConn", data: _usockconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: seriesVisibility["uSockConn"]},   // Initially hidden  
        { name: "tcpActConn", data: _tcpactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: seriesVisibility["tcpActConn"]},   // Initially hidden  
        { name: "tcpInactConn", data: _tcpinactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: seriesVisibility["tcpInactConn"]},   // Initially hidden  
        { name: "httpsActConn", data: _httpsactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: seriesVisibility["httpsActConn"]},   // Initially hidden  
        { name: "httpsInactConn", data: _httpsinactconn.slice(slice_start,slice_length), yAxis: 2, dashStyle: 'Dash', visible: seriesVisibility["httpsInactConn"]},   // Initially hidden  
      ],
      xAxis: {
        type: "datetime",
        // title: { text: "% Used", },
        labels: {
          // format: "{value:%Y-%b-%e %l:%M %p}",
          formatter: function() {
            let date = new Date(this.value);
            if (useUTC) {
              return Highcharts.dateFormat('%a, %b %d %H:%M UTC', this.value, useUTC);
            }
            let offsetHours = -date.getTimezoneOffset() / 60;
            let offsetMinutes = Math.abs(date.getTimezoneOffset() % 60);
            let offset = ' UTC' + (offsetHours >= 0 ? '+' : '-') + 
                         ('0' + Math.abs(offsetHours)).slice(-2) + ':' + 
                         ('0' + offsetMinutes).slice(-2);
            // return Highcharts.dateFormat('%Y-%m-%d %H:%M ' + offset, this.value);
            // return Highcharts.dateFormat('%a, %b %d %H:%M ', this.value, useUTC)  + offset;
            // let localdateopts = {month: 'short',   // Short month name (e.g., Jan)
            //   day: 'numeric',    // Day of the month (e.g., 15)
            //   hour: 'numeric',   // Hour (e.g., 12)
            //   minute: 'numeric',  // Minute (e.g., 30)
            //   hour12: false         // Use 24-hour format
            // }
            // return  new Date(this.value).toLocaleString("en-us", localdateopts) + offset;
            return  moment(new Date(this.value)).format('ddd, MMM DD HH:mm') + offset;
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
      time: { useUTC: useUTC, timezoneOffset: new Date().getTimezoneOffset() },
      data: { dateFormat: "YYYY-MM-DD" },
      plotOptions: {
        series: {
          events: {
            legendItemClick: function () {
              // const series = this;
              // const chart = series.chart;
              
              // Toggle visibility of the series
              // series.setVisible(!series.visible);

              
            const seriesName = this.name;
            const isVisible = this.visible;

            setSeriesVisibility(prevState => ({
                ...prevState,
                [seriesName]: !isVisible
              }));
              
              // Redraw the chart after handling the click
              // chart.redraw();
              /*
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
              */
              
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
    console.log("new Date(options.info.max)", new Date(options.info.max));
    
  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />
    </div>
  );
}

export default Graph;
