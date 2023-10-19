import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

function Graph(props) {
  const // destructuring objects
    { rows, filterRows } = props,
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
    xythosfs = rows.map((d) => {
      return { x: new Date(d.date), y: Number(d.xythosfs_pct_used) };
    }),
    // create options needed for graph - https://www.highcharts.com/demo
    options = {
      chart: {
        type: "spline", // column, spline, area, bar, scatter, etc.
        zoomType: "x",
        zooming: { type: "x" },
        height: window.innerHeight,
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
        { name: "Xythosfs", data: xythosfs },
      ],
      xAxis: {
        type: "datetime",
        labels: {
          format: "{value:%Y-%b-%e %l:%M %p}",
        },
        minRange: 3600000,
      },
      yAxis: {
        title: {
          text: "% Used",
        },
      },
      data: { dateFormat: "YYYY-MM-DD" },
      plotOptions: {
        series: {
          turboThreshold: 0,
          cursor: "pointer",
          point: {
            events: {
              click: function () {
                show(this);
              },
            },
          },
        },
        connectNulls: true,
      },
    },
    show = (e) => {
      // console.log("Date: " + e.category + ", % Used: " + e.y);
      filterRows(e.category);
    };
  // console.log("props", props, "rows", rows, "options", options);

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export default Graph;
